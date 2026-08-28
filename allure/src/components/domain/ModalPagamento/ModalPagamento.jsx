import { useState, useEffect } from "react";
import { CreditCard, Banknote, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { maskCurrencyInput, formatCurrency } from "../../../utils/masks";
import { FORM_STYLES } from "../../../config/theme";

export function ModalPagamento({ isOpen, onClose, dados, onSave }) {
  const [buscaCliente, setBuscaCliente] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [observacao, setObservacao] = useState("");

  const clientesCadastradas = [
    { id: 1, nome: "Juliana Costa" },
    { id: 2, nome: "Camila Mendes" },
    { id: 3, nome: "Amanda Reis" },
    { id: 4, nome: "Mariana Souza" },
  ];

  useEffect(() => {
    if (dados) {
      setBuscaCliente(dados.cliente || "");
      setValor(dados.valor ? (typeof dados.valor === "number" ? formatCurrency(dados.valor) : maskCurrencyInput(dados.valor)) : "");
      setFormaPagamento("Pix");
      setObservacao("");
    } else {
      setBuscaCliente("");
      setValor("");
      setFormaPagamento("Pix");
      setObservacao("");
    }
  }, [dados, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const pacotePagamento = {
      cliente: buscaCliente,
      valorGasto: valor,
      metodoPagamento: formaPagamento,
      dataPagamento: new Date().toISOString().split("T")[0],
      observacao: observacao,
    };

    if (onSave) {
      onSave(pacotePagamento);
      toast.success("Pagamento confirmado!");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receber Pagamento">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* BUSCA DE CLIENTE */}
        <div className={FORM_STYLES.group + " relative"}>
          <label className={FORM_STYLES.label}>Nome da Cliente</label>
          <input
            type="text"
            placeholder="Digite o nome da cliente..."
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
            required
            className={FORM_STYLES.input}
          />
          {!dados && buscaCliente.trim().length >= 3 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto mt-1">
              {clientesCadastradas
                .filter((c) =>
                  c.nome.toLowerCase().includes(buscaCliente.toLowerCase()),
                )
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setBuscaCliente(c.nome)}
                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-sm font-medium text-slate-700"
                  >
                    {c.nome}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* VALOR COBRADO */}
        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Valor a Cobrar (R$)</label>
          <input
            type="text"
            placeholder="R$ 0,00"
            value={valor}
            onChange={(e) => setValor(maskCurrencyInput(e.target.value))}
            required
            className={FORM_STYLES.input + " font-bold text-lg text-[var(--cor-primaria)]"}
          />
        </div>

        {/* FORMA DE PAGAMENTO */}
        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Forma de Pagamento</label>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setFormaPagamento("Pix")}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer text-sm ${
                formaPagamento === "Pix"
                  ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm"
                  : "border border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <QrCode size={18} /> Pix
            </button>

            <button
              type="button"
              onClick={() => setFormaPagamento("Crédito")}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer text-sm ${
                formaPagamento === "Crédito"
                  ? "border-2 border-[var(--cor-primaria)] bg-slate-50 text-[var(--cor-primaria)] shadow-sm"
                  : "border border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <CreditCard size={18} /> Crédito
            </button>

            <button
              type="button"
              onClick={() => setFormaPagamento("Débito")}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer text-sm ${
                formaPagamento === "Débito"
                  ? "border-2 border-[var(--cor-primaria)] bg-slate-50 text-[var(--cor-primaria)] shadow-sm"
                  : "border border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <CreditCard size={18} /> Débito
            </button>

            <button
              type="button"
              onClick={() => setFormaPagamento("Dinheiro")}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer text-sm ${
                formaPagamento === "Dinheiro"
                  ? "border-2 border-amber-500 bg-amber-50 text-amber-600 shadow-sm"
                  : "border border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Banknote size={18} /> Dinheiro
            </button>
          </div>
        </div>

        {/* OBSERVAÇÃO */}
        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Observação (Opcional)</label>
          <textarea
            placeholder="Algum detalhe sobre esse pagamento?"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className={FORM_STYLES.textarea}
          />
        </div>

        <div className={FORM_STYLES.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700">
            Confirmar Recebimento
          </Button>
        </div>
      </form>
    </Modal>
  );
}
