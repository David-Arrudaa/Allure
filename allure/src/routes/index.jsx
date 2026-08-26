import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login/index.jsx";
import { Financeiro } from "../pages/Financeiro/Financeiro";
import { Equipe } from "../pages/Equipe/Equipe";
import { Agenda } from "../pages/Agenda/index.jsx";
import { Clientes } from "../pages/Clientes/index.jsx";
import { Servicos } from "../pages/Servicos/index.jsx";
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
        <Route path="/" element={<Navigate to="/login" replace />} />
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
          {/* A navegação da Home não é mais necessária pois a raiz redireciona pro login */}
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
