import React, { useState, useEffect } from "react";
import { X, CreditCard, Banknote, QrCode } from "lucide-react";
import { supabase } from "../../../services/supabase";
import "./ModalPagamento.css";

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
      setValor(dados.valor || "");
      setFormaPagamento("Pix");
      setObservacao("");
    } else {
      setBuscaCliente("");
      setValor("");
      setFormaPagamento("Pix");
      setObservacao("");
    }
  }, [dados, isOpen]);

  if (!isOpen) return null;

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
              onChange={(e) => setBuscaCliente(e.target.value)}
              required
            />
            {!dados && buscaCliente.trim().length >= 3 && (
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
                }}
              >
                {clientesCadastradas
                  .filter((c) =>
                    c.nome.toLowerCase().includes(buscaCliente.toLowerCase()),
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setBuscaCliente(c.nome)}
                      style={{
                        padding: "0.6rem 1rem",
                        cursor: "pointer",
                        borderBottom: "1px solid #F1F5F9",
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
              placeholder="Ex: 65,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
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
            style={{
              marginTop: "1.5rem",
              width: "100%",
              backgroundColor: "#10B981",
              color: "white",
            }}
          >
            Confirmar Recebimento
          </button>
        </form>
      </div>
    </div>
  );
}
