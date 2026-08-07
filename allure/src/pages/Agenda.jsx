import React, { useState, useEffect, useRef } from "react";
import { Plus, Check, MessageCircle, Trash2, Calendar } from "lucide-react";
import { ModalAgendamento } from "../components/ModalAgendamento";
import "./Agenda.css";

export function Agenda() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState(null);
  const [mensagemErro, setMensagemErro] = useState("");

  // Controle da data atual e do relógio
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const linhaTempoRef = useRef(null);

  // Relógio rodando a cada 1 minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Formata a data para exibir bonito (ex: Terça-feira, 05 de Agosto)
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

  // Funções de Navegação da Data
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

  // Cálculos de Posição
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

  // Lógica da Linha do Tempo Vermelha
  const hoje = new Date();
  const isHoje =
    dataSelecionada.getDate() === hoje.getDate() &&
    dataSelecionada.getMonth() === hoje.getMonth() &&
    dataSelecionada.getFullYear() === hoje.getFullYear();

  const minutosAtuais = horaAtual.getHours() * 60 + horaAtual.getMinutes();
  const posicaoLinhaTempo = (minutosAtuais - 7 * 60) * 2;
  const mostrarLinhaTempo =
    isHoje && posicaoLinhaTempo >= 0 && posicaoLinhaTempo <= 14 * 60 * 2;

  // Auto-scroll para a linha do tempo quando abrir "Hoje"
  useEffect(() => {
    if (mostrarLinhaTempo && linhaTempoRef.current) {
      linhaTempoRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [dataSelecionada, mostrarLinhaTempo]);

  // Lista Mockada
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

  return (
    <div className="agenda-container">
      {/* BARRA SUPERIOR (TOPBAR) */}
      <div className="agenda-topbar">
        <div className="agenda-info-navegacao">
          <div className="agenda-info">
            <h2>Agenda do Dia</h2>
            <div className="data-formatada">
              {formatarDataExibicao(dataSelecionada)}

              {/* Botão de calendário com input embutido */}
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

      {/* ÁREA COM SCROLL INTERNO DA AGENDA */}
      <div className="agenda-wrapper">
        {/* Coluna da esquerda (14 horas fixas) */}
        <div className="coluna-horarios">
          <div className="espaco-cabecalho-horarios"></div>{" "}
          {/* Espaço vazio para alinhar com o cabeçalho fixo das profissionais */}
          {horasDoDia.map((hora) => (
            <div key={hora} className="horario-label">
              <span>{hora}</span>
              <span className="meia-hora">{hora.replace(":00", ":30")}</span>
            </div>
          ))}
        </div>

        {/* Grade principal com a agenda */}
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
              {/* CABEÇALHO FIXO (FOTO + NOME LADO A LADO) */}
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

              {/* RENDERIZAÇÃO DOS CARDS */}
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

                      <div className="card-acoes-topo">
                        <button
                          className="btn-delete-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAgendamentoParaExcluir(ag);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        {ag.status !== "bloqueio" && (
                          <>
                            <a
                              href="#"
                              className="btn-wpp-card"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle size={14} />
                            </a>
                            <button
                              className={`btn-status-tick status-${ag.status}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                alternarStatus(ag.id);
                              }}
                            >
                              <Check size={14} strokeWidth={3} />
                            </button>
                          </>
                        )}
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

      {/* MODAL DE AVISO DE ERRO */}
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
