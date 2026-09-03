import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Edit2, Trash2, Plus, Search } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { maskCurrencyInput, parseCurrencyToNumber, formatCurrency } from "../../utils/masks";
import { FORM_STYLES } from "../../config/theme";
import "./Produtos.css";

const produtoSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório"),
  preco: z.string().refine((val) => parseCurrencyToNumber(val) > 0, "Preço inválido"),
  estoque: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
  }, "Estoque inválido"),
});

export function Produtos() {
  const { profile } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  const [isSalvando, setIsSalvando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      preco: "",
      estoque: "0",
    },
  });

  const fetchProdutos = async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("nome", { ascending: true });

      if (error) throw error;
      setProdutos(data || []);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [profile?.tenant_id]);

  const abrirModal = (produto = null) => {
    setProdutoEditando(produto);
    if (produto) {
      reset({
        nome: produto.nome || "",
        preco: formatCurrency(produto.preco || 0),
        estoque: String(produto.estoque || "0"),
      });
    } else {
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

  const onSubmit = async (dados) => {
    if (!profile?.tenant_id) return;
    setIsSalvando(true);
    try {
      const precoNumerico = parseCurrencyToNumber(dados.preco);
      const estoqueNumerico = Number(dados.estoque);

      const payload = {
        nome: dados.nome.trim(),
        preco: precoNumerico,
        estoque: estoqueNumerico,
        tenant_id: profile.tenant_id,
      };

      if (produtoEditando) {
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", produtoEditando.id)
          .eq("tenant_id", profile.tenant_id);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("produtos").insert([payload]);

        if (error) throw error;
        toast.success("Produto cadastrado com sucesso!");
      }

      fecharModal();
      fetchProdutos();
    } catch (err) {
      console.error("Erro ao salvar produto:", err.message);
      toast.error("Erro ao salvar o produto.");
    } finally {
      setIsSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir || !profile?.tenant_id) return;
    try {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", produtoParaExcluir.id)
        .eq("tenant_id", profile.tenant_id);

      if (error) throw error;

      toast.success("Produto excluído com sucesso!");
      setProdutoParaExcluir(null);
      fetchProdutos();
    } catch (err) {
      console.error("Erro ao excluir produto:", err.message);
      toast.error("Não foi possível excluir o produto.");
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="produtos-container">
      <div className="produtos-header">
        <div>
          <h2>Gestão de Produtos</h2>
          <p>Controle de estoque e vendas de produtos</p>
        </div>

        {profile?.is_admin && (
          <Button variant="primary" onClick={() => abrirModal(null)}>
            <Plus size={18} /> Novo Produto
          </Button>
        )}
      </div>

      <div className="produtos-conteudo">
        <div className="filtro-busca-container">
          <Search size={18} className="icone-busca" />
          <input
            type="text"
            placeholder="Buscar produto por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-busca"
          />
        </div>

        <div className="tabela-container">
          <table className="tabela-produtos">
            <thead>
              <tr>
                <th>Nome do Produto</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td>
                      <Skeleton width="150px" height="20px" />
                    </td>
                    <td>
                      <Skeleton width="80px" height="20px" />
                    </td>
                    <td>
                      <Skeleton width="60px" height="20px" />
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <Skeleton width="32px" height="32px" borderRadius="6px" />
                        <Skeleton width="32px" height="32px" borderRadius="6px" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((produto) => (
                  <tr key={produto.id}>
                    <td>
                      <strong>{produto.nome}</strong>
                    </td>
                    <td>{formatCurrency(produto.preco)}</td>
                    <td>
                      <span
                        className={`estoque-badge ${
                          produto.estoque > 0
                            ? "estoque-positivo"
                            : "estoque-zerado"
                        }`}
                      >
                        {produto.estoque > 0
                          ? `${produto.estoque} un.`
                          : "Esgotado"}
                      </span>
                    </td>
                    <td>
                      <div className="acoes-tabela">
                        {profile?.is_admin && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => abrirModal(produto)}
                              title="Editar Produto"
                            >
                              <Edit2 size={18} className="text-blue-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setProdutoParaExcluir(produto)}
                              title="Excluir Produto"
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </Button>
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

      {/* MODAL DE CADASTRO E EDIÇÃO */}
      <Modal
        isOpen={isModalOpen}
        onClose={fecharModal}
        title={produtoEditando ? "Editar Produto" : "Novo Produto"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Nome do Produto *</label>
            <input
              type="text"
              placeholder="Ex: Shampo Pós-Química 500ml"
              {...register("nome")}
              className={FORM_STYLES.input}
            />
            {errors.nome && (
              <span className={FORM_STYLES.error}>{errors.nome.message}</span>
            )}
          </div>

          <div className={FORM_STYLES.row}>
            <div className={FORM_STYLES.group}>
              <label className={FORM_STYLES.label}>Preço de Venda (R$) *</label>
              <Controller
                name="preco"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={value}
                    onChange={(e) => onChange(maskCurrencyInput(e.target.value))}
                    className={FORM_STYLES.input}
                  />
                )}
              />
              {errors.preco && (
                <span className={FORM_STYLES.error}>{errors.preco.message}</span>
              )}
            </div>

            <div className={FORM_STYLES.group}>
              <label className={FORM_STYLES.label}>Quantidade em Estoque *</label>
              <input
                type="number"
                placeholder="Ex: 10"
                {...register("estoque")}
                className={FORM_STYLES.input}
              />
              {errors.estoque && (
                <span className={FORM_STYLES.error}>{errors.estoque.message}</span>
              )}
            </div>
          </div>

          <div className={FORM_STYLES.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={fecharModal}
              disabled={isSalvando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSalvando}
            >
              {isSalvando
                ? "Salvando..."
                : produtoEditando
                  ? "Salvar Alterações"
                  : "Salvar Produto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={!!produtoParaExcluir}
        onClose={() => setProdutoParaExcluir(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Tem certeza que deseja apagar o produto{" "}
            <strong>{produtoParaExcluir?.nome}</strong> do estoque?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setProdutoParaExcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmarExclusao}
            >
              Sim, apagar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

