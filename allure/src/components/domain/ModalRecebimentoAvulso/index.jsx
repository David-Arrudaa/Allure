import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { useTenant } from "../../../contexts/TenantContext";
import { useAuth } from "../../../contexts/AuthContext";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { maskCurrencyInput, parseCurrencyToNumber } from "../../../utils/masks";
import { FORM_STYLES } from "../../../config/theme";

export function ModalRecebimentoAvulso({ isOpen, onClose, onSave, vendaEditando = null }) {
  const { tenant } = useTenant();
  const { user, profile } = useAuth();

  // tenant_id do profissional logado é a fonte confiável; o contexto é fallback
  const tenantId = profile?.tenant_id || user?.tenant_id || tenant?.id;
  const isEdicao = Boolean(vendaEditando && vendaEditando.id);

  const [produtos, setProdutos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loadingDados, setLoadingDados] = useState(false);

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [produtoOriginalId, setProdutoOriginalId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [qtdOriginal, setQtdOriginal] = useState(1);
  const [valor, setValor] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  // Busca e seleção de Cliente (autocomplete)
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesBanco, setClientesBanco] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [isBuscandoCliente, setIsBuscandoCliente] = useState(false);
  const [digitandoCliente, setDigitandoCliente] = useState(false);

  useEffect(() => {
    if (isOpen && tenantId) {
      carregarDados();
    }
  }, [isOpen, tenantId, vendaEditando]);

  // Autocomplete de Clientes com debounce
  useEffect(() => {
    if (!isOpen || !digitandoCliente || buscaCliente.trim().length < 2) {
      setClientesBanco([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsBuscandoCliente(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, nome, telefone")
          .ilike("nome", `%${buscaCliente.trim()}%`)
          .limit(5);

        if (!error && data) setClientesBanco(data);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      } finally {
        setIsBuscandoCliente(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaCliente, digitandoCliente, isOpen]);

  const carregarDados = async () => {
    if (!tenantId) return;
    setLoadingDados(true);
    setErroMsg("");

    try {
      const [resProdutos, resProfissionais] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, nome, preco, estoque")
          .eq("tenant_id", tenantId)
          .order("nome", { ascending: true }),
        supabase
          .from("profissionais")
          .select("id, nome")
          .eq("tenant_id", tenantId)
          .order("nome", { ascending: true }),
      ]);

      if (resProdutos.error) throw resProdutos.error;
      if (resProfissionais.error) throw resProfissionais.error;

      const prodsList = resProdutos.data || [];
      const profsList = resProfissionais.data || [];

      setProdutos(prodsList);
      setProfissionais(profsList);

      if (vendaEditando) {
        // Extrai nome do produto e quantidade a partir de "Venda: Nome (2x)"
        let nomeProdBusca = "";
        let qtdDetectada = 1;

        if (vendaEditando.servico) {
          const match = vendaEditando.servico.match(/Venda:\s*(.*?)(?:\s*\((\d+)x\))?$/i);
          if (match) {
            nomeProdBusca = match[1]?.trim() || "";
            qtdDetectada = match[2] ? Number(match[2]) : 1;
          } else {
            nomeProdBusca = vendaEditando.servico.replace(/^Venda:\s*/i, "").trim();
          }
        }

        const prodEncontrado = prodsList.find(
          (p) =>
            String(p.id) === String(vendaEditando.produto_id) ||
            p.nome.toLowerCase() === nomeProdBusca.toLowerCase()
        );

        const idProd = prodEncontrado ? prodEncontrado.id : "";
        setProdutoSelecionado(idProd);
        setProdutoOriginalId(idProd);
        setQuantidade(qtdDetectada);
        setQtdOriginal(qtdDetectada);

        const valorBruto =
          vendaEditando.valorNum !== undefined
            ? Number(vendaEditando.valorNum)
            : parseCurrencyToNumber(vendaEditando.valor);
        setValor(maskCurrencyInput(Math.round(valorBruto * 100)));

        setProfissionalId(vendaEditando.profissionalId || profsList[0]?.id || "");
        setFormaPagamento(vendaEditando.forma || "Pix");
        setDataRecebimento(
          vendaEditando.dataIso ||
            (vendaEditando.data_horario
              ? vendaEditando.data_horario.split("T")[0]
              : new Date().toISOString().split("T")[0])
        );

        if (vendaEditando.clienteId) {
          setClienteSelecionado({
            id: vendaEditando.clienteId,
            nome: vendaEditando.cliente || "",
          });
          setBuscaCliente(vendaEditando.cliente || "");
        } else {
          setClienteSelecionado(null);
          setBuscaCliente("");
        }
      } else {
        setProdutoSelecionado("");
        setProdutoOriginalId("");
        setQuantidade(1);
        setQtdOriginal(1);
        setValor("");
        setFormaPagamento("Pix");
        setDataRecebimento(new Date().toISOString().split("T")[0]);
        setBuscaCliente("");
        setClienteSelecionado(null);
        setClientesBanco([]);
        setDigitandoCliente(false);

        if (profsList.length > 0) {
          const profLogada = profsList.find((p) => p.id === profile?.id);
          setProfissionalId(profLogada ? profLogada.id : profsList[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da venda:", error.message);
      toast.error("Erro ao carregar produtos e profissionais.");
    } finally {
      setLoadingDados(false);
    }
  };

  const produtoSelecionadoObj = produtos.find(
    (p) => String(p.id) === String(produtoSelecionado)
  );

  // Ao editar, a quantidade já baixada volta a ficar disponível — mas só se
  // continuarmos no mesmo produto.
  const mesmoProdutoDaEdicao =
    isEdicao && String(produtoSelecionado) === String(produtoOriginalId);

  const calcularEstoqueDisponivel = (prod) => {
    if (!prod) return 0;
    const base = Number(prod.estoque || 0);
    return mesmoProdutoDaEdicao ? base + Number(qtdOriginal) : base;
  };

  const estoqueDisponivel = calcularEstoqueDisponivel(produtoSelecionadoObj);

  const validarEstoque = (prod, qtd) => {
    if (!prod || prod.estoque === undefined) return "";
    const disponivel = calcularEstoqueDisponivel(prod);
    if (disponivel <= 0) {
      return `Estoque esgotado: "${prod.nome}" possui 0 unidades.`;
    }
    if (qtd > disponivel) {
      return `Estoque insuficiente: ${qtd} un. selecionadas, mas restam ${disponivel} un.`;
    }
    return "";
  };

  const recalcularValor = (prod, qtd) => {
    if (!prod) return;
    const total = Number(prod.preco || 0) * Number(qtd || 1);
    setValor(maskCurrencyInput(Math.round(total * 100)));
  };

  const handleProdutoChange = (e) => {
    const prodId = e.target.value;
    setProdutoSelecionado(prodId);

    const prod = produtos.find((p) => String(p.id) === String(prodId));
    recalcularValor(prod, quantidade);
    setErroMsg(validarEstoque(prod, quantidade));
  };

  const handleQuantidadeChange = (novaQtd) => {
    const qtdNum = Math.max(1, Number(novaQtd) || 1);
    setQuantidade(qtdNum);
    recalcularValor(produtoSelecionadoObj, qtdNum);
    setErroMsg(validarEstoque(produtoSelecionadoObj, qtdNum));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (isSaving || !tenantId) return;

    if (!produtoSelecionado) {
      setErroMsg("Selecione um produto para a venda.");
      return;
    }
    if (!profissionalId) {
      setErroMsg("Selecione a profissional responsável pela venda.");
      return;
    }

    const erroEstoque = validarEstoque(produtoSelecionadoObj, quantidade);
    if (erroEstoque) {
      setErroMsg(erroEstoque);
      return;
    }

    const valorNumerico = parseCurrencyToNumber(valor);
    if (!valorNumerico || valorNumerico <= 0) {
      setErroMsg("Informe um valor válido para a venda.");
      return;
    }

    setIsSaving(true);
    setErroMsg("");

    try {
      const agora = new Date();
      const horaStr = String(agora.getHours()).padStart(2, "0");
      const minStr = String(agora.getMinutes()).padStart(2, "0");
      const dataHorarioCompleto = `${dataRecebimento}T${horaStr}:${minStr}:00-03:00`;

      const nomeProduto = produtoSelecionadoObj ? produtoSelecionadoObj.nome : "Produto";
      const nomeServico = `Venda: ${nomeProduto}${quantidade > 1 ? ` (${quantidade}x)` : ""}`;

      const payload = {
        servico: nomeServico,
        valor: valorNumerico,
        data_horario: dataHorarioCompleto,
        forma_pagamento: formaPagamento,
        profissional_id: profissionalId,
        customer_id: clienteSelecionado?.id || null,
      };

      if (isEdicao) {
        const { error: updateError } = await supabase
          .from("appointments")
          .update(payload)
          .eq("id", vendaEditando.id)
          .eq("tenant_id", tenantId);

        if (updateError) throw updateError;

        if (mesmoProdutoDaEdicao) {
          // Mesmo produto: aplica só a diferença de quantidade
          if (produtoSelecionadoObj?.estoque !== undefined) {
            const diferenca = Number(qtdOriginal) - Number(quantidade);
            const novoEstoque = Math.max(
              0,
              Number(produtoSelecionadoObj.estoque || 0) + diferenca
            );
            await supabase
              .from("produtos")
              .update({ estoque: novoEstoque })
              .eq("id", produtoSelecionadoObj.id)
              .eq("tenant_id", tenantId);
          }
        } else {
          // Produto trocado: devolve ao antigo e debita do novo
          const produtoAntigo = produtos.find(
            (p) => String(p.id) === String(produtoOriginalId)
          );
          if (produtoAntigo?.estoque !== undefined) {
            await supabase
              .from("produtos")
              .update({
                estoque: Math.max(
                  0,
                  Number(produtoAntigo.estoque || 0) + Number(qtdOriginal)
                ),
              })
              .eq("id", produtoAntigo.id)
              .eq("tenant_id", tenantId);
          }
          if (produtoSelecionadoObj?.estoque !== undefined) {
            await supabase
              .from("produtos")
              .update({
                estoque: Math.max(
                  0,
                  Number(produtoSelecionadoObj.estoque || 0) - Number(quantidade)
                ),
              })
              .eq("id", produtoSelecionadoObj.id)
              .eq("tenant_id", tenantId);
          }
        }

        toast.success("Venda atualizada com sucesso!");
      } else {
        const { error: insertError } = await supabase.from("appointments").insert([
          {
            ...payload,
            status: "confirmado",
            pagamento: "pago",
            duracao: 0,
            tenant_id: tenantId,
          },
        ]);

        if (insertError) throw insertError;

        if (produtoSelecionadoObj?.estoque !== undefined) {
          const novoEstoque = Math.max(
            0,
            Number(produtoSelecionadoObj.estoque || 0) - Number(quantidade)
          );
          await supabase
            .from("produtos")
            .update({ estoque: novoEstoque })
            .eq("id", produtoSelecionadoObj.id)
            .eq("tenant_id", tenantId);
        }

        toast.success("Venda registrada com sucesso!");
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar venda:", error.message);
      toast.error("Erro ao salvar venda: " + (error.message || "tente novamente."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdicao ? "Editar Venda" : "Recebimento Avulso (Venda)"}
    >
      <form onSubmit={handleSalvar} className="space-y-5 pb-6">
        {erroMsg && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{erroMsg}</span>
          </div>
        )}

        {/* CLIENTE (autocomplete, opcional) */}
        <div className={`${FORM_STYLES.group} relative`}>
          <label className={FORM_STYLES.label}>Cliente (Opcional)</label>
          <input
            type="text"
            placeholder="Buscar cliente por nome..."
            value={clienteSelecionado ? clienteSelecionado.nome : buscaCliente}
            onChange={(e) => {
              setDigitandoCliente(true);
              setBuscaCliente(e.target.value);
              setClienteSelecionado(null);
            }}
            onFocus={() => {
              if (buscaCliente.trim().length >= 2) setDigitandoCliente(true);
            }}
            onBlur={() => setTimeout(() => setDigitandoCliente(false), 200)}
            disabled={isSaving}
            className={FORM_STYLES.input}
          />
          {digitandoCliente && buscaCliente.trim().length >= 2 && !clienteSelecionado && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-44 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {isBuscandoCliente ? (
                <div className="p-3 text-xs text-slate-500 text-center italic">
                  Buscando clientes...
                </div>
              ) : clientesBanco.length > 0 ? (
                clientesBanco.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClienteSelecionado(c);
                      setBuscaCliente(c.nome);
                      setClientesBanco([]);
                      setDigitandoCliente(false);
                    }}
                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-xs text-slate-700 font-medium"
                  >
                    <strong>{c.nome}</strong> {c.telefone ? `- ${c.telefone}` : ""}
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-slate-500 text-center italic">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          )}
        </div>

        {/* PRODUTO */}
        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Produto *</label>
          <select
            value={produtoSelecionado}
            onChange={handleProdutoChange}
            required
            disabled={loadingDados || isSaving}
            className={FORM_STYLES.select}
          >
            <option value="" disabled>
              {loadingDados ? "Carregando produtos..." : "Selecione um produto..."}
            </option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
                {p.estoque !== undefined ? ` (Estoque: ${p.estoque})` : ""} —{" "}
                {Number(p.preco || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </option>
            ))}
          </select>
          {produtoSelecionadoObj && (
            <span
              className={`text-xs font-semibold mt-1 ${
                estoqueDisponivel <= 0 ? "text-red-500" : "text-slate-500"
              }`}
            >
              Estoque disponível: {estoqueDisponivel} un.
            </span>
          )}
        </div>

        {/* QUANTIDADE + VALOR */}
        <div className={FORM_STYLES.row}>
          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Quantidade *</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => handleQuantidadeChange(quantidade - 1)}
                disabled={quantidade <= 1 || isSaving}
                title="Diminuir"
              >
                <Minus size={16} />
              </Button>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => handleQuantidadeChange(e.target.value)}
                required
                disabled={isSaving}
                className={`${FORM_STYLES.input} text-center`}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => handleQuantidadeChange(quantidade + 1)}
                disabled={isSaving}
                title="Aumentar"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Valor Total (R$) *</label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={valor}
              onChange={(e) => setValor(maskCurrencyInput(e.target.value))}
              required
              disabled={isSaving}
              className={FORM_STYLES.input}
            />
          </div>
        </div>

        {/* DATA + FORMA DE PAGAMENTO */}
        <div className={FORM_STYLES.row}>
          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Data *</label>
            <input
              type="date"
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
              required
              disabled={isSaving}
              className={FORM_STYLES.input}
            />
          </div>

          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Forma de Pagamento *</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              required
              disabled={isSaving}
              className={FORM_STYLES.select}
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
            </select>
          </div>
        </div>

        {/* PROFISSIONAL */}
        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Profissional (Vendedora) *</label>
          <select
            value={profissionalId}
            onChange={(e) => setProfissionalId(e.target.value)}
            required
            disabled={loadingDados || isSaving}
            className={FORM_STYLES.select}
          >
            <option value="" disabled>
              Selecione a profissional...
            </option>
            {profissionais.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={FORM_STYLES.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Salvar Recebimento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
