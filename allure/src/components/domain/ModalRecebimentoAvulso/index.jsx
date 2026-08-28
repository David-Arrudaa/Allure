import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../../../services/supabase";
import { useTenant } from "../../../contexts/TenantContext";
import { useAuth } from "../../../contexts/AuthContext";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { maskCurrencyInput, parseCurrencyToNumber } from "../../../utils/masks";
import { FORM_STYLES } from "../../../config/theme";

export function ModalRecebimentoAvulso({ isOpen, onClose, onSave }) {
  const { tenant } = useTenant();
  const { user, profile } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSaving, setIsSaving] = useState(false);

  // Busca e seleção de Cliente
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesBanco, setClientesBanco] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [isBuscandoCliente, setIsBuscandoCliente] = useState(false);
  const [digitandoCliente, setDigitandoCliente] = useState(false);

  useEffect(() => {
    if (isOpen && tenant?.id) {
      carregarProdutos();
      setProdutoSelecionado("");
      setValor("");
      setFormaPagamento("Pix");
      setDataRecebimento(new Date().toISOString().split("T")[0]);
      setBuscaCliente("");
      setClienteSelecionado(null);
      setClientesBanco([]);
      setDigitandoCliente(false);
    }
  }, [isOpen, tenant]);

  // Autocomplete de Clientes com debounce
  useEffect(() => {
    if (!isOpen || !digitandoCliente || buscaCliente.trim().length < 2) {
      setClientesBanco([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsBuscandoCliente(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, nome, telefone")
          .ilike("nome", `%${buscaCliente.trim()}%`)
          .limit(5);

        if (!error && data) {
          setClientesBanco(data);
        }
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      } finally {
        setIsBuscandoCliente(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaCliente, digitandoCliente, isOpen]);

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase.from("produtos").select("*").eq("tenant_id", tenant.id);
      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error.message);
    }
  };

  const handleProdutoChange = (e) => {
    const prodId = e.target.value;
    setProdutoSelecionado(prodId);

    const produtoEncontrado = produtos.find(p => p.id === prodId || p.id === Number(prodId));
    if (produtoEncontrado) {
      const precoNumerico = Number(produtoEncontrado.preco || 0);
      setValor(maskCurrencyInput(Math.round(precoNumerico * 100)));
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (isSaving || !tenant?.id) return;
    setIsSaving(true);

    try {
      const produtoObj = produtos.find(p => p.id === produtoSelecionado || p.id === Number(produtoSelecionado));
      const nomeServico = produtoObj ? `Venda: ${produtoObj.nome}` : "Recebimento Avulso";
      const valorFormatado = parseCurrencyToNumber(valor);
      const profissionalId = profile?.id || user?.id;
      const customerId = clienteSelecionado ? clienteSelecionado.id : null;

      const { error } = await supabase.from("appointments").insert([{
        servico: nomeServico,
        valor: valorFormatado,
        data_horario: `${dataRecebimento}T12:00:00-03:00`,
        status: "confirmado",
        pagamento: "pago",
        forma_pagamento: formaPagamento,
        duracao: 0,
        tenant_id: tenant.id,
        profissional_id: profissionalId,
        customer_id: customerId,
      }]);

      if (error) throw error;

      if (produtoObj) {
        await supabase.from("produtos")
          .update({ estoque: Math.max(0, produtoObj.estoque - 1) })
          .eq("id", produtoObj.id)
          .eq("tenant_id", tenant.id);
      }

      toast.success("Venda registrada com sucesso!");
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar recebimento:", error.message);
      toast.error("Erro ao salvar recebimento.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recebimento Avulso (Venda)">
      <form onSubmit={handleSalvar} className="space-y-5 pb-6">
        {/* BUSCA DE CLIENTE (OPCIONAL/PESQUISÁVEL) */}
        <div className="flex flex-col gap-2 relative">
          <label className={FORM_STYLES.label}>Cliente (Opcional)</label>
          <input
            type="text"
            placeholder="Buscar por nome da cliente..."
            value={clienteSelecionado ? clienteSelecionado.nome : buscaCliente}
            onFocus={() => {
              if (buscaCliente.trim().length >= 2) setDigitandoCliente(true);
            }}
            onBlur={() => {
              setTimeout(() => setDigitandoCliente(false), 200);
            }}
            onChange={(e) => {
              setDigitandoCliente(true);
              setBuscaCliente(e.target.value);
              setClienteSelecionado(null);
            }}
            className={FORM_STYLES.input}
          />

          {digitandoCliente && buscaCliente.trim().length >= 2 && !clienteSelecionado && (
            <div
              className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto mt-1"
              onMouseDown={(e) => e.preventDefault()}
            >
              {isBuscandoCliente ? (
                <div className="p-3 text-xs text-slate-500 text-center italic">
                  Buscando clientes...
                </div>
              ) : clientesBanco.length > 0 ? (
                clientesBanco.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClienteSelecionado(c);
                      setBuscaCliente(c.nome);
                      setClientesBanco([]);
                      setDigitandoCliente(false);
                    }}
                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-xs text-slate-700 font-medium"
                  >
                    <strong>{c.nome}</strong> {c.telefone ? `- ${c.telefone}` : ""}
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-slate-500 text-center italic">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          )}
        </div>

        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Produto</label>
          <select
            value={produtoSelecionado}
            onChange={handleProdutoChange}
            required
            className={FORM_STYLES.select}
          >
            <option value="" disabled>Selecione um produto...</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className={FORM_STYLES.row}>
          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Valor (R$)</label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={valor}
              onChange={e => setValor(maskCurrencyInput(e.target.value))}
              required
              className={FORM_STYLES.input}
            />
          </div>
          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Data</label>
            <input
              type="date"
              value={dataRecebimento}
              onChange={e => setDataRecebimento(e.target.value)}
              required
              className={FORM_STYLES.input}
            />
          </div>
        </div>

        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Forma de Pagamento</label>
          <select
            value={formaPagamento}
            onChange={e => setFormaPagamento(e.target.value)}
            required
            className={FORM_STYLES.select}
          >
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
          </select>
        </div>

        <div className={FORM_STYLES.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Recebimento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
