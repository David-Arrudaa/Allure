import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ModalAgendamento } from "../components/ModalAgendamento";
import "./Agenda.css";

export function Agenda() {
  const { profile } = useAuth();

  // Memória do React que guarda se o modal está aberto (começa como falso/fechado)
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
  const profissionais = [
    {
      id: 1,
      nome: "Ana Silva",
      especialidade: "Manicure / Pedicure",
      agendamentos: [
        {
          id: 101,
          horario: "09:00",
          cliente: "Juliana Costa",
          servico: "Pé e Mão",
          valor: "R$ 65",
          status: "confirmado",
        },
        {
          id: 102,
          horario: "14:00",
          cliente: "Camila Mendes",
          servico: "Manicure",
          valor: "R$ 35",
          status: "pendente",
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
          servico: "Manutenção Gel",
          valor: "R$ 120",
          status: "confirmado",
        },
      ],
    },
    {
      id: 3,
      nome: "Carla Dias",
      especialidade: "Manicure",
      agendamentos: [],
    },
  ];

  return (
    <div className="agenda-container">
      <div className="agenda-topbar">
        <div className="agenda-info">
          <h2>Programação do Dia</h2>
          <p style={{ textTransform: "capitalize" }}>{dataHoje}</p>
        </div>

        {/* Botão que muda o estado para true e abre o modal */}
        <button className="btn-novo" onClick={() => setModalAberto(true)}>
          <Plus size={18} strokeWidth={2.5} />
          Novo Agendamento
        </button>
      </div>

      <div className="agenda-conteudo">
        {profissionais.map((profissional) => (
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
                        <div className="cartao-topo">
                          <span className="cartao-cliente">
                            {agendamento.cliente}
                          </span>
                          <div
                            className={`status-bolinha status-${agendamento.status}`}
                            title={`Status: ${agendamento.status}`}
                          ></div>
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

      {/* Janela Modal controlada pelo estado modalAberto */}
      <ModalAgendamento
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
