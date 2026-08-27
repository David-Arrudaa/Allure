import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Edit2, Trash2, Plus, Search, X } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import "./Produtos.css";

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
  }, [profile]);

  const abrirModal = (produto = null) => {
    if (produto) {
      setProdutoEditando(produto);
      reset({
        nome: produto.nome || "",
        preco: produto.preco !== undefined ? String(produto.preco).replace(".", ",") : "",
        estoque: produto.estoque !== undefined ? String(produto.estoque) : "0",
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
    setIsSalvando(true);

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
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", produtoEditando.id)
          .eq("tenant_id", profile.tenant_id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("produtos").insert([payload]);
        if (error) throw error;
      }

      fetchProdutos();
      fecharModal();
    } catch (err) {
      console.error("Erro ao salvar produto:", err.message);
      alert("Erro ao salvar produto: " + err.message);
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

      setProdutoParaExcluir(null);
      fetchProdutos();
    } catch (err) {
      console.error("Erro ao excluir produto:", err.message);
      alert("Não foi possível excluir este produto.");
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
    <div className="produtos-container">
      <div className="produtos-topbar">
        <div className="produtos-info">
          <h2>Gestão de Produtos</h2>
          <p>Cadastre e controle o estoque de produtos físicos do salão</p>
        </div>

        {profile?.is_admin && (
          <button
            className="btn-novo"
            onClick={() => abrirModal()}
            disabled={loading}
          >
            <Plus size={18} strokeWidth={2.5} />
            Novo Produto
          </button>
        )}
      </div>

      <div className="produtos-conteudo">
        <div className="produtos-filtros">
          <div className="busca-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar produto por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="tabela-container">
          <table className="tabela-produtos">
            <thead>
              <tr>
                <th>Nome do Produto</th>
                <th>Preço de Venda</th>
                <th>Qtd. Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <tr key={`skel-${item}`}>
                    <td>
                      <Skeleton width="60%" height="20px" />
                    </td>
                    <td>
                      <Skeleton width="80px" height="20px" />
                    </td>
                    <td>
                      <Skeleton width="60px" height="20px" />
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
                    <td>{formatarMoeda(produto.preco)}</td>
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
                            <button
                              className="btn-acao editar"
                              onClick={() => abrirModal(produto)}
                              title="Editar Produto"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="btn-acao excluir"
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
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
          >
            <div
              className="modal-header"
              style={{
                marginBottom: "1.2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                {produtoEditando ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                className="btn-fechar"
                onClick={fecharModal}
                title="Fechar"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="form-agendamento">
              <div className="form-grupo">
                <label>Nome do Produto *</label>
                <input
                  type="text"
                  placeholder="Ex: Shampoo Nutritivo 300ml"
                  {...register("nome")}
                  onChange={(e) => {
                    e.target.value = formatarNome(e.target.value);
                    register("nome").onChange(e);
                  }}
                />
                {errors.nome && (
                  <span
                    className="erro"
                    style={{
                      color: "red",
                      fontSize: "0.85rem",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    {errors.nome.message}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div className="form-grupo">
                  <label>Preço (R$) *</label>
                  <input
                    type="text"
                    placeholder="Ex: 45,00"
                    {...register("preco")}
                  />
                  {errors.preco && (
                    <span
                      className="erro"
                      style={{
                        color: "red",
                        fontSize: "0.85rem",
                        marginTop: "4px",
                        display: "block",
                      }}
                    >
                      {errors.preco.message}
                    </span>
                  )}
                </div>

                <div className="form-grupo">
                  <label>Qtd. em Estoque *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 10"
                    {...register("estoque")}
                  />
                  {errors.estoque && (
                    <span
                      className="erro"
                      style={{
                        color: "red",
                        fontSize: "0.85rem",
                        marginTop: "4px",
                        display: "block",
                      }}
                    >
                      {errors.estoque.message}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn-salvar"
                style={{ marginTop: "1.5rem" }}
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
