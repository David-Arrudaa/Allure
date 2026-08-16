import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import "./ModalCliente.css";
import "../ModalAgendamento/ModalAgendamento.css";

export function ModalCliente({ isOpen, onClose }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aniversario, setAniversario] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      // Envia os dados para a tabela customers no Supabase
      const { error } = await supabase.from("customers").insert([
        {
          nome: nome.trim(),
          telefone: telefone.trim(),
          observacoes: observacoes.trim(),
          // Se sua tabela tiver coluna de aniversário, descomente a linha abaixo:
          // aniversario: aniversario || null
        },
      ]);

      if (error) throw error;

      alert(`Cliente ${nome} cadastrada com sucesso no banco de dados!`);

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
          <h2>Nova Cliente</h2>
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
              onChange={(e) => setNome(e.target.value)}
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
            {carregando ? "Salvando..." : "Salvar Cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
