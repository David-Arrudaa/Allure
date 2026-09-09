import { useState } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { ModalServico } from "../components/domain/ModalServico";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../contexts/AuthContext";
import { useServicos } from "../hooks/useServicos";
import { toast } from "../lib/toast";

export function Servicos() {
  const { profile } = useAuth();
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState(null);

  const { servicos, isLoading, excluirServico } = useServicos();

  const confirmarExclusao = async () => {
    if (!servicoParaExcluir) return;

    try {
      await excluirServico(servicoParaExcluir.id);
      toast.success("Serviço excluído com sucesso!");
      setServicoParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir serviço:", error.message);
      toast.error(
        "Não foi possível excluir. Este serviço pode estar vinculado a algum agendamento do histórico.",
      );
    }
  };

  const servicosFiltrados = servicos.filter((servico) =>
    servico.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 max-md:p-3 min-h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--cor-borda)] flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cor-texto)] mb-1">Gestão de Serviços</h2>
          <p className="text-slate-500 text-sm">Cadastre e ajuste os valores dos serviços do salão</p>
        </div>

        {profile?.is_admin && (
          <button
            className="btn-novo max-md:w-full max-md:justify-center"
            onClick={() => {
              setServicoEditando(null);
              setModalAberto(true);
            }}
            disabled={isLoading}
          >
            <Plus size={18} strokeWidth={2.5} />
            Novo Serviço
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex mb-6">
          <div className="relative w-full max-w-[400px] max-md:max-w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar serviço por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={isLoading}
              className="w-full py-3 pr-4 pl-11 border border-[var(--cor-borda)] rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            />
          </div>
        </div>

        <div className="bg-white border border-[var(--cor-borda)] rounded-[10px] overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="max-md:hidden">
              <tr>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Nome do Serviço</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Valor (R$)</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <tr key={`skel-${item}`}>
                    <td className="p-4 border-b border-slate-100">
                      <Skeleton width="60%" height="20px" />
                    </td>
                    <td className="p-4 border-b border-slate-100">
                      <Skeleton width="80px" height="20px" />
                    </td>
                    <td className="p-4 border-b border-slate-100">
                      <div className="flex gap-2">
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
              ) : servicosFiltrados.length > 0 ? (
                servicosFiltrados.map((servico) => (
                  <tr
                    key={servico.id}
                    className="last:[&>td]:border-none hover:bg-slate-50 max-md:flex max-md:flex-col max-md:bg-white max-md:border max-md:border-[var(--cor-borda)] max-md:rounded-xl max-md:mb-3 max-md:p-3 max-md:shadow-[0_2px_8px_rgba(0,0,0,0.02)] max-md:hover:bg-white"
                  >
                    <td className="p-4 border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:py-2 max-md:px-0 max-md:border-slate-100">
                      <span className="hidden max-md:font-semibold max-md:text-slate-500 max-md:text-xs max-md:uppercase max-md:inline">Serviço</span>
                      <strong>{servico.nome}</strong>
                    </td>
                    <td className="p-4 border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:py-2 max-md:px-0 max-md:border-slate-100">
                      <span className="hidden max-md:font-semibold max-md:text-slate-500 max-md:text-xs max-md:uppercase max-md:inline">Valor</span>
                      R$ {String(servico.preco).replace(".", ",")}
                    </td>
                    <td className="p-4 align-middle max-md:flex max-md:justify-between max-md:py-2 max-md:px-0">
                      <span className="hidden max-md:font-semibold max-md:text-slate-500 max-md:text-xs max-md:uppercase max-md:inline">Ações</span>
                      <div className="flex gap-2">
                        {profile?.is_admin && (
                          <>
                            <button
                              className="bg-transparent border-none p-[0.4rem] rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all hover:bg-blue-50 hover:text-blue-500"
                              title="Editar Serviço"
                              onClick={() => {
                                setServicoEditando(servico);
                                setModalAberto(true);
                              }}
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="bg-transparent border-none p-[0.4rem] rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all hover:bg-red-50 hover:text-red-500"
                              title="Excluir Serviço"
                              onClick={() => setServicoParaExcluir(servico)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
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

      <ModalServico
        isOpen={modalAberto}
        servico={servicoEditando}
        onClose={() => {
          setModalAberto(false);
          setServicoEditando(null);
        }}
      />

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
