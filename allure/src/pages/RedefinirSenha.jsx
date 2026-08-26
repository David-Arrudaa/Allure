import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import logoLogin from "../assets/logo-login.png";
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import "./Login.css";

export function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 8) {
      setErro("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) throw error;

      setSucesso(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setErro(err.message || "Erro ao atualizar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* LADO ESQUERDO: DARK LUXURY */}
      <div className="login-left-panel">
        <div className="login-overlay"></div>
        <div className="login-ambient-light"></div>
        <div className="login-brand-info">
          <div className="login-brand-logo-container">
            <img src={logoLogin} alt="LUZZ" className="login-brand-logo" />
          </div>
          <p className="login-tagline">Gestão Inteligente</p>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO DE NOVA SENHA */}
      <div className="login-right-panel">
        <div className="login-box">
          <div className="login-header-group">
            <h2 className="login-title">Criar Nova Senha</h2>
            <p className="login-subtitle">
              Digite e confirme a sua nova senha de acesso.
            </p>
          </div>

          {erro && (
            <div className="login-error" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <AlertCircle size={18} />
              <span>{erro}</span>
            </div>
          )}

          {sucesso ? (
            <div
              style={{
                backgroundColor: "#ECFDF5",
                color: "#065F46",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid #A7F3D0",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={32} color="#10B981" />
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Senha Atualizada!</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#047857" }}>
                Sua senha foi redefinida com sucesso. Redirecionando para o login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="novaSenha">Nova Senha (Mínimo 8 caracteres)</label>
                <div className="input-field-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    id="novaSenha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                <div className="input-field-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    id="confirmarSenha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  "Atualizando senha..."
                ) : (
                  <>
                    <span>Salvar Nova Senha</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-cancelar"
                style={{ marginTop: "0.5rem", width: "100%", textAlign: "center" }}
                onClick={() => navigate("/login")}
              >
                Voltar para o Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

