import { useState } from "react";
import {
  UserPlus,
  Search,
  Trash2,
  Briefcase,
  X,
  AlertTriangle,
  Edit,
  Camera,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useEquipe } from "../../hooks/useEquipe";
import { toast } from "../../lib/toast";
import { Skeleton } from "../../components/ui/Skeleton";
import { ModalReativarProfissional } from "../../components/domain/ModalReativarProfissional";

export function Equipe() {
  const { user, profile } = useAuth();
  const [busca, setBusca] = useState("");

  const {
    equipe,
    isLoading: carregandoDados,
    criarProfissional,
    atualizarProfissional,
    excluirProfissional,
    reordenarProfissional,
    criarUsuarioAuth,
  } = useEquipe();

  const [carregandoForm, setCarregandoForm] = useState(false);

  // Controle do modal de reativação de login existente
  const [modalReativarInfo, setModalReativarInfo] = useState({
    aberto: false,
    email: "",
    nome: "",
    tipo: "reativar",
    profNome: "",
    profObj: null,
    dadosParaSalvar: null,
  });
  const [carregandoReativacao, setCarregandoReativacao] = useState(false);

  // Controle do modal principal (Cadastro/Edição)
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = Criando; número = Editando
  const [formFunc, setFormFunc] = useState({
    nome: "",
    especialidade: "",
    telefone: "",
    ordem: "",
    foto: "",
  });

  // Controles do modal de exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [profParaExcluir, setProfParaExcluir] = useState(null);

  // Formata o nome para Primeira Letra Maiúscula
  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  // Abre modal para NOVA profissional
  const abrirModalCadastro = () => {
    setEditandoId(null);
    const proximaOrdem =
      equipe.length > 0 ? Math.max(...equipe.map((p) => p.ordem || 0)) + 1 : 1;
    setFormFunc({
      nome: "",
      especialidade: "",
      telefone: "",
      ordem: String(proximaOrdem),
      foto: "",
      email: "",
      senha: "",
      is_admin: false,
    });
    setModalAberto(true);
  };

  // Abre modal para EDITAR profissional
  const abrirModalEdicao = (prof) => {
    setEditandoId(prof.id);
    setFormFunc({
      nome: prof.nome || "",
      especialidade: prof.especialidade || "",
      telefone: prof.telefone || "",
      ordem:
        prof.ordem !== null && prof.ordem !== undefined
          ? String(prof.ordem)
          : "1",
      foto: prof.foto || "",
      email: prof.email || "",
      senha: "", // Nunca carregamos a senha por segurança
      is_admin: prof.is_admin || false,
    });
    setModalAberto(true);
  };

  // Lida com o upload da imagem
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem é muito grande. Escolha uma foto com menos de 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFunc({ ...formFunc, foto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. SALVAR COM REORDENAÇÃO INTELIGENTE
  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!formFunc.nome || !formFunc.especialidade) return;

    if (!editandoId && formFunc.email && formFunc.senha && formFunc.senha.length < 8) {
      toast.error("A senha de acesso deve conter no mínimo 8 caracteres para maior segurança.");
      return;
    }

    setCarregandoForm(true);

    try {
      let novaOrdem = formFunc.ordem !== "" ? parseInt(formFunc.ordem, 10) : 1;

      if (editandoId) {
        const profissionalAntiga = equipe.find((p) => p.id === editandoId);
        const ordemAntiga = profissionalAntiga
          ? profissionalAntiga.ordem
          : null;

        if (ordemAntiga !== novaOrdem) {
          if (novaOrdem < ordemAntiga) {
            for (let prof of equipe) {
              if (
                prof.id !== editandoId &&
                prof.ordem >= novaOrdem &&
                prof.ordem < ordemAntiga
              ) {
                await reordenarProfissional({ id: prof.id, novaOrdem: prof.ordem + 1 });
              }
            }
          } else if (novaOrdem > ordemAntiga) {
            for (let prof of equipe) {
              if (
                prof.id !== editandoId &&
                prof.ordem <= novaOrdem &&
                prof.ordem > ordemAntiga
              ) {
                await reordenarProfissional({ id: prof.id, novaOrdem: prof.ordem - 1 });
              }
            }
          }
        }
      }

      const tenantIdFinal = profile?.tenant_id || user?.tenant_id || "11111111-1111-1111-1111-111111111111";

      const dadosParaSalvar = {
        nome: formFunc.nome.trim(),
        especialidade: formFunc.especialidade.trim(),
        telefone: formFunc.telefone.trim() || null,
        ordem: novaOrdem,
        foto: formFunc.foto || null,
        email: formFunc.email ? formFunc.email.trim() : null,
        is_admin: formFunc.is_admin || false,
        tenant_id: tenantIdFinal,
      };

      if (editandoId) {
        await atualizarProfissional({ id: editandoId, payload: dadosParaSalvar });
        toast.success("Profissional atualizada com sucesso!");
      } else {
        // Criar usuário no Auth (sem deslogar o admin)
        if (formFunc.email && formFunc.senha) {
          const { data: authData, error: authError } = await criarUsuarioAuth(
            formFunc.email.trim(),
            formFunc.senha
          );

          if (authError) {
            const isUserAlreadyRegistered =
              authError.message?.toLowerCase().includes("already registered") ||
              authError.message?.toLowerCase().includes("already exists") ||
              authError.status === 422;

            if (isUserAlreadyRegistered) {
              // Verificar se esse e-mail já pertence a alguém na equipe
              const profNaEquipe = equipe.find(
                (p) => p.email && p.email.toLowerCase() === formFunc.email.trim().toLowerCase()
              );

              if (profNaEquipe) {
                setModalReativarInfo({
                  aberto: true,
                  email: formFunc.email.trim(),
                  nome: formFunc.nome.trim(),
                  tipo: "ja_na_equipe",
                  profNome: profNaEquipe.nome,
                  profObj: profNaEquipe,
                  dadosParaSalvar: null,
                });
                setCarregandoForm(false);
                return;
              } else {
                // E-mail existe no Auth (conta anterior), permitindo reativação
                setModalReativarInfo({
                  aberto: true,
                  email: formFunc.email.trim(),
                  nome: formFunc.nome.trim(),
                  tipo: "reativar",
                  profNome: "",
                  profObj: null,
                  dadosParaSalvar,
                });
                setCarregandoForm(false);
                return;
              }
            }

            throw new Error("Erro ao criar login: " + authError.message);
          }

          if (authData?.user) {
            dadosParaSalvar.id = authData.user.id; // Vincula ao mesmo UUID
          }
        }

        await criarProfissional(dadosParaSalvar);
        toast.success("Profissional cadastrada com sucesso!");
      }

      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar profissional:", error.message);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setCarregandoForm(false);
    }
  };

  const handleConfirmarReativacao = async () => {
    if (modalReativarInfo.tipo === "ja_na_equipe") {
      const profParaEditar = modalReativarInfo.profObj;
      setModalReativarInfo({ aberto: false });
      if (profParaEditar) {
        abrirModalEdicao(profParaEditar);
      }
      return;
    }

    if (!modalReativarInfo.dadosParaSalvar) return;

    setCarregandoReativacao(true);
    try {
      await criarProfissional(modalReativarInfo.dadosParaSalvar);
      toast.success("Profissional reativada com sucesso!");

      setModalReativarInfo({ aberto: false });
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao reativar profissional:", error.message);
      toast.error("Erro ao reativar profissional: " + error.message);
    } finally {
      setCarregandoReativacao(false);
    }
  };

  const handleCancelarReativacao = () => {
    setModalReativarInfo({ aberto: false });
  };

  const abrirModalExcluir = (id) => {
    setProfParaExcluir(id);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!profParaExcluir) return;
    if (profParaExcluir === profile?.id) {
      toast.error("Você não pode excluir o seu próprio usuário administrador.");
      setModalExcluirAberto(false);
      setProfParaExcluir(null);
      return;
    }
    try {
      await excluirProfissional(profParaExcluir);
      toast.success("Profissional excluída com sucesso!");
      setModalExcluirAberto(false);
      setProfParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir profissional:", error.message);
      toast.error(
        "Não foi possível excluir. Esta profissional já possui agendamentos no sistema.",
      );
    }
  };

  const cancelarExclusao = () => {
    setModalExcluirAberto(false);
    setProfParaExcluir(null);
  };

  const equipeFiltrada = equipe.filter((f) =>
    f.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  const inputClasse =
    "w-full py-3 px-3 border border-slate-200 rounded-lg outline-none text-[0.95rem] transition-colors focus:border-[var(--cor-primaria)]";

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 max-md:p-4 min-h-[calc(100vh-3rem)] max-md:min-h-[calc(100vh-80px)] text-[var(--cor-texto)]">
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-slate-100 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h2 className="text-[1.6rem] font-bold mb-1">Equipe</h2>
          <p className="text-slate-500 text-[0.95rem]">Gerencie as profissionais do seu negócio</p>
        </div>
        <div className="flex items-center gap-4 max-md:w-full max-md:flex-col max-md:items-stretch">
          <div className="relative flex items-center max-md:w-full">
            <Search size={16} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar profissional..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-[0.7rem] pr-3 pl-9 text-sm outline-none transition-all w-[200px] max-md:w-full focus:border-[var(--cor-primaria)] focus:bg-white"
            />
          </div>
          <button className="bg-gradient-to-br from-[var(--cor-primaria)] to-[#6d28d9] text-white border-none py-3 px-5 rounded-lg text-[0.95rem] font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(124,58,237,0.35)] max-md:w-full max-md:justify-center" onClick={abrirModalCadastro}>
            <UserPlus size={18} />
            <span>Nova Profissional</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 max-md:grid-cols-1">
        {carregandoDados ? (
          [1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-start"
              style={{ pointerEvents: "none" }}
            >
              <div className="flex gap-4 items-start min-w-0 flex-1">
                <Skeleton width="48px" height="48px" borderRadius="50%" />
                <div className="flex flex-col gap-1.5 ml-2">
                  <Skeleton width="130px" height="18px" />
                  <Skeleton width="90px" height="14px" />
                  <Skeleton width="100px" height="14px" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton width="32px" height="32px" borderRadius="8px" />
                <Skeleton width="32px" height="32px" borderRadius="8px" />
              </div>
            </div>
          ))
        ) : equipeFiltrada.length > 0 ? (
          equipeFiltrada.map((prof) => (
            <div
              key={prof.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-start transition-all hover:border-[var(--cor-primaria)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
            >
              <div className="flex gap-4 items-start min-w-0 flex-1">
                {prof.foto ? (
                  <img
                    src={prof.foto}
                    alt={prof.nome}
                    className="w-[50px] h-[50px] shrink-0 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                  />
                ) : (
                  <div className="w-[50px] h-[50px] shrink-0 rounded-full bg-gradient-to-br from-[var(--cor-primaria)] to-[#6d28d9] text-white flex items-center justify-center text-2xl font-bold">
                    {prof.nome.charAt(0)}
                  </div>
                )}

                <div className="flex flex-col gap-1 min-w-0 flex-1 break-words">
                  <h3 className="m-0 text-[1.1rem] leading-snug">
                    {prof.nome}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      (Ordem: {prof.ordem ?? 1})
                    </span>
                  </h3>
                  <span className="flex items-center gap-1 text-[0.85rem] text-[var(--cor-primaria)] font-semibold">
                    <Briefcase size={14} /> {prof.especialidade}
                  </span>
                  <span className="text-[0.85rem] text-slate-500">
                    {prof.telefone || "Sem telefone"}
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  className="bg-transparent border-none text-slate-300 cursor-pointer transition-colors p-2 hover:text-[var(--cor-primaria)]"
                  onClick={() => abrirModalEdicao(prof)}
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                {prof.id !== profile?.id && (
                  <button
                    className="bg-transparent border-none text-slate-300 cursor-pointer transition-colors p-2 hover:text-red-500"
                    onClick={() => abrirModalExcluir(prof.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center p-12 text-slate-400">
            Nenhuma profissional encontrada.
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.6)] flex items-center justify-center z-[1000] p-4">
          <div
            className="bg-white rounded-xl w-full max-w-[450px] p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] animate-[modalAparecer_0.3s_ease-out]"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="m-0 text-xl font-bold">
                {editandoId ? "Editar Profissional" : "Cadastrar Profissional"}
              </h3>
              <button
                type="button"
                className="btn-fechar"
                onClick={() => setModalAberto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="flex flex-col gap-4">
              <div className="flex items-center gap-5 mb-2 pb-4 border-b border-dashed border-slate-200">
                <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                  {formFunc.foto ? (
                    <img src={formFunc.foto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} color="#94a3b8" />
                  )}
                </div>
                <div className="flex flex-col gap-2 items-start">
                  <label className="bg-transparent border border-slate-200 py-2 px-4 rounded-lg font-semibold text-slate-500 cursor-pointer text-[0.85rem] transition-colors hover:bg-slate-50">
                    Escolher Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">JPG, PNG. Max 5MB.</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amanda Lima"
                  value={formFunc.nome}
                  onChange={(e) =>
                    setFormFunc({
                      ...formFunc,
                      nome: formatarNome(e.target.value),
                    })
                  }
                  className={inputClasse}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Especialidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nail Designer"
                  value={formFunc.especialidade}
                  onChange={(e) =>
                    setFormFunc({
                      ...formFunc,
                      especialidade: formatarNome(e.target.value),
                    })
                  }
                  className={inputClasse}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Telefone</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formFunc.telefone}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, telefone: e.target.value })
                  }
                  className={inputClasse}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">E-mail (Login) *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: amanda@salao.com"
                  value={formFunc.email}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, email: e.target.value })
                  }
                  className={inputClasse}
                />
              </div>

              {!editandoId && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Senha Provisória (Mínimo 8 caracteres) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    value={formFunc.senha}
                    onChange={(e) =>
                      setFormFunc({ ...formFunc, senha: e.target.value })
                    }
                    className={inputClasse}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isAdminCheckbox"
                  checked={formFunc.is_admin}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, is_admin: e.target.checked })
                  }
                  className="w-auto"
                />
                <label htmlFor="isAdminCheckbox" className="mb-0 cursor-pointer font-normal text-sm text-slate-600">
                  Dar permissão de <strong>Administrador</strong> (Pode ver tudo)
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Ordem de Exibição na Agenda</label>
                <input
                  type="number"
                  placeholder="Ex: 1"
                  value={formFunc.ordem}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, ordem: e.target.value })
                  }
                  className={inputClasse}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  className="bg-transparent border border-slate-200 py-3 px-5 rounded-lg font-semibold cursor-pointer text-slate-500 transition-colors hover:bg-slate-50"
                  onClick={() => setModalAberto(false)}
                  disabled={carregandoForm}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-br from-[var(--cor-primaria)] to-[#6d28d9] text-white border-none py-3 px-5 rounded-lg text-[0.95rem] font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(124,58,237,0.35)]"
                  disabled={carregandoForm}
                >
                  {carregandoForm
                    ? "Salvando..."
                    : editandoId
                      ? "Salvar Alterações"
                      : "Salvar Profissional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.6)] flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-[400px] p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] animate-[modalAparecer_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="flex items-center gap-2 text-red-500 text-xl font-bold m-0">
                <AlertTriangle size={20} />
                Excluir Profissional
              </h3>
              <button type="button" className="btn-fechar" onClick={cancelarExclusao}>
                <X size={20} />
              </button>
            </div>
            <div className="mb-6 text-slate-600">
              <p>
                Tem certeza que deseja excluir esta profissional? Esta ação não
                poderá ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <button type="button" className="bg-transparent border border-slate-200 py-3 px-5 rounded-lg font-semibold cursor-pointer text-slate-500 transition-colors hover:bg-slate-50" onClick={cancelarExclusao}>
                Cancelar
              </button>
              <button
                type="button"
                className="bg-red-500 text-white border-none py-3 px-5 rounded-lg font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(239,68,68,0.35)]"
                onClick={confirmarExclusao}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reativação / E-mail já existente */}
      <ModalReativarProfissional
        isOpen={modalReativarInfo.aberto}
        email={modalReativarInfo.email}
        nome={modalReativarInfo.nome}
        tipo={modalReativarInfo.tipo}
        profNome={modalReativarInfo.profNome}
        isSalvando={carregandoReativacao}
        onConfirmar={handleConfirmarReativacao}
        onCancelar={handleCancelarReativacao}
      />
    </div>
  );
}
