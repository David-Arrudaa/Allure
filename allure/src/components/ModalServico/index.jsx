import React, { useState } from "react";
import { X } from "lucide-react";
import "./ModalServico.css";
// Reaproveitamos a base visual do primeiro modal
import "../ModalAgendamento/ModalAgendamento.css";

export function ModalServico({ isOpen, onClose }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ nome, preco });
    alert(`Serviço ${nome} cadastrado com sucesso!`);

    // Limpa os campos e fecha
    setNome("");
    setPreco("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Serviço</h2>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-servico">
          <div className="form-grupo">
            <label>Nome do Serviço *</label>
            <input
              type="text"
              placeholder="Ex: Manicure e Pedicure"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-grupo">
            <label>Valor (R$) *</label>
            <input
              type="text"
              placeholder="Ex: 65,00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-salvar"
            style={{ marginTop: "1rem" }}
          >
            Salvar Serviço
          </button>
        </form>
      </div>
    </div>
  );
}
