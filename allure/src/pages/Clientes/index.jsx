import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, ClipboardList } from "lucide-react";
import { ModalCliente } from "../../components/domain/ModalCliente";
import { ModalHistorico } from "../../components/domain/ModalHistorico";
import { Skeleton } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { useClientes } from "../../hooks/useClientes";

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
    <div className="bg-white rounded-[var(--raio-borda)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 min-h-screen flex flex-col max-md:p-4 max-md:min-h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--cor-borda)] max-md:flex-col max-md:items-stretch max-md:gap-4">
        <div>
          <h2 className="text-2xl text-[var(--cor-texto)] font-bold mb-1">Gestão de Clientes</h2>
          <p className="text-slate-500 text-sm">
            {isLoading ? (
              <Skeleton width="200px" height="16px" />
            ) : (
              `Visualize e gerencie as clientes do salão (${totalClientes} cadastradas)`
            )}
          </p>
        </div>

        <button
          className="btn-novo max-md:w-full max-md:justify-center"
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

      <div className="flex-1 flex flex-col">
        <div className="flex mb-6">
          <div className="relative w-full max-w-[400px] max-md:max-w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={handleBuscaChange}
              className="w-full py-3 pr-4 pl-[2.8rem] border border-[var(--cor-borda)] rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all duration-200 focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(199,75,103,0.1)]"
            />
          </div>
        </div>

        <div className="bg-white border border-[var(--cor-borda)] rounded-lg overflow-y-auto overflow-x-auto max-md:border-none max-md:bg-transparent max-md:overflow-x-hidden w-full">
          <table className="w-full border-collapse text-left max-md:min-w-0">
            <thead className="max-md:hidden">
              <tr>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Nome da Cliente</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Telefone</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Última Visita</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((item) => (
                  <tr key={`skel-${item}`} className="hover:bg-slate-50 max-md:flex max-md:flex-col max-md:bg-white max-md:border max-md:border-[var(--cor-borda)] max-md:rounded-[10px] max-md:mb-4 max-md:px-4 max-md:py-2 max-md:shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:border-slate-100 max-md:before:content-['Nome:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem]">
                      <Skeleton width="60%" height="20px" />
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:border-slate-100 max-md:before:content-['Telefone:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem]">
                      <Skeleton width="110px" height="20px" />
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:border-slate-100 max-md:before:content-['Última_Visita:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem]">
                      <Skeleton width="90px" height="20px" />
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle last:border-b-0 max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:pb-2 max-md:border-none max-md:before:content-['Ações:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem] max-md:before:mr-auto">
                      <div style={{ display: "flex", gap: "6px" }} className="flex gap-2">
                        <Skeleton width="32px" height="32px" borderRadius="6px" />
                        <Skeleton width="32px" height="32px" borderRadius="6px" />
                        <Skeleton width="32px" height="32px" borderRadius="6px" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50 max-md:flex max-md:flex-col max-md:bg-white max-md:border max-md:border-[var(--cor-borda)] max-md:rounded-[10px] max-md:mb-4 max-md:px-4 max-md:py-2 max-md:shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:border-slate-100 max-md:before:content-['Nome:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem]">
                      <strong className="max-md:text-[1.05rem]">{cliente.nome}</strong>
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:border-slate-100 max-md:before:content-['Telefone:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem]">
                      {cliente.telefone}
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:border-slate-100 max-md:before:content-['Última_Visita:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem]">
                      {cliente.ultimaVisita}
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle last:border-b-0 max-md:flex max-md:justify-between max-md:items-center max-md:py-[0.8rem] max-md:px-0 max-md:text-right max-md:pb-2 max-md:border-none max-md:before:content-['Ações:'] max-md:before:font-semibold max-md:before:text-slate-500 max-md:before:text-[0.85rem] max-md:before:mr-auto">
                      <div className="flex gap-2">
                        <button
                          className="bg-transparent border-none p-1.5 rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all duration-200 hover:bg-purple-100 hover:text-purple-600"
                          title="Ver Histórico"
                          onClick={() => {
                            setClienteParaHistorico(cliente);
                            setModalHistoricoAberto(true);
                          }}
                        >
                          <ClipboardList size={18} />
                        </button>

                        <button
                          className="bg-transparent border-none p-1.5 rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:text-blue-500"
                          title="Editar Cliente"
                          onClick={() => {
                            setClienteEditando(cliente);
                            setModalAberto(true);
                          }}
                        >
                          <Edit2 size={18} />
                        </button>

                        <button
                          className="bg-transparent border-none p-1.5 rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all duration-200 hover:bg-red-50 hover:text-red-500"
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
