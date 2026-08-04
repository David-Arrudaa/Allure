import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { ModalServico } from "../components/ModalServico";
import "./Servicos.css";

export function Servicos() {
  // Estado para capturar o que for digitado na barra de pesquisa
  const [busca, setBusca] = useState("");

  // Memória para controlar o modal de serviço
  const [modalAberto, setModalAberto] = useState(false);

  // Tabela simulada de Serviços (Focada apenas no nome e valor)
  const servicosMock = [
    { id: 1, nome: "Corte Feminino", preco: "80,00" },
    { id: 2, nome: "Escova Modeladora", preco: "50,00" },
    { id: 3, nome: "Manutenção em Gel", preco: "120,00" },
    { id: 4, nome: "Spa dos Pés", preco: "50,00" },
    { id: 5, nome: "Manicure e Pedicure", preco: "65,00" },
  ];

  // Filtro de busca instantâneo
  const servicosFiltrados = servicosMock.filter((servico) =>
    servico.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="servicos-container">
      <div className="servicos-topbar">
        <div className="servicos-info">
          <h2>Gestão de Serviços</h2>
          <p>Cadastre e ajuste os valores dos serviços do salão</p>
        </div>

        {/* Botão atualizado para abrir o modal */}
        <button className="btn-novo" onClick={() => setModalAberto(true)}>
          <Plus size={18} strokeWidth={2.5} />
          Novo Serviço
        </button>
      </div>

      <div className="servicos-conteudo">
        {/* Barra de Pesquisa */}
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

        {/* Tabela de Listagem */}
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
                    <td>R$ {servico.preco}</td>
                    <td>
                      <div className="acoes-tabela">
                        <button
                          className="btn-acao editar"
                          title="Editar Serviço"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="btn-acao excluir"
                          title="Excluir Serviço"
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

      {/* Janela Modal controlada pelo estado */}
      <ModalServico
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
