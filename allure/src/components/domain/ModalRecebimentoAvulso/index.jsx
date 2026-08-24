import { useState, useEffect } from "react";
import { X, Save, ShoppingBag } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { useTenant } from "../../../contexts/TenantContext";
import CurrencyInput from "react-currency-input-field";
import "./ModalRecebimentoAvulso.css"; // Create this file next

export function ModalRecebimentoAvulso({ isOpen, onClose, onSave }) {
  const { tenant } = useTenant();
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && tenant?.id) {
      carregarProdutos();
      setProdutoSelecionado("");
      setValor("");
      setFormaPagamento("Pix");
      setDataRecebimento(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, tenant]);

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
      setValor(String(produtoEncontrado.preco || "0.00").replace(".", ","));
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (isSaving || !tenant?.id) return;
    setIsSaving(true);

    try {
      const produtoObj = produtos.find(p => p.id === produtoSelecionado || p.id === Number(produtoSelecionado));
      const nomeServico = produtoObj ? `Venda: ${produtoObj.nome}` : "Recebimento Avulso";
      
      const valorFormatado = Number(valor.replace(",", "."));

      const { error } = await supabase.from("appointments").insert([{
        servico: nomeServico,
        valor: valorFormatado,
        data_horario: `${dataRecebimento}T12:00:00-03:00`,
        status: "confirmado",
        pagamento: "pago",
        forma_pagamento: formaPagamento,
        duracao: 0,
        tenant_id: tenant.id
        // profissional_id: null? might be better to set to a default or leave null if allowed
      }]);

      if (error) throw error;

      if (produtoObj) {
        // Baixar o estoque do produto
        await supabase.from("produtos")
          .update({ estoque: Math.max(0, produtoObj.estoque - 1) })
          .eq("id", produtoObj.id)
          .eq("tenant_id", tenant.id);
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar recebimento:", error.message);
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box recebimento-box">
        <div className="modal-header">
          <h2>Recebimento Avulso (Venda)</h2>
          <button className="btn-fechar" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSalvar} className="form-recebimento">
          <div className="form-grupo">
            <label>Produto</label>
            <select value={produtoSelecionado} onChange={handleProdutoChange} required>
              <option value="" disabled>Selecione um produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-linha-dupla">
            <div className="form-grupo">
              <label>Valor (R$)</label>
              <CurrencyInput
                id="valor"
                name="valor"
                placeholder="Ex: 50,00"
                decimalsLimit={2}
                decimalSeparator=","
                groupSeparator="."
                prefix="R$ "
                value={valor}
                onValueChange={(val) => setValor(val || "")}
                required
              />
            </div>
            <div className="form-grupo">
              <label>Data</label>
              <input
                type="date"
                value={dataRecebimento}
                onChange={e => setDataRecebimento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grupo">
            <label>Forma de Pagamento</label>
            <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} required>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancelar" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button type="submit" className="btn-salvar" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Recebimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
