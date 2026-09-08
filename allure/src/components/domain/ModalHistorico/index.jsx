import { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  User,
  DollarSign,
  Loader2,
  FileText,
  Phone,
  Cake,
  Clock,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
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
  const [abaAtiva, setAbaAtiva] = useState("agendados"); // 'agendados' ou 'finalizados'

  useEffect(() => {
    // Só carrega os dados se o modal estiver aberto e existir uma cliente selecionada
    if (isOpen && cliente) {
      setAbaAtiva("agendados");
      carregarHistoricoCliente();
    } else {
      setHistorico([]); // Limpa ao fechar
    }
  }, [isOpen, cliente]);

  const carregarHistoricoCliente = async () => {
    try {
      setLoading(true);

      // Busca no Supabase TODOS os agendamentos da cliente (sem limite de 12 meses)
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
        .neq("status", "bloqueio") // Exclui bloqueios
        .order("data_horario", { ascending: false });

      if (error) throw error;

      if (data) {
        const historicoFormatado = data.map((item) => {
          const dataObj = new Date(item.data_horario);
          const dataBr = `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}/${dataObj.getFullYear()}`;
          const horario = `${String(dataObj.getHours()).padStart(2, "0")}:${String(dataObj.getMinutes()).padStart(2, "0")}`;

          // Um agendamento é considerado "finalizado" se estiver pago OU com status concluido/finalizado
          const isFinalizado =
            item.pagamento === "pago" ||
            item.status === "concluido" ||
            item.status === "finalizado";

          // Um agendamento é "futuro/agendado" quando não foi pago e está agendado/pendente/confirmado
          const isFuturo = !isFinalizado && item.status !== "cancelado";

          return {
            id: item.id,
            data: dataBr,
            horario,
            dataObj,
            servico: item.servico || "Serviço não especificado",
            profissional: item.profissionais?.nome || "Equipe",
            valor: item.valor ? String(item.valor).replace(".", ",") : "0,00",
            status: item.status || "pendente",
            pagamento: item.pagamento || "pendente",
            isFinalizado,
            isFuturo,
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

  // Divide a lista em agendados e finalizados
  const agendados = useMemo(
    () => historico.filter((item) => item.isFuturo || (!item.isFinalizado && item.status !== "cancelado")),
    [historico]
  );

  const finalizados = useMemo(
    () => historico.filter((item) => item.isFinalizado),
    [historico]
  );

  const itensExibidos = abaAtiva === "agendados" ? agendados : finalizados;

  if (!isOpen || !cliente) return null;

  const aniversarioStr = extrairAniversario(cliente.observacoes);
  const obsLimpa = limparObservacoes(cliente.observacoes);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-historico-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: "0.25rem", fontSize: "1.25rem" }}>
              Histórico da Cliente
            </h2>
            <div className="historico-cliente-subtitulo">
              <span className="historico-cliente-nome">{cliente.nome}</span>
              {cliente.telefone && (
                <span className="historico-header-tag tag-tel">
                  <Phone size={12} /> {cliente.telefone}
                </span>
              )}
              {aniversarioStr && (
                <span className="historico-header-tag tag-niver">
                  <Cake size={12} /> {aniversarioStr}
                </span>
              )}
            </div>
          </div>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bloco de Observações: só aparece se realmente houver alguma observação preenchida */}
        {obsLimpa && (
          <div className="historico-obs-compacta">
            <div className="historico-obs-header">
              <FileText size={13} className="icone-obs" />
              <strong>Observações:</strong>
            </div>
            <p className="historico-obs-conteudo">{obsLimpa}</p>
          </div>
        )}

        {/* ABAS DE NAVEGAÇÃO: AGENDADOS vs FINALIZADOS */}
        <div className="historico-abas-container">
          <button
            type="button"
            className={`historico-aba-btn ${abaAtiva === "agendados" ? "ativa" : ""}`}
            onClick={() => setAbaAtiva("agendados")}
          >
            <CalendarClock size={16} />
            <span>Agendados</span>
            <span className="historico-aba-badge">{agendados.length}</span>
          </button>

          <button
            type="button"
            className={`historico-aba-btn ${abaAtiva === "finalizados" ? "ativa" : ""}`}
            onClick={() => setAbaAtiva("finalizados")}
          >
            <CheckCircle2 size={16} />
            <span>Finalizados</span>
            <span className="historico-aba-badge">{finalizados.length}</span>
          </button>
        </div>

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
              <span>Buscando atendimentos...</span>
            </div>
          ) : itensExibidos.length > 0 ? (
            itensExibidos.map((item) => (
              <div key={item.id} className={`historico-item ${abaAtiva === "agendados" ? "item-agendado" : "item-finalizado"}`}>
                <div className="historico-data">
                  <Calendar size={14} />
                  <span>{item.data}</span>
                  <span className="historico-data-hora">
                    <Clock size={12} /> {item.horario}
                  </span>
                </div>

                <div className="historico-detalhes">
                  <div className="historico-detalhes-topo">
                    <h4>{item.servico}</h4>
                    <span
                      className={`badge-status-atendimento ${
                        item.isFinalizado ? "badge-pago" : item.status === "confirmado" ? "badge-confirmado" : "badge-pendente"
                      }`}
                    >
                      {item.isFinalizado ? "Pago / Concluído" : item.status === "confirmado" ? "Confirmado" : "Agendado"}
                    </span>
                  </div>

                  <div className="historico-detalhes-info">
                    <p>
                      <User size={14} /> <strong>Profissional:</strong>{" "}
                      {item.profissional}
                    </p>
                    <p>
                      <DollarSign size={14} /> <strong>Valor:</strong> R${" "}
                      {item.valor}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="historico-vazio">
              <Calendar size={28} opacity={0.4} />
              <p>
                {abaAtiva === "agendados"
                  ? "Nenhum agendamento futuro em aberto para esta cliente."
                  : "Nenhum atendimento finalizado registrado para esta cliente."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
