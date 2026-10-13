import { useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Users,
  Calendar,
  CreditCard,
  AlertTriangle,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  PlusCircle,
  Percent,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchProdutos } from "../../../services/produtosService";
import { fetchProfissionaisParaAgenda as fetchProfissionais } from "../../../services/agendaService";
import { fetchClientes } from "../../../services/clientesService";
import {
  criarVendaAvulsa,
  atualizarVendaAvulsa,
} from "../../../services/transacoesService";
import "./ModalRecebimentoAvulso.css";

const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

const parseMoedaParaNumero = (valor) => {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  const limpo = String(valor).replace(/\D/g, "");
  if (!limpo) return 0;
  return Number(limpo) / 100;
};

const aplicarMascaraMoeda = (valor) => {
  if (!valor) return "";
  const limpo = String(valor).replace(/\D/g, "");
  if (!limpo) return "";
  const numero = Number(limpo) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
};

export function ModalRecebimentoAvulso({
  isOpen,
  onClose,
  onSave,
  vendaEditando = null,
}) {
  const { profile, user } = useAuth();
  const tenantId = profile?.tenant_id || user?.tenant_id;

  const isEdicao = Boolean(vendaEditando && (vendaEditando.transacao_id || vendaEditando.id));

  // Catálogos
  const [produtos, setProdutos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingDados, setLoadingDados] = useState(false);

  // Form Fields Principais
  const [profissionalId, setProfissionalId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  // Pagamento misto: lista de parcelas { id, forma, valorTexto }
  const [pagamentos, setPagamentos] = useState([
    { id: "pag-1", forma: "Pix", valorTexto: "" },
  ]);
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [descontoTexto, setDescontoTexto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  // Carrinho / Cesta de Itens
  // Cada item: { idTemporario, produtoId, descricao, precoUnitario, quantidade, subtotal }
  const [itensCarrinho, setItensCarrinho] = useState([]);

  // Seletor do Produto a Adicionar
  const [produtoParaAdicionarId, setProdutoParaAdicionarId] = useState("");
  const [qtdParaAdicionar, setQtdParaAdicionar] = useState(1);

  useEffect(() => {
    if (isOpen && tenantId) {
      carregarDados();
    }
  }, [isOpen, tenantId, vendaEditando]);

  const carregarDados = async () => {
    if (!tenantId) return;
    setLoadingDados(true);
    setErroMsg("");

    try {
      const [prodsList, profsList, clientesData] = await Promise.all([
        fetchProdutos(tenantId).catch(() => []),
        fetchProfissionais().catch(() => []),
        fetchClientes({ tenantId, page: 1, pageSize: 200 }).catch(() => ({ clientes: [] })),
      ]);

      const clientesList = clientesData.clientes || [];

      setProdutos(prodsList);
      setProfissionais(profsList);
      setClientes(clientesList);

      if (vendaEditando) {
        // Modo Edição: carregar itens
        if (vendaEditando.transacao_itens && vendaEditando.transacao_itens.length > 0) {
          const itensFormatados = vendaEditando.transacao_itens.map((it) => ({
            idTemporario: it.id || crypto.randomUUID(),
            produtoId: it.produto_id,
            descricao: it.descricao,
            precoUnitario: Number(it.valor_unitario || 0),
            quantidade: Number(it.quantidade || 1),
            subtotal: Number(it.subtotal || 0),
          }));
          setItensCarrinho(itensFormatados);
        } else {
          // Fallback se veio do appointments legado
          let nomeProd = "";
          let qtdDetectada = 1;
          if (vendaEditando.servico) {
            const match = vendaEditando.servico.match(/Venda:\s*(.*?)(?:\s*\((\d+)x\))?$/i);
            if (match) {
              nomeProd = match[1]?.trim() || "";
              qtdDetectada = match[2] ? Number(match[2]) : 1;
            } else {
              nomeProd = vendaEditando.servico.replace(/^Venda:\s*/i, "").trim();
            }
          }

          const prodEncontrado = prodsList.find(
            (p) =>
              String(p.id) === String(vendaEditando.produto_id || vendaEditando.produtoId) ||
              p.nome.toLowerCase() === nomeProd.toLowerCase()
          );

          if (prodEncontrado) {
            const pUnit = Number(prodEncontrado.preco || 0);
            setItensCarrinho([
              {
                idTemporario: crypto.randomUUID(),
                produtoId: prodEncontrado.id,
                descricao: prodEncontrado.nome,
                precoUnitario: pUnit,
                quantidade: qtdDetectada,
                subtotal: pUnit * qtdDetectada,
              },
            ]);
          }
        }

        setProfissionalId(
          vendaEditando.profissional_id ||
          vendaEditando.profissionalId ||
          profsList[0]?.id ||
          ""
        );
        setClienteId(vendaEditando.customer_id || vendaEditando.clienteId || "");
        const formaInicial = vendaEditando.forma_pagamento || vendaEditando.forma || "Pix";
        setFormaPagamento(formaInicial);
        setPagamentos([{ id: "pag-1", forma: formaInicial, valorTexto: "" }]);
        setDataRecebimento(
          vendaEditando.dataIso ||
          (vendaEditando.data_horario
            ? vendaEditando.data_horario.split("T")[0]
            : new Date().toISOString().split("T")[0])
        );

        const descNum = Number(vendaEditando.desconto || 0);
        setDescontoTexto(descNum > 0 ? formatarMoeda(descNum) : "");
        setObservacoes(vendaEditando.observacoes || "");
      } else {
        // Modo Criação
        setItensCarrinho([]);
        setProdutoParaAdicionarId("");
        setQtdParaAdicionar(1);
        setDescontoTexto("");
        setObservacoes("");
        setClienteId("");
        setFormaPagamento("Pix");
        setPagamentos([{ id: "pag-1", forma: "Pix", valorTexto: "" }]);
        setDataRecebimento(new Date().toISOString().split("T")[0]);

        if (profsList.length > 0) {
          const profLogada = profsList.find((p) => p.id === profile?.id);
          setProfissionalId(profLogada ? profLogada.id : profsList[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do PDV:", error);
      setErroMsg("Erro ao carregar produtos e profissionais.");
    } finally {
      setLoadingDados(false);
    }
  };

  // Cálculos do Carrinho
  const subtotalCarrinho = useMemo(() => {
    return itensCarrinho.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  }, [itensCarrinho]);

  const descontoNumerico = useMemo(() => {
    return parseMoedaParaNumero(descontoTexto);
  }, [descontoTexto]);

  const totalLiquido = useMemo(() => {
    return Math.max(0, subtotalCarrinho - descontoNumerico);
  }, [subtotalCarrinho, descontoNumerico]);

  // Soma das parcelas de pagamento informadas pelo usuário
  const totalPagamentosDigitado = useMemo(() => {
    return pagamentos.reduce((acc, curr) => {
      const v = parseMoedaParaNumero(curr.valorTexto);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
  }, [pagamentos]);

  // Se houver mais de uma forma, o valor digitado precisa bater com o total líquido
  const diferencaPagamento = useMemo(() => {
    if (pagamentos.length <= 1) return 0;
    return Math.round((totalLiquido - totalPagamentosDigitado) * 100) / 100;
  }, [totalLiquido, totalPagamentosDigitado, pagamentos.length]);

  const adicionarFormaPagamento = () => {
    setPagamentos((prev) => [
      ...prev,
      { id: `pag-${Date.now()}`, forma: "Dinheiro", valorTexto: "" },
    ]);
  };

  const removerFormaPagamento = (id) => {
    if (pagamentos.length <= 1) return;
    setPagamentos((prev) => prev.filter((p) => p.id !== id));
  };

  const alterarFormaPagamentoItem = (id, campo, valor) => {
    setPagamentos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (campo === "valorTexto") {
          return { ...p, valorTexto: aplicarMascaraMoeda(valor) };
        }
        return { ...p, [campo]: valor };
      })
    );
  };

  // Ações do Carrinho
  const adicionarAoCarrinho = () => {
    if (!produtoParaAdicionarId) {
      setErroMsg("Selecione um produto para adicionar.");
      return;
    }

    const prod = produtos.find((p) => String(p.id) === String(produtoParaAdicionarId));
    if (!prod) return;

    const qtd = Math.max(1, Number(qtdParaAdicionar) || 1);
    const estoqueDisponivel = Number(prod.estoque || 0);

    if (estoqueDisponivel <= 0) {
      setErroMsg(`O produto "${prod.nome}" está esgotado no estoque.`);
      return;
    }

    const precoUnitario = Number(prod.preco || 0);

    const indexExistente = itensCarrinho.findIndex(
      (it) => String(it.produtoId) === String(prod.id)
    );

    if (indexExistente >= 0) {
      const novaQtd = itensCarrinho[indexExistente].quantidade + qtd;
      if (novaQtd > estoqueDisponivel) {
        setErroMsg(
          `Quantidade total (${novaQtd} un.) excede o estoque disponível (${estoqueDisponivel} un.) de "${prod.nome}".`
        );
        return;
      }
      const novoCarrinho = [...itensCarrinho];
      novoCarrinho[indexExistente] = {
        ...novoCarrinho[indexExistente],
        quantidade: novaQtd,
        subtotal: novaQtd * precoUnitario,
      };
      setItensCarrinho(novoCarrinho);
    } else {
      setItensCarrinho([
        ...itensCarrinho,
        {
          idTemporario: crypto.randomUUID(),
          produtoId: prod.id,
          descricao: prod.nome,
          precoUnitario,
          quantidade: qtd,
          subtotal: qtd * precoUnitario,
          comissao_percentual: prod.comissao_percentual,
          profissionalId: profissionalId || (profissionais[0]?.id || null),
        },
      ]);
    }

    setProdutoParaAdicionarId("");
    setQtdParaAdicionar(1);
    setErroMsg("");
  };

  const alterarQuantidade = (idTemporario, novaQtd) => {
    const qtdNum = Math.max(1, Number(novaQtd) || 1);
    setItensCarrinho((prev) =>
      prev.map((it) => {
        if (it.idTemporario === idTemporario) {
          return {
            ...it,
            quantidade: qtdNum,
            subtotal: qtdNum * it.precoUnitario,
          };
        }
        return it;
      })
    );
  };

  const alterarProfissionalItem = (idTemporario, novoProfissionalId) => {
    setItensCarrinho((prev) =>
      prev.map((it) => {
        if (it.idTemporario === idTemporario) {
          return { ...it, profissionalId: novoProfissionalId };
        }
        return it;
      })
    );
  };

  const removerItem = (idTemporario) => {
    setItensCarrinho((prev) => prev.filter((it) => it.idTemporario !== idTemporario));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (isSaving || !tenantId) return;

    if (itensCarrinho.length === 0) {
      setErroMsg("Adicione pelo menos um produto ao carrinho antes de salvar.");
      return;
    }

    if (!profissionalId) {
      setErroMsg("Selecione a profissional responsável pela venda.");
      return;
    }

    // Validação de pagamento misto: a soma precisa bater com o total líquido
    if (pagamentos.length > 1 && Math.abs(diferencaPagamento) > 0.01) {
      setErroMsg(
        `A soma das formas de pagamento (R$ ${totalPagamentosDigitado.toFixed(2)}) não fecha com o total da venda (R$ ${totalLiquido.toFixed(2)}). Ajuste os valores.`
      );
      return;
    }

    setIsSaving(true);
    setErroMsg("");

    try {
      const horaAgora = new Date();
      const horaStr = String(horaAgora.getHours()).padStart(2, "0");
      const minStr = String(horaAgora.getMinutes()).padStart(2, "0");
      const dataCompleta = `${dataRecebimento}T${horaStr}:${minStr}:00-03:00`;

      // Preserva profissionalId e comissao_percentual por item
      const itensPayload = itensCarrinho.map((it) => ({
        tipo: "produto",
        produtoId: it.produtoId,
        descricao: it.descricao,
        quantidade: it.quantidade,
        valorUnitario: it.precoUnitario,
        profissionalId: it.profissionalId || profissionalId,
        comissao_percentual: it.comissao_percentual,
      }));

      // Monta as parcelas para o backend
      let pagamentosPayload = [];
      if (pagamentos.length === 1 && !pagamentos[0].valorTexto) {
        // Forma única sem valor explicitado: assume o total líquido
        pagamentosPayload = [{ forma: pagamentos[0].forma, valor: totalLiquido }];
      } else {
        pagamentosPayload = pagamentos
          .map((p) => ({
            forma: p.forma,
            valor: parseMoedaParaNumero(p.valorTexto) || 0,
          }))
          .filter((p) => p.valor > 0);
      }

      const formaPrincipal = pagamentosPayload[0]?.forma || formaPagamento || "Pix";
      const transacaoIdAlvo = vendaEditando?.transacao_id || vendaEditando?.id;

      if (isEdicao && transacaoIdAlvo) {
        await atualizarVendaAvulsa({
          transacaoId: transacaoIdAlvo,
          tenantId,
          profissionalId,
          customerId: clienteId || null,
          formaPagamento: formaPrincipal,
          statusPagamento: "pago",
          dataTransacao: dataCompleta,
          desconto: descontoNumerico,
          observacoes,
          itensNovos: itensPayload,
          pagamentos: pagamentosPayload,
        });
      } else {
        await criarVendaAvulsa({
          tenantId,
          profissionalId,
          customerId: clienteId || null,
          formaPagamento: formaPrincipal,
          statusPagamento: "pago",
          dataTransacao: dataCompleta,
          desconto: descontoNumerico,
          observacoes,
          itens: itensPayload,
          pagamentos: pagamentosPayload,
        });
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar venda no PDV:", error);
      setErroMsg("Erro ao salvar venda: " + (error.message || "Tente novamente."));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const produtoSelecionadoObj = produtos.find(
    (p) => String(p.id) === String(produtoParaAdicionarId)
  );

  // Overlay não fecha no clique: evita perder a venda em digitação
  // com um toque acidental na borda (tela pequena). Fecha só por X/Cancelar.
  return (
    <div className="modal-overlay">
      <div
        className="modal-box recebimento-box"
        style={{ maxWidth: "620px" }}
      >
        <div className="modal-header">
          <div className="modal-header-titulo-wrapper">
            <div className="modal-header-icone">
              <ShoppingBag size={20} />
            </div>
            <h2>{isEdicao ? "Editar Venda / Recebimento" : "Ponto de Venda (PDV) — Venda"}</h2>
          </div>
          <button className="btn-fechar" onClick={onClose} disabled={isSaving}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="form-recebimento">
          <div className="form-recebimento-corpo">
            {erroMsg && (
              <div className="aviso-erro-recebimento">
                <AlertTriangle size={18} className="icone-alerta-erro" />
                <span>{erroMsg}</span>
              </div>
            )}

            {/* SELEÇÃO DE PRODUTOS / CARRINHO */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                  Adicionar Produtos à Venda
                </span>
                {produtoSelecionadoObj && (
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Estoque: <strong style={{ color: Number(produtoSelecionadoObj.estoque) <= 0 ? "#EF4444" : "#0F172A" }}>{produtoSelecionadoObj.estoque ?? 0} un.</strong>
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px auto", gap: "8px", alignItems: "flex-end" }}>
                <div className="form-grupo" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.75rem" }}>Produto</label>
                  <select
                    value={produtoParaAdicionarId}
                    onChange={(e) => setProdutoParaAdicionarId(e.target.value)}
                    disabled={loadingDados || isSaving}
                    style={{ fontSize: "0.85rem", padding: "8px" }}
                  >
                    <option value="" disabled>
                      {loadingDados ? "Carregando..." : "Escolha um produto..."}
                    </option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {formatarMoeda(p.preco || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grupo" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.75rem" }}>Qtd.</label>
                  <input
                    type="number"
                    min="1"
                    value={qtdParaAdicionar}
                    onChange={(e) => setQtdParaAdicionar(Math.max(1, Number(e.target.value) || 1))}
                    disabled={isSaving}
                    style={{ textAlign: "center", fontSize: "0.85rem", padding: "8px" }}
                  />
                </div>

                <button
                  type="button"
                  onClick={adicionarAoCarrinho}
                  disabled={!produtoParaAdicionarId || isSaving}
                  style={{
                    padding: "8px 14px",
                    height: "38px",
                    backgroundColor: "var(--cor-primaria, #7c3aed)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.8rem",
                    cursor: !produtoParaAdicionarId || isSaving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: !produtoParaAdicionarId || isSaving ? 0.6 : 1,
                  }}
                >
                  <PlusCircle size={16} /> Adicionar
                </button>
              </div>
            </div>

            {/* LISTA DA CESTA / CARRINHO */}
            <div className="form-grupo">
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Itens da Venda ({itensCarrinho.length})</span>
                {itensCarrinho.length > 0 && (
                  <span style={{ fontSize: "0.8rem", color: "var(--cor-primaria)", fontWeight: "bold" }}>
                    Subtotal: {formatarMoeda(subtotalCarrinho)}
                  </span>
                )}
              </label>

              {itensCarrinho.length === 0 ? (
                <div
                  style={{
                    padding: "1.2rem",
                    backgroundColor: "#F8FAFC",
                    border: "1px dashed #CBD5E1",
                    borderRadius: "10px",
                    textAlign: "center",
                    color: "#94A3B8",
                    fontSize: "0.8rem",
                  }}
                >
                  Nenhum item adicionado ainda. Escolha um produto acima e clique em Adicionar.
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {itensCarrinho.map((item, idx) => (
                    <div
                      key={item.idTemporario}
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: idx === itensCarrinho.length - 1 ? "none" : "1px solid #F1F5F9",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
                        <strong style={{ display: "block", color: "#1E293B", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {item.descricao}
                        </strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            {formatarMoeda(item.precoUnitario)} un.
                          </span>
                          {profissionais.length > 1 && (
                            <select
                              value={item.profissionalId || profissionalId || ""}
                              onChange={(e) => alterarProfissionalItem(item.idTemporario, e.target.value)}
                              disabled={isSaving}
                              style={{
                                fontSize: "0.7rem",
                                padding: "1px 4px",
                                borderRadius: "4px",
                                border: "1px solid #CBD5E1",
                                background: "#F8FAFC",
                                color: "#475569",
                              }}
                              title="Profissional responsável por este item"
                            >
                              {profissionais.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nome}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(item.idTemporario, item.quantidade - 1)}
                          disabled={item.quantidade <= 1 || isSaving}
                          style={{
                            width: "26px",
                            height: "26px",
                            border: "1px solid #CBD5E1",
                            background: "#F8FAFC",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: item.quantidade <= 1 ? "not-allowed" : "pointer",
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: "700", minWidth: "20px", textAlign: "center" }}>
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(item.idTemporario, item.quantidade + 1)}
                          disabled={isSaving}
                          style={{
                            width: "26px",
                            height: "26px",
                            border: "1px solid #CBD5E1",
                            background: "#F8FAFC",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div style={{ minWidth: "80px", textAlign: "right", fontWeight: "700", color: "#0F172A", marginLeft: "12px" }}>
                        {formatarMoeda(item.subtotal)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItem(item.idTemporario)}
                        disabled={isSaving}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          marginLeft: "10px",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DADOS DA VENDA: CLIENTE + PROFISSIONAL */}
            <div className="form-linha-dupla">
              <div className="form-grupo">
                <label>
                  <Users size={15} />
                  <span>Profissional (Vendedora) *</span>
                </label>
                <select
                  value={profissionalId}
                  onChange={(e) => setProfissionalId(e.target.value)}
                  required
                  disabled={loadingDados || isSaving}
                >
                  <option value="" disabled>Selecione...</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-grupo">
                <label>
                  <User size={15} />
                  <span>Cliente (Opcional)</span>
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  disabled={loadingDados || isSaving}
                >
                  <option value="">Consumidor Final (Não identificado)</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PAGAMENTOS (PAGAMENTO MISTO) */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
                  <CreditCard size={15} />
                  <span>Forma de Pagamento *</span>
                </label>
                <button
                  type="button"
                  onClick={adicionarFormaPagamento}
                  disabled={isSaving}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--cor-primaria, #7C3AED)",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  + Dividir pagamento
                </button>
              </div>

              {pagamentos.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: idx === pagamentos.length - 1 ? "4px" : "8px",
                  }}
                >
                  <select
                    value={p.forma}
                    onChange={(e) => alterarFormaPagamentoItem(p.id, "forma", e.target.value)}
                    disabled={isSaving}
                    style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                  </select>

                  {pagamentos.length > 1 && (
                    <>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="R$ 0,00"
                        value={p.valorTexto}
                        onChange={(e) => alterarFormaPagamentoItem(p.id, "valorTexto", e.target.value)}
                        disabled={isSaving}
                        style={{
                          width: "120px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.9rem",
                          textAlign: "right",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removerFormaPagamento(p.id)}
                        disabled={isSaving}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Remover forma"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))}

              {pagamentos.length > 1 && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    marginTop: "6px",
                    fontWeight: "600",
                    color: Math.abs(diferencaPagamento) <= 0.01 ? "#16A34A" : "#D97706",
                  }}
                >
                  {Math.abs(diferencaPagamento) <= 0.01
                    ? `✓ Total conferido: R$ ${totalLiquido.toFixed(2)}`
                    : diferencaPagamento > 0
                    ? `Falta R$ ${diferencaPagamento.toFixed(2)} para fechar o total de R$ ${totalLiquido.toFixed(2)}`
                    : `Soma ultrapassa o total em R$ ${Math.abs(diferencaPagamento).toFixed(2)}`}
                </div>
              )}
            </div>

            {/* DATA DA VENDA */}
            <div className="form-grupo" style={{ marginTop: "8px" }}>
              <label>
                <Calendar size={15} />
                <span>Data da Venda *</span>
              </label>
              <input
                type="date"
                value={dataRecebimento}
                onChange={(e) => setDataRecebimento(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            {/* DESCONTO E OBSERVAÇÕES */}
            <div className="form-linha-dupla">
              <div className="form-grupo">
                <label>
                  <Percent size={15} />
                  <span>Desconto (R$)</span>
                </label>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={descontoTexto}
                  onChange={(e) => setDescontoTexto(aplicarMascaraMoeda(e.target.value))}
                  disabled={isSaving}
                />
              </div>

              <div className="form-grupo">
                <label style={{ fontWeight: "700", color: "var(--cor-primaria)" }}>
                  Total Final a Receber
                </label>
                <div
                  style={{
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "800",
                    fontSize: "1.1rem",
                    color: "var(--cor-primaria)",
                  }}
                >
                  {formatarMoeda(totalLiquido)}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-salvar"
              disabled={isSaving || itensCarrinho.length === 0}
            >
              {isSaving
                ? "Salvando..."
                : isEdicao
                ? "Salvar Alterações"
                : `Finalizar Venda (${formatarMoeda(totalLiquido)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
