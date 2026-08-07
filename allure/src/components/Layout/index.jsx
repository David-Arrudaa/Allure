import React from "react";
import { NavLink, Outlet } from "react-router-dom";
// Adicionado o ícone LayoutDashboard para a Home
import {
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Scissors,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "./Layout.css";

export function Layout() {
  const { profile, logout } = useAuth();

  return (
    <div className="layout-container">
      {/* MENU LATERAL */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Allure</h2>
          <p>Admin</p>
        </div>

        <nav className="sidebar-nav">
          {/* NOVO LINK PARA O PAINEL / HOME */}
          <NavLink to="/" end className="nav-item">
            <LayoutDashboard size={20} />
            <span>Painel</span>
          </NavLink>

          <NavLink to="/agenda" className="nav-item">
            <CalendarDays size={20} />
            <span>Agenda</span>
          </NavLink>

          <NavLink to="/clientes" className="nav-item">
            <Users size={20} />
            <span>Clientes</span>
          </NavLink>

          <NavLink to="/servicos" className="nav-item">
            <Scissors size={20} />
            <span>Serviços</span>
          </NavLink>

          {profile?.cargo === "admin" && (
            <NavLink to="/configuracoes" className="nav-item">
              <Settings size={20} />
              <span>Configurações</span>
            </NavLink>
          )}
        </nav>

        {/* RODAPÉ DO MENU (Informações e Logout) */}
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{profile?.nome || "Usuário"}</span>
            <span className="user-role">{profile?.cargo || "Admin"}</span>
          </div>

          <button
            onClick={logout}
            className="logout-button"
            title="Sair do sistema"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ÁREA DIREITA */}
      <div className="main-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
