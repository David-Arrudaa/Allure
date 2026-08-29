import { useState, useEffect } from "react";
import { Calendar, User, DollarSign, Loader2, FileText, Phone, Cake } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { Modal } from "../../ui/Modal";

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
    if (isOpen && cliente) {
      carregarHistoricoCliente();
    } else {
      setHistorico([]);
    }
  }, [isOpen, cliente]);

  const carregarHistoricoCliente = async () => {
    try {
      setLoading(true);

      const dataLimite = new Date();
      dataLimite.setMonth(dataLimite.getMonth() - 12);
      const dataLimiteIso = dataLimite.toISOString();

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
        .gte("data_horario", dataLimiteIso)
        .order("data_horario", { ascending: false });

      if (error) throw error;

      if (data) {
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

  const aniversarioStr = extrairAniversario(cliente.observacoes);
  const obsLimpa = limparObservacoes(cliente.observacoes);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico: ${cliente.nome}`}>
      <div className="space-y-4">
        {/* CARD DE INFORMAÇÕES & OBSERVAÇÕES */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
              <Phone size={13} className="text-slate-500" /> {cliente.telefone || "Sem telefone"}
            </span>
            {aniversarioStr && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-50 border border-pink-200 rounded-lg text-xs font-semibold text-pink-700">
                <Cake size={13} /> Aniversário: {aniversarioStr}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <FileText size={15} />
              <span>Observações & Preferências:</span>
            </div>
            {obsLimpa ? (
              <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">{obsLimpa}</p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhuma observação ou preferência registrada para esta cliente.
              </p>
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Calendar size={16} className="text-[var(--cor-primaria)]" /> Atendimentos Realizados (Últimos 12 meses)
        </h3>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center items-center p-8 text-slate-500 gap-2 text-sm">
              <Loader2 className="animate-spin" size={20} />
              <span>Buscando histórico...</span>
            </div>
          ) : historico.length > 0 ? (
            historico.map((item) => (
              <div key={item.id} className="p-3 border border-slate-200 rounded-xl bg-white space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                    <Calendar size={13} /> {item.data}
                  </span>
                  <div className="flex gap-1">
                    {item.status === "cancelado" && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[0.65rem] font-bold">CANCELADO</span>}
                    {item.pagamento === "pago" && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[0.65rem] font-bold">PAGO</span>}
                    {item.pagamento !== "pago" && item.status !== "cancelado" && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[0.65rem] font-bold">PENDENTE</span>}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-800">{item.servico}</h4>

                <div className="flex flex-wrap justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1">
                    <User size={13} className="text-slate-400" /> {item.profissional}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                    <DollarSign size={13} className="text-emerald-600" /> R$ {item.valor}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8 bg-slate-50 rounded-xl text-sm">
              Nenhum atendimento registrado nos últimos 12 meses.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
