import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Trash2,
  Briefcase,
  AlertTriangle,
  Edit,
  Camera,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { ModalReativarProfissional } from "../../components/domain/ModalReativarProfissional";
import { Modal } from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import "./Equipe.css";

const getEquipeSchema = (isEditing) =>
  z
    .object({
      nome: z.string().trim().min(1, "Nome completo é obrigatório"),
      especialidade: z.string().trim().min(1, "Especialidade é obrigatória"),
      telefone: z.string().optional(),
      ordem: z.union([z.string(), z.number()]).optional(),
      foto: z.string().optional().nullable(),
      email: z
        .string()
        .trim()
        .min(1, "E-mail é obrigatório")
        .email("E-mail inválido"),
      senha: z.string().optional(),
      is_admin: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (!isEditing) {
        if (!data.senha || data.senha.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A senha de acesso deve conter no mínimo 8 caracteres",
            path: ["senha"],
          });
        }
      } else if (data.senha && data.senha.length > 0 && data.senha.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A senha de acesso deve conter no mínimo 8 caracteres",
          path: ["senha"],
        });
      }
    });

export function Equipe() {
  const { user, profile } = useAuth();
  const [busca, setBusca] = useState("");
  const [equipe, setEquipe] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [carregandoForm, setCarregandoForm] = useState(false);

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

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [profParaExcluir, setProfParaExcluir] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: (values, context, options) =>
      zodResolver(getEquipeSchema(!!editandoId))(values, context, options),
    defaultValues: {
      nome: "",
      especialidade: "",
      telefone: "",
      ordem: "1",
      foto: "",
      email: "",
      senha: "",
      is_admin: false,
    },
  });

  const fotoWatch = watch("foto");

  const buscarProfissionais = async () => {
    try {
      setCarregandoDados(true);
      const { data, error } = await supabase
        .from("profissionais")
        .select("*")
        .order("ordem", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      if (data) setEquipe(data);
    } catch (error) {
      console.error("Erro ao buscar equipe:", error.message);
    } finally {
      setCarregandoDados(false);
    }
  };

  useEffect(() => {
    buscarProfissionais();
  }, []);

  const formatarNome = (texto) => {
    if (!texto) return "";
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const abrirModalCadastro = () => {
    setEditandoId(null);
    const proximaOrdem =
      equipe.length > 0 ? Math.max(...equipe.map((p) => p.ordem || 0)) + 1 : 1;
    reset({
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

  const abrirModalEdicao = (prof) => {
    setEditandoId(prof.id);
    reset({
      nome: prof.nome || "",
      especialidade: prof.especialidade || "",
      telefone: prof.telefone || "",
      ordem:
        prof.ordem !== null && prof.ordem !== undefined
          ? String(prof.ordem)
          : "1",
      foto: prof.foto || "",
      email: prof.email || "",
      senha: "",
      is_admin: prof.is_admin || false,
    });
    setModalAberto(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          "A imagem é muito grande. Escolha uma foto com menos de 5MB.",
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("foto", reader.result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvar = async (dadosForm) => {
    setCarregandoForm(true);

    try {
      let novaOrdem =
        dadosForm.ordem !== "" &&
        dadosForm.ordem !== null &&
        dadosForm.ordem !== undefined
          ? parseInt(dadosForm.ordem, 10)
          : 1;

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
                await supabase
                  .from("profissionais")
                  .update({ ordem: prof.ordem + 1 })
                  .eq("id", prof.id);
              }
            }
          } else if (novaOrdem > ordemAntiga) {
            for (let prof of equipe) {
              if (
                prof.id !== editandoId &&
                prof.ordem <= novaOrdem &&
                prof.ordem > ordemAntiga
              ) {
                await supabase
                  .from("profissionais")
                  .update({ ordem: prof.ordem - 1 })
                  .eq("id", prof.id);
              }
            }
          }
        }
      }

      const tenantIdFinal =
        profile?.tenant_id ||
        user?.tenant_id ||
        "11111111-1111-1111-1111-111111111111";

      const dadosParaSalvar = {
        nome: formatarNome(dadosForm.nome.trim()),
        especialidade: formatarNome(dadosForm.especialidade.trim()),
        telefone: dadosForm.telefone ? dadosForm.telefone.trim() : null,
        ordem: novaOrdem,
        foto: dadosForm.foto || null,
        email: dadosForm.email ? dadosForm.email.trim() : null,
        is_admin: dadosForm.is_admin || false,
        tenant_id: tenantIdFinal,
      };

      if (editandoId) {
        const { error } = await supabase
          .from("profissionais")
          .update(dadosParaSalvar)
          .eq("id", editandoId);
        if (error) throw error;
        toast.success("Profissional atualizado com sucesso!");
      } else {
        if (dadosForm.email && dadosForm.senha) {
          const adminAuthClient = createClient(
            import.meta.env.VITE_SUPABASE_URL ||
              "https://placeholder.supabase.co",
            import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key",
            { auth: { persistSession: false, autoRefreshToken: false } },
          );

          const { data: authData, error: authError } =
            await adminAuthClient.auth.signUp({
              email: dadosForm.email.trim(),
              password: dadosForm.senha,
            });

          if (authError) {
            const isUserAlreadyRegistered =
              authError.message?.toLowerCase().includes("already registered") ||
              authError.message?.toLowerCase().includes("already exists") ||
              authError.status === 422;

            if (isUserAlreadyRegistered) {
              const profNaEquipe = equipe.find(
                (p) =>
                  p.email &&
                  p.email.toLowerCase() ===
                    dadosForm.email.trim().toLowerCase(),
              );

              if (profNaEquipe) {
                setModalReativarInfo({
                  aberto: true,
                  email: dadosForm.email.trim(),
                  nome: dadosParaSalvar.nome,
                  tipo: "ja_na_equipe",
                  profNome: profNaEquipe.nome,
                  profObj: profNaEquipe,
                  dadosParaSalvar: null,
                });
                setCarregandoForm(false);
                return;
              } else {
                setModalReativarInfo({
                  aberto: true,
                  email: dadosForm.email.trim(),
                  nome: dadosParaSalvar.nome,
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
            dadosParaSalvar.id = authData.user.id;
          }
        }

        const { error } = await supabase
          .from("profissionais")
          .insert([dadosParaSalvar]);
        if (error) throw error;
        toast.success("Profissional cadastrado com sucesso!");
      }

      setModalAberto(false);
      buscarProfissionais();
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
      const { error } = await supabase
        .from("profissionais")
        .insert([modalReativarInfo.dadosParaSalvar]);

      if (error) throw error;

      toast.success("Profissional reativado com sucesso!");
      setModalReativarInfo({ aberto: false });
      setModalAberto(false);
      buscarProfissionais();
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
    try {
      const { error } = await supabase
        .from("profissionais")
        .delete()
        .eq("id", profParaExcluir);
      if (error) throw error;
      toast.success("Profissional excluído com sucesso!");
      setModalExcluirAberto(false);
      setProfParaExcluir(null);
      buscarProfissionais();
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

  return (
    <div className="equipe-container">
      <div className="equipe-header">
        <div>
          <h2>Equipe</h2>
          <p>Gerencie as profissionais do seu negócio</p>
        </div>
        <div className="equipe-header-acoes">
          <div className="filtro-busca-container">
            <Search size={16} className="icone-busca" />
            <input
              type="text"
              placeholder="Buscar profissional..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-busca"
            />
          </div>
          <Button variant="primary" onClick={abrirModalCadastro}>
            <UserPlus size={18} />
            <span>Nova Profissional</span>
          </Button>
        </div>
      </div>

      <div className="equipe-grid">
        {carregandoDados ? (
          [1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="equipe-card"
              style={{ pointerEvents: "none" }}
            >
              <div className="equipe-card-info">
                <Skeleton width="48px" height="48px" borderRadius="50%" />
                <div
                  className="info-textos"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    marginLeft: "8px",
                  }}
                >
                  <Skeleton width="130px" height="18px" />
                  <Skeleton width="90px" height="14px" />
                  <Skeleton width="100px" height="14px" />
                </div>
              </div>

              <div
                className="equipe-card-acoes"
                style={{ display: "flex", gap: "8px" }}
              >
                <Skeleton width="32px" height="32px" borderRadius="8px" />
                <Skeleton width="32px" height="32px" borderRadius="8px" />
              </div>
            </div>
          ))
        ) : equipeFiltrada.length > 0 ? (
          equipeFiltrada.map((prof) => (
            <div key={prof.id} className="equipe-card">
              <div className="equipe-card-info">
                {prof.foto ? (
                  <img
                    src={prof.foto}
                    alt={prof.nome}
                    className="avatar-img-card"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {prof.nome.charAt(0)}
                  </div>
                )}

                <div className="info-textos">
                  <h3>
                    {prof.nome}{" "}
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        fontWeight: "normal",
                      }}
                    >
                      (Ordem: {prof.ordem ?? 1})
                    </span>
                  </h3>
                  <span className="especialidade">
                    <Briefcase size={14} /> {prof.especialidade}
                  </span>
                  <span className="telefone">
                    {prof.telefone || "Sem telefone"}
                  </span>
                </div>
              </div>

              <div className="equipe-card-acoes">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => abrirModalEdicao(prof)}
                  title="Editar"
                >
                  <Edit size={18} className="text-slate-600" />
                </Button>
                {prof.id !== profile?.id && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => abrirModalExcluir(prof.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div
            className="estado-vazio-equipe"
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "3rem",
            }}
          >
            Nenhuma profissional encontrada.
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editandoId ? "Editar Profissional" : "Cadastrar Profissional"}
      >
        <form
          onSubmit={handleSubmit(handleSalvar)}
          className="space-y-4"
          autoComplete="off"
        >
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {fotoWatch ? (
                <img
                  src={fotoWatch}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera size={24} className="text-slate-400" />
              )}
            </div>
            <div className="space-y-1">
              <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Escolher Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>
              <span className="block text-[0.7rem] text-slate-400">
                JPG, PNG. Max 5MB.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Nome Completo *
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="Ex: Amanda Lima"
              {...register("nome")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
            />
            {errors.nome && (
              <span className="text-xs text-red-500">
                {errors.nome.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Especialidade *
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="Ex: Nail Designer"
              {...register("especialidade")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
            />
            {errors.especialidade && (
              <span className="text-xs text-red-500">
                {errors.especialidade.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Telefone
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="(00) 00000-0000"
                {...register("telefone")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Ordem de Exibição
              </label>
              <input
                type="number"
                placeholder="Ex: 1"
                {...register("ordem")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              E-mail (Login) *
            </label>
            <input
              type="email"
              autoComplete="off"
              placeholder="Ex: amanda@salao.com"
              {...register("email")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
            />
            {errors.email && (
              <span className="text-xs text-red-500">
                {errors.email.message}
              </span>
            )}
          </div>

          {!editandoId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Senha Provisória *
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                {...register("senha")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
              />
              {errors.senha && (
                <span className="text-xs text-red-500">
                  {errors.senha.message}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAdminCheckbox"
              {...register("is_admin")}
              className="rounded text-[var(--cor-primaria)] cursor-pointer"
            />
            <label
              htmlFor="isAdminCheckbox"
              className="text-sm text-slate-700 cursor-pointer"
            >
              Dar permissão de <strong>Administrador</strong> (Pode ver tudo)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalAberto(false)}
              disabled={carregandoForm}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={carregandoForm}>
              {carregandoForm
                ? "Salvando..."
                : editandoId
                  ? "Salvar Alterações"
                  : "Salvar Profissional"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={modalExcluirAberto}
        onClose={cancelarExclusao}
        title="Excluir Profissional"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <p>
              Tem certeza que deseja excluir esta profissional? Esta ação não
              poderá ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={cancelarExclusao}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarExclusao}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

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
