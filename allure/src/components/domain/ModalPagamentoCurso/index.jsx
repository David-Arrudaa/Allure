import { useState, useEffect } from "react";
import { X, DollarSign, CreditCard, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "../../../lib/toast";

export function ModalPagamentoCurso({
  isOpen,
  onClose,
  matricula,
  turma,
  onRegistrarPagamento,
  isSalvando,
  tenantId,
}) {
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [tipoLancamento, setTipoLancamento] = useState("restante");
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (isOpen && matricula) {
      // Pré-preenche com o saldo devedor restante
      const saldo = matricula.saldoDevedor || 0;
      setValor(saldo > 0 ? String(saldo.toFixed(2)).replace(".", ",") : "");
      setFormaPagamento("Pix");
      setTipoLancamento(saldo > 0 ? "restante" : "avulso");
      setDataPagamento(new Date().toISOString().split("T")[0]);
      setObservacoes("");
    }
  }, [isOpen, matricula]);

  if (!isOpen || !matricula) return null;

  const handleSubmeter = async (e) => {
    e.preventDefault();

    const valorNum = valor
      ? Number(valor.replace(/\./g, "").replace(",", "."))
      : 0;

    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error("Informe um valor de pagamento válido.");
      return;
    }

    try {
      await onRegistrarPagamento({
        tenantId,
        matriculaId: matricula.id,
        valor: valorNum,
        formaPagamento,
        tipoLancamento,
        dataPagamento,
        observacoes: observacoes.trim(),
      });

      toast.success("Pagamento registrado com sucesso!");
      onClose();
    } catch (err) {
      console.error("Erro ao registrar pagamento:", err);
      toast.error("Ocorreu um erro ao registrar o pagamento.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Lançar Pagamento
              </h3>
              <p className="text-xs text-slate-500">
                Aluna: <span className="font-semibold text-slate-700">{matricula.aluna?.nome}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumo Financeiro da Aluna */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 text-center text-xs">
          <div>
            <span className="text-slate-500 block">Total do Curso</span>
            <span className="font-bold text-slate-700">
              R$ {Number(matricula.valor_acordado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Já Pago</span>
            <span className="font-bold text-emerald-600">
              R$ {Number(matricula.totalPago || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Saldo Pendente</span>
            <span className="font-bold text-amber-600">
              R$ {Number(matricula.saldoDevedor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmeter} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <DollarSign size={13} className="text-slate-400" />
              Valor a Receber (R$) *
            </label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 1.200,00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard size={13} className="text-slate-400" />
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                value={tipoLancamento}
                onChange={(e) => setTipoLancamento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="restante">Quitação Restante</option>
                <option value="sinal">Sinal Adicional</option>
                <option value="avulso">Parcela Avulsa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-slate-400" />
              Data do Recebimento
            </label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Pago no balcão da recepção"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSalvando}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSalvando}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              {isSalvando ? "Salvando..." : "Confirmar Recebimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

