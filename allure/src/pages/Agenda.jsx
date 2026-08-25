import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Check,
  Trash2,
  Calendar,
  CircleDollarSign,
  RefreshCw,
  X,
  CalendarDays,
  CheckCircle2,
  AlertOctagon,
  MoreVertical,
} from "lucide-react";
import { ModalAgendamento } from "../components/domain/ModalAgendamento";
import { ModalPagamento } from "../components/domain/ModalPagamento/ModalPagamento";
import { supabase } from "../services/supabase";
import { Skeleton } from "../components/ui/Skeleton"; // <-- IMPORTAÇÃO DO SKELETON
import "./Agenda.css";

const formatarDataInput = (data) => {
  if (!data) return "";
  const d = data instanceof Date ? data : new Date(data);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function Agenda() {
  const location = useLocation();

  // ESTADO DE CARREGAMENTO PARA OS SKELETONS
  const [isLoading, setIsLoading] = useState(true);

  const [notificacao, setNotificacao] = useState({
    visivel: false,
    mensagem: "",
    tipo: "sucesso",
  });

  const mostrarNotificacao = (mensagem, tipo = "sucesso") => {
    setNotificacao({ visivel: true, mensagem, tipo });
    setTimeout(() => {
      setNotificacao({ visivel: false, mensagem: "", tipo: "sucesso" });
    }, 3000);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState(null);
  const [menuAbertoId, setMenuAbertoId] = useState(null);

  const [isModalPagamentoAberto, setIsModalPagamentoAberto] = useState(false);
  const [agendamentoParaPagamento, setAgendamentoParaPagamento] =
    useState(null);
  const [
    agendamentoParaDesfazerPagamento,
    setAgendamentoParaDesfazerPagamento,
  ] = useState(null);

  const [isModalRecorrenciaAberto, setIsModalRecorrenciaAberto] =
    useState(false);
  const [listaRecorrencia, setListaRecorrencia] = useState([]);
  const [grupoRecorrenciaFoco, setGrupoRecorrenciaFoco] = useState(null);
  const [loadingRecorrencia, setLoadingRecorrencia] = useState(false);

  const [modalExclusaoSerieAberto, setModalExclusaoSerieAberto] =
    useState(false);
  const [itemRecorrenciaParaExcluir, setItemRecorrenciaParaExcluir] =
    useState(null);

  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const linhaTempoRef = useRef(null);

  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const carregarDadosAgenda = async () => {
    setIsLoading(true);
    try {
      const { data: profsData, error: profsError } = await supabase
        .from("profissionais")
        .select("id, nome, especialidade, foto")
        .order("ordem", { ascending: true });

      if (profsError) throw profsError;
      if (profsData) setProfissionais(profsData);

      // BUSCA O TELEFONE JUNTO COM O NOME DO CLIENTE NA TABELA CUSTOMERS
      const { data, error } = await supabase.from("appointments").select(`
          *,
          customers ( id, nome, telefone, aniversario, is_whatsapp ),
          profissionais ( id, nome )
        `);

      if (error) throw error;

      if (data) {
        const listaFormatada = data.map((item) => {
          const dataObj = new Date(item.data_horario);
          const dataFormatada = formatarDataInput(dataObj);
          const horarioFormatado = dataObj.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return {
            id: item.id,
            customerId: item.customer_id || item.customers?.id || null,
            cliente: item.customers?.nome || "Cliente",
            telefone: item.customers?.telefone || "",
            aniversario: item.customers?.aniversario || "",
            isWhatsApp: item.customers?.is_whatsapp ?? true,
            profissionalId: item.profissional_id,
            profissional: item.profissionais?.nome || "Profissional",
            servico: item.servico,
            horarioInicio: horarioFormatado,
            data: dataFormatada,
            dataHoraCompleta: item.data_horario,
            duracao: item.duracao || 60,
            valor: item.valor ? String(item.valor).replace(".", ",") : "0,00",
            status: item.status || "pendente",
            pagamento: item.pagamento || "pendente",
            forma_pagamento: item.forma_pagamento || null,
            tenant_id: item.tenant_id || null,
            grupo_recorrencia: item.grupo_recorrencia,
          };
        });

        setAgendamentos(listaFormatada);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da agenda:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosAgenda();
  }, []);

  const gerarLinkWhatsapp = (ag, template = 1) => {
    const telefoneLimpo = ag.telefone ? ag.telefone.replace(/\D/g, "") : "";
    let texto = "";
    if (template === 1) {
      texto = `Olá ${ag.cliente}, tudo bem? Seu agendamento de ${ag.servico} está marcado para hoje às ${ag.horarioInicio}!`;
    } else if (template === 2) {
      texto = `Olá ${ag.cliente}, passando para confirmar seu agendamento de ${ag.servico} hoje às ${ag.horarioInicio}. O valor é R$ ${ag.valor}. Te aguardamos!`;
    }
    const mensagem = encodeURIComponent(texto);
    return telefoneLimpo
      ? `https://wa.me/55${telefoneLimpo}?text=${mensagem}`
      : `https://wa.me/?text=${mensagem}`;
  };

  useEffect(() => {
    if (location.state && location.state.dataAlvo) {
      const novaData = new Date(location.state.dataAlvo);
      setDataSelecionada(novaData);
      
      if (location.state.abrirAgendamentoId && agendamentos.length > 0) {
        const agFoco = agendamentos.find(
          (ag) => ag.id === location.state.abrirAgendamentoId,
        );

        if (agFoco) {
          setAgendamentoParaPagamento(agFoco);
          setIsModalPagamentoAberto(true);
          window.history.replaceState({}, document.title);
        }
      }
    }
  }, [location.state, agendamentos]);

  const handleAbrirRecorrencia = async (ag, e) => {
    e.preventDefault();
    e.stopPropagation();
    setGrupoRecorrenciaFoco(ag);
    setIsModalRecorrenciaAberto(true);
    setLoadingRecorrencia(true);

    try {
      const hojeStr = formatarDataInput(new Date());

      const { data, error } = await supabase
        .from("appointments")
        .select("*, customers(id, nome, telefone, aniversario, is_whatsapp)")
        .eq("grupo_recorrencia", ag.grupo_recorrencia)
        .gte("data_horario", hojeStr)
        .order("data_horario", { ascending: true });

      if (error) throw error;
      setListaRecorrencia(data || []);
    } catch (error) {
      console.error("Erro ao buscar recorrências:", error);
    } finally {
      setLoadingRecorrencia(false);
    }
  };

  const executarExclusaoSerie = async () => {
    try {
      const hojeStr = formatarDataInput(new Date());
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("grupo_recorrencia", grupoRecorrenciaFoco.grupo_recorrencia)
        .gte("data_horario", hojeStr);

      if (error) throw error;

      setModalExclusaoSerieAberto(false);
      setIsModalRecorrenciaAberto(false);
      carregarDadosAgenda();
      mostrarNotificacao("Série de agendamentos excluída!");
    } catch (error) {
      console.error("Erro ao excluir série:", error);
    }
  };

  const executarExclusaoItemUnico = async () => {
    if (!itemRecorrenciaParaExcluir) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", itemRecorrenciaParaExcluir.id);
      if (error) throw error;

      setListaRecorrencia((prev) =>
        prev.filter((item) => item.id !== itemRecorrenciaParaExcluir.id),
      );
      setItemRecorrenciaParaExcluir(null);
      carregarDadosAgenda();
      mostrarNotificacao("Agendamento removido da série.");

      if (listaRecorrencia.length <= 1) {
        setIsModalRecorrenciaAberto(false);
      }
    } catch (error) {
      console.error("Erro ao excluir agendamento da série:", error);
    }
  };

  const formatarDataExibicao = (data) => {
    if (!data) return "";
    const d = data instanceof Date ? data : new Date(data);
    if (isNaN(d.getTime())) return "";
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return `${dias[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} de ${meses[d.getMonth()]}`;
  };

  const irParaHoje = () => setDataSelecionada(new Date());
  const diaAnterior = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() - 1);
    setDataSelecionada(novaData);
  };
  const proximoDia = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + 1);
    setDataSelecionada(novaData);
  };

  const calcularPosicao = (horarioString) => {
    const [hora, minuto] = horarioString.split(":").map(Number);
    const minutosDesde00h = hora * 60 + minuto;
    return (minutosDesde00h * 2) + 74; // Adiciona os 74px do cabeçalho
  };

  const determinarCoresAgendamento = (ag) => {
    if (ag.status === "bloqueio") {
      return { bg: "#F1F5F9", border: "#94A3B8", text: "#64748B" }; // Cinza
    }
    if (ag.status === "cancelado") {
      return { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" }; // Vermelho/Cancelado
    }
    if (ag.pagamento === "pago") {
      return { bg: "#F5F3FF", border: "#8B5CF6", text: "#5B21B6" }; // Roxo/Pago
    }
    if (ag.status === "confirmado") {
      return { bg: "#F0FDF4", border: "#22C55E", text: "#166534" }; // Verde/Confirmado
    }
    // Default: Agendado / Pendente
    return { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" }; // Azul/Pendente
  };

  const calcularHoraFim = (horaInicio, duracaoMinutos) => {
    if (!horaInicio) return "";
    const [horas, minutos] = horaInicio.split(":").map(Number);
    const data = new Date();
    data.setHours(horas, minutos + Number(duracaoMinutos), 0);
    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hoje = new Date();
  const isHoje =
    dataSelecionada.getDate() === hoje.getDate() &&
    dataSelecionada.getMonth() === hoje.getMonth() &&
    dataSelecionada.getFullYear() === hoje.getFullYear();

  const minutosAtuais = horaAtual.getHours() * 60 + horaAtual.getMinutes();
  const posicaoLinhaTempo = (minutosAtuais * 2) + 74; // Adiciona os 74px do cabeçalho
  const mostrarLinhaTempo =
    isHoje && posicaoLinhaTempo >= 74 && posicaoLinhaTempo <= (24 * 60 * 2) + 74;

  useEffect(() => {
    if (mostrarLinhaTempo && linhaTempoRef.current) {
      const container = linhaTempoRef.current.closest(".agenda-wrapper");

      if (container) {
        // Isso força a rolagem ser apenas vertical e mantem o scroll horizontal travado na esquerda (left: 0)
        container.scrollTo({
          top: linhaTempoRef.current.offsetTop - container.clientHeight / 2,
          left: 0,
          behavior: "smooth",
        });
      }
    }
  }, [dataSelecionada, mostrarLinhaTempo]);

  const horasDoDia = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`,
  );

  const alterarStatus = async (id, novoStatus) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: novoStatus })
        .eq("id", id);
      if (error) throw error;
      carregarDadosAgenda();
      mostrarNotificacao(`Agendamento marcado como ${novoStatus}!`);
    } catch (error) {
      console.error("Erro ao alterar status:", error.message);
    }
  };

  const confirmarExclusao = async () => {
    if (!agendamentoParaExcluir) return;
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", agendamentoParaExcluir.id);
      if (error) throw error;
      setAgendamentoParaExcluir(null);
      carregarDadosAgenda();
      mostrarNotificacao("Agendamento excluído com sucesso.", "excluir");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error.message);
    }
  };

  const handleAbrirPagamento = (ag, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ag.pagamento === "pago") {
      setAgendamentoParaDesfazerPagamento(ag);
    } else {
      setAgendamentoParaPagamento(ag);
      setIsModalPagamentoAberto(true);
    }
  };

  const dataSelecionadaString = formatarDataInput(dataSelecionada);
  const agendamentosDoDia = agendamentos.filter(
    (ag) => ag.data === dataSelecionadaString,
  );

  const qtdAtendimentosDia = agendamentosDoDia.filter(
    (ag) => ag.status !== "bloqueio",
  ).length;

  const agendamentosOrfaos = agendamentosDoDia.filter(
    (ag) => !profissionais.some((p) => p.id === ag.profissionalId),
  );

  return (
    <div className="agenda-container" onClick={() => setMenuAbertoId(null)}>
      {notificacao.visivel && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor:
              notificacao.tipo === "excluir" ? "#EF4444" : "#10B981",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 9999,
            fontWeight: "600",
            fontSize: "0.95rem",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notificacao.tipo === "excluir" ? (
            <Trash2 size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          {notificacao.mensagem}
        </div>
      )}

      <div className="agenda-topbar">
        <div className="agenda-info-navegacao">
          <div className="agenda-info">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "4px",
              }}
            >
              <h2 style={{ margin: 0 }}>Agenda do Dia</h2>
              <div
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isLoading ? (
                  <Skeleton width="60px" height="12px" />
                ) : (
                  `${qtdAtendimentosDia} ${qtdAtendimentosDia === 1 ? "agendamento" : "agendamentos"}`
                )}
              </div>
            </div>

            <div className="data-formatada">
              {formatarDataExibicao(dataSelecionada)}
              <label className="btn-calendario-icon" title="Escolher data">
                <Calendar size={18} />
                <input
                  type="date"
                  className="input-data-invisivel"
                  value={dataSelecionadaString}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [ano, mes, dia] = e.target.value.split("-");
                      setDataSelecionada(new Date(ano, mes - 1, dia));
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="agenda-botoes-nav">
            <button onClick={diaAnterior}>&lt; Anterior</button>
            <button onClick={irParaHoje}>Hoje</button>
            <button onClick={proximoDia}>Próxima &gt;</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
          <button
            className="btn-novo"
            onClick={() => {
              setAgendamentoEditando(null);
              setIsModalOpen(true);
            }}
            disabled={isLoading}
          >
            <Plus size={20} /> Novo Agendamento
          </button>
          
          <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontWeight: "600", color: "#64748B" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "12px", height: "12px", backgroundColor: "#EFF6FF", border: "1px solid #3B82F6", borderRadius: "50%" }}></div> 
              Agendado
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "12px", height: "12px", backgroundColor: "#F0FDF4", border: "1px solid #22C55E", borderRadius: "50%" }}></div> 
              Confirmado
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "12px", height: "12px", backgroundColor: "#F5F3FF", border: "1px solid #8B5CF6", borderRadius: "50%" }}></div> 
              Pago
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "12px", height: "12px", backgroundColor: "#FEF2F2", border: "1px solid #EF4444", borderRadius: "50%" }}></div> 
              Cancelado
            </span>
          </div>
        </div>
      </div>

      <div className="agenda-wrapper">
        <div className="coluna-horarios">
          <div className="espaco-cabecalho-horarios"></div>
          {horasDoDia.map((hora) => (
            <div key={hora} className="horario-label">
              <span>{hora}</span>
              <span className="meia-hora">{hora.replace(":00", ":30")}</span>
            </div>
          ))}
        </div>

        <div className="grade-profissionais">
          {/* SKELETONS NAS COLUNAS DE PROFISSIONAIS ENQUANTO CARREGA */}
          {isLoading
            ? [1, 2, 3].map((col) => (
                <div
                  key={col}
                  className="coluna-profissional"
                  style={{ padding: "12px" }}
                >
                  <div
                    className="profissional-header"
                    style={{ marginBottom: "20px" }}
                  >
                    <Skeleton width="40px" height="40px" borderRadius="50%" />
                    <div style={{ marginLeft: "10px" }}>
                      <Skeleton width="90px" height="16px" />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <Skeleton width="100%" height="90px" borderRadius="10px" />
                    <Skeleton width="100%" height="70px" borderRadius="10px" />
                  </div>
                </div>
              ))
            : profissionais.map((prof) => (
                <div key={prof.id} className="coluna-profissional">
                  <div className="profissional-header">
                    {prof.foto ? (
                      <img
                        src={prof.foto}
                        alt={prof.nome}
                        className="avatar-img-agenda"
                      />
                    ) : (
                      <div className="avatar-placeholder-agenda">
                        {prof.nome.charAt(0)}
                      </div>
                    )}
                    <div className="profissional-header-info">
                      <h3>{prof.nome}</h3>
                    </div>
                  </div>

                  {agendamentosDoDia
                    .filter((ag) => ag.profissionalId === prof.id)
                    .map((ag) => (
                      <div
                        key={ag.id}
                        className="cartao-agendamento"
                        onClick={() => {
                          setAgendamentoEditando(ag);
                          setIsModalOpen(true);
                        }}
                        style={{
                          top: `${calcularPosicao(ag.horarioInicio)}px`,
                          height: `${ag.duracao * 2}px`,
                          backgroundColor: determinarCoresAgendamento(ag).bg,
                          borderLeftColor: determinarCoresAgendamento(ag).border,
                          position: "absolute",
                          cursor: "pointer",
                        }}
                      >
                        <div className="card-header">
                          <div className="cliente-info-wrapper">
                            <span 
                              className="cartao-cliente" 
                              title={ag.cliente}
                              style={{ 
                                color: determinarCoresAgendamento(ag).text,
                                textDecoration: ag.status === "cancelado" ? "line-through" : "none" 
                              }}
                            >
                              {ag.cliente}
                            </span>
                          </div>

                          <div
                            className="card-acoes-topo"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                          >
                            {ag.status !== "bloqueio" ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-menu-card"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMenuAbertoId(
                                      menuAbertoId === ag.id ? null : ag.id,
                                    );
                                  }}
                                  title="Opções"
                                >
                                  <MoreVertical size={20} />
                                </button>

                                {menuAbertoId === ag.id && (
                                  <div className="menu-acoes-flutuante">
                                    <a
                                      href={gerarLinkWhatsapp(ag, 1)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                    >
                                      <span style={{ color: "#22C55E", display: "flex" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                      </span>
                                      Enviar Lembrete
                                    </a>
                                    <a
                                      href={gerarLinkWhatsapp(ag, 2)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                    >
                                      <span style={{ color: "#22C55E", display: "flex" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                      </span>
                                      Enviar Cobrança
                                    </a>

                                    <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "4px 0" }}></div>

                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleAbrirPagamento(ag, e);
                                        setMenuAbertoId(null);
                                      }}
                                    >
                                      <CircleDollarSign size={16} color={ag.pagamento === "pago" ? "#64748B" : "#10B981"} />
                                      {ag.pagamento === "pago" ? "Estornar Pagamento" : "Receber Pagamento"}
                                    </button>

                                    {ag.status !== "cancelado" && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          alterarStatus(ag.id, ag.status === "confirmado" ? "pendente" : "confirmado");
                                          setMenuAbertoId(null);
                                        }}
                                      >
                                        <Check size={16} color={ag.status === "confirmado" ? "#F59E0B" : "#22C55E"} />
                                        {ag.status === "confirmado" ? "Remover Confirmação" : "Confirmar Presença"}
                                      </button>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        alterarStatus(ag.id, ag.status === "cancelado" ? "pendente" : "cancelado");
                                        setMenuAbertoId(null);
                                      }}
                                    >
                                      <X size={16} color={ag.status === "cancelado" ? "#3B82F6" : "#EF4444"} />
                                      {ag.status === "cancelado" ? "Restaurar Agendamento" : "Cancelar Agendamento"}
                                    </button>

                                    <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "4px 0" }}></div>

                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAgendamentoParaExcluir(ag);
                                        setMenuAbertoId(null);
                                      }}
                                      style={{ color: "#EF4444" }}
                                    >
                                      <Trash2 size={16} />
                                      Apagar do Sistema
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAgendamentoParaExcluir(ag);
                                }}
                                className="btn-menu-card"
                                style={{ color: "#EF4444" }}
                                title="Excluir Bloqueio"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="cartao-horario">
                          <span>
                            {ag.horarioInicio} -{" "}
                            {calcularHoraFim(ag.horarioInicio, ag.duracao)}
                          </span>
                          {ag.grupo_recorrencia && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAbrirRecorrencia(ag, e);
                              }}
                              style={{
                                backgroundColor: "#E0F2FE",
                                color: "#0284C7",
                                border: "none",
                                borderRadius: "6px",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                              }}
                              title="Ver série"
                            >
                              <RefreshCw size={14} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>

                        <div className="cartao-servico">
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ag.servico}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ))}

          {!isLoading && agendamentosOrfaos.length > 0 && (
            <div
              className="coluna-profissional"
              style={{
                backgroundColor: "#FEF2F2",
                borderRight: "1px solid #FECACA",
              }}
            >
              <div
                className="profissional-header"
                style={{
                  backgroundColor: "#FEE2E2",
                  borderBottom: "1px solid #FECACA",
                }}
              >
                <div
                  className="avatar-placeholder-agenda"
                  style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                >
                  <AlertOctagon size={20} strokeWidth={2.5} />
                </div>
                <div className="profissional-header-info">
                  <h3 style={{ color: "#991B1B" }}>Sem Profissional</h3>
                </div>
              </div>

              {agendamentosOrfaos.map((ag) => (
                <div
                  key={ag.id}
                  className="cartao-agendamento"
                  onClick={() => {
                    setAgendamentoEditando(ag);
                    setIsModalOpen(true);
                  }}
                  style={{
                    top: `${calcularPosicao(ag.horarioInicio)}px`,
                    height: `${ag.duracao * 2}px`,
                    backgroundColor: "#FFFFFF",
                    borderLeftColor: "#EF4444",
                    border: "2px dashed #FECACA",
                    borderLeft: "4px solid #EF4444",
                    position: "absolute",
                    cursor: "pointer",
                  }}
                >
                  <div className="card-header">
                    <div className="cliente-info-wrapper">
                      <span className="cartao-cliente">{ag.cliente}</span>
                    </div>

                    <div
                      className="card-acoes-topo"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAgendamentoParaExcluir(ag);
                        }}
                        className="btn-menu-card"
                        style={{ color: "#EF4444" }}
                        title="Excluir Definitivamente"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div className="cartao-horario">
                    <span>
                      {ag.horarioInicio} -{" "}
                      {calcularHoraFim(ag.horarioInicio, ag.duracao)}
                    </span>
                    {ag.grupo_recorrencia && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAbrirRecorrencia(ag, e);
                        }}
                        style={{
                          backgroundColor: "#E0F2FE",
                          color: "#0284C7",
                          border: "none",
                          borderRadius: "6px",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        title="Ver série"
                      >
                        <RefreshCw size={14} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  <div className="cartao-servico">
                    <span
                      style={{
                        color: "#EF4444",
                        fontWeight: "600",
                        fontSize: "0.8rem",
                      }}
                    >
                      Reatribuir profissional
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mostrarLinhaTempo && (
            <div
              ref={linhaTempoRef}
              className="linha-tempo"
              style={{
                top: `${posicaoLinhaTempo}px`,
                zIndex: 999,
                pointerEvents: "none",
              }}
            >
              <div className="bolinha-linha-tempo"></div>
            </div>
          )}
        </div>
      </div>

      <ModalAgendamento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agendamento={agendamentoEditando}
        onSave={() => {
          setIsModalOpen(false);
          carregarDadosAgenda();
          mostrarNotificacao(
            agendamentoEditando
              ? "Agendamento atualizado!"
              : "Agendamento salvo com sucesso!",
          );
        }}
      />

      <ModalPagamento
        isOpen={isModalPagamentoAberto}
        onClose={() => setIsModalPagamentoAberto(false)}
        dados={agendamentoParaPagamento}
        onSave={async (pacotePagamento) => {
          if (agendamentoParaPagamento) {
            await supabase
              .from("appointments")
              .update({
                pagamento: "pago",
                status: "confirmado",
                forma_pagamento: pacotePagamento.metodoPagamento,
              })
              .eq("id", agendamentoParaPagamento.id);
            carregarDadosAgenda();
            mostrarNotificacao("Pagamento recebido com sucesso!");
          }
          setIsModalPagamentoAberto(false);
        }}
      />

      {isModalRecorrenciaAberto && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalRecorrenciaAberto(false)}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px" }}
          >
            <div className="modal-header" style={{ marginBottom: "1rem" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#E0F2FE",
                    borderRadius: "8px",
                    color: "#0284C7",
                  }}
                >
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h2
                    style={{ margin: 0, fontSize: "1.25rem", color: "#1E293B" }}
                  >
                    Série de Agendamentos
                  </h2>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.85rem",
                      color: "#64748B",
                    }}
                  >
                    Visualizando horários futuros de{" "}
                    <strong>{grupoRecorrenciaFoco?.cliente}</strong>.
                  </p>
                </div>
              </div>
              <button
                className="btn-fechar"
                onClick={() => setIsModalRecorrenciaAberto(false)}
              >
                <X size={20} />
              </button>
            </div>

            {loadingRecorrencia ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#64748B",
                  padding: "2rem",
                }}
              >
                Carregando horários...
              </p>
            ) : (
              <div
                style={{
                  maxHeight: "350px",
                  overflowY: "auto",
                  paddingRight: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {listaRecorrencia.map((item) => {
                  const dataObj = new Date(item.data_horario);
                  const dataFormatada = `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}`;
                  const horaFormatada = dataObj.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        backgroundColor: "#F8FAFC",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontWeight: "700",
                            color: "#334155",
                          }}
                        >
                          {dataFormatada}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#0F172A",
                              fontSize: "0.95rem",
                            }}
                          >
                            {horaFormatada}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                            {item.status}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            setAgendamentoEditando({
                              id: item.id,
                              customerId: item.customer_id || item.customers?.id || null,
                              cliente: item.customers?.nome,
                              telefone: item.customers?.telefone || "",
                              aniversario: item.customers?.aniversario || "",
                              isWhatsApp: item.customers?.is_whatsapp ?? true,
                              profissionalId: item.profissional_id,
                              servico: item.servico,
                              horarioInicio: horaFormatada,
                              data: formatarDataInput(dataObj),
                              duracao: item.duracao || 60,
                              valor: String(item.valor).replace(".", ","),
                              status: item.status,
                              pagamento: item.pagamento,
                              forma_pagamento: item.forma_pagamento,
                              tenant_id: item.tenant_id,
                              grupo_recorrencia: item.grupo_recorrencia,
                            });
                            setIsModalRecorrenciaAberto(false);
                            setIsModalOpen(true);
                          }}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            color: "#475569",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setItemRecorrenciaParaExcluir(item)}
                          style={{
                            padding: "6px",
                            backgroundColor: "#FEE2E2",
                            border: "none",
                            borderRadius: "6px",
                            color: "#EF4444",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Excluir apenas este"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <button
                onClick={() => setModalExclusaoSerieAberto(true)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#FEF2F2",
                  color: "#EF4444",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Excluir Todos os Futuros Desta Série
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExclusaoSerieAberto && (
        <div
          className="modal-overlay"
          onClick={() => setModalExclusaoSerieAberto(false)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="modal-box modal-exclusao"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Excluir Série</h3>
            <p>
              Isso irá apagar todos os horários futuros de{" "}
              <strong>{grupoRecorrenciaFoco?.cliente}</strong>.<br />
              Tem certeza?
            </p>
            <div className="modal-exclusao-acoes">
              <button
                className="btn-cancelar"
                onClick={() => setModalExclusaoSerieAberto(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-exclusao"
                onClick={executarExclusaoSerie}
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {itemRecorrenciaParaExcluir && (
        <div
          className="modal-overlay"
          onClick={() => setItemRecorrenciaParaExcluir(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="modal-box modal-exclusao"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirmar Exclusão</h3>
            <p>Deseja apagar apenas este horário da série?</p>
            <div className="modal-exclusao-acoes">
              <button
                className="btn-cancelar"
                onClick={() => setItemRecorrenciaParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-exclusao"
                onClick={executarExclusaoItemUnico}
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {agendamentoParaDesfazerPagamento && (
        <div
          className="modal-overlay"
          onClick={() => setAgendamentoParaDesfazerPagamento(null)}
        >
          <div
            className="modal-box modal-exclusao"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Desfazer Pagamento</h3>
            <p>
              Deseja estornar o pagamento recebido de{" "}
              <strong>{agendamentoParaDesfazerPagamento.cliente}</strong>?
            </p>
            <div className="modal-exclusao-acoes">
              <button
                className="btn-cancelar"
                onClick={() => setAgendamentoParaDesfazerPagamento(null)}
              >
                Voltar
              </button>
              <button
                className="btn-confirmar-exclusao"
                onClick={async () => {
                  await supabase
                    .from("appointments")
                    .update({ pagamento: "pendente", forma_pagamento: null })
                    .eq("id", agendamentoParaDesfazerPagamento.id);
                  setAgendamentoParaDesfazerPagamento(null);
                  carregarDadosAgenda();
                  mostrarNotificacao("Pagamento desfeito.");
                }}
              >
                Sim, desfazer
              </button>
            </div>
          </div>
        </div>
      )}

      {agendamentoParaExcluir && (
        <div
          className="modal-overlay"
          onClick={() => setAgendamentoParaExcluir(null)}
        >
          <div
            className="modal-box modal-exclusao"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirmar Exclusão</h3>
            <p>
              Tem certeza que deseja apagar o agendamento de{" "}
              <strong>{agendamentoParaExcluir.cliente}</strong>?
            </p>
            <div className="modal-exclusao-acoes">
              <button
                className="btn-cancelar"
                onClick={() => setAgendamentoParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-exclusao"
                onClick={confirmarExclusao}
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
