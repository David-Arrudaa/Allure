import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Printer,
  DollarSign,
  Scissors,
  CalendarCheck,
  Users,
  TrendingUp,
  Percent,
  Clock,
  XCircle,
  CheckCircle2,
  Wallet,
  QrCode,
  CreditCard,
} from "lucide-react";
import { fetchDadosRelatorio } from "../../services/relatoriosService";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../contexts/AuthContext";
import "./Relatorios.css";

const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);

const formatarNum = (valor) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor || 0);

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Nomes de serviço/profissional vêm de cadastro do usuário — escapar antes de
// injetar na janela de impressão evita HTML/script armazenado sendo executado.
function escapeHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function calcularPeriodo(periodo, customInicio, customFim) {
  const hoje = new Date();
  let inicio, fim, label;

  if (periodo === "hoje") {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
    label = "Hoje";
  } else if (periodo === "semana") {
    const diaSemana = hoje.getDay();
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diaSemana);
    fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59);
    label = "Esta Semana";
  } else if (periodo === "ano") {
    inicio = new Date(hoje.getFullYear(), 0, 1);
    fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59);
    label = "Este Ano";
  } else if (periodo === "custom") {
    inicio = customInicio ? new Date(`${customInicio}T00:00:00`) : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    fim = customFim ? new Date(`${customFim}T23:59:59`) : hoje;
    label = "Período Personalizado";
  } else {
    // mes (padrão)
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
    label = "Este Mês";
  }

  const fmt = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

  return { inicioFiltro: fmt(inicio), fimFiltro: fmt(fim), label, inicio, fim };
}

const isVenda = (item) =>
  item.duracao === 0 || String(item.servico || "").toLowerCase().startsWith("venda:");

const isPagoValido = (item) =>
  item.pagamento === "pago" && item.status !== "bloqueio" && item.status !== "cancelado";

const nomeFormaPagamento = (forma) => {
  const f = String(forma || "").toLowerCase();
  if (f === "pix") return "pix";
  if (f === "dinheiro") return "dinheiro";
  if (f.includes("cart") || f.includes("cred") || f.includes("deb")) return "cartao";
  return "outro";
};

