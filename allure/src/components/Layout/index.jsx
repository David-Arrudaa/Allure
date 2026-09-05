import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Scissors,
  LayoutDashboard,
  DollarSign,
  UserCheck,
  Package,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ErrorBoundary } from "../ErrorBoundary";
import logoHeader from "../../assets/logo-header.png";
import "./Layout.css";

export function Layout() {
  const { profile, logout } = useAuth();

  // Estado do menu mobile (drawer)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  // Estado para recolher/expandir sidebar no desktop
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false);

  const fecharMenuMobile = () => setMenuMobileAberto(false);

  return (
    <div className={`layout-container ${sidebarRecolhida ? "sidebar-recolhida" : ""}`}>
      {/* CABEÇALHO MOBILE / TABLET COM BOTÃO HAMBÚRGUER */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <img src={logoHeader} alt="LUZZ" className="mobile-logo-img" />
        </div>
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setMenuMobileAberto(!menuMobileAberto)}
          aria-label="Abrir Menu"
        >
          {menuMobileAberto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </header>

      {/* OVERLAY ESCURO AO ABRIR O MENU NO CELULAR */}
      {menuMobileAberto && (
        <div className="mobile-overlay" onClick={fecharMenuMobile}></div>
      )}

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className={`sidebar ${menuMobileAberto ? "aberto" : ""} ${sidebarRecolhida ? "recolhida" : ""}`}>
        <div className="sidebar-top-section">
          <div className="sidebar-logo">
            <img src={logoHeader} alt="LUZZ" className="sidebar-logo-img" />
          </div>

          {/* Botão para fechar no mobile */}
          <button
            type="button"
            className="btn-fechar-drawer"
            onClick={fecharMenuMobile}
            title="Fechar menu"
          >
            <X size={22} />
          </button>

          {/* Botão de colapsar no Desktop */}
          <button
            type="button"
            className="btn-toggle-desktop"
            onClick={() => setSidebarRecolhida(!sidebarRecolhida)}
            title={sidebarRecolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {sidebarRecolhida ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-item" onClick={fecharMenuMobile} title="Painel">
            <LayoutDashboard size={20} />
            <span className="nav-label">Painel</span>
          </NavLink>

          <NavLink to="/agenda" className="nav-item" onClick={fecharMenuMobile} title="Agenda">
            <CalendarDays size={20} />
            <span className="nav-label">Agenda</span>
          </NavLink>

          <NavLink to="/clientes" className="nav-item" onClick={fecharMenuMobile} title="Clientes">
            <Users size={20} />
            <span className="nav-label">Clientes</span>
          </NavLink>

          <NavLink to="/servicos" className="nav-item" onClick={fecharMenuMobile} title="Serviços">
            <Scissors size={20} />
            <span className="nav-label">Serviços</span>
          </NavLink>

          {profile?.is_admin && (
            <NavLink to="/produtos" className="nav-item" onClick={fecharMenuMobile} title="Produtos">
              <Package size={20} />
              <span className="nav-label">Produtos</span>
            </NavLink>
          )}

          {profile?.is_admin && (
            <NavLink to="/equipe" className="nav-item" onClick={fecharMenuMobile} title="Gerenciamento">
              <UserCheck size={20} />
              <span className="nav-label">Gerenciamento</span>
            </NavLink>
          )}

          <NavLink to="/financeiro" className="nav-item" onClick={fecharMenuMobile} title="Financeiro">
            <DollarSign size={20} />
            <span className="nav-label">Financeiro</span>
          </NavLink>

          <NavLink to="/relatorios" className="nav-item" onClick={fecharMenuMobile} title="Relatórios">
            <BarChart3 size={20} />
            <span className="nav-label">Relatórios</span>
          </NavLink>

          {/*
          <NavLink
            to="/configuracoes"
            className="nav-item"
            onClick={fecharMenuMobile}
            title="Configurações"
          >
            <Settings size={20} />
            <span className="nav-label">Configurações</span>
          </NavLink> 
          */}
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

      {/* ÁREA DIREITA (CONTEÚDO PRINCIPAL) */}
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
