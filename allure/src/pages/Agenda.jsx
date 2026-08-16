import React, { useState, useEffect, useRef } from "react";
import { Plus, Check, Trash2, Calendar, CircleDollarSign } from "lucide-react";
import { ModalAgendamento } from "../components/ModalAgendamento";
import { ModalPagamento } from "../components/ModalPagamento/ModalPagamento";
import "./Agenda.css";

export function Agenda() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState(null);
  const [mensagemErro, setMensagemErro] = useState("");

  const [isModalPagamentoAberto, setIsModalPagamentoAberto] = useState(false);
  const [agendamentoParaPagamento, setAgendamentoParaPagamento] =
    useState(null);

  // NOVO ESTADO: Para controlar a janelinha de desfazer pagamento
  const [
    agendamentoParaDesfazerPagamento,
    setAgendamentoParaDesfazerPagamento,
  ] = useState(null);

  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const linhaTempoRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

  const [agendamentos, setAgendamentos] = useState([
    {
      id: 1,
      profissional: "Ana Silva",
      cliente: "Juliana Costa",
      servico: "Manutenção em Gel",
      horarioInicio: "09:00",
      duracao: 120,
      valor: "120,00",
      status: "pendente",
      pagamento: "pendente",
    },
    {
      id: 2,
      profissional: "Beatriz Santos",
      cliente: "Camila Mendes",
      servico: "Pedicure",
      horarioInicio: "10:30",
      duracao: 60,
      valor: "35,00",
      status: "confirmado",
      pagamento: "pago",
    },
    {
      id: 3,
      profissional: "Ana Silva",
      cliente: "Amanda Reis",
      servico: "Pé e Mão",
      horarioInicio: "13:30",
      duracao: 90,
      valor: "65,00",
      status: "pendente",
      pagamento: "pendente",
    },
    {
      id: 4,
      profissional: "Carla Dias",
      cliente: "ALMOÇO",
      servico: "Pausa",
      horarioInicio: "12:00",
      duracao: 60,
      valor: "-",
      status: "bloqueio",
    },
  ]);

  const profissionais = [
    { nome: "Ana Silva", especialidade: "Nail Designer", foto: "" },
    { nome: "Beatriz Santos", especialidade: "Manicure Clássica", foto: "" },
    { nome: "Carla Dias", especialidade: "Pedicure e Spa", foto: "" },
  ];

  const horasDoDia = Array.from(
    { length: 14 },
    (_, i) => `${String(i + 7).padStart(2, "0")}:00`,
  );

  const alternarStatus = (id) => {
    setAgendamentos(
      agendamentos.map((ag) =>
        ag.id === id && ag.status !== "bloqueio"
          ? {
              ...ag,
              status: ag.status === "pendente" ? "confirmado" : "pendente",
            }
          : ag,
      ),
    );
  };

  const confirmarExclusao = () => {
    setAgendamentos(
      agendamentos.filter((ag) => ag.id !== agendamentoParaExcluir.id),
    );
    setAgendamentoParaExcluir(null);
  };

  const salvarAgendamento = (novoDado) => {
    if (!novoDado.id) {
      const dataAgendamentoObj = new Date(
        `${novoDado.data}T${novoDado.horarioInicio}:00`,
      );
      if (dataAgendamentoObj < new Date()) {
        setMensagemErro(
          "Você não pode criar um agendamento em um horário que já passou!",
        );
        return;
      }
    }

    const converterParaMinutos = (horaString) => {
      const [horas, minutos] = horaString.split(":").map(Number);
      return horas * 60 + minutos;
    };

    const inicioNovo = converterParaMinutos(novoDado.horarioInicio);
    const fimNovo = inicioNovo + novoDado.duracao;

    const temChoque = agendamentos.some((ag) => {
      if (novoDado.id && ag.id === novoDado.id) return false;
      if (ag.profissional !== novoDado.profissional) return false;
      const inicioExistente = converterParaMinutos(ag.horarioInicio);
      const fimExistente = inicioExistente + ag.duracao;
      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });

    if (temChoque) {
      setMensagemErro(
        "Esse profissional já possui um agendamento ou pausa nesse horário. Por favor, escolha outro.",
      );
      return;
    }

    if (novoDado.id) {
      setAgendamentos(
        agendamentos.map((ag) => (ag.id === novoDado.id ? novoDado : ag)),
      );
    } else {
      const novoId =
        agendamentos.length > 0
          ? Math.max(...agendamentos.map((ag) => ag.id)) + 1
          : 1;
      setAgendamentos([...agendamentos, { ...novoDado, id: novoId }]);
    }
    setIsModalOpen(false);
  };

  // NOVA LÓGICA DO BOTÃO DE PAGAMENTO
  const handleAbrirPagamento = (ag, e) => {
    e.stopPropagation();
    if (ag.pagamento === "pago") {
      // Se já está pago, abre a confirmação para desfazer
      setAgendamentoParaDesfazerPagamento(ag);
    } else {
      // Se está pendente, abre o modal de recebimento normalmente
      setAgendamentoParaPagamento(ag);
      setIsModalPagamentoAberto(true);
    }
  };

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
            <div key={prof.nome} className="coluna-profissional">
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

              {agendamentos
                .filter((ag) => ag.profissional === prof.nome)
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
                            {/* 1. WHATSAPP */}
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
                                transition: "all 0.2s",
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

                            {/* 2. PAGAMENTO INTELIGENTE */}
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
                                transition: "all 0.2s",
                              }}
                              title={
                                ag.pagamento === "pago"
                                  ? "Pagamento Recebido - Clique para desfazer"
                                  : "Receber Pagamento"
                              }
                            >
                              <CircleDollarSign size={16} strokeWidth={2.5} />
                            </button>

                            {/* 3. CONCLUIR */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alternarStatus(ag.id);
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
                                transition: "all 0.2s",
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

                        {/* 4. LIXEIRA */}
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
                            transition: "all 0.2s",
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
        onSave={salvarAgendamento}
      />

      <ModalPagamento
        isOpen={isModalPagamentoAberto}
        onClose={() => setIsModalPagamentoAberto(false)}
        dados={agendamentoParaPagamento}
        onSave={(dadosPagamento) => {
          setAgendamentos(
            agendamentos.map((ag) =>
              ag.id === agendamentoParaPagamento.id
                ? { ...ag, pagamento: "pago" }
                : ag,
            ),
          );
          setIsModalPagamentoAberto(false);
        }}
      />

      {/* NOVO: MODAL DE DESFAZER PAGAMENTO */}
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
              <strong>{agendamentoParaDesfazerPagamento.cliente}</strong> e
              voltar para pendente?
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
                onClick={() => {
                  setAgendamentos(
                    agendamentos.map((ag) =>
                      ag.id === agendamentoParaDesfazerPagamento.id
                        ? { ...ag, pagamento: "pendente" }
                        : ag,
                    ),
                  );
                  setAgendamentoParaDesfazerPagamento(null);
                }}
              >
                Sim, desfazer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
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

      {mensagemErro !== "" && (
        <div
          className="modal-overlay"
          style={{ zIndex: 9999 }}
          onClick={() => setMensagemErro("")}
        >
          <div
            className="modal-box modal-exclusao"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "center", padding: "2rem" }}
          >
            <h3 style={{ color: "#E11D48", margin: "0 0 1rem 0" }}>
              Ação Inválida
            </h3>
            <p style={{ margin: "0 0 1.5rem 0", color: "#475569" }}>
              {mensagemErro}
            </p>
            <button
              className="btn-confirmar-exclusao"
              onClick={() => setMensagemErro("")}
              style={{ width: "100%", backgroundColor: "var(--cor-primaria)" }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
