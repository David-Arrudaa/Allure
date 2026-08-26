import { useState, useEffect } from "react";
import { X, Calendar, User, DollarSign, Loader2, FileText, Phone, Cake } from "lucide-react";
import { supabase } from "../../../services/supabase";
import "./ModalHistorico.css";
import "../ModalAgendamento/ModalAgendamento.css";

const extrairAniversario = (observacoes) => {
  if (!observacoes) return "";
  const match = observacoes.match(
    /(?:Nascimento|Anivers[áa]rio):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i,
  );
  if (match) {
    const val = match[1];
    if (val.includes("-")) {
      const [y, m, d] = val.split("-");
      return `${d}/${m}/${y}`;
    }
    return val;
  }
  return "";
};

const limparObservacoes = (observacoes) => {
  if (!observacoes) return "";
  return observacoes
    .replace(
      /(?:\[)?(?:Nascimento|Anivers[áa]rio):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})(?:\])?\n?/gi,
      "",
    )
    .trim();
};

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
          profissionais ( nome )
        `,
        )
        .eq("customer_id", cliente.id)
        .eq("pagamento", "pago") // Filtra estritamente os concluídos/pagos
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

  const aniversarioStr = extrairAniversario(cliente.observacoes);
  const obsLimpa = limparObservacoes(cliente.observacoes);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "550px" }}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ marginBottom: "0.2rem", fontSize: "1.3rem" }}>
              Histórico da Cliente
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#64748B", margin: 0 }}>
              <strong>{cliente.nome}</strong>
            </p>
          </div>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* CARD DE INFORMAÇÕES & OBSERVAÇÕES */}
        <div className="historico-cliente-card">
          <div className="historico-cliente-topo">
            <div className="historico-tags">
              <span className="tag-contato">
                <Phone size={13} /> {cliente.telefone || "Sem telefone"}
              </span>
              {aniversarioStr && (
                <span className="tag-aniversario">
                  <Cake size={13} /> Aniversário: {aniversarioStr}
                </span>
              )}
            </div>
          </div>

          <div className="historico-observacoes-bloco">
            <div className="historico-observacoes-header">
              <FileText size={15} />
              <span>Observações & Preferências:</span>
            </div>
            {obsLimpa ? (
              <p className="historico-observacoes-texto">{obsLimpa}</p>
            ) : (
              <p className="historico-observacoes-vazio">
                Nenhuma observação ou preferência registrada para esta cliente.
              </p>
            )}
          </div>
        </div>

        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: "700",
            color: "var(--cor-texto)",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Calendar size={16} color="var(--cor-primaria)" /> Atendimentos
          Realizados (Últimos 12 meses)
        </h3>

        <div className="historico-lista">
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
                marginTop: "0.5rem",
                padding: "2rem",
                backgroundColor: "#F8FAFC",
                borderRadius: "8px",
              }}
            >
              Nenhum atendimento pago registrado nos últimos 12 meses.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
