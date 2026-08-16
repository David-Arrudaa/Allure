import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
  CalendarClock,
  X,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import "./Home.css";

export function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [resumoHoje, setResumoHoje] = useState(0);

  const [metricas, setMetricas] = useState({
    faturamento: 0,
    totalAtendimentos: 0,
    ticketMedio: 0,
    pendentesValor: 0,
    pendentesQtd: 0,
  });

  const [rankingProfissionais, setRankingProfissionais] = useState([]);
  const [rankingServicos, setRankingServicos] = useState([]);

  // Estados para gerenciar os atrasados
  const [listaPendentes, setListaPendentes] = useState([]);
  const [isModalPendentesAberto, setIsModalPendentesAberto] = useState(false);

  useEffect(() => {
    carregarDadosPainel();
  }, [filtroPeriodo]);

  const carregarDadosPainel = async () => {
    try {
      setLoading(true);

      const hoje = new Date();
      // Define a "virada de dia" - o início de hoje (00:00)
      const inicioHojeStr = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
      ).toISOString();
      const fimHojeStr = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        23,
        59,
        59,
      ).toISOString();

      let dataInicio, dataFim;

      if (filtroPeriodo === "hoje") {
        dataInicio = inicioHojeStr;
        dataFim = fimHojeStr;
      } else if (filtroPeriodo === "semana") {
        // Semana completa: Domingo a Sábado para não perder nenhum dia de movimentação
        const diaSemana = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

        const dataDomingo = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          hoje.getDate() - diaSemana,
        );
        const dataSabado = new Date(
          dataDomingo.getFullYear(),
          dataDomingo.getMonth(),
          dataDomingo.getDate() + 6,
        );

        dataInicio = new Date(
          dataDomingo.getFullYear(),
          dataDomingo.getMonth(),
          dataDomingo.getDate(),
          0,
          0,
          0,
        ).toISOString();
        dataFim = new Date(
          dataSabado.getFullYear(),
          dataSabado.getMonth(),
          dataSabado.getDate(),
          23,
          59,
          59,
        ).toISOString();
      } else {
        dataInicio = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          1,
        ).toISOString();
        dataFim = new Date(
          hoje.getFullYear(),
          hoje.getMonth() + 1,
          0,
          23,
          59,
          59,
        ).toISOString();
      }

      // 1. Busca os dados de faturamento baseados no filtro selecionado
      const { data: agendamentos, error } = await supabase
        .from("appointments")
        .select(
          `
          id, valor, servico, status, pagamento, data_horario, profissionais ( nome )
        `,
        )
        .gte("data_horario", dataInicio)
        .lte("data_horario", dataFim)
        .neq("status", "bloqueio")
        .neq("status", "cancelado");

      if (error) throw error;

      // 2. Busca ESPECIFICAMENTE os pagamentos atrasados (pendentes E anteriores a hoje)
      const { data: pendentesPassados, error: errPendentes } = await supabase
        .from("appointments")
        .select(
          `
          id, valor, servico, data_horario, customers ( nome )
        `,
        )
        .lt("data_horario", inicioHojeStr) // Estritamente antes de hoje
        .eq("pagamento", "pendente")
        .neq("status", "bloqueio")
        .neq("status", "cancelado")
        .order("data_horario", { ascending: true });

      if (errPendentes) throw errPendentes;

      // Resumo de Hoje (Para a tag azul no topo)
      if (filtroPeriodo === "hoje" && agendamentos) {
        setResumoHoje(agendamentos.length);
      } else {
        const { count } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("data_horario", inicioHojeStr)
          .lte("data_horario", fimHojeStr)
          .neq("status", "bloqueio")
          .neq("status", "cancelado");
        setResumoHoje(count || 0);
      }

      // Processa Faturamento e Rankings (Só computa os PAGOS no período)
      let faturamento = 0;
      let atendimentosPagos = 0;
      const contagemProfissionais = {};
      const contagemServicos = {};

      if (agendamentos) {
        agendamentos.forEach((ag) => {
          if (ag.pagamento === "pago") {
            const valorFormatado = Number(ag.valor) || 0;
            faturamento += valorFormatado;
            atendimentosPagos += 1;

            const nomeProf = ag.profissionais?.nome || "Equipe";
            contagemProfissionais[nomeProf] =
              (contagemProfissionais[nomeProf] || 0) + 1;

            const nomeServ = ag.servico || "Outros";
            if (!contagemServicos[nomeServ]) {
              contagemServicos[nomeServ] = { count: 0, valorTotal: 0 };
            }
            contagemServicos[nomeServ].count += 1;
            contagemServicos[nomeServ].valorTotal += valorFormatado;
          }
        });
      }

      // Processa a totalização dos Atrasados
      let pendentesV = 0;
      if (pendentesPassados) {
        pendentesPassados.forEach((p) => {
          pendentesV += Number(p.valor) || 0;
        });
      }

      // Monta as listas finais para a tela
      const arrayProfissionais = Object.entries(contagemProfissionais)
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd);

      const arrayServicos = Object.entries(contagemServicos)
        .map(([nome, stats]) => ({
          nome,
          qtd: stats.count,
          porcentagem:
            atendimentosPagos > 0
              ? Math.round((stats.count / atendimentosPagos) * 100)
              : 0,
          valorTotal: stats.valorTotal,
        }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 3);

      setMetricas({
        faturamento,
        totalAtendimentos: atendimentosPagos,
        ticketMedio:
          atendimentosPagos > 0 ? faturamento / atendimentosPagos : 0,
        pendentesValor: pendentesV,
        pendentesQtd: pendentesPassados?.length || 0,
      });

      setRankingProfissionais(arrayProfissionais);
      setRankingServicos(arrayServicos);
      setListaPendentes(pendentesPassados || []);
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para dar baixa no modal expresso
  const handleDarBaixa = async (idAgendamento) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ pagamento: "pago", status: "confirmado" })
        .eq("id", idAgendamento);

      if (error) throw error;

      // Se for o último da lista, fecha o modal sozinho para melhorar o fluxo
      if (listaPendentes.length === 1) {
        setIsModalPendentesAberto(false);
      }

      // Recarrega os dados (o faturamento subirá na hora e o item sumirá)
      carregarDadosPainel();
    } catch (error) {
      console.error("Erro ao dar baixa no pagamento:", error.message);
      alert("Ocorreu um erro ao dar baixa no pagamento.");
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const labelPeriodo =
    filtroPeriodo === "hoje"
      ? "HOJE"
      : filtroPeriodo === "semana"
        ? "NA SEMANA"
        : "NO MÊS";

  return (
    <div className="home-container">
      <div className="home-header">
        <div>
          <h2>Painel</h2>
          <p>Acompanhe a saúde do seu negócio em tempo real.</p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#F0F9FF",
              color: "#0369A1",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "600",
              width: "fit-content",
              marginTop: "12px",
            }}
          >
            <CalendarClock size={16} />
            Você tem {resumoHoje} agendamento(s) programado(s) para hoje
          </div>
        </div>

        <div
          className="home-header-acoes"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "flex-end",
          }}
        >
          <button
            className="btn-acao-primaria"
            onClick={() => navigate("/agenda")}
          >
            <Plus size={18} />
            <span>Ir para Agenda</span>
          </button>

          <div
            style={{
              display: "flex",
              gap: "4px",
              backgroundColor: "#F1F5F9",
              padding: "4px",
              borderRadius: "8px",
            }}
          >
            <button
              onClick={() => setFiltroPeriodo("hoje")}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor:
                  filtroPeriodo === "hoje" ? "#FFFFFF" : "transparent",
                color:
                  filtroPeriodo === "hoje" ? "var(--cor-primaria)" : "#64748B",
                boxShadow:
                  filtroPeriodo === "hoje"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
              }}
            >
              Hoje
            </button>
            <button
              onClick={() => setFiltroPeriodo("semana")}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor:
                  filtroPeriodo === "semana" ? "#FFFFFF" : "transparent",
                color:
                  filtroPeriodo === "semana"
                    ? "var(--cor-primaria)"
                    : "#64748B",
                boxShadow:
                  filtroPeriodo === "semana"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
              }}
            >
              Semana
            </button>
            <button
              onClick={() => setFiltroPeriodo("mes")}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor:
                  filtroPeriodo === "mes" ? "#FFFFFF" : "transparent",
                color:
                  filtroPeriodo === "mes" ? "var(--cor-primaria)" : "#64748B",
                boxShadow:
                  filtroPeriodo === "mes"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
              }}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      {/* ALERTA DE PAGAMENTOS ATRASADOS QUE ABRE O MODAL */}
      {!loading && metricas.pendentesQtd > 0 && (
        <div
          onClick={() => setIsModalPendentesAberto(true)}
          style={{
            backgroundColor: "#FEF2F2",
            borderLeft: "4px solid #EF4444",
            padding: "1rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "1.5rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#FEE2E2")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#FEF2F2")
          }
        >
          <AlertCircle color="#EF4444" size={24} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, color: "#991B1B", fontSize: "0.95rem" }}>
              Pagamentos em Atraso
            </h4>
            <p
              style={{
                margin: "4px 0 0",
                color: "#B91C1C",
                fontSize: "0.85rem",
              }}
            >
              Existem{" "}
              <strong>
                {metricas.pendentesQtd} atendimentos de dias anteriores
              </strong>{" "}
              sem recebimento. Clique aqui para visualizar e dar baixa (
              <strong>{formatarMoeda(metricas.pendentesValor)}</strong>).
            </p>
          </div>
          <ArrowUpRight color="#EF4444" size={20} />
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span>ATENDIMENTOS ({labelPeriodo})</span>
            <h2>{loading ? "..." : metricas.totalAtendimentos}</h2>
          </div>
          <div className="metric-icon blue">
            <Calendar size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>FATURAMENTO ({labelPeriodo})</span>
            <h2>{loading ? "..." : formatarMoeda(metricas.faturamento)}</h2>
          </div>
          <div className="metric-icon green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>TICKET MÉDIO</span>
            <h2>{loading ? "..." : formatarMoeda(metricas.ticketMedio)}</h2>
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
            <h3>Atendimentos por Funcionária (Pagos)</h3>
          </div>
          <div className="ranking-list">
            {loading ? (
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Carregando dados...
              </p>
            ) : rankingProfissionais.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Nenhum atendimento pago encontrado.
              </p>
            ) : (
              rankingProfissionais.map((prof) => (
                <div key={prof.nome} className="ranking-item">
                  <div className="ranking-detalhes">
                    <strong>{prof.nome}</strong>
                    <span>{prof.qtd} atendimentos pagos</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section-box">
          <div className="section-title">
            <TrendingUp size={20} />
            <h3>Serviços Mais Procurados</h3>
          </div>
          <div className="ranking-list">
            {loading ? (
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Carregando dados...
              </p>
            ) : rankingServicos.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Nenhum serviço pago registrado.
              </p>
            ) : (
              rankingServicos.map((serv) => (
                <div key={serv.nome} className="ranking-item">
                  <div className="ranking-detalhes">
                    <strong>{serv.nome}</strong>
                    <span>{serv.porcentagem}% da preferência</span>
                  </div>
                  <div className="ranking-valor">
                    {formatarMoeda(serv.valorTotal)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE BAIXA DE ATRASADOS */}
      {isModalPendentesAberto && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalPendentesAberto(false)}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header" style={{ marginBottom: "1rem" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#FEE2E2",
                    borderRadius: "8px",
                    color: "#EF4444",
                  }}
                >
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2
                    style={{ margin: 0, fontSize: "1.25rem", color: "#1E293B" }}
                  >
                    Pagamentos em Atraso
                  </h2>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.85rem",
                      color: "#64748B",
                    }}
                  >
                    Dê baixa nos valores que já foram acertados para atualizar o
                    caixa.
                  </p>
                </div>
              </div>
              <button
                className="btn-fechar"
                onClick={() => setIsModalPendentesAberto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {listaPendentes.map((ag) => {
                const dataObj = new Date(ag.data_horario);
                const dataFormatada = `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}`;

                return (
                  <div
                    key={ag.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ fontWeight: "700", color: "#0F172A" }}>
                          {ag.customers?.nome || "Cliente Removido"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            backgroundColor: "#E2E8F0",
                            color: "#475569",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {dataFormatada}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#64748B" }}>
                        {ag.servico}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "800",
                          color: "#EF4444",
                          fontSize: "1.1rem",
                        }}
                      >
                        {formatarMoeda(ag.valor)}
                      </span>

                      <button
                        onClick={() => handleDarBaixa(ag.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#22C55E",
                          color: "#FFF",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#16A34A")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#22C55E")
                        }
                      >
                        <CheckCircle2 size={18} />
                        Dar Baixa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
