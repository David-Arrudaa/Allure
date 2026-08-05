import React, { useState } from "react";
import { Plus, RefreshCw, MessageCircle, Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ModalAgendamento } from "../components/ModalAgendamento";
import "./Agenda.css";

export function Agenda() {
  const { profile } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);

  const dataHoje = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const horariosDoDia = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  // Transformamos os dados em um Estado para o React atualizar a tela ao clicarmos
  const [listaProfissionais, setListaProfissionais] = useState([
    {
      id: 1,
      nome: "Ana Silva",
      especialidade: "Manicure / Pedicure",
      agendamentos: [
        {
          id: 101,
          horario: "09:00",
          cliente: "Juliana Costa",
          telefone: "(15) 99999-1111",
          servico: "Pé e Mão",
          valor: "R$ 65",
          status: "confirmado",
          recorrente: true,
        },
        {
          id: 102,
          horario: "14:00",
          cliente: "Camila Mendes",
          telefone: "(15) 99999-2222",
          servico: "Manicure",
          valor: "R$ 35",
          status: "pendente",
          recorrente: false,
        },
      ],
    },
    {
      id: 2,
      nome: "Beatriz Santos",
      especialidade: "Nail Designer",
      agendamentos: [
        {
          id: 103,
          horario: "10:00",
          cliente: "Amanda Reis",
          telefone: "(15) 99999-3333",
          servico: "Manutenção Gel",
          valor: "R$ 120",
          status: "confirmado",
          recorrente: false,
        },
      ],
    },
    {
      id: 3,
      nome: "Carla Dias",
      especialidade: "Manicure",
      agendamentos: [],
    },
  ]);

  // Função que inverte o status ao clicar no botão
  const alternarStatus = (profissionalId, agendamentoId) => {
    setListaProfissionais((listaAtual) =>
      listaAtual.map((prof) => {
        if (prof.id === profissionalId) {
          return {
            ...prof,
            agendamentos: prof.agendamentos.map((agend) => {
              if (agend.id === agendamentoId) {
                return {
                  ...agend,
                  status:
                    agend.status === "pendente" ? "confirmado" : "pendente",
                };
              }
              return agend;
            }),
          };
        }
        return prof;
      }),
    );
  };

  return (
    <div className="agenda-container">
      <div className="agenda-topbar">
        <div className="agenda-info">
          <h2>Programação do Dia</h2>
          <p style={{ textTransform: "capitalize" }}>{dataHoje}</p>
        </div>

        <button className="btn-novo" onClick={() => setModalAberto(true)}>
          <Plus size={18} strokeWidth={2.5} />
          Novo Agendamento
        </button>
      </div>

      <div className="agenda-conteudo">
        {listaProfissionais.map((profissional) => (
          <div key={profissional.id} className="coluna-profissional">
            <div className="profissional-header">
              <h3>{profissional.nome}</h3>
              <span>{profissional.especialidade}</span>
            </div>

            <div className="coluna-body">
              {horariosDoDia.map((horario) => {
                const agendamento = profissional.agendamentos.find(
                  (a) => a.horario === horario,
                );

                return (
                  <div key={horario} className="horario-linha">
                    <div className="horario-label">{horario}</div>

                    {agendamento ? (
                      <div className="cartao-agendamento">
                        <div className="card-header">
                          <div className="cliente-info-wrapper">
                            <span className="cartao-cliente">
                              {agendamento.cliente}
                            </span>
                            {agendamento.recorrente && (
                              <RefreshCw
                                size={14}
                                className="icone-recorrencia"
                                title="Agendamento Recorrente"
                                strokeWidth={2.5}
                              />
                            )}
                          </div>

                          <div className="card-acoes-topo">
                            {agendamento.telefone && (
                              <a
                                href={`https://wa.me/55${agendamento.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${agendamento.cliente}, tudo bem? Passando para confirmar seu horário hoje às ${agendamento.horario} para o serviço de ${agendamento.servico}.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-wpp-card"
                                title="Confirmar via WhatsApp"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MessageCircle size={15} strokeWidth={2.5} />
                              </a>
                            )}

                            {/* NOVO BOTÃO DE CHECK CLICÁVEL */}
                            <button
                              className={`btn-status-tick status-${agendamento.status}`}
                              onClick={(e) => {
                                e.stopPropagation(); // Evita abrir o modal sem querer
                                alternarStatus(profissional.id, agendamento.id);
                              }}
                              title={
                                agendamento.status === "pendente"
                                  ? "Marcar como Confirmado"
                                  : "Voltar para Pendente"
                              }
                            >
                              <Check size={14} strokeWidth={3.5} />
                            </button>
                          </div>
                        </div>

                        <div className="cartao-servico">
                          <span>{agendamento.servico}</span>
                          <span className="cartao-valor">
                            {agendamento.valor}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="cartao-vazio">+ Disponível</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ModalAgendamento
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
