import { useState, useEffect } from "react";
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
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../services/supabase"; // Importação do banco de dados
import { Skeleton } from "../../components/ui/Skeleton";
import "./Equipe.css";

export function Equipe() {
  const [busca, setBusca] = useState("");
  const [equipe, setEquipe] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [carregandoForm, setCarregandoForm] = useState(false);

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

  // 1. BUSCAR PROFISSIONAIS NO BANCO DE DADOS
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
        alert("A imagem é muito grande. Escolha uma foto com menos de 5MB.");
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

      const dadosParaSalvar = {
        nome: formFunc.nome.trim(),
        especialidade: formFunc.especialidade.trim(),
        telefone: formFunc.telefone.trim() || null,
        ordem: novaOrdem,
        foto: formFunc.foto || null,
        email: formFunc.email.trim(),
        is_admin: formFunc.is_admin,
      };

      if (editandoId) {
        const { error } = await supabase
          .from("profissionais")
          .update(dadosParaSalvar)
          .eq("id", editandoId);
        if (error) throw error;
      } else {
        // Criar usuário no Auth (sem deslogar o admin)
        // Isso requer que a confirmação de e-mail esteja desativada no Supabase (Autoconfirm)
        if (formFunc.email && formFunc.senha) {
          const adminAuthClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
          );

          const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
            email: formFunc.email.trim(),
            password: formFunc.senha,
          });

          if (authError) throw new Error("Erro ao criar login: " + authError.message);
          
          if (authData.user) {
            dadosParaSalvar.id = authData.user.id; // Vincula ao mesmo UUID
          }
        }

        const { error } = await supabase
          .from("profissionais")
          .insert([dadosParaSalvar]);
        if (error) throw error;
      }

      setModalAberto(false);
      buscarProfissionais();
    } catch (error) {
      console.error("Erro ao salvar profissional:", error.message);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setCarregandoForm(false);
    }
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
      setModalExcluirAberto(false);
      setProfParaExcluir(null);
      buscarProfissionais();
    } catch (error) {
      console.error("Erro ao excluir profissional:", error.message);
      alert(
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
          <button className="btn-acao-primaria" onClick={abrirModalCadastro}>
            <UserPlus size={18} />
            <span>Nova Profissional</span>
          </button>
        </div>
      </div>

      <div className="equipe-grid">
        {carregandoDados ? (
          /* ========================================================= */
          /* MÁGICA DOS SKELETONS AQUI - GERANDO 6 CARTÕES FANTASMAS   */
          /* ========================================================= */
          [1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="equipe-card"
              style={{ pointerEvents: "none" }}
            >
              <div className="equipe-card-info">
                {/* Foto Fantasma */}
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
                  {/* Nome Fantasma */}
                  <Skeleton width="130px" height="18px" />
                  {/* Especialidade Fantasma */}
                  <Skeleton width="90px" height="14px" />
                  {/* Telefone Fantasma */}
                  <Skeleton width="100px" height="14px" />
                </div>
              </div>

              <div
                className="equipe-card-acoes"
                style={{ display: "flex", gap: "8px" }}
              >
                {/* Botões de Ação Fantasmas */}
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
                <button
                  className="btn-editar"
                  onClick={() => abrirModalEdicao(prof)}
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  className="btn-excluir"
                  onClick={() => abrirModalExcluir(prof.id)}
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
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

      {/* Modais continuam normais daqui para baixo... */}
      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3>
                {editandoId ? "Editar Profissional" : "Cadastrar Profissional"}
              </h3>
              <button
                className="btn-fechar"
                onClick={() => setModalAberto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="modal-form">
              <div className="upload-foto-container">
                <div className="avatar-preview">
                  {formFunc.foto ? (
                    <img src={formFunc.foto} alt="Preview" />
                  ) : (
                    <Camera size={24} color="#94a3b8" />
                  )}
                </div>
                <div className="upload-foto-textos">
                  <label className="btn-secundario upload-label">
                    Escolher Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      style={{ display: "none" }}
                    />
                  </label>
                  <span className="upload-dica">JPG, PNG. Max 5MB.</span>
                </div>
              </div>

              <div className="form-group">
                <label>Nome Completo *</label>
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
                />
              </div>

              <div className="form-group">
                <label>Especialidade *</label>
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
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formFunc.telefone}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, telefone: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>E-mail (Login) *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: amanda@salao.com"
                  value={formFunc.email}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, email: e.target.value })
                  }
                />
              </div>

              {!editandoId && (
                <div className="form-group">
                  <label>Senha Provisória *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={formFunc.senha}
                    onChange={(e) =>
                      setFormFunc({ ...formFunc, senha: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="isAdminCheckbox"
                  checked={formFunc.is_admin}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, is_admin: e.target.checked })
                  }
                  style={{ width: "auto" }}
                />
                <label htmlFor="isAdminCheckbox" style={{ marginBottom: 0, cursor: "pointer", fontWeight: "normal" }}>
                  Dar permissão de <strong>Administrador</strong> (Pode ver tudo)
                </label>
              </div>

              <div className="form-group">
                <label>Ordem de Exibição na Agenda</label>
                <input
                  type="number"
                  placeholder="Ex: 1"
                  value={formFunc.ordem}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, ordem: e.target.value })
                  }
                />
              </div>

              <div className="modal-acoes" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setModalAberto(false)}
                  disabled={carregandoForm}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-acao-primaria"
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
        <div className="modal-overlay">
          <div className="modal-content modal-pequeno">
            <div className="modal-header">
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={20} />
                Excluir Profissional
              </h3>
              <button className="btn-fechar" onClick={cancelarExclusao}>
                <X size={20} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{ marginBottom: "1.5rem", color: "#475569" }}
            >
              <p>
                Tem certeza que deseja excluir esta profissional? Esta ação não
                poderá ser desfeita.
              </p>
            </div>
            <div className="modal-acoes">
              <button className="btn-secundario" onClick={cancelarExclusao}>
                Cancelar
              </button>
              <button className="btn-acao-perigo" onClick={confirmarExclusao}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
