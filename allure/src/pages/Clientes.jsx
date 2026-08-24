import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, ClipboardList } from "lucide-react";
import { ModalCliente } from "../components/domain/ModalCliente";
import { ModalHistorico } from "../components/domain/ModalHistorico";
import { Skeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { useClientes } from "../hooks/useClientes";
import "./Clientes.css";

export function Clientes() {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteParaHistorico, setClienteParaHistorico] = useState(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 25;

  const { clientes, totalClientes, isLoading, excluirCliente, isSalvando } = useClientes(paginaAtual, itensPorPagina, busca);

  const handleBuscaChange = (e) => {
    setBusca(e.target.value);
    setPaginaAtual(1);
  };

  const confirmarExclusao = async () => {
    if (!clienteParaExcluir) return;
    try {
      await excluirCliente(clienteParaExcluir.id);
      setClienteParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      alert("Não foi possível excluir esta cliente.");
    }
  };

  const totalPaginas = Math.ceil(totalClientes / itensPorPagina) || 1;

  return (
    <div className="clientes-container">
      <div className="clientes-topbar">
        <div className="clientes-info">
          <h2>Gestão de Clientes</h2>
          <p>
            {isLoading ? (
              <Skeleton width="200px" height="16px" />
            ) : (
              `Visualize e gerencie as clientes do salão (${totalClientes} cadastradas)`
            )}
          </p>
        </div>

        <button
          className="btn-novo"
          onClick={() => {
            setClienteEditando(null);
            setModalAberto(true);
          }}
          disabled={isLoading}
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
              placeholder="Buscar por nome..."
              value={busca}
              onChange={handleBuscaChange}
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
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((item) => (
                  <tr key={`skel-${item}`}>
                    <td>
                      <Skeleton width="60%" height="20px" />
                    </td>
                    <td>
                      <Skeleton width="110px" height="20px" />
                    </td>
                    <td>
                      <Skeleton width="90px" height="20px" />
                    </td>
                    <td>
                      <div
                        className="acoes-tabela"
                        style={{ display: "flex", gap: "6px" }}
                      >
                        <Skeleton
                          width="32px"
                          height="32px"
                          borderRadius="6px"
                        />
                        <Skeleton
                          width="32px"
                          height="32px"
                          borderRadius="6px"
                        />
                        <Skeleton
                          width="32px"
                          height="32px"
                          borderRadius="6px"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : clientes.length > 0 ? (
                clientes.map((cliente) => (
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
                    {busca.length > 0 && busca.length < 3
                      ? "Digite pelo menos 3 letras para buscar..."
                      : `Nenhuma cliente encontrada com a busca "${busca}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && totalPaginas > 1 && (
          <Pagination
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            totalPaginas={totalPaginas}
            totalItems={totalClientes}
          />
        )}
      </div>

      <ModalCliente
        isOpen={modalAberto}
        cliente={clienteEditando}
        onClose={() => {
          setModalAberto(false);
          setClienteEditando(null);
        }}
      />

      <ModalHistorico
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
        cliente={clienteParaHistorico}
      />

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
              <strong>{clienteParaExcluir.nome}</strong>?
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
                disabled={isSalvando}
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
