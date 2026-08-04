import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarDays, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "./Layout.css";

export function Layout() {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/agenda":
        return "Agenda Inteligente";
      case "/clientes":
        return "Gestão de Clientes";
      case "/configuracoes":
        return "Configurações";
      default:
        return "Painel Allure";
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Allure</h2>
          <p>Admin</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/agenda" className="nav-item">
            <CalendarDays size={20} />
            <span>Agenda</span>
          </NavLink>

          <NavLink to="/clientes" className="nav-item">
            <Users size={20} />
            <span>Clientes</span>
          </NavLink>

          {profile?.cargo === "admin" && (
            <NavLink to="/configuracoes" className="nav-item">
              <Settings size={20} />
              <span>Configurações</span>
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="header">
          <h1 className="header-title">{getPageTitle()}</h1>

          <div className="header-profile">
            <div className="user-info">
              <span className="user-name">{profile?.nome || "Usuário"}</span>
              <span className="user-role">{profile?.cargo}</span>
            </div>

            <button
              onClick={logout}
              className="logout-button"
              title="Sair do sistema"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
