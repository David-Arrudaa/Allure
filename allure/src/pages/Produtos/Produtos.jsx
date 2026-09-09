import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../contexts/AuthContext";
import { useProdutos } from "../../hooks/useProdutos";
import { toast } from "../../lib/toast";
import { Edit2, Trash2, Plus, Search, X } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";

const produtoSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório"),
  preco: z.string().refine((val) => {
    const num = Number(val.replace(",", "."));
    return !isNaN(num) && num >= 0;
  }, "Preço inválido"),
  estoque: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
  }, "Estoque inválido"),
});

export function Produtos() {
  const { profile } = useAuth();
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);

  const {
    produtos,
    isLoading,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    isSalvando,
  } = useProdutos(profile?.tenant_id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      preco: "",
      estoque: "0",
    },
  });

  const abrirModal = (produto = null) => {
    if (produto) {
      setProdutoEditando(produto);
      reset({
        nome: produto.nome || "",
        preco:
          produto.preco !== undefined
            ? String(produto.preco).replace(".", ",")
            : "",
        estoque:
          produto.estoque !== undefined ? String(produto.estoque) : "0",
      });
    } else {
      setProdutoEditando(null);
      reset({
        nome: "",
        preco: "",
        estoque: "0",
      });
    }
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setProdutoEditando(null);
    reset();
  };

  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const onSubmit = async (data) => {
    if (!profile?.tenant_id) return;

    try {
      const precoNumerico = Number(data.preco.replace(",", "."));
      const estoqueNumerico = parseInt(data.estoque, 10) || 0;

      const payload = {
        nome: formatarNome(data.nome.trim()),
        preco: precoNumerico,
        estoque: estoqueNumerico,
        tenant_id: profile.tenant_id,
      };

      if (produtoEditando) {
        await atualizarProduto({
          id: produtoEditando.id,
          tenantId: profile.tenant_id,
          payload,
        });
        toast.success("Produto atualizado com sucesso!");
      } else {
        await criarProduto(payload);
        toast.success("Produto cadastrado com sucesso!");
      }

      fecharModal();
    } catch (err) {
      console.error("Erro ao salvar produto:", err.message);
      toast.error("Erro ao salvar produto: " + (err.message || "Tente novamente"));
    }
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir || !profile?.tenant_id) return;

    try {
      await excluirProduto({
        id: produtoParaExcluir.id,
        tenantId: profile.tenant_id,
      });
      toast.success("Produto excluído com sucesso!");
      setProdutoParaExcluir(null);
    } catch (err) {
      console.error("Erro ao excluir produto:", err.message);
      toast.error("Não foi possível excluir este produto.");
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);
  };

  const produtosFiltrados = produtos.filter((prod) =>
    prod.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 max-md:p-3 min-h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--cor-borda)] flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cor-texto)] mb-1">Gestão de Produtos</h2>
          <p className="text-slate-500 text-sm">Cadastre e controle o estoque de produtos físicos do salão</p>
        </div>

        {profile?.is_admin && (
          <button
            className="btn-novo max-md:w-full max-md:justify-center"
            onClick={() => abrirModal()}
            disabled={isLoading}
          >
            <Plus size={18} strokeWidth={2.5} />
            Novo Produto
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex mb-6">
          <div className="relative w-full max-w-[400px] max-md:max-w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar produto por nome..."
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
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Nome do Produto</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Preço de Venda</th>
                <th className="bg-slate-50 p-4 text-[0.85rem] font-semibold text-slate-500 uppercase border-b border-[var(--cor-borda)]">Qtd. Estoque</th>
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
                      <Skeleton width="60px" height="20px" />
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
              ) : produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((produto) => (
                  <tr
                    key={produto.id}
                    className="last:[&>td]:border-none hover:bg-slate-50 max-md:flex max-md:flex-col max-md:bg-white max-md:border max-md:border-[var(--cor-borda)] max-md:rounded-xl max-md:mb-3 max-md:p-3 max-md:shadow-[0_2px_8px_rgba(0,0,0,0.02)] max-md:hover:bg-white"
                  >
                    <td className="p-4 border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:py-2 max-md:px-0 max-md:border-slate-100">
                      <span className="max-md:font-semibold max-md:text-slate-500 max-md:text-xs max-md:uppercase">Produto</span>
                      <strong>{produto.nome}</strong>
                    </td>
                    <td className="p-4 border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:py-2 max-md:px-0 max-md:border-slate-100">
                      <span className="max-md:font-semibold max-md:text-slate-500 max-md:text-xs max-md:uppercase">Preço</span>
                      {formatarMoeda(produto.preco)}
                    </td>
                    <td className="p-4 border-b border-slate-100 align-middle max-md:flex max-md:justify-between max-md:py-2 max-md:px-0 max-md:border-slate-100">
                      <span className="max-md:font-semibold max-md:text-slate-500 max-md:text-xs max-md:uppercase">Estoque</span>
                      <span
                        className={`px-3 py-1 rounded-full text-[0.85rem] font-semibold inline-block ${
                          produto.estoque > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {produto.estoque > 0
                          ? `${produto.estoque} un.`
                          : "Esgotado"}
                      </span>
                    </td>
                    <td className="p-4 align-middle max-md:flex max-md:justify-between max-md:py-2 max-md:px-0">
                      <span className="max-md:font-semibold max-md:text-slate-500 max-md:text-xs max-md:uppercase">Ações</span>
                      <div className="flex gap-2">
                        {profile?.is_admin && (
                          <>
                            <button
                              className="bg-transparent border-none p-[0.4rem] rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all hover:bg-blue-50 hover:text-blue-500"
                              onClick={() => abrirModal(produto)}
                              title="Editar Produto"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="bg-transparent border-none p-[0.4rem] rounded-md cursor-pointer text-slate-400 flex items-center justify-center transition-all hover:bg-red-50 hover:text-red-500"
                              onClick={() => setProdutoParaExcluir(produto)}
                              title="Excluir Produto"
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
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#94A3B8",
                    }}
                  >
                    {busca
                      ? `Nenhum produto encontrado com a busca "${busca}".`
                      : "Nenhum produto cadastrado no momento."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div
            className="bg-white rounded-2xl w-[92%] max-w-[540px] p-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] flex flex-col animate-[modalAparecer_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-[var(--cor-texto)] m-0">
                {produtoEditando ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                type="button"
                className="btn-fechar"
                onClick={fecharModal}
                title="Fechar"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-600">Nome do Produto *</label>
                <input
                  type="text"
                  placeholder="Ex: Shampoo Nutritivo 300ml"
                  {...register("nome")}
                  onChange={(e) => {
                    e.target.value = formatarNome(e.target.value);
                    register("nome").onChange(e);
                  }}
                  className="w-full py-3 px-4 border border-slate-300 rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                />
                {errors.nome && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {errors.nome.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-600">Preço (R$) *</label>
                  <input
                    type="text"
                    placeholder="Ex: 45,00"
                    {...register("preco")}
                    className="w-full py-3 px-4 border border-slate-300 rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                  />
                  {errors.preco && (
                    <span className="text-red-500 text-xs mt-1 block">
                      {errors.preco.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-600">Qtd. em Estoque *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 10"
                    {...register("estoque")}
                    className="w-full py-3 px-4 border border-slate-300 rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                  />
                  {errors.estoque && (
                    <span className="text-red-500 text-xs mt-1 block">
                      {errors.estoque.message}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn-salvar mt-4 py-3.5 px-6 text-base font-semibold rounded-lg"
                disabled={isSalvando}
              >
                {isSalvando
                  ? "Salvando..."
                  : produtoEditando
                    ? "Salvar Alterações"
                    : "Salvar Produto"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {produtoParaExcluir && (
        <div
          className="modal-overlay"
          onClick={() => setProdutoParaExcluir(null)}
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
              Tem certeza que deseja apagar o produto{" "}
              <strong>{produtoParaExcluir.nome}</strong> do estoque?
            </p>
            <div className="modal-exclusao-acoes">
              <button
                className="btn-cancelar"
                onClick={() => setProdutoParaExcluir(null)}
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
