import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, ClipboardList } from "lucide-react";
import "./Clientes.css";

export function Clientes() {
  // Estado para capturar o que for digitado na barra de pesquisa
  const [busca, setBusca] = useState("");

  // Tabela simulada de Clientes (os mesmos dados que usamos no Modal)
  const clientesMock = [
    {
      id: 1,
      nome: "Juliana Costa",
      telefone: "(15) 99999-1111",
      ultimaVisita: "15/08/2026",
    },
    {
      id: 2,
      nome: "Camila Mendes",
      telefone: "(15) 99999-2222",
      ultimaVisita: "10/08/2026",
    },
    {
      id: 3,
      nome: "Amanda Reis",
      telefone: "(15) 99999-3333",
      ultimaVisita: "02/08/2026",
    },
    {
      id: 4,
      nome: "Mariana Souza",
      telefone: "(15) 99999-4444",
      ultimaVisita: "20/07/2026",
    },
  ];

  // Filtra a lista instantaneamente com base na busca (por nome ou telefone)
  const clientesFiltrados = clientesMock.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      cliente.telefone.includes(busca),
  );

  return (
    <div className="clientes-container">
      <div className="clientes-topbar">
        <div className="clientes-info">
          <h2>Gestão de Clientes</h2>
          <p>Visualize e gerencie as clientes do salão</p>
        </div>

        <button className="btn-novo">
          <Plus size={18} strokeWidth={2.5} />
          Nova Cliente
        </button>
      </div>

      <div className="clientes-conteudo">
        {/* Barra de Pesquisa */}
        <div className="clientes-filtros">
          <div className="busca-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Listagem */}
        <div className="tabela-container">
          <table className="tabela-clientes">
            <thead>
              <tr>
                <th>Nome da Cliente</th>
                <th>Telefone</th>
                <th>Última Visita</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Se a busca encontrou resultados, desenha as linhas */}
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <strong>{cliente.nome}</strong>
                    </td>
                    <td>{cliente.telefone}</td>
                    <td>{cliente.ultimaVisita}</td>
                    <td>
                      <div className="acoes-tabela">
                        <button
                          className="btn-acao historico"
                          title="Ver Histórico"
                        >
                          <ClipboardList size={18} />
                        </button>
                        <button
                          className="btn-acao editar"
                          title="Editar Cliente"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="btn-acao excluir"
                          title="Excluir Cliente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Se não encontrou nada na busca, exibe esta mensagem */
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#94A3B8",
                    }}
                  >
                    Nenhuma cliente encontrada com a busca "{busca}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
