import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Dashboard as Home } from "../pages/Dashboard/Dashboard";
import { Financeiro } from "../pages/Financeiro/Financeiro";
import { Equipe } from "../pages/Equipe/Equipe";
import { Agenda } from "../pages/Agenda";
import { Clientes } from "../pages/Clientes";
import { Servicos } from "../pages/Servicos";
import { Produtos } from "../pages/Produtos/Produtos";
import { PrivateRoute } from "./PrivateRoute";
import { Layout } from "../components/Layout/index.jsx";
import { useAuth } from "../contexts/AuthContext";
import { AgendamentoPublico } from "../pages/AgendamentoPublico/AgendamentoPublico";
import { Configuracoes } from "../pages/Configuracoes/Configuracoes";

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rota pública de agendamento */}
        <Route path="/agendar/:tenant_id" element={<AgendamentoPublico />} />

        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Agora a Home está limpa, pois a navegação já é feita dentro dela */}
          <Route index element={<Home />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/produtos" element={<AdminRoute><Produtos /></AdminRoute>} />
          {/* Rotas de Finanças e Equipe */}
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/equipe" element={<AdminRoute><Equipe /></AdminRoute>} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>

        {/* Qualquer link errado agora joga para a Home principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
