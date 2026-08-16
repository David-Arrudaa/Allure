import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import "../ModalAgendamento/ModalAgendamento.css"; // Usa a mesma base visual

export function ModalServico({ isOpen, onClose, servico }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Preenche os inputs se for edição, limpa se for cadastro
  useEffect(() => {
    if (servico) {
      setNome(servico.nome || "");
      setPreco(servico.preco ? String(servico.preco).replace(".", ",") : "");
    } else {
      setNome("");
      setPreco("");
    }
  }, [servico, isOpen]);

  if (!isOpen) return null;

  // Deixa a primeira letra de cada palavra maiúscula (Ex: Spa Dos Pés)
  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      // Converte a vírgula para ponto pro banco de dados não dar erro matemático
      const precoNumerico = Number(preco.replace(",", "."));

      const dadosServico = {
        nome: nome.trim(),
        preco: precoNumerico,
      };

      if (servico && servico.id) {
        // MODO EDIÇÃO
        const { error } = await supabase
          .from("servicos")
          .update(dadosServico)
          .eq("id", servico.id);

        if (error) throw error;
      } else {
        // MODO NOVO CADASTRO
        const { error } = await supabase
          .from("servicos")
          .insert([dadosServico]);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error.message);
      alert(`Erro ao salvar serviço: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "450px" }}
      >
        <div
          className="modal-header"
          style={{
            marginBottom: "1.2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
            {servico ? "Editar Serviço" : "Novo Serviço"}
          </h2>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-agendamento">
          <div className="form-grupo">
            <label>Nome do Serviço *</label>
            <input
              type="text"
              placeholder="Ex: Escova Modeladora"
              value={nome}
              onChange={(e) => setNome(formatarNome(e.target.value))}
              required
            />
          </div>

          <div className="form-grupo" style={{ marginTop: "1rem" }}>
            <label>Valor (R$) *</label>
            <input
              type="text"
              placeholder="Ex: 80,00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-salvar"
            style={{ marginTop: "1.5rem" }}
            disabled={carregando}
          >
            {carregando
              ? "Salvando..."
              : servico
                ? "Salvar Alterações"
                : "Salvar Serviço"}
          </button>
        </form>
      </div>
    </div>
  );
}
