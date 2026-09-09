import { useState, useEffect, useMemo } from "react";
import {
  X,
  Package,
  User,
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
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchProdutos } from "../../../services/produtosService";
import { fetchProfissionais } from "../../../services/equipeService";
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
        fetchProfissionais(tenantId).catch(() => []),
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
        setFormaPagamento(
          vendaEditando.forma_pagamento || vendaEditando.forma || "Pix"
        );
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

  // Ações do Carrinho
  const adicionarAoCarrinho = () => {
    if (!produtoParaAdicionarId) {
      setErroMsg("Selecione um produto para adicionar.");
      return;
    }

    const prod = produtos.find((p) => String(p.id) === String(produtoParaAdicionarId));
    if (!prod) return;

    const qtd = Math.max(1, Number(qtdParaAdicionar) || 1);
    const precoUnitario = Number(prod.preco || 0);

    const indexExistente = itensCarrinho.findIndex(
      (it) => String(it.produtoId) === String(prod.id)
    );

    if (indexExistente >= 0) {
      const novaQtd = itensCarrinho[indexExistente].quantidade + qtd;
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

    setIsSaving(true);
    setErroMsg("");

    try {
      const horaAgora = new Date();
      const horaStr = String(horaAgora.getHours()).padStart(2, "0");
      const minStr = String(horaAgora.getMinutes()).padStart(2, "0");
      const dataCompleta = `${dataRecebimento}T${horaStr}:${minStr}:00-03:00`;

      const itensPayload = itensCarrinho.map((it) => ({
        tipo: "produto",
        produtoId: it.produtoId,
        descricao: it.descricao,
        quantidade: it.quantidade,
        valorUnitario: it.precoUnitario,
      }));

      const transacaoIdAlvo = vendaEditando?.transacao_id || vendaEditando?.id;

      if (isEdicao && transacaoIdAlvo) {
        await atualizarVendaAvulsa({
          transacaoId: transacaoIdAlvo,
          tenantId,
          profissionalId,
          customerId: clienteId || null,
          formaPagamento,
          statusPagamento: "pago",
          dataTransacao: dataCompleta,
          desconto: descontoNumerico,
          observacoes,
          itensNovos: itensPayload,
        });
      } else {
        await criarVendaAvulsa({
          tenantId,
          profissionalId,
          customerId: clienteId || null,
          formaPagamento,
          statusPagamento: "pago",
          dataTransacao: dataCompleta,
          desconto: descontoNumerico,
          observacoes,
          itens: itensPayload,
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box recebimento-box"
        style={{ maxWidth: "620px" }}
        onClick={(e) => e.stopPropagation()}
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
                        <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          {formatarMoeda(item.precoUnitario)} un.
                        </span>
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

            {/* PAGAMENTO + DATA */}
            <div className="form-linha-dupla">
              <div className="form-grupo">
                <label>
                  <CreditCard size={15} />
                  <span>Forma de Pagamento *</span>
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  required
                  disabled={isSaving}
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                </select>
              </div>

              <div className="form-grupo">
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
