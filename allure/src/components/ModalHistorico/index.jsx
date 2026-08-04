import React from "react";
import { X, Calendar, User, DollarSign } from "lucide-react";
import "./ModalHistorico.css";
import "../ModalAgendamento/ModalAgendamento.css";

export function ModalHistorico({ isOpen, onClose, cliente }) {
  if (!isOpen || !cliente) return null;

  // Dados simulados do histórico (Adicionei o ID 4 com uma data bem antiga para testarmos o filtro)
  const historicoMock = [
    {
      id: 1,
      data: "15/08/2026",
      servico: "Manutenção em Gel",
      profissional: "Ana Silva",
      valor: "120,00",
    },
    {
      id: 2,
      data: "20/07/2026",
      servico: "Pé e Mão",
      profissional: "Beatriz Santos",
      valor: "65,00",
    },
    {
      id: 3,
      data: "18/06/2026",
      servico: "Spa dos Pés",
      profissional: "Ana Silva",
      valor: "50,00",
    },
    {
      id: 4,
      data: "10/01/2024",
      servico: "Manicure Antiga",
      profissional: "Carla Dias",
      valor: "35,00",
    }, // Este não deve aparecer!
  ];

  // 1. Descobre a data de exatamente 12 meses atrás
  const dataLimite = new Date();
  dataLimite.setMonth(dataLimite.getMonth() - 12);

  // 2. Filtra a lista mantendo apenas os serviços recentes
  const historicoFiltrado = historicoMock.filter((item) => {
    // Converte a nossa data em texto (DD/MM/YYYY) para uma data real que o JavaScript entenda
    const [dia, mes, ano] = item.data.split("/");
    const dataDoServico = new Date(ano, mes - 1, dia);

    // Retorna apenas se for mais recente que a data limite
    return dataDoServico >= dataLimite;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ marginBottom: "0.2rem" }}>
              Histórico de Atendimentos
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#64748B", margin: 0 }}>
              Cliente: <strong>{cliente.nome}</strong> (Últimos 12 meses)
            </p>
          </div>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="historico-lista">
          {historicoFiltrado.length > 0 ? (
            historicoFiltrado.map((item) => (
              <div key={item.id} className="historico-item">
                <div className="historico-data">
                  <Calendar size={14} />
                  {item.data}
                </div>

                <div className="historico-detalhes">
                  <h4>{item.servico}</h4>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <User size={14} /> <strong>Profissional:</strong>{" "}
                    {item.profissional}
                  </p>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <DollarSign size={14} /> <strong>Valor:</strong> R${" "}
                    {item.valor}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p
              style={{
                color: "#94A3B8",
                textAlign: "center",
                marginTop: "1rem",
              }}
            >
              Nenhum atendimento registrado nos últimos 12 meses.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
