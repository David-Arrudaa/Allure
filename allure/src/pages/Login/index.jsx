import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logoAllure from "../../assets/logo.png";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/agenda", { replace: true });
    }
  }, [user, navigate]);

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
    <div className="flex h-screen w-screen bg-[var(--cor-fundo)] font-sans">
      {/* LADO ESQUERDO */}
      <div
        className="hidden min-[900px]:flex flex-[1.2] relative bg-cover bg-center justify-center items-center overflow-hidden"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1920&auto=format&fit=crop")',
        }}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[rgba(199,75,103,0.85)] to-[rgba(160,60,83,0.95)]"></div>
        <div className="relative z-20 text-center text-white px-16 py-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col items-center">
          <img
            src={logoAllure}
            alt="Logo Allure"
            className="w-[220px] mb-2 brightness-0 invert"
          />
          {/* ESTILO PREMIUM PARA O SUBTÍTULO */}
          <p className="uppercase tracking-[4px] text-[0.85rem] font-medium text-white/80 m-0">
            Gestão Inteligente
          </p>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="flex-1 flex justify-center items-center bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-30 min-[900px]:bg-white max-[900px]:bg-[var(--cor-fundo)]">
        <div className="w-full max-w-[400px] p-10 max-[900px]:bg-white max-[900px]:rounded-[20px] max-[900px]:shadow-[0_10px_40px_rgba(0,0,0,0.05)] max-[900px]:px-8 max-[900px]:py-10">
          <h2 className="text-[var(--cor-texto)] text-[2.2rem] font-bold mb-2 tracking-tight">
            Bem-vindo(a)
          </h2>
          <p className="text-slate-500 mb-10 text-base">
            Acesse sua plataforma de gestão.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border-l-4 border-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col text-left gap-1.5">
              <label
                htmlFor="email"
                className="text-[0.85rem] font-semibold text-slate-600 uppercase tracking-wide"
              >
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="contato@salao.com"
                className="px-5 py-4 border-2 border-[var(--cor-fundo)] bg-slate-50 rounded-xl text-base outline-none transition-all duration-300 text-[var(--cor-texto)] focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_4px_12px_rgba(199,75,103,0.1)] placeholder-slate-400"
              />
            </div>

            <div className="flex flex-col text-left gap-1.5">
              <label
                htmlFor="password"
                className="text-[0.85rem] font-semibold text-slate-600 uppercase tracking-wide"
              >
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="px-5 py-4 border-2 border-[var(--cor-fundo)] bg-slate-50 rounded-xl text-base outline-none transition-all duration-300 text-[var(--cor-texto)] focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_4px_12px_rgba(199,75,103,0.1)] placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-br from-[var(--cor-primaria)] to-[#a03c53] text-white border-none p-[1.2rem] rounded-xl text-[1.05rem] font-semibold cursor-pointer transition-all duration-300 mt-4 shadow-[0_4px_15px_rgba(199,75,103,0.3)] hover:not(:disabled):-translate-y-[2px] hover:not(:disabled):shadow-[0_6px_20px_rgba(199,75,103,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {isLoading ? "Autenticando..." : "Entrar na plataforma"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
