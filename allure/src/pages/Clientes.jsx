import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ClipboardList } from "lucide-react";
import { ModalCliente } from "../components/ModalCliente";
import { ModalHistorico } from "../components/ModalHistorico";
import { supabase } from "../services/supabase";
import "./Clientes.css";

export function Clientes() {
  const [busca, setBusca] = useState("");

  // Estados dos modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  // Estados de ação (quem está sendo editado/excluído/visualizado)
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteParaHistorico, setClienteParaHistorico] = useState(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

  // Lista de clientes vinda do banco de dados
  const [clientes, setClientes] = useState([]);

  // Função para buscar os dados reais no Supabase, incluindo os agendamentos para a "Última Visita"
  const buscarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, nome, telefone, appointments(data_horario, status)")
        .order("nome", { ascending: true });

      if (error) throw error;

      if (data) {
        const listaFormatada = data.map((item) => {
          // Calcula a data da Última Visita baseada nos agendamentos passados
          let ultimaVisitaStr = "A definir";
          if (item.appointments && item.appointments.length > 0) {
            const hoje = new Date();
            const passados = item.appointments
              .filter(
                (a) =>
                  new Date(a.data_horario) <= hoje &&
                  a.status !== "cancelado" &&
                  a.status !== "bloqueio",
              )
              .map((a) => new Date(a.data_horario));

            if (passados.length > 0) {
              const maxDate = new Date(Math.max(...passados));
              ultimaVisitaStr = `${String(maxDate.getDate()).padStart(2, "0")}/${String(maxDate.getMonth() + 1).padStart(2, "0")}/${maxDate.getFullYear()}`;
            }
          }

          return {
            id: item.id,
            nome: item.nome,
            telefone: item.telefone || "Não informado",
            ultimaVisita: ultimaVisitaStr,
          };
        });
        setClientes(listaFormatada);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error.message);
    }
  };

  useEffect(() => {
    buscarClientes();
  }, []);

  // FUNÇÃO PARA EXCLUIR CLIENTE
  const confirmarExclusao = async () => {
    if (!clienteParaExcluir) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", clienteParaExcluir.id);

      if (error) throw error;

      setClienteParaExcluir(null);
      buscarClientes(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao excluir cliente:", error.message);
      alert(
        "Não foi possível excluir. Esta cliente pode ter agendamentos ou pagamentos vinculados a ela.",
      );
    }
  };

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

        <button
          className="btn-novo"
          onClick={() => {
            setClienteEditando(null); // Garante que abra vazio para um novo cadastro
            setModalAberto(true);
          }}
        >
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
                          onClick={() => {
                            setClienteEditando(cliente);
                            setModalAberto(true);
                          }}
                        >
                          <Edit2 size={18} />
                        </button>

                        <button
                          className="btn-acao excluir"
                          title="Excluir Cliente"
                          onClick={() => setClienteParaExcluir(cliente)}
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

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <ModalCliente
        isOpen={modalAberto}
        cliente={clienteEditando} // Passa o cliente para o modal (se for edição)
        onClose={() => {
          setModalAberto(false);
          setClienteEditando(null); // Limpa o estado ao fechar
          buscarClientes(); // Atualiza a tabela ao fechar o modal
        }}
      />

      {/* MODAL DE HISTÓRICO */}
      <ModalHistorico
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
        cliente={clienteParaHistorico}
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {clienteParaExcluir && (
        <div
          className="modal-overlay"
          onClick={() => setClienteParaExcluir(null)}
        >
          <div
            className="modal-box modal-exclusao"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirmar Exclusão</h3>
            <p>
              Tem certeza que deseja apagar a cliente{" "}
              <strong>{clienteParaExcluir.nome}</strong> da sua base de dados?
            </p>
            <div className="modal-exclusao-acoes">
              <button
                className="btn-cancelar"
                onClick={() => setClienteParaExcluir(null)}
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
