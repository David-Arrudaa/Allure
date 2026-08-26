import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import logoLogin from "../assets/logo-login.png";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  Users,
  X,
  CheckCircle2,
} from "lucide-react";
import "./Login.css";

export function Login() {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("luzz_saved_email") || "";
  });
  const [password, setPassword] = useState("");
  const [lembrarDeMim, setLembrarDeMim] = useState(() => {
    return localStorage.getItem("luzz_lembrar_senha") === "true";
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para Recuperação de Senha
  const [modalRecuperacao, setModalRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState({
    tipo: "",
    texto: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (lembrarDeMim) {
        localStorage.setItem("luzz_saved_email", email);
        localStorage.setItem("luzz_lembrar_senha", "true");
      } else {
        localStorage.removeItem("luzz_saved_email");
        localStorage.setItem("luzz_lembrar_senha", "false");
      }

      await login(email, password);
      navigate("/agenda");
    } catch (err) {
      setError("E-mail ou senha incorretos.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRecuperarSenha(e) {
    e.preventDefault();
    setMensagemRecuperacao({ tipo: "", texto: "" });
    setEnviandoRecuperacao(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailRecuperacao,
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        },
      );

      if (error) throw error;

      setMensagemRecuperacao({
        tipo: "sucesso",
        texto:
          "Enviamos um link de recuperação para seu e-mail! Verifique sua caixa de entrada e spam.",
      });
    } catch (err) {
      setMensagemRecuperacao({
        tipo: "erro",
        texto: err.message || "Erro ao solicitar recuperação de senha.",
      });
    } finally {
      setEnviandoRecuperacao(false);
    }
  }

  return (
    <div className="login-container">
      {/* LADO ESQUERDO: APRESENTAÇÃO CINEMATOGRÁFICA DARK LUXURY */}
      <div className="login-left-panel">
        <div className="login-overlay"></div>
        <div className="login-ambient-light"></div>

        <div className="login-brand-info">
          <div className="login-brand-logo-container">
            <img src={logoLogin} alt="LUZZ" className="login-brand-logo" />
          </div>

          <p className="login-tagline">Gestão Inteligente</p>

          <p className="login-subdescription">
            A tecnologia definitiva para transformar e elevar o seu negócio de
            beleza.
          </p>

          <div className="login-pills-container">
            <div className="login-pill">
              <Calendar size={15} className="pill-icon" />
              <span>Agenda Inteligente</span>
            </div>
            <div className="login-pill">
              <DollarSign size={15} className="pill-icon" />
              <span>Controle Financeiro</span>
            </div>
            <div className="login-pill">
              <Users size={15} className="pill-icon" />
              <span>Equipe & Comissões</span>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO MODERNO & DIRETO */}
      <div className="login-right-panel">
        <div className="login-box">
          {/* CABEÇALHO DE MARCA MOBILE/TABLET */}
          <div className="login-mobile-brand">
            <img src={logoLogin} alt="LUZZ" className="login-mobile-logo-img" />
            <p className="login-mobile-tagline">Gestão Inteligente</p>
          </div>

          <div className="login-header-group">
            <h2 className="login-title">Acesse sua conta</h2>
            <p className="login-subtitle">
              Entre com seus dados para gerenciar seu espaço.
            </p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <div className="input-field-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seuemail@salao.com"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Senha</label>
              <div className="input-field-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* LINHA AUXILIAR: LEMBRAR DE MIM & ESQUECI A SENHA */}
            <div className="login-aux-row">
              <label className="checkbox-lembrar">
                <input
                  type="checkbox"
                  checked={lembrarDeMim}
                  onChange={(e) => setLembrarDeMim(e.target.checked)}
                />
                <span>Lembrar meu e-mail</span>
              </label>

              <button
                type="button"
                className="btn-esqueci-senha"
                onClick={() => {
                  setEmailRecuperacao(email || "");
                  setMensagemRecuperacao({ tipo: "", texto: "" });
                  setModalRecuperacao(true);
                }}
              >
                Esqueceu a senha?
              </button>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                "Autenticando..."
              ) : (
                <>
                  <span>Entrar na plataforma</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer-security">
            <ShieldCheck size={16} color="#10B981" />
            <span>Ambiente seguro com criptografia de ponta a ponta</span>
          </div>
        </div>
      </div>

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
      {modalRecuperacao && (
        <div
          className="modal-overlay"
          onClick={() => setModalRecuperacao(false)}
        >
          <div
            className="modal-box modal-recuperacao"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px" }}
          >
            <div className="modal-header">
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    margin: "0 0 4px 0",
                    color: "#0F172A",
                  }}
                >
                  Recuperar Senha
                </h2>
                <p
                  style={{ fontSize: "0.88rem", color: "#64748B", margin: 0 }}
                >
                  Enviaremos um link para você redefinir sua senha com
                  segurança.
                </p>
              </div>
              <button
                className="btn-fechar"
                onClick={() => setModalRecuperacao(false)}
                title="Fechar"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {mensagemRecuperacao.texto && (
              <div
                className={`alerta-recuperacao ${mensagemRecuperacao.tipo}`}
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  fontSize: "0.88rem",
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor:
                    mensagemRecuperacao.tipo === "sucesso"
                      ? "#ECFDF5"
                      : "#FEF2F2",
                  color:
                    mensagemRecuperacao.tipo === "sucesso"
                      ? "#065F46"
                      : "#DC2626",
                  border: `1px solid ${
                    mensagemRecuperacao.tipo === "sucesso"
                      ? "#A7F3D0"
                      : "#FECACA"
                  }`,
                }}
              >
                {mensagemRecuperacao.tipo === "sucesso" && (
                  <CheckCircle2 size={18} />
                )}
                <span>{mensagemRecuperacao.texto}</span>
              </div>
            )}

            <form
              onSubmit={handleRecuperarSenha}
              style={{ marginTop: "1.25rem" }}
            >
              <div className="input-group">
                <label htmlFor="emailRecuperacao">E-mail Cadastrado</label>
                <div className="input-field-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="emailRecuperacao"
                    value={emailRecuperacao}
                    onChange={(e) => setEmailRecuperacao(e.target.value)}
                    required
                    placeholder="seuemail@salao.com"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "1.5rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setModalRecuperacao(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="login-button"
                  style={{
                    marginTop: 0,
                    padding: "0.75rem 1.25rem",
                    fontSize: "0.95rem",
                  }}
                  disabled={enviandoRecuperacao}
                >
                  {enviandoRecuperacao ? "Enviando..." : "Enviar link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
