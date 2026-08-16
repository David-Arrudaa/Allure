import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ClipboardList } from "lucide-react";
import { ModalCliente } from "../components/ModalCliente";
import { ModalHistorico } from "../components/ModalHistorico";
import { supabase } from "../services/supabase";
import "./Clientes.css";

export function Clientes() {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [clienteParaHistorico, setClienteParaHistorico] = useState(null);

  // Lista de clientes vinda do banco de dados
  const [clientes, setClientes] = useState([]);

  // Função para buscar os dados reais no Supabase
  const buscarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;

      if (data) {
        const listaFormatada = data.map((item) => ({
          id: item.id,
          nome: item.nome,
          telefone: item.telefone || "Não informado",
          ultimaVisita: "A definir",
        }));
        setClientes(listaFormatada);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error.message);
    }
  };

  useEffect(() => {
    buscarClientes();
  }, []);

  // Filtra a lista com base na busca (por nome ou telefone)
  const clientesFiltrados = clientes.filter(
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

        <button className="btn-novo" onClick={() => setModalAberto(true)}>
          <Plus size={18} strokeWidth={2.5} />
          Nova Cliente
        </button>
      </div>

      <div className="clientes-conteudo">
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
                          onClick={() => {
                            setClienteParaHistorico(cliente);
                            setModalHistoricoAberto(true);
                          }}
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

      <ModalCliente
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          buscarClientes(); // Atualiza a tabela ao fechar o modal de cadastro
        }}
      />

      <ModalHistorico
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
        cliente={clienteParaHistorico}
      />
    </div>
  );
}
