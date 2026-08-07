import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Home } from "../components/Home/Home";
import { Financeiro } from "../components/Financeiro/Financeiro"; // <-- 1. Importação do Financeiro
import { Agenda } from "../pages/Agenda";
import { Clientes } from "../pages/Clientes";
import { Servicos } from "../pages/Servicos";
import { PrivateRoute } from "./PrivateRoute";
import { Layout } from "../components/Layout/index.jsx";

function Configuracoes() {
  return <div>Tela de Configurações em construção...</div>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

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

          {/* 2. Nossa nova Rota de Finanças! */}
          <Route path="/financeiro" element={<Financeiro />} />

          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>

        {/* Qualquer link errado agora joga para a Home principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
