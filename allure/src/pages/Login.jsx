import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/agenda");
    } catch (err) {
      setError("E-mail ou senha incorretos.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* LADO ESQUERDO */}
      <div className="login-left-panel">
        <div className="login-overlay"></div>
        <div
          className="login-brand-info"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: "4rem",
              fontWeight: "900",
              letterSpacing: "10px",
              color: "#FFFFFF",
              margin: "0 0 0.25rem 0",
              fontFamily: "'Segoe UI', Roboto, sans-serif",
              textShadow: "0 4px 20px rgba(0,0,0,0.25)",
            }}
          >
            LUZZ
          </h1>

          {/* ESTILO PREMIUM PARA O SUBTÍTULO */}
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "4px",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.9)",
              margin: "0",
            }}
          >
            Gestão Inteligente
          </p>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="login-right-panel">
        <div className="login-box">
          <h2 className="login-title">Bem-vindo(a)</h2>
          <p className="login-subtitle">Acesse sua plataforma de gestão.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="contato@salao.com"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Autenticando..." : "Entrar na plataforma"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
