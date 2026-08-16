import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { ModalAgendamento } from "../components/ModalAgendamento";
import { ModalPagamento } from "../components/ModalPagamento/ModalPagamento";
import { supabase } from "../services/supabase";
import "./Agenda.css";

export function Agenda() {
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState(null);
  const [mensagemErro, setMensagemErro] = useState("");

  const [isModalPagamentoAberto, setIsModalPagamentoAberto] = useState(false);
  const [agendamentoParaPagamento, setAgendamentoParaPagamento] =
    useState(null);
  const [
    agendamentoParaDesfazerPagamento,
    setAgendamentoParaDesfazerPagamento,
  ] = useState(null);

  // ESTADOS DA RECORRÊNCIA
  const [isModalRecorrenciaAberto, setIsModalRecorrenciaAberto] =
    useState(false);
  const [listaRecorrencia, setListaRecorrencia] = useState([]);
  const [grupoRecorrenciaFoco, setGrupoRecorrenciaFoco] = useState(null);
  const [loadingRecorrencia, setLoadingRecorrencia] = useState(false);

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
    try {
      const { data: profsData, error: profsError } = await supabase
        .from("profissionais")
        .select("id, nome, especialidade, foto");

      if (profsError) throw profsError;
      if (profsData) setProfissionais(profsData);

      // BUSCA COM A NOVA COLUNA GRUPO_RECORRENCIA
      const { data, error } = await supabase.from("appointments").select(`
          *,
          customers ( nome ),
          profissionais ( id, nome )
        `);

      if (error) throw error;

      if (data) {
        const listaFormatada = data.map((item) => {
          const dataObj = new Date(item.data_horario);
          const dataFormatada = dataObj.toISOString().split("T")[0];
          const horarioFormatado = dataObj.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return {
            id: item.id,
            cliente: item.customers?.nome || "Cliente",
            profissionalId: item.profissional_id,
            profissional: item.profissionais?.nome || "Profissional",
            servico: item.servico,
            horarioInicio: horarioFormatado,
            data: dataFormatada,
            dataHoraCompleta: item.data_horario,
            duracao: 60,
            valor: item.valor ? String(item.valor).replace(".", ",") : "0,00",
            status: item.status || "pendente",
            pagamento: item.pagamento || "pendente",
            grupo_recorrencia: item.grupo_recorrencia, // <- Mapeamento da recorrência
          };
        });

        setAgendamentos(listaFormatada);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da agenda:", error.message);
    }
  };

  useEffect(() => {
    carregarDadosAgenda();
  }, []);

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

  // FUNÇÃO PARA BUSCAR E ABRIR O MODAL DE RECORRÊNCIA
  const handleAbrirRecorrencia = async (ag, e) => {
    e.stopPropagation();
    setGrupoRecorrenciaFoco(ag);
    setIsModalRecorrenciaAberto(true);
    setLoadingRecorrencia(true);

    try {
      const hojeStr = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("appointments")
        .select("*, customers(nome)")
        .eq("grupo_recorrencia", ag.grupo_recorrencia)
        .gte("data_horario", hojeStr) // Pega apenas agendamentos de hoje em diante
        .order("data_horario", { ascending: true });

      if (error) throw error;
      setListaRecorrencia(data || []);
    } catch (error) {
      console.error("Erro ao buscar recorrências:", error);
    } finally {
      setLoadingRecorrencia(false);
    }
  };

  // FUNÇÃO PARA EXCLUIR TODA A SÉRIE FUTURA
  const confirmarExclusaoSerie = async () => {
    if (
      !window.confirm(
        `Isso irá apagar todos os horários futuros desta cliente.\nTem certeza?`,
      )
    )
      return;

    try {
      const hojeStr = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("grupo_recorrencia", grupoRecorrenciaFoco.grupo_recorrencia)
        .gte("data_horario", hojeStr);

      if (error) throw error;

      setIsModalRecorrenciaAberto(false);
      carregarDadosAgenda();
    } catch (error) {
      console.error("Erro ao excluir série:", error);
    }
  };

  // FUNÇÃO PARA EXCLUIR UM ITEM DA LISTA DE RECORRÊNCIA
  const excluirItemUnicoSerie = async (idParaExcluir) => {
    if (!window.confirm("Deseja apagar apenas este horário?")) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", idParaExcluir);
      if (error) throw error;

      setListaRecorrencia((prev) =>
        prev.filter((item) => item.id !== idParaExcluir),
      );
      carregarDadosAgenda();

      if (listaRecorrencia.length <= 1) {
        setIsModalRecorrenciaAberto(false);
      }
    } catch (error) {
      console.error("Erro ao excluir agendamento da série:", error);
    }
  };

  const formatarDataExibicao = (data) => {
    const dias = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
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
    return `${dias[data.getDay()]}, ${String(data.getDate()).padStart(2, "0")} de ${meses[data.getMonth()]}`;
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
    const minutosDesde07h = hora * 60 + minuto - 7 * 60;
    return minutosDesde07h * 2;
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
  const posicaoLinhaTempo = (minutosAtuais - 7 * 60) * 2;
  const mostrarLinhaTempo =
    isHoje && posicaoLinhaTempo >= 0 && posicaoLinhaTempo <= 14 * 60 * 2;

  useEffect(() => {
    if (mostrarLinhaTempo && linhaTempoRef.current) {
      linhaTempoRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [dataSelecionada, mostrarLinhaTempo]);

  const horasDoDia = Array.from(
    { length: 14 },
    (_, i) => `${String(i + 7).padStart(2, "0")}:00`,
  );

  const alternarStatus = async (id, statusAtual) => {
    const novoStatus = statusAtual === "pendente" ? "confirmado" : "pendente";
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: novoStatus })
        .eq("id", id);
      if (error) throw error;
      carregarDadosAgenda();
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
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error.message);
    }
  };

  const handleAbrirPagamento = (ag, e) => {
    e.stopPropagation();
    if (ag.pagamento === "pago") {
      setAgendamentoParaDesfazerPagamento(ag);
    } else {
      setAgendamentoParaPagamento(ag);
      setIsModalPagamentoAberto(true);
    }
  };

  const dataSelecionadaString = dataSelecionada.toISOString().split("T")[0];
  const agendamentosDoDia = agendamentos.filter(
    (ag) => ag.data === dataSelecionadaString,
  );

  return (
    <div className="agenda-container">
      <div className="agenda-topbar">
        <div className="agenda-info-navegacao">
          <div className="agenda-info">
            <h2>Agenda do Dia</h2>
            <div className="data-formatada">
              {formatarDataExibicao(dataSelecionada)}
              <label className="btn-calendario-icon" title="Escolher data">
                <Calendar size={18} />
                <input
                  type="date"
                  className="input-data-invisivel"
                  value={dataSelecionada.toISOString().split("T")[0]}
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

        <button
          className="btn-novo"
          onClick={() => {
            setAgendamentoEditando(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} />
          Novo Agendamento
        </button>
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
          {mostrarLinhaTempo && (
            <div
              ref={linhaTempoRef}
              className="linha-tempo"
              style={{ top: `${posicaoLinhaTempo}px` }}
            >
              <div className="bolinha-linha-tempo"></div>
            </div>
          )}

          {profissionais.map((prof) => (
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
                      backgroundColor:
                        ag.status === "bloqueio" ? "#F1F5F9" : "#FFFFFF",
                      borderLeftColor:
                        ag.status === "bloqueio"
                          ? "#94A3B8"
                          : "var(--cor-primaria)",
                      cursor: "pointer",
                    }}
                  >
                    <div className="card-header" style={{ marginBottom: "0" }}>
                      <div className="cliente-info-wrapper">
                        <span className="cartao-cliente">{ag.cliente}</span>
                      </div>

                      <div
                        className="card-acoes-topo"
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        {ag.status !== "bloqueio" && (
                          <>
                            {/* BOTÃO DE RECORRÊNCIA AQUI */}
                            {ag.grupo_recorrencia && (
                              <button
                                onClick={(e) => handleAbrirRecorrencia(ag, e)}
                                style={{
                                  backgroundColor: "#E0F2FE",
                                  color: "#0284C7",
                                  border: "none",
                                  borderRadius: "8px",
                                  width: "32px",
                                  height: "32px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                title="Ver série de agendamentos"
                              >
                                <RefreshCw size={16} strokeWidth={2.5} />
                              </button>
                            )}

                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`Olá ${ag.cliente}, tudo bem? Seu agendamento de ${ag.servico} está marcado para hoje às ${ag.horarioInicio}!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                backgroundColor: "#DCFCE7",
                                color: "#22C55E",
                                borderRadius: "8px",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textDecoration: "none",
                              }}
                              title="Chamar no WhatsApp"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                              </svg>
                            </a>

                            <button
                              onClick={(e) => handleAbrirPagamento(ag, e)}
                              style={{
                                backgroundColor:
                                  ag.pagamento === "pago"
                                    ? "#3B82F6"
                                    : "#EF4444",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "8px",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                              }}
                              title={
                                ag.pagamento === "pago"
                                  ? "Pagamento Recebido - Clique para desfazer"
                                  : "Receber Pagamento"
                              }
                            >
                              <CircleDollarSign size={16} strokeWidth={2.5} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alternarStatus(ag.id, ag.status);
                              }}
                              style={{
                                backgroundColor:
                                  ag.status === "confirmado"
                                    ? "#22C55E"
                                    : "#FEF3C7",
                                color:
                                  ag.status === "confirmado"
                                    ? "#FFFFFF"
                                    : "#F59E0B",
                                border: "none",
                                borderRadius: "8px",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                              title={
                                ag.status === "confirmado"
                                  ? "Agendamento Concluído"
                                  : "Marcar como Concluído"
                              }
                            >
                              <Check size={18} strokeWidth={3} />
                            </button>

                            <div
                              style={{
                                width: "1px",
                                height: "20px",
                                backgroundColor: "#E2E8F0",
                                margin: "0 2px",
                              }}
                            ></div>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAgendamentoParaExcluir(ag);
                          }}
                          style={{
                            backgroundColor: "#FEE2E2",
                            color: "#EF4444",
                            border: "none",
                            borderRadius: "8px",
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          title="Excluir"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    <div className="cartao-horario">
                      {ag.horarioInicio} -{" "}
                      {calcularHoraFim(ag.horarioInicio, ag.duracao)}
                    </div>
                    <div className="cartao-servico">
                      <span>{ag.servico}</span>
                      <span className="cartao-valor">
                        {ag.valor !== "-" && `R$ ${ag.valor}`}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <ModalAgendamento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agendamento={agendamentoEditando}
        onSave={() => {
          setIsModalOpen(false);
          carregarDadosAgenda();
        }}
      />

      <ModalPagamento
        isOpen={isModalPagamentoAberto}
        onClose={() => setIsModalPagamentoAberto(false)}
        dados={agendamentoParaPagamento}
        onSave={async () => {
          if (agendamentoParaPagamento) {
            await supabase
              .from("appointments")
              .update({ pagamento: "pago" })
              .eq("id", agendamentoParaPagamento.id);
            carregarDadosAgenda();
          }
          setIsModalPagamentoAberto(false);
        }}
      />

      {/* MODAL DE LISTAGEM DE RECORRÊNCIA */}
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
                              cliente: item.customers?.nome,
                              profissionalId: item.profissional_id,
                              servico: item.servico,
                              horarioInicio: horaFormatada,
                              data: dataObj.toISOString().split("T")[0],
                              duracao: 60,
                              valor: String(item.valor).replace(".", ","),
                              status: item.status,
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
                          onClick={() => excluirItemUnicoSerie(item.id)}
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
                onClick={confirmarExclusaoSerie}
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

      {/* MODAIS DE EXCLUSÃO E DESFAZER PAGAMENTO OMITIDOS PARA BREVIDADE (Mantidos do original) */}
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
                    .update({ pagamento: "pendente" })
                    .eq("id", agendamentoParaDesfazerPagamento.id);
                  setAgendamentoParaDesfazerPagamento(null);
                  carregarDadosAgenda();
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
