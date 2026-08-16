import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import "./ModalCliente.css";
import "../ModalAgendamento/ModalAgendamento.css";

export function ModalCliente({ isOpen, onClose, cliente }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aniversario, setAniversario] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Preenche os campos se for edição, ou limpa se for um novo cadastro
  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome || "");
      setTelefone(
        cliente.telefone && cliente.telefone !== "Não informado"
          ? cliente.telefone
          : "",
      );
      setAniversario(cliente.aniversario || "");
      setObservacoes(cliente.observacoes || "");
    } else {
      setNome("");
      setTelefone("");
      setAniversario("");
      setObservacoes("");
    }
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  // Função para formatar o nome: "david arruda" vira "David Arruda"
  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const dadosCliente = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        observacoes: observacoes.trim(),
        // Se sua tabela tiver coluna de aniversário, descomente a linha abaixo:
        // aniversario: aniversario || null
      };

      if (cliente && cliente.id) {
        // MODO EDIÇÃO
        const { error } = await supabase
          .from("customers")
          .update(dadosCliente)
          .eq("id", cliente.id);

        if (error) throw error;
        // alert(`Cliente ${nome} atualizada com sucesso!`); // Opcional
      } else {
        // MODO CADASTRO
        const { error } = await supabase
          .from("customers")
          .insert([dadosCliente]);

        if (error) throw error;
        // alert(`Cliente ${nome} cadastrada com sucesso!`); // Opcional
      }

      // Limpa os campos e fecha
      setNome("");
      setTelefone("");
      setAniversario("");
      setObservacoes("");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error.message);
      alert(`Erro ao salvar cliente: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cliente ? "Editar Cliente" : "Nova Cliente"}</h2>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-cliente">
          <div className="form-grupo">
            <label>Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Mariana Souza"
              value={nome}
              onChange={(e) => setNome(formatarNome(e.target.value))} // Aplica a formatação em tempo real
              required
            />
          </div>

          <div className="form-linha-dupla">
            <div className="form-grupo">
              <label>Telefone (WhatsApp) *</label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>

            <div className="form-grupo">
              <label>Data de Nascimento</label>
              <input
                type="date"
                value={aniversario}
                onChange={(e) => setAniversario(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grupo">
            <label>Observações (Alergias, preferências, etc)</label>
            <textarea
              placeholder="Digite aqui informações importantes sobre a cliente..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-salvar"
            style={{ marginTop: "1rem" }}
            disabled={carregando}
          >
            {carregando
              ? "Salvando..."
              : cliente
                ? "Salvar Alterações"
                : "Salvar Cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
