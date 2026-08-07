import React, { useState, useEffect } from "react";
import { Plus, Check, MessageCircle, Trash2 } from "lucide-react"; // <-- Ícone de Lixeira adicionado
import { ModalAgendamento } from "../components/ModalAgendamento";
import "./Agenda.css";

export function Agenda() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState(null); // <-- Estado da Exclusão
  const [horaAtual, setHoraAtual] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

  const minutosAtuais = horaAtual.getHours() * 60 + horaAtual.getMinutes();
  const posicaoLinhaTempo = (minutosAtuais - 7 * 60) * 2;
  const mostrarLinhaTempo =
    posicaoLinhaTempo >= 0 && posicaoLinhaTempo <= 14 * 60 * 2;

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

  const profissionais = ["Ana Silva", "Beatriz Santos", "Carla Dias"];
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

  // Função que realmente apaga o agendamento da lista
  const confirmarExclusao = () => {
    setAgendamentos(
      agendamentos.filter((ag) => ag.id !== agendamentoParaExcluir.id),
    );
    setAgendamentoParaExcluir(null);
  };

  const abrirNovoAgendamento = () => {
    setAgendamentoEditando(null);
    setIsModalOpen(true);
  };

  const abrirEdicao = (agendamento) => {
    setAgendamentoEditando(agendamento);
    setIsModalOpen(true);
  };

  return (
    <div className="agenda-container">
      <div className="agenda-topbar">
        <div className="agenda-info">
          <h2>Agenda do Dia</h2>
          <p>Terça-feira, 05 de Agosto</p>
        </div>
        <button className="btn-novo" onClick={abrirNovoAgendamento}>
          <Plus size={20} />
          Novo Agendamento
        </button>
      </div>

      <div className="agenda-wrapper">
        <div className="coluna-horarios">
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
              className="linha-tempo"
              style={{ top: `${posicaoLinhaTempo}px` }}
            ></div>
          )}

          {profissionais.map((profNome) => (
            <div key={profNome} className="coluna-profissional">
              <div className="profissional-header">
                <h3>{profNome}</h3>
              </div>

              {agendamentos
                .filter((ag) => ag.profissional === profNome)
                .map((ag) => (
                  <div
                    key={ag.id}
                    className="cartao-agendamento"
                    onClick={() => abrirEdicao(ag)}
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

                      {ag.status !== "bloqueio" && (
                        <div className="card-acoes-topo">
                          {/* AQUI ENTRA O BOTÃO DE LIXEIRA */}
                          <button
                            className="btn-delete-card"
                            title="Excluir Agendamento"
                            onClick={(e) => {
                              e.stopPropagation(); // Impede de abrir a edição
                              setAgendamentoParaExcluir(ag); // Ativa o mini-modal
                            }}
                          >
                            <Trash2 size={14} />
                          </button>

                          <a
                            href="#"
                            className="btn-wpp-card"
                            title="WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle size={14} />
                          </a>
                          <button
                            className={`btn-status-tick status-${ag.status}`}
                            title={
                              ag.status === "pendente"
                                ? "Confirmar"
                                : "Desmarcar"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              alternarStatus(ag.id);
                            }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </div>
                      )}
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
      />

      {/* MINI-MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
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
