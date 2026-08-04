import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Agenda } from "../pages/Agenda";
import { PrivateRoute } from "./PrivateRoute";
// IMPORTAÇÃO EXPLÍCITA PARA EVITAR ERROS DO VITE
import { Layout } from "../components/Layout/index.jsx";

function Clientes() {
  return <div>Tela de Clientes em construção...</div>;
}
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
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="*" element={<Navigate to="/agenda" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
