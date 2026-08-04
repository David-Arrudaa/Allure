import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Agenda } from "../pages/Agenda";
import { Clientes } from "../pages/Clientes";
import { Servicos } from "../pages/Servicos"; // <-- Nova importação
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
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/servicos" element={<Servicos />} />{" "}
          {/* <-- Nova Rota */}
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="*" element={<Navigate to="/agenda" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
