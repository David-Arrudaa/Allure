import React, { useState } from "react";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  ArrowUpRight,
  CreditCard,
  Wallet,
  QrCode,
} from "lucide-react";
import "./Financeiro.css";

export function Financeiro() {
  const [mesSelecionado, setMesSelecionado] = useState("Ago");
  const [anoSelecionado, setAnoSelecionado] = useState("2026");
  const [busca, setBusca] = useState("");

  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  // Exemplo de dados financeiros para o mês
  const totalFaturado = "R$ 4.850,00";
  const entradasPix = "R$ 2.450,00";
  const entradasDinheiro = "R$ 1.200,00";
  const entradasCartao = "R$ 1.200,00";

  // Lista de pagamentos de exemplo (vazia ou com itens)
  const historicoPagamentos = [
    {
      id: 1,
      cliente: "Juliana Costa",
      servico: "Manutenção em Gel",
      valor: "R$ 120,00",
      forma: "PIX",
      data: "05/08/2026",
    },
    {
      id: 2,
      cliente: "Marcela Souza",
      servico: "Pé e Mão",
      valor: "R$ 90,00",
      forma: "Dinheiro",
      data: "05/08/2026",
    },
  ];

  return (
    <div className="financeiro-container">
      <div className="financeiro-header">
        <div>
          <h2>Controle Financeiro</h2>
          <p>Gestão de fluxo de caixa e pagamentos</p>
        </div>
        <div className="financeiro-header-acoes">
          <div className="filtro-busca-container">
            <Search size={16} className="icone-busca" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-busca"
            />
          </div>
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="select-ano"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          <button className="btn-acao-primaria">
            <Plus size={18} />
            <span>Registrar Pagamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Seleção de Meses */}
      <div className="meses-grid">
        {meses.map((mes) => (
          <button
            key={mes}
            className={`btn-mes ${mesSelecionado === mes ? "ativo" : ""}`}
            onClick={() => setMesSelecionado(mes)}
          >
            {mes}
          </button>
        ))}
      </div>

      {/* Cards de Métricas Financeiras */}
      <div className="metrics-grid">
        <div className="metric-card destaque">
          <div className="metric-info">
            <span>TOTAL FATURADO (MÊS)</span>
            <h2>{totalFaturado}</h2>
          </div>
          <div className="metric-icon primary">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>ENTRADAS VIA PIX</span>
            <h2>{entradasPix}</h2>
          </div>
          <div className="metric-icon green">
            <QrCode size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>ENTRADAS EM DINHEIRO</span>
            <h2>{entradasDinheiro}</h2>
          </div>
          <div className="metric-icon blue">
            <Wallet size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>ENTRADAS EM CARTÃO</span>
            <h2>{entradasCartao}</h2>
          </div>
          <div className="metric-icon purple">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Histórico de Recebimentos */}
      <div className="section-box">
        <div className="section-title">
          <Calendar size={20} />
          <h3>
            Histórico de Recebimentos - {mesSelecionado}/{anoSelecionado}
          </h3>
        </div>

        {historicoPagamentos.length > 0 ? (
          <div className="tabela-financeira">
            <div className="tabela-cabecalho">
              <span>Cliente</span>
              <span>Serviço</span>
              <span>Forma</span>
              <span>Data</span>
              <span>Valor</span>
            </div>
            {historicoPagamentos.map((item) => (
              <div key={item.id} className="tabela-linha">
                <strong>{item.cliente}</strong>
                <span className="texto-secundario">{item.servico}</span>
                <span>
                  <span className="tag-forma">{item.forma}</span>
                </span>
                <span className="texto-secundario">{item.data}</span>
                <span className="valor-recebido">{item.valor}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="estado-vazio">
            <Calendar size={40} />
            <p>Nenhum pagamento encontrado para este mês.</p>
          </div>
        )}
      </div>
    </div>
  );
}
