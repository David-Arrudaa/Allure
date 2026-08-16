import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { ModalServico } from "../components/ModalServico";
import { supabase } from "../services/supabase";
import "./Servicos.css";

export function Servicos() {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  // Novos estados para o banco de dados
  const [servicos, setServicos] = useState([]);
  const [servicoEditando, setServicoEditando] = useState(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState(null);

  // Busca os serviços direto do Supabase
  const buscarServicos = async () => {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      if (data) setServicos(data);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error.message);
    }
  };

  // Roda a busca assim que a tela abre
  useEffect(() => {
    buscarServicos();
  }, []);

  // Função para deletar o serviço do banco
  const confirmarExclusao = async () => {
    if (!servicoParaExcluir) return;

    try {
      const { error } = await supabase
        .from("servicos")
        .delete()
        .eq("id", servicoParaExcluir.id);

      if (error) throw error;

      setServicoParaExcluir(null);
      buscarServicos(); // Atualiza a tabela
    } catch (error) {
      console.error("Erro ao excluir serviço:", error.message);
      alert(
        "Não foi possível excluir. Este serviço pode estar vinculado a algum agendamento do histórico.",
      );
    }
  };

  // Filtro instantâneo
  const servicosFiltrados = servicos.filter((servico) =>
    servico.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="servicos-container">
      <div className="servicos-topbar">
        <div className="servicos-info">
          <h2>Gestão de Serviços</h2>
          <p>Cadastre e ajuste os valores dos serviços do salão</p>
        </div>

        <button
          className="btn-novo"
          onClick={() => {
            setServicoEditando(null); // Garante que abra o modal limpo
            setModalAberto(true);
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Novo Serviço
        </button>
      </div>

      <div className="servicos-conteudo">
        <div className="servicos-filtros">
          <div className="busca-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar serviço por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="tabela-container">
          <table className="tabela-servicos">
            <thead>
              <tr>
                <th>Nome do Serviço</th>
                <th>Valor (R$)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicosFiltrados.length > 0 ? (
                servicosFiltrados.map((servico) => (
                  <tr key={servico.id}>
                    <td>
                      <strong>{servico.nome}</strong>
                    </td>
                    {/* Formata o preço com vírgula */}
                    <td>R$ {String(servico.preco).replace(".", ",")}</td>
                    <td>
                      <div className="acoes-tabela">
                        <button
                          className="btn-acao editar"
                          title="Editar Serviço"
                          onClick={() => {
                            setServicoEditando(servico);
                            setModalAberto(true);
                          }}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="btn-acao excluir"
                          title="Excluir Serviço"
                          onClick={() => setServicoParaExcluir(servico)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#94A3B8",
                    }}
                  >
                    Nenhum serviço encontrado com a busca "{busca}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Janela Modal conectada ao estado de edição */}
      <ModalServico
        isOpen={modalAberto}
        servico={servicoEditando}
        onClose={() => {
          setModalAberto(false);
          setServicoEditando(null);
          buscarServicos(); // Recarrega a tabela ao salvar/fechar
        }}
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {servicoParaExcluir && (
        <div
          className="modal-overlay"
          onClick={() => setServicoParaExcluir(null)}
        >
          <div
            className="modal-box modal-exclusao"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                color: "#1E293B",
                marginBottom: "0.5rem",
              }}
            >
              Confirmar Exclusão
            </h3>
            <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
              Tem certeza que deseja apagar o serviço{" "}
              <strong>{servicoParaExcluir.nome}</strong> do sistema?
            </p>
            <div className="modal-exclusao-acoes">
              <button
                className="btn-cancelar"
                onClick={() => setServicoParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-exclusao"
                onClick={confirmarExclusao}
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
