import { useState, useEffect } from "react";
import { X, CreditCard, Banknote, QrCode } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import "./ModalPagamento.css";

const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

const parseMoedaParaNumero = (valor) => {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  const limpo = String(valor).replace(/\D/g, "");
  if (!limpo) return 0;
  return Number(limpo) / 100;
};

const aplicarMascaraMoeda = (valor) => {
  if (!valor) return "";
  const limpo = String(valor).replace(/\D/g, "");
  if (!limpo) return "";
  const numero = Number(limpo) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
};

export function ModalPagamento({ isOpen, onClose, dados, onSave }) {
  const { profile, user } = useAuth();
  const tenantId = profile?.tenant_id || user?.tenant_id;

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [observacao, setObservacao] = useState("");
  const [isSalvando, setIsSalvando] = useState(false);

  useEffect(() => {
    if (dados) {
      setBuscaCliente(dados.cliente || "");
      setClienteId(dados.clienteId || null);
      setValor(dados.valor ? (typeof dados.valor === "number" ? formatarMoeda(dados.valor) : aplicarMascaraMoeda(dados.valor)) : "");
      setFormaPagamento(dados.forma_pagamento || dados.forma || "Pix");
      setObservacao(dados.observacoes || "");
    } else {
      setBuscaCliente("");
      setClienteId(null);
      setValor("");
      setFormaPagamento("Pix");
      setObservacao("");
    }
  }, [dados, isOpen]);

  // Autocomplete real de clientes buscando no banco
  useEffect(() => {
    if (!isOpen || dados || buscaCliente.trim().length < 2) {
      setClientesEncontrados([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        let q = supabase
          .from("customers")
          .select("id, nome")
          .ilike("nome", `%${buscaCliente.trim()}%`)
          .limit(5);

        if (tenantId) q = q.eq("tenant_id", tenantId);
        const { data } = await q;
        setClientesEncontrados(data || []);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [buscaCliente, dados, isOpen, tenantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSalvando) return;
    setIsSalvando(true);

    try {
      const valorNum = parseMoedaParaNumero(valor);

      const pacotePagamento = {
        cliente: buscaCliente,
        clienteId: clienteId,
        valorGasto: valorNum,
        metodoPagamento: formaPagamento,
        dataPagamento: new Date().toISOString().split("T")[0],
        observacao: observacao,
      };

      if (onSave) {
        await onSave(pacotePagamento);
      }
    } finally {
      setIsSalvando(false);
    }
  };

  return (
    <div className="modal-pagamento-overlay" onClick={onClose}>
      <div className="modal-pagamento-box" onClick={(e) => e.stopPropagation()}>
        {/* CABEÇALHO */}
        <div className="modal-pagamento-header">
          <h2
            style={{
              margin: 0,
              fontSize: "1.25rem",
              color: "var(--cor-texto)",
            }}
          >
            Receber Pagamento
          </h2>
          <button
            className="btn-fechar-pagamento"
            onClick={onClose}
            title="Fechar"
            disabled={isSalvando}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-agendamento">
          {/* BUSCA DE CLIENTE */}
          <div className="form-grupo" style={{ position: "relative" }}>
            <label>Nome da Cliente</label>
            <input
              type="text"
              placeholder="Digite o nome da cliente..."
              value={buscaCliente}
              onChange={(e) => {
                setBuscaCliente(e.target.value);
                setClienteId(null);
              }}
              required
              disabled={isSalvando}
            />
            {!dados && buscaCliente.trim().length >= 2 && clientesEncontrados.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--cor-borda)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 10,
                  maxHeight: "160px",
                  overflowY: "auto",
                }}
              >
                {clientesEncontrados.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setBuscaCliente(c.nome);
                      setClienteId(c.id);
                      setClientesEncontrados([]);
                    }}
                    style={{
                      padding: "0.6rem 1rem",
                      cursor: "pointer",
                      borderBottom: "1px solid #F1F5F9",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>{c.nome}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VALOR COBRADO */}
          <div className="form-grupo" style={{ marginTop: "1rem" }}>
            <label>Valor a Cobrar (R$)</label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={valor}
              onChange={(e) => setValor(aplicarMascaraMoeda(e.target.value))}
              required
              disabled={isSalvando}
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "var(--cor-primaria)",
              }}
            />
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div className="form-grupo" style={{ marginTop: "1.5rem" }}>
            <label style={{ marginBottom: "10px", display: "block" }}>
              Forma de Pagamento
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setFormaPagamento("Pix")}
                disabled={isSalvando}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  border:
                    formaPagamento === "Pix"
                      ? "2px solid #10B981"
                      : "1px solid #CBD5E1",
                  backgroundColor:
                    formaPagamento === "Pix" ? "#ECFDF5" : "#FFFFFF",
                  color: formaPagamento === "Pix" ? "#10B981" : "#64748B",
                }}
              >
                <QrCode size={18} /> Pix
              </button>

              <button
                type="button"
                onClick={() => setFormaPagamento("Crédito")}
                disabled={isSalvando}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  border:
                    formaPagamento === "Crédito"
                      ? "2px solid var(--cor-primaria)"
                      : "1px solid #CBD5E1",
                  backgroundColor:
                    formaPagamento === "Crédito" ? "#F8FAFC" : "#FFFFFF",
                  color:
                    formaPagamento === "Crédito"
                      ? "var(--cor-primaria)"
                      : "#64748B",
                }}
              >
                <CreditCard size={18} /> Crédito
              </button>

              <button
                type="button"
                onClick={() => setFormaPagamento("Débito")}
                disabled={isSalvando}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  border:
                    formaPagamento === "Débito"
                      ? "2px solid var(--cor-primaria)"
                      : "1px solid #CBD5E1",
                  backgroundColor:
                    formaPagamento === "Débito" ? "#F8FAFC" : "#FFFFFF",
                  color:
                    formaPagamento === "Débito"
                      ? "var(--cor-primaria)"
                      : "#64748B",
                }}
              >
                <CreditCard size={18} /> Débito
              </button>

              <button
                type="button"
                onClick={() => setFormaPagamento("Dinheiro")}
                disabled={isSalvando}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  border:
                    formaPagamento === "Dinheiro"
                      ? "2px solid #F59E0B"
                      : "1px solid #CBD5E1",
                  backgroundColor:
                    formaPagamento === "Dinheiro" ? "#FFFBEB" : "#FFFFFF",
                  color: formaPagamento === "Dinheiro" ? "#F59E0B" : "#64748B",
                }}
              >
                <Banknote size={18} /> Dinheiro
              </button>
            </div>
          </div>

          {/* OBSERVAÇÃO */}
          <div className="form-grupo" style={{ marginTop: "1rem" }}>
            <label>Observação (Opcional)</label>
            <textarea
              placeholder="Algum detalhe sobre esse pagamento?"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={isSalvando}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--cor-borda)",
                fontFamily: "inherit",
                minHeight: "60px",
                resize: "none",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-salvar"
            disabled={isSalvando}
            style={{
              marginTop: "1.5rem",
              width: "100%",
              backgroundColor: "#10B981",
              color: "white",
              opacity: isSalvando ? 0.7 : 1,
            }}
          >
            {isSalvando ? "Confirmando..." : "Confirmar Recebimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
