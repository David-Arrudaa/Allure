import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { ModalServico } from "../../components/domain/ModalServico";
import { supabase } from "../../services/supabase";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../contexts/AuthContext";

export function Servicos() {
  const { profile } = useAuth();
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  // <-- ESTADO DE CARREGAMENTO -->
  const [isLoading, setIsLoading] = useState(true);

  // Novos estados para o banco de dados
  const [servicos, setServicos] = useState([]);
  const [servicoEditando, setServicoEditando] = useState(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState(null);

  // Busca os serviços direto do Supabase
  const buscarServicos = async () => {
    setIsLoading(true); // Começa a carregar
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      if (data) setServicos(data);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error.message);
    } finally {
      setIsLoading(false); // Termina de carregar
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
    <div className="bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 min-h-[calc(100vh-3rem)] flex flex-col max-md:p-4 max-md:h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--cor-borda)] max-md:flex-col max-md:items-start max-md:gap-5">
        <div>
          <h2 className="text-2xl text-[var(--cor-texto)] font-bold mb-1">Gestão de Serviços</h2>
          <p className="text-slate-500 text-sm">Cadastre e ajuste os valores dos serviços do salão</p>
        </div>

        {profile?.is_admin && (
          <button
            className="btn-novo max-md:w-full max-md:justify-center"
            onClick={() => {
              setServicoEditando(null); // Garante que abra o modal limpo
              setModalAberto(true);
            }}
            disabled={isLoading} // Desabilita o botão enquanto carrega
          >
            <Plus size={18} strokeWidth={2.5} />
            Novo Serviço
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex mb-6">
          <div className="relative w-full max-w-[400px] max-md:max-w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar serviço por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={isLoading} // Trava a busca enquanto carrega
              className="w-full py-3 pr-4 pl-[2.8rem] border border-[var(--cor-borda)] rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all duration-200 focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(199,75,103,0.1)]"
            />
          </div>
        </div>

        <div className="bg-white border border-[var(--cor-borda)] rounded-lg overflow-hidden max-md:overflow-x-hidden max-md:w-full">
          <table className="w-full border-collapse text-left max-md:min-w-0 max-md:w-full">
            <thead>
              <tr>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)] max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">Nome do Serviço</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)] max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">Valor (R$)</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)] max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <tr key={`skel-${item}`} className="hover:bg-slate-50">
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">
                      <Skeleton width="60%" height="20px" />
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">
                      <Skeleton width="80px" height="20px" />
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle last:border-b-0 max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">
                      <div
                        className="flex gap-1.5"
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : servicosFiltrados.length > 0 ? (
                servicosFiltrados.map((servico) => (
                  <tr key={servico.id} className="hover:bg-slate-50">
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">
                      <strong>{servico.nome}</strong>
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">
                      R$ {String(servico.preco).replace(".", ",")}
                    </td>
                    <td className="p-4 text-[0.95rem] text-[var(--cor-texto)] border-b border-slate-100 align-middle last:border-b-0 max-md:p-[0.8rem_0.4rem] max-md:text-[0.85rem] max-md:whitespace-normal">
                      <div className="flex gap-1.5">
                        {profile?.is_admin && (
                          <>
                            <button
                              className="bg-transparent border-none p-1.5 rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:text-blue-500"
                              title="Editar Serviço"
                              onClick={() => {
                                setServicoEditando(servico);
                                setModalAberto(true);
                              }}
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="bg-transparent border-none p-1.5 rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all duration-200 hover:bg-red-50 hover:text-red-500"
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