export function Relatorios() {
  const { profile } = useAuth();
  const [periodo, setPeriodo] = useState("mes");
  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("financeiro");
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  const { inicioFiltro, fimFiltro, label } = useMemo(
    () => calcularPeriodo(periodo, customInicio, customFim),
    [periodo, customInicio, customFim]
  );

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setLoading(true);
      try {
        const resultado = await fetchDadosRelatorio({
          inicioFiltro,
          fimFiltro,
          apenasProfissionalId: !profile?.is_admin ? profile?.id : null,
        });
        if (!cancelado) setDados(resultado);
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error.message);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    carregar();
    return () => {
      cancelado = true;
    };
  }, [inicioFiltro, fimFiltro, profile?.id, profile?.is_admin]);

  // --- Agregações derivadas do dataset único ---
  const dadosPagos = useMemo(() => dados.filter(isPagoValido), [dados]);

  const metricasFinanceiro = useMemo(() => {
    let total = 0;
    let pix = 0;
    let cartao = 0;
    let dinheiro = 0;
    let outro = 0;
    let comissoes = 0;

    dadosPagos.forEach((item) => {
      const valor = Number(item.valor) || 0;
      total += valor;
      const taxa =
        item.profissionais?.comissao !== undefined && item.profissionais?.comissao !== null
          ? Number(item.profissionais.comissao)
          : 50;
      comissoes += valor * (taxa / 100);

      const tipo = nomeFormaPagamento(item.forma_pagamento);
      if (tipo === "pix") pix += valor;
      else if (tipo === "cartao") cartao += valor;
      else if (tipo === "dinheiro") dinheiro += valor;
      else outro += valor;
    });

    const ticketMedio = dadosPagos.length > 0 ? total / dadosPagos.length : 0;

    return { total, pix, cartao, dinheiro, outro, comissoes, liquido: total - comissoes, ticketMedio };
  }, [dadosPagos]);

  const rankingServicos = useMemo(() => {
    const mapa = {};
    dadosPagos
      .filter((item) => !isVenda(item))
      .forEach((item) => {
        const nome = item.servico || "Serviço sem nome";
        const valor = Number(item.valor) || 0;
        if (!mapa[nome]) mapa[nome] = { nome, qtd: 0, faturamento: 0 };
        mapa[nome].qtd += 1;
        mapa[nome].faturamento += valor;
      });
    const lista = Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento);
    const totalGeral = lista.reduce((acc, s) => acc + s.faturamento, 0);
    return lista.map((s) => ({
      ...s,
      ticketMedio: s.faturamento / s.qtd,
      percentual: totalGeral > 0 ? (s.faturamento / totalGeral) * 100 : 0,
    }));
  }, [dadosPagos]);

  const metricasAgendamentos = useMemo(() => {
    const agendamentosReais = dados.filter((item) => !isVenda(item) && item.status !== "bloqueio");
    const total = agendamentosReais.length;
    const pagos = agendamentosReais.filter((item) => item.pagamento === "pago").length;
    const cancelados = agendamentosReais.filter((item) => item.status === "cancelado").length;
    const pendentes = total - pagos - cancelados;

    const faixas = { "Manhã (06h-12h)": 0, "Tarde (12h-18h)": 0, "Noite (18h-22h)": 0, "Outros horários": 0 };
    agendamentosReais.forEach((item) => {
      const hora = new Date(item.data_horario).getHours();
      if (hora >= 6 && hora < 12) faixas["Manhã (06h-12h)"] += 1;
      else if (hora >= 12 && hora < 18) faixas["Tarde (12h-18h)"] += 1;
      else if (hora >= 18 && hora < 22) faixas["Noite (18h-22h)"] += 1;
      else faixas["Outros horários"] += 1;
    });
    const faixaPico = Object.entries(faixas).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      pagos,
      cancelados,
      pendentes: Math.max(0, pendentes),
      taxaConclusao: total > 0 ? (pagos / total) * 100 : 0,
      faixaPico: faixaPico && faixaPico[1] > 0 ? faixaPico[0] : "—",
    };
  }, [dados]);

  const rankingFuncionarios = useMemo(() => {
    const mapa = {};
    dadosPagos.forEach((item) => {
      const id = item.profissionais?.id || item.profissional_id || "sem-prof";
      const nome = item.profissionais?.nome || "Equipe";
      const taxa =
        item.profissionais?.comissao !== undefined && item.profissionais?.comissao !== null
          ? Number(item.profissionais.comissao)
          : 50;
      const valor = Number(item.valor) || 0;
      if (!mapa[id]) mapa[id] = { id, nome, atendimentos: 0, totalProduzido: 0, comissaoPct: taxa };
      mapa[id].atendimentos += 1;
      mapa[id].totalProduzido += valor;
    });
    return Object.values(mapa)
      .map((p) => ({ ...p, comissaoValor: p.totalProduzido * (p.comissaoPct / 100) }))
      .sort((a, b) => b.totalProduzido - a.totalProduzido);
  }, [dadosPagos]);

  const abas = [
    { id: "financeiro", label: "Financeiro", icone: DollarSign },
    { id: "servicos", label: "Serviços", icone: Scissors },
    { id: "agendamentos", label: "Agendamentos", icone: CalendarCheck },
    ...(profile?.is_admin ? [{ id: "funcionarios", label: "Funcionários", icone: Users }] : []),
  ];

  const imprimirRelatorio = () => {
    const linhasServicos = rankingServicos
      .map(
        (s) => `
        <tr>
          <td>${escapeHtml(s.nome)}</td>
          <td style="text-align:center;">${s.qtd}</td>
          <td style="text-align:right;">${formatarMoeda(s.faturamento)}</td>
          <td style="text-align:right;">${formatarNum(s.percentual)}%</td>
        </tr>`
      )
      .join("");

    const linhasFuncionarios = rankingFuncionarios
      .map(
        (f) => `
        <tr>
          <td>${escapeHtml(f.nome)}</td>
          <td style="text-align:center;">${f.atendimentos}</td>
          <td style="text-align:right;">${formatarMoeda(f.totalProduzido)}</td>
          <td style="text-align:right;">${formatarMoeda(f.comissaoValor)}</td>
        </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório - ${label}</title>
      <style>
        @page { size: A4; margin: 16mm; }
        body { font-family: Arial, sans-serif; color: #111; margin: 0; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
        h2 { font-size: 13px; margin-top: 22px; margin-bottom: 6px; text-transform: uppercase; }
        .periodo { text-align: center; font-size: 12px; color: #555; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { border: 1px solid #999; padding: 5px 8px; font-size: 11px; }
        th { background: #eee; text-align: left; }
        .kpis { display: flex; gap: 10px; margin-bottom: 10px; }
        .kpi { border: 1px solid #999; padding: 8px; flex: 1; text-align: center; }
        .kpi strong { display:block; font-size: 14px; }
      </style></head>
      <body>
        <h1>Relatório Gerencial</h1>
        <div class="periodo">Período: ${label}</div>

        <h2>Financeiro</h2>
        <div class="kpis">
          <div class="kpi">Faturado<strong>${formatarMoeda(metricasFinanceiro.total)}</strong></div>
          <div class="kpi">Ticket Médio<strong>${formatarMoeda(metricasFinanceiro.ticketMedio)}</strong></div>
          <div class="kpi">Comissões<strong>${formatarMoeda(metricasFinanceiro.comissoes)}</strong></div>
          <div class="kpi">Líquido<strong>${formatarMoeda(metricasFinanceiro.liquido)}</strong></div>
        </div>

        <h2>Serviços Mais Vendidos</h2>
        <table><thead><tr><th>Serviço</th><th>Qtd.</th><th>Faturamento</th><th>%</th></tr></thead>
        <tbody>${linhasServicos || '<tr><td colspan="4">Sem dados no período.</td></tr>'}</tbody></table>

        <h2>Agendamentos</h2>
        <div class="kpis">
          <div class="kpi">Total<strong>${metricasAgendamentos.total}</strong></div>
          <div class="kpi">Pagos<strong>${metricasAgendamentos.pagos}</strong></div>
          <div class="kpi">Pendentes<strong>${metricasAgendamentos.pendentes}</strong></div>
          <div class="kpi">Cancelados<strong>${metricasAgendamentos.cancelados}</strong></div>
        </div>

        ${
          profile?.is_admin
            ? `<h2>Desempenho da Equipe</h2>
        <table><thead><tr><th>Profissional</th><th>Atendimentos</th><th>Produzido</th><th>Comissão</th></tr></thead>
        <tbody>${linhasFuncionarios || '<tr><td colspan="4">Sem dados no período.</td></tr>'}</tbody></table>`
            : ""
        }
      </body></html>
    `;

    const janela = window.open("", "_blank");
    if (!janela) {
      alert("Por favor, permita popups para gerar e imprimir o relatório.");
      return;
    }
    janela.document.documentElement.innerHTML = html;
    setTimeout(() => {
      janela.focus();
      janela.print();
    }, 400);
  };

  return (
    <div className="relatorios-container">
      <div className="relatorios-header">
        <div>
          <h2>Relatórios Gerenciais</h2>
          <p>Métricas e indicadores de desempenho do negócio</p>
        </div>
        <div className="relatorios-header-acoes">
          <div className="filtros-periodo-grupo">
            {[
              { id: "hoje", label: "Hoje" },
              { id: "semana", label: "Semana" },
              { id: "mes", label: "Mês" },
              { id: "ano", label: "Ano" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`btn-filtro-periodo ${periodo === opt.id ? "ativo" : ""}`}
                onClick={() => setPeriodo(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-imprimir-relatorio" onClick={imprimirRelatorio} disabled={loading}>
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      <nav className="relatorios-nav-abas">
        {abas.map((aba) => {
          const Icone = aba.icone;
          return (
            <button
              key={aba.id}
              type="button"
              className={`aba-item ${abaAtiva === aba.id ? "ativa" : ""}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              <Icone size={16} /> {aba.label}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card">
              <Skeleton width="70%" height="40px" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {abaAtiva === "financeiro" && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card destaque">
                  <div className="kpi-card-info">
                    <span>Total Faturado</span>
                    <h3>{formatarMoeda(metricasFinanceiro.total)}</h3>
                  </div>
                  <div className="kpi-card-icon primary"><DollarSign size={22} /></div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-info">
                    <span>Ticket Médio</span>
                    <h3>{formatarMoeda(metricasFinanceiro.ticketMedio)}</h3>
                  </div>
                  <div className="kpi-card-icon blue"><TrendingUp size={22} /></div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-info">
                    <span>Comissões</span>
                    <h3>{formatarMoeda(metricasFinanceiro.comissoes)}</h3>
                  </div>
                  <div className="kpi-card-icon amber"><Percent size={22} /></div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-info">
                    <span>Faturamento Líquido</span>
                    <h3>{formatarMoeda(metricasFinanceiro.liquido)}</h3>
                  </div>
                  <div className="kpi-card-icon green"><Wallet size={22} /></div>
                </div>
              </div>

              <div className="relatorio-tabela-box">
                <div className="relatorio-tabela-titulo">
                  <h4>Distribuição por Forma de Pagamento</h4>
                  <span>{label}</span>
                </div>
                <div className="barras-distribuicao">
                  {[
                    { key: "pix", nome: "Pix", valor: metricasFinanceiro.pix, icone: QrCode },
                    { key: "cartao", nome: "Cartão", valor: metricasFinanceiro.cartao, icone: CreditCard },
                    { key: "dinheiro", nome: "Dinheiro", valor: metricasFinanceiro.dinheiro, icone: Wallet },
                  ].map((item) => {
                    const pct = metricasFinanceiro.total > 0 ? (item.valor / metricasFinanceiro.total) * 100 : 0;
                    return (
                      <div key={item.key} className="barra-item">
                        <div className="barra-info">
                          <span>{item.nome}</span>
                          <strong>
                            {formatarMoeda(item.valor)} ({formatarNum(pct)}%)
                          </strong>
                        </div>
                        <div className="barra-trilha">
                          <div className={`barra-progresso ${item.key}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {abaAtiva === "servicos" && (
            <div className="relatorio-tabela-box">
              <div className="relatorio-tabela-titulo">
                <h4>Serviços Mais Vendidos</h4>
                <span>{label}</span>
              </div>
              {rankingServicos.length > 0 ? (
                <table className="tabela-relatorio">
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th style={{ textAlign: "center" }}>Qtd.</th>
                      <th style={{ textAlign: "right" }}>Ticket Médio</th>
                      <th style={{ textAlign: "right" }}>Faturamento</th>
                      <th style={{ textAlign: "right" }}>% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingServicos.map((s) => (
                      <tr key={s.nome}>
                        <td><strong>{s.nome}</strong></td>
                        <td style={{ textAlign: "center" }}>{s.qtd}</td>
                        <td style={{ textAlign: "right" }}>{formatarMoeda(s.ticketMedio)}</td>
                        <td style={{ textAlign: "right" }}>{formatarMoeda(s.faturamento)}</td>
                        <td style={{ textAlign: "right" }}>{formatarNum(s.percentual)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="estado-vazio-relatorio">
                  <Scissors size={32} />
                  <p>Nenhum serviço pago registrado no período.</p>
                </div>
              )}
            </div>
          )}

          {abaAtiva === "agendamentos" && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card destaque">
                  <div className="kpi-card-info">
                    <span>Total de Agendamentos</span>
                    <h3>{metricasAgendamentos.total}</h3>
                  </div>
                  <div className="kpi-card-icon primary"><CalendarCheck size={22} /></div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-info">
                    <span>Pagos / Concluídos</span>
                    <h3>{metricasAgendamentos.pagos}</h3>
                  </div>
                  <div className="kpi-card-icon green"><CheckCircle2 size={22} /></div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-info">
                    <span>Cancelados</span>
                    <h3>{metricasAgendamentos.cancelados}</h3>
                  </div>
                  <div className="kpi-card-icon amber"><XCircle size={22} /></div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-card-info">
                    <span>Taxa de Conclusão</span>
                    <h3>{formatarNum(metricasAgendamentos.taxaConclusao)}%</h3>
                  </div>
                  <div className="kpi-card-icon blue"><TrendingUp size={22} /></div>
                </div>
              </div>
              <div className="relatorio-tabela-box">
                <div className="relatorio-tabela-titulo">
                  <h4>Horário de Pico</h4>
                  <span>{label}</span>
                </div>
                <div className="barras-distribuicao">
                  <div className="barra-item">
                    <div className="barra-info">
                      <span><Clock size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />Faixa mais procurada</span>
                      <strong>{metricasAgendamentos.faixaPico}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {abaAtiva === "funcionarios" && profile?.is_admin && (
            <div className="relatorio-tabela-box">
              <div className="relatorio-tabela-titulo">
                <h4>Desempenho da Equipe</h4>
                <span>{label}</span>
              </div>
              {rankingFuncionarios.length > 0 ? (
                <table className="tabela-relatorio">
                  <thead>
                    <tr>
                      <th>Profissional</th>
                      <th style={{ textAlign: "center" }}>Atendimentos</th>
                      <th style={{ textAlign: "right" }}>Total Produzido</th>
                      <th style={{ textAlign: "right" }}>Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingFuncionarios.map((f) => (
                      <tr key={f.id}>
                        <td><strong>{f.nome}</strong></td>
                        <td style={{ textAlign: "center" }}>{f.atendimentos}</td>
                        <td style={{ textAlign: "right" }}>{formatarMoeda(f.totalProduzido)}</td>
                        <td style={{ textAlign: "right", color: "#059669", fontWeight: 700 }}>
                          {formatarMoeda(f.comissaoValor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="estado-vazio-relatorio">
                  <Users size={32} />
                  <p>Nenhum atendimento pago registrado no período.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
