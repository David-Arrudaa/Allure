import React, { useState, useEffect } from "react";
import { X, Calendar, User, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "../../../services/supabase";
import "./ModalHistorico.css";
import "../ModalAgendamento/ModalAgendamento.css";

export function ModalHistorico({ isOpen, onClose, cliente }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Só carrega os dados se o modal estiver aberto e existir uma cliente selecionada
    if (isOpen && cliente) {
      carregarHistoricoCliente();
    } else {
      setHistorico([]); // Limpa ao fechar
    }
  }, [isOpen, cliente]);

  const carregarHistoricoCliente = async () => {
    try {
      setLoading(true);

      // 1. Descobre a data exata de 12 meses atrás no formato do banco
      const dataLimite = new Date();
      dataLimite.setMonth(dataLimite.getMonth() - 12);
      const dataLimiteIso = dataLimite.toISOString();

      // 2. Busca no Supabase os agendamentos da cliente específica, pagos e recentes
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          data_horario,
          servico,
          valor,
          status,
          pagamento,
          profissionais ( nome )
        `,
        )
        .eq("customer_id", cliente.id)
        .gte("data_horario", dataLimiteIso) // Apenas últimos 12 meses
        .order("data_horario", { ascending: false }); // Ordena do mais recente para o mais antigo

      if (error) throw error;

      if (data) {
        // Formata os dados retornados para exibir bonitinho na tela
        const historicoFormatado = data.map((item) => {
          const dataObj = new Date(item.data_horario);
          const dataBr = `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}/${dataObj.getFullYear()}`;

          return {
            id: item.id,
            data: dataBr,
            servico: item.servico || "Serviço não especificado",
            profissional: item.profissionais?.nome || "Equipe",
            valor: item.valor ? String(item.valor).replace(".", ",") : "0,00",
            status: item.status,
            pagamento: item.pagamento,
          };
        });

        setHistorico(historicoFormatado);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico da cliente:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cliente) return null;

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
          {cliente.observacoes && (
            <div style={{ backgroundColor: "#FEF9C3", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #F59E0B", marginBottom: "16px", color: "#854D0E", fontSize: "0.9rem" }}>
              <strong>Observações Importantes:</strong>
              <p style={{ margin: "4px 0 0" }}>{cliente.observacoes}</p>
            </div>
          )}
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "3rem",
                color: "#64748B",
                gap: "10px",
              }}
            >
              <Loader2 className="animate-spin" size={24} />
              <span>Buscando histórico...</span>
            </div>
          ) : historico.length > 0 ? (
            historico.map((item) => (
              <div key={item.id} className="historico-item">
                <div className="historico-data">
                  <Calendar size={14} />
                  {item.data}
                </div>

                <div className="historico-detalhes">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4>{item.servico}</h4>
                    <div style={{ display: "flex", gap: "6px", flexDirection: "column", alignItems: "flex-end" }}>
                      {item.status === "cancelado" && <span style={{ backgroundColor: "#FEE2E2", color: "#EF4444", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>CANCELADO</span>}
                      {item.pagamento === "pago" && <span style={{ backgroundColor: "#DCFCE7", color: "#16A34A", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>PAGO</span>}
                      {item.pagamento !== "pago" && item.status !== "cancelado" && <span style={{ backgroundColor: "#F1F5F9", color: "#64748B", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>PENDENTE</span>}
                    </div>
                  </div>
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
                padding: "2rem",
                backgroundColor: "#F8FAFC",
                borderRadius: "8px",
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
