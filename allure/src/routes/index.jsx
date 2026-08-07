import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Home } from "../components/Home/Home"; // <-- 1. Importação da Home
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
          {/* 2. Rota raiz agora abre a Home profissional dentro do Layout */}
          <Route
            index
            element={
              <Home
                aoNavegar={(pagina) => (window.location.href = `/${pagina}`)}
              />
            }
          />

          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>

        {/* 3. Qualquer link errado agora joga para a Home principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
