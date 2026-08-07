import React, { useState } from "react";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  QrCode,
  User,
  Scissors,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "./Financeiro.css";

export function Financeiro() {
  const [mesSelecionado, setMesSelecionado] = useState("Ago");
  const [anoSelecionado, setAnoSelecionado] = useState("2026");
  const [busca, setBusca] = useState("");

  // Controles de abertura dos painéis
  const [expandirDesempenho, setExpandirDesempenho] = useState(false);
  const [expandirHistorico, setExpandirHistorico] = useState(false);

  const [profSelecionada, setProfSelecionada] = useState(null);

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

  const totalFaturado = "R$ 4.850,00";
  const entradasPix = "R$ 2.450,00";
  const entradasDinheiro = "R$ 1.200,00";
  const entradasCartao = "R$ 1.200,00";

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

  const funcionarias = [
    {
      id: 1,
      nome: "Ana Silva",
      totalProduzido: "R$ 2.160,00",
      atendimentos: 18,
    },
    {
      id: 2,
      nome: "Beatriz Santos",
      totalProduzido: "R$ 1.170,00",
      atendimentos: 15,
    },
    { id: 3, nome: "Carla Dias", totalProduzido: "R$ 630,00", atendimentos: 9 },
  ];

  const atendimentosPorProfissional = {
    1: [
      {
        id: 101,
        data: "05/08/2026",
        cliente: "Juliana Costa",
        servico: "Manutenção em Gel",
        tipo: "Gel",
        valor: "R$ 120,00",
      },
      {
        id: 102,
        data: "06/08/2026",
        cliente: "Amanda Lima",
        servico: "Alongamento",
        tipo: "Gel",
        valor: "R$ 200,00",
      },
      {
        id: 103,
        data: "06/08/2026",
        cliente: "Letícia Ribeiro",
        servico: "Pé e Mão",
        tipo: "Tradicional",
        valor: "R$ 90,00",
      },
    ],
    2: [
      {
        id: 201,
        data: "05/08/2026",
        cliente: "Marcela Souza",
        servico: "Pé e Mão",
        tipo: "Tradicional",
        valor: "R$ 90,00",
      },
      {
        id: 202,
        data: "07/08/2026",
        cliente: "Fernanda Costa",
        servico: "Spa dos Pés",
        tipo: "Spa",
        valor: "R$ 150,00",
      },
    ],
  };

  const calcularResumoTipos = (idProfissional) => {
    const atendimentos = atendimentosPorProfissional[idProfissional] || [];
    const resumo = {};
    atendimentos.forEach((at) => {
      // Trocamos at.tipo por at.servico para pegar o nome exato
      resumo[at.servico] = (resumo[at.servico] || 0) + 1;
    });
    return Object.entries(resumo);
  };

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

      {/* SEÇÃO: DESEMPENHO POR PROFISSIONAL (Expansível) */}
      <div className="section-box mb-15">
        <div
          className={`section-header-clickable ${expandirDesempenho ? "aberto" : ""}`}
          onClick={() => setExpandirDesempenho(!expandirDesempenho)}
        >
          <div className="section-title">
            <User size={20} />
            <h3>
              Desempenho por Funcionária - {mesSelecionado}/{anoSelecionado}
            </h3>
          </div>
          {expandirDesempenho ? (
            <ChevronUp size={20} className="chevron-icon" />
          ) : (
            <ChevronDown size={20} className="chevron-icon" />
          )}
        </div>

        {expandirDesempenho && (
          <div className="section-content">
            <div className="prof-cards-grid">
              {funcionarias.map((prof) => (
                <div
                  key={prof.id}
                  className={`prof-card ${profSelecionada === prof.id ? "ativo" : ""}`}
                  onClick={() =>
                    setProfSelecionada(
                      profSelecionada === prof.id ? null : prof.id,
                    )
                  }
                >
                  <div className="prof-card-info">
                    <strong>{prof.nome}</strong>
                    <span>{prof.atendimentos} atendimentos</span>
                  </div>
                  <div className="prof-card-valor">{prof.totalProduzido}</div>
                </div>
              ))}
            </div>

            {profSelecionada && (
              <div className="prof-detalhes-container">
                <div className="prof-detalhes-header">
                  <h4>
                    Histórico Detalhado:{" "}
                    {funcionarias.find((f) => f.id === profSelecionada)?.nome}
                  </h4>
                  <button
                    className="btn-fechar"
                    onClick={() => setProfSelecionada(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="prof-resumo-tags">
                  <span className="resumo-label">Resumo do mês:</span>
                  {calcularResumoTipos(profSelecionada).map(
                    ([tipo, quantidade]) => (
                      <div key={tipo} className="prof-tag">
                        <strong>{quantidade}</strong> {tipo}
                      </div>
                    ),
                  )}
                  {calcularResumoTipos(profSelecionada).length === 0 && (
                    <span className="texto-secundario">
                      Nenhum serviço registrado neste mês.
                    </span>
                  )}
                </div>

                {atendimentosPorProfissional[profSelecionada]?.length > 0 && (
                  <div className="tabela-financeira mt-10">
                    <div className="tabela-cabecalho prof-table">
                      <span>Data</span>
                      <span>Cliente</span>
                      <span>Serviço</span>
                      <span>Valor Produzido</span>
                    </div>
                    {atendimentosPorProfissional[profSelecionada].map(
                      (item) => (
                        <div key={item.id} className="tabela-linha prof-table">
                          <span className="texto-secundario">{item.data}</span>
                          <strong>{item.cliente}</strong>
                          <span>
                            <span className="tag-forma">{item.servico}</span>
                          </span>
                          <span className="valor-recebido">{item.valor}</span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SEÇÃO: HISTÓRICO GERAL (Expansível) */}
      <div className="section-box">
        <div
          className={`section-header-clickable ${expandirHistorico ? "aberto" : ""}`}
          onClick={() => setExpandirHistorico(!expandirHistorico)}
        >
          <div className="section-title">
            <Calendar size={20} />
            <h3>
              Histórico Geral de Recebimentos - {mesSelecionado}/
              {anoSelecionado}
            </h3>
          </div>
          {expandirHistorico ? (
            <ChevronUp size={20} className="chevron-icon" />
          ) : (
            <ChevronDown size={20} className="chevron-icon" />
          )}
        </div>

        {expandirHistorico && (
          <div className="section-content">
            {historicoPagamentos.length > 0 ? (
              <div className="tabela-financeira">
                <div className="tabela-cabecalho geral-table">
                  <span>Cliente</span>
                  <span>Serviço</span>
                  <span>Forma</span>
                  <span>Data</span>
                  <span>Valor</span>
                </div>
                {historicoPagamentos.map((item) => (
                  <div key={item.id} className="tabela-linha geral-table">
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
        )}
      </div>
    </div>
  );
}
