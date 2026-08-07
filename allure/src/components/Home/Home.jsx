import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import "./Home.css";

export function Home() {
  const navigate = useNavigate();

  const faturamentoMes = "R$ 4.850,00";
  const totalAtendimentos = 42;
  const ticketMedio = "R$ 115,47";

  const atendimentosPorProfissional = [
    { nome: "Ana Silva", qtd: 18 },
    { nome: "Beatriz Santos", qtd: 15 },
    { nome: "Carla Dias", qtd: 9 },
  ];

  return (
    <div className="home-container">
      <div className="home-header">
        <div>
          <h2>Painel</h2>
          <p>Acompanhe a saúde do seu negócio em tempo real.</p>
        </div>
        <div className="home-header-acoes">
          <button
            className="btn-acao-primaria"
            onClick={() => navigate("/agenda")}
          >
            <Plus size={18} />
            <span>Ir para Agenda</span>
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span>ATENDIMENTOS (MÊS)</span>
            <h2>{totalAtendimentos}</h2>
          </div>
          <div className="metric-icon blue">
            <Calendar size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>FATURAMENTO (MÊS)</span>
            <h2>{faturamentoMes}</h2>
          </div>
          <div className="metric-icon green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>TICKET MÉDIO</span>
            <h2>{ticketMedio}</h2>
          </div>
          <div className="metric-icon purple">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="shortcuts-grid">
        <div className="shortcut-card" onClick={() => navigate("/agenda")}>
          <div className="shortcut-icon">
            <Plus size={24} />
          </div>
          <div className="shortcut-text">
            <h3>Novo Agendamento</h3>
            <p>Marcar horário na agenda</p>
          </div>
          <ArrowUpRight size={20} className="shortcut-arrow" />
        </div>

        <div className="shortcut-card" onClick={() => navigate("/clientes")}>
          <div className="shortcut-icon secondary">
            <Users size={24} />
          </div>
          <div className="shortcut-text">
            <h3>Cadastrar Cliente</h3>
            <p>Adicionar nova cliente à base</p>
          </div>
          <ArrowUpRight size={20} className="shortcut-arrow" />
        </div>
      </div>

      <div className="home-sections-grid">
        <div className="section-box">
          <div className="section-title">
            <Users size={20} />
            <h3>Atendimentos por Funcionária</h3>
          </div>
          <div className="ranking-list">
            {atendimentosPorProfissional.map((prof) => (
              <div key={prof.nome} className="ranking-item">
                <div className="ranking-detalhes">
                  <strong>{prof.nome}</strong>
                  <span>{prof.qtd} atendimentos realizados</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-box">
          <div className="section-title">
            <TrendingUp size={20} />
            <h3>Serviços Mais Procurados</h3>
          </div>
          <div className="ranking-list">
            <div className="ranking-item">
              <div className="ranking-detalhes">
                <strong>Manutenção em Gel</strong>
                <span>45% da preferência</span>
              </div>
              <div className="ranking-valor">R$ 2.160,00</div>
            </div>
            <div className="ranking-item">
              <div className="ranking-detalhes">
                <strong>Pé e Mão</strong>
                <span>30% da preferência</span>
              </div>
              <div className="ranking-valor">R$ 1.170,00</div>
            </div>
            <div className="ranking-item">
              <div className="ranking-detalhes">
                <strong>Pedicure Simples</strong>
                <span>25% da preferência</span>
              </div>
              <div className="ranking-valor">R$ 630,00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
