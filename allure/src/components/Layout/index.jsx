import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Scissors,
  LayoutDashboard,
  DollarSign,
  Briefcase,
  Package,
  Menu, // <-- Ícone do hambúrguer
  X, // <-- Ícone para fechar o menu
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ErrorBoundary } from "../ErrorBoundary";
import "./Layout.css";

export function Layout() {
  const { profile, logout } = useAuth();

  // ESTADO PARA CONTROLAR O MENU NO CELULAR
  const [menuAberto, setMenuAberto] = useState(false);

  // Função para fechar o menu ao clicar em um link
  const fecharMenu = () => setMenuAberto(false);

  return (
    <div className="layout-container">
      {/* CABEÇALHO MOBILE (Aparece apenas no celular) */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <h2>Allure</h2>
          <p>Admin</p>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          {menuAberto ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* OVERLAY: Fundo escuro que fecha o menu ao clicar fora */}
      {menuAberto && (
        <div className="mobile-overlay" onClick={fecharMenu}></div>
      )}

      {/* MENU LATERAL */}
      <aside className={`sidebar ${menuAberto ? "aberto" : ""}`}>
        <div className="sidebar-logo">
          <h2>Allure</h2>
          <p>Admin</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-item" onClick={fecharMenu}>
            <LayoutDashboard size={20} />
            <span>Painel</span>
          </NavLink>

          <NavLink to="/agenda" className="nav-item" onClick={fecharMenu}>
            <CalendarDays size={20} />
            <span>Agenda</span>
          </NavLink>

          <NavLink to="/clientes" className="nav-item" onClick={fecharMenu}>
            <Users size={20} />
            <span>Clientes</span>
          </NavLink>

          <NavLink to="/servicos" className="nav-item" onClick={fecharMenu}>
            <Scissors size={20} />
            <span>Serviços</span>
          </NavLink>

          {profile?.is_admin && (
            <NavLink to="/produtos" className="nav-item" onClick={fecharMenu}>
              <Package size={20} />
              <span>Produtos</span>
            </NavLink>
          )}

          {profile?.is_admin && (
            <NavLink to="/equipe" className="nav-item" onClick={fecharMenu}>
              <Briefcase size={20} />
              <span>Gerenciamento</span>
            </NavLink>
          )}

          <NavLink to="/financeiro" className="nav-item" onClick={fecharMenu}>
            <DollarSign size={20} />
            <span>Financeiro</span>
          </NavLink>

          <NavLink
            to="/configuracoes"
            className="nav-item"
            onClick={fecharMenu}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </NavLink>
        </nav>

        {/* RODAPÉ DO MENU */}
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

      {/* ÁREA DIREITA (CONTEÚDO DAS TELAS) */}
      <div className="main-wrapper">
        <main className="main-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
