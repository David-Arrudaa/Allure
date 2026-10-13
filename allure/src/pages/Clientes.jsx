import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, ClipboardList } from "lucide-react";
import { ModalCliente } from "../components/domain/ModalCliente";
import { ModalHistorico } from "../components/domain/ModalHistorico";
import { Skeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { useClientes } from "../hooks/useClientes";
import { MessageCircle } from "lucide-react";
import "./Clientes.css";

export function Clientes() {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteParaHistorico, setClienteParaHistorico] = useState(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroInatividade, setFiltroInatividade] = useState("");
  const itensPorPagina = 25;

  const { clientes, totalClientes, isLoading, excluirCliente, isSalvando } = useClientes(
    paginaAtual,
    itensPorPagina,
    busca,
    filtroInatividade
  );

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
        <div className="clientes-filtros flex flex-wrap gap-2 mb-4">
          <div className="busca-container flex-1 min-w-[200px]">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={handleBuscaChange}
            />
          </div>
          <select
            className="p-2 border border-slate-300 rounded-lg text-sm text-slate-600 bg-white"
            value={filtroInatividade}
            onChange={(e) => {
              setFiltroInatividade(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="">Todas</option>
            <option value="ausentes_30">Ausentes +30 dias</option>
            <option value="ausentes_60">Risco (+60 dias)</option>
          </select>
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
                        {cliente.telefone && cliente.telefone !== "Não informado" && (
                          <button
                            className="btn-acao bg-green-50 text-green-600 hover:bg-green-100"
                            title="WhatsApp"
                            onClick={() => {
                              const tel = cliente.telefone.replace(/\D/g, "");
                              const msg = encodeURIComponent(`Oi ${cliente.nome}, sentimos sua falta! Que tal renovar o visual essa semana?`);
                              window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
                            }}
                          >
                            <MessageCircle size={18} />
                          </button>
                        )}
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
                      color: "#64748b",
                    }}
                  >
                    {!busca.trim() ? (
                      <div>
                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>
                          Você ainda não tem nenhuma cliente cadastrada.
                        </p>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                          Toque em <strong>Nova Cliente</strong> no topo para começar.
                        </p>
                      </div>
                    ) : busca.length < 3 ? (
                      "Digite pelo menos 3 letras para buscar..."
                    ) : (
                      `Nenhuma cliente encontrada para "${busca}".`
                    )}
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
