import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ModalCliente } from "../components/ModalCliente";
import { ModalHistorico } from "../components/ModalHistorico";
import { supabase } from "../services/supabase";
import { Skeleton } from "../components/ui/Skeleton";
import "./Clientes.css";

export function Clientes() {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteParaHistorico, setClienteParaHistorico] = useState(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

  const [clientes, setClientes] = useState([]);

  // <-- CRIAMOS O ESTADO DE CARREGAMENTO AQUI -->
  const [isLoading, setIsLoading] = useState(true);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 25;
  const [totalClientes, setTotalClientes] = useState(0);

  useEffect(() => {
    async function carregarClientes() {
      // Começamos avisando que a tela vai carregar
      setIsLoading(true);

      try {
        let countQuery = supabase
          .from("customers")
          .select("*", { count: "exact", head: true });
        if (busca.trim().length > 0) {
          countQuery = countQuery.ilike("nome", `%${busca.trim()}%`);
        }
        const { count } = await countQuery;
        setTotalClientes(count || 0);

        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina - 1;

        let query = supabase
          .from("customers")
          .select("id, nome, telefone, appointments(data_horario, status)")
          .order("nome", { ascending: true })
          .range(inicio, fim);

        if (busca.trim().length > 0) {
          query = query.ilike("nome", `%${busca.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const listaFormatada = data.map((item) => {
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
              nome: item.nome || "Cliente sem nome",
              telefone: item.telefone || "Não informado",
              ultimaVisita: ultimaVisitaStr,
            };
          });
          setClientes(listaFormatada);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Erro ao buscar clientes:", error.message);
      } finally {
        // Ao terminar (com sucesso ou erro), desligamos o carregamento
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      carregarClientes();
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, paginaAtual]);

  const handleBuscaChange = (e) => {
    setBusca(e.target.value);
    setPaginaAtual(1);
  };

  const confirmarExclusao = async () => {
    if (!clienteParaExcluir) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", clienteParaExcluir.id);

      if (error) throw error;

      setClienteParaExcluir(null);
      setBusca("");
      setPaginaAtual(1);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error.message);
      alert("Não foi possível excluir esta cliente.");
    }
  };

  const totalPaginas = Math.ceil(totalClientes / itensPorPagina) || 1;

  return (
    <div className="clientes-container">
      <div className="clientes-topbar">
        <div className="clientes-info">
          <h2>Gestão de Clientes</h2>
          {/* Escondemos a contagem enquanto carrega para não piscar um "0" falso */}
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
          disabled={isLoading} // Desabilita o botão enquanto carrega
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
              disabled={isLoading} // Trava a busca enquanto carrega
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
              {/* ========================================================= */}
              {/* MÁGICA DOS SKELETONS - TABELA FANTASMA                   */}
              {/* ========================================================= */}
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
                    Nenhuma cliente encontrada com a busca "{busca}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Esconde a paginação enquanto estiver carregando */}
        {!isLoading && totalPaginas > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 0",
            }}
          >
            <span style={{ fontSize: "0.9rem", color: "#64748B" }}>
              Página <strong>{paginaAtual}</strong> de{" "}
              <strong>{totalPaginas}</strong> ({totalClientes} registros)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: paginaAtual === 1 ? "#F1F5F9" : "#FFFFFF",
                  color: paginaAtual === 1 ? "#94A3B8" : "#334155",
                  cursor: paginaAtual === 1 ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              <button
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                }
                disabled={paginaAtual === totalPaginas}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  backgroundColor:
                    paginaAtual === totalPaginas ? "#F1F5F9" : "#FFFFFF",
                  color: paginaAtual === totalPaginas ? "#94A3B8" : "#334155",
                  cursor:
                    paginaAtual === totalPaginas ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ModalCliente
        isOpen={modalAberto}
        cliente={clienteEditando}
        onClose={() => {
          setModalAberto(false);
          setClienteEditando(null);
          setBusca("");
          setPaginaAtual(1);
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
