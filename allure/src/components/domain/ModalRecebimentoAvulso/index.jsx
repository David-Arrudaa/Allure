import { useState, useEffect } from "react";
import { X, Package, User, Users, Calendar, CreditCard, DollarSign, AlertTriangle } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import "./ModalRecebimentoAvulso.css";

export function ModalRecebimentoAvulso({ isOpen, onClose, onSave, vendaEditando = null }) {
  const { profile, user } = useAuth();
  const tenantId = profile?.tenant_id || user?.tenant_id;

  const [produtos, setProdutos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingDados, setLoadingDados] = useState(false);

  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [qtdOriginal, setQtdOriginal] = useState(1);
  const [valorTotal, setValorTotal] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  const isEdicao = Boolean(vendaEditando && vendaEditando.id);

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
      const [resProdutos, resProfissionais, resClientes] = await Promise.all([
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
        supabase
          .from("customers")
          .select("id, nome")
          .eq("tenant_id", tenantId)
          .order("nome", { ascending: true }),
      ]);

      if (resProdutos.error) throw resProdutos.error;
      if (resProfissionais.error) throw resProfissionais.error;
      if (resClientes.error) throw resClientes.error;

      const prodsList = resProdutos.data || [];
      const profsList = resProfissionais.data || [];
      const clientesList = resClientes.data || [];

      setProdutos(prodsList);
      setProfissionais(profsList);
      setClientes(clientesList);

      if (vendaEditando) {
        // Preencher dados da venda para edição
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

        setProdutoSelecionadoId(prodEncontrado ? prodEncontrado.id : "");
        setQuantidade(qtdDetectada);
        setQtdOriginal(qtdDetectada);
        setValorTotal(
          vendaEditando.valorNum !== undefined
            ? String(vendaEditando.valorNum).replace(".", ",")
            : String(vendaEditando.valor || "").replace("R$", "").trim()
        );
        setProfissionalId(vendaEditando.profissionalId || profsList[0]?.id || "");
        setClienteId(vendaEditando.clienteId || "");
        setFormaPagamento(vendaEditando.forma || "Pix");
        setDataRecebimento(
          vendaEditando.dataIso ||
            (vendaEditando.data_horario ? vendaEditando.data_horario.split("T")[0] : new Date().toISOString().split("T")[0])
        );
      } else {
        // Modo criação: resetar campos
        setProdutoSelecionadoId("");
        setQuantidade(1);
        setQtdOriginal(1);
        setValorTotal("");
        setClienteId("");
        setFormaPagamento("Pix");
        setDataRecebimento(new Date().toISOString().split("T")[0]);

        if (profsList.length > 0) {
          const profLogada = profsList.find((p) => p.id === profile?.id);
          setProfissionalId(profLogada ? profLogada.id : profsList[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados para venda avulsa:", error.message);
    } finally {
      setLoadingDados(false);
    }
  };

  const produtoSelecionadoObj = produtos.find(
    (p) => String(p.id) === String(produtoSelecionadoId)
  );

  const handleProdutoChange = (e) => {
    const prodId = e.target.value;
    setProdutoSelecionadoId(prodId);
    setErroMsg("");

    const prod = produtos.find((p) => String(p.id) === String(prodId));
    if (prod) {
      const precoUnitario = Number(prod.preco || 0);
      const total = precoUnitario * Number(quantidade || 1);
      setValorTotal(total.toFixed(2).replace(".", ","));

      if (!isEdicao && prod.estoque !== undefined && Number(prod.estoque) <= 0) {
        setErroMsg(`Atenção: O produto "${prod.nome}" está com estoque esgotado (0 unidades).`);
      }
    }
  };

  const handleQuantidadeChange = (novaQtd) => {
    const qtdNum = Math.max(1, Number(novaQtd) || 1);
    setQuantidade(qtdNum);

    if (produtoSelecionadoObj) {
      const precoUnitario = Number(produtoSelecionadoObj.preco || 0);
      const total = precoUnitario * qtdNum;
      setValorTotal(total.toFixed(2).replace(".", ","));

      const estoqueBase = Number(produtoSelecionadoObj.estoque || 0);
      const estoqueDisponivel = isEdicao ? estoqueBase + qtdOriginal : estoqueBase;

      if (estoqueDisponivel <= 0) {
        setErroMsg(`Estoque esgotado! O produto "${produtoSelecionadoObj.nome}" possui 0 unidades.`);
      } else if (qtdNum > estoqueDisponivel) {
        setErroMsg(
          `Estoque insuficiente! Você selecionou ${qtdNum} un., mas restam apenas ${estoqueDisponivel} un. disponíveis.`
        );
      } else {
        setErroMsg("");
      }
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (isSaving || !tenantId) return;

    if (!produtoSelecionadoId) {
      setErroMsg("Por favor, selecione um produto para a venda.");
      return;
    }

    if (!profissionalId) {
      setErroMsg("Por favor, selecione a profissional responsável pela venda.");
      return;
    }

    // Validação de estoque disponível
    if (produtoSelecionadoObj && produtoSelecionadoObj.estoque !== undefined) {
      const estoqueBase = Number(produtoSelecionadoObj.estoque || 0);
      const estoqueDisponivel = isEdicao ? estoqueBase + qtdOriginal : estoqueBase;

      if (estoqueDisponivel <= 0) {
        setErroMsg(
          `Não é possível concluir a venda: o produto "${produtoSelecionadoObj.nome}" está com estoque esgotado (0 unidades).`
        );
        return;
      }
      if (quantidade > estoqueDisponivel) {
        setErroMsg(
          `Estoque insuficiente! Você tentou vender ${quantidade} unidade(s), mas o produto "${produtoSelecionadoObj.nome}" possui apenas ${estoqueDisponivel} unidade(s) disponíveis.`
        );
        return;
      }
    }

    const valorNumerico = Number(String(valorTotal).replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErroMsg("Por favor, informe um valor válido para a venda.");
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

      if (isEdicao) {
        // 1. Atualizar agendamento da venda existente
        const { error: updateError } = await supabase
          .from("appointments")
          .update({
            servico: nomeServico,
            valor: valorNumerico,
            data_horario: dataHorarioCompleto,
            forma_pagamento: formaPagamento,
            profissional_id: profissionalId,
            customer_id: clienteId || null,
          })
          .eq("id", vendaEditando.id)
          .eq("tenant_id", tenantId);

        if (updateError) throw updateError;

        // 2. Ajustar a diferença de estoque no produto
        if (produtoSelecionadoObj && produtoSelecionadoObj.estoque !== undefined) {
          const diferenca = Number(qtdOriginal) - Number(quantidade);
          const novoEstoque = Math.max(0, Number(produtoSelecionadoObj.estoque || 0) + diferenca);

          await supabase
            .from("produtos")
            .update({ estoque: novoEstoque })
            .eq("id", produtoSelecionadoObj.id)
            .eq("tenant_id", tenantId);
        }
      } else {
        // 1. Inserir nova venda em appointments
        const { error: insertError } = await supabase.from("appointments").insert([
          {
            servico: nomeServico,
            valor: valorNumerico,
            data_horario: dataHorarioCompleto,
            status: "confirmado",
            pagamento: "pago",
            forma_pagamento: formaPagamento,
            duracao: 0,
            tenant_id: tenantId,
            profissional_id: profissionalId,
            customer_id: clienteId || null,
          },
        ]);

        if (insertError) throw insertError;

        // 2. Baixar o estoque do produto vendido
        if (produtoSelecionadoObj && produtoSelecionadoObj.estoque !== undefined) {
          const estoqueAtual = Number(produtoSelecionadoObj.estoque || 0);
          const novoEstoque = Math.max(0, estoqueAtual - Number(quantidade));

          await supabase
            .from("produtos")
            .update({ estoque: novoEstoque })
            .eq("id", produtoSelecionadoObj.id)
            .eq("tenant_id", tenantId);
        }
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar venda avulsa:", error.message);
      setErroMsg("Erro ao salvar: " + (error.message || "Tente novamente."));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const estoqueAtual = Number(produtoSelecionadoObj?.estoque ?? 0);
  const estoqueDisponivel = isEdicao ? estoqueAtual + qtdOriginal : estoqueAtual;
  const estoqueInsuficiente = produtoSelecionadoObj && estoqueDisponivel < quantidade;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box recebimento-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-titulo-wrapper">
            <div className="modal-header-icone">
              <Package size={20} />
            </div>
            <h2>{isEdicao ? "Editar Venda / Recebimento" : "Recebimento Avulso (Venda)"}</h2>
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

            {/* SELEÇÃO DO PRODUTO */}
            <div className="form-grupo">
              <label>
                <Package size={15} />
                <span>Produto *</span>
              </label>
              <select
                value={produtoSelecionadoId}
                onChange={handleProdutoChange}
                required
                disabled={loadingDados || isSaving}
                className="select-produto-venda"
              >
                <option value="" disabled>
                  {loadingDados ? "Carregando produtos..." : "Selecione um produto..."}
                </option>
                {produtos.map((p) => {
                  const precoFormatado = Number(p.preco || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  });
                  const estoqueText =
                    p.estoque !== undefined ? ` (Estoque: ${p.estoque})` : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {p.nome} {estoqueText} — {precoFormatado}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* ESTOQUE E STATUS */}
            {produtoSelecionadoObj && (
              <div className="info-estoque-bar">
                <span className={`badge-estoque-atual ${estoqueDisponivel <= 0 ? "estoque-zerado" : ""}`}>
                  Estoque disponível: <strong>{estoqueDisponivel} un.</strong>
                </span>
                {estoqueInsuficiente && (
                  <span className="badge-estoque-alerta">
                    ⚠️ {estoqueDisponivel <= 0 ? "Produto esgotado" : "Qtd. maior que o estoque"}
                  </span>
                )}
              </div>
            )}

            <div className="form-linha-dupla">
              {/* QUANTIDADE */}
              <div className="form-grupo form-grupo-qtd">
                <label>Qtd. *</label>
                <div className="input-qtd-wrapper">
                  <button
                    type="button"
                    className="btn-qtd-step"
                    onClick={() => handleQuantidadeChange(quantidade - 1)}
                    disabled={quantidade <= 1 || isSaving}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => handleQuantidadeChange(e.target.value)}
                    required
                    disabled={isSaving}
                    className="input-qtd-numero"
                  />
                  <button
                    type="button"
                    className="btn-qtd-step"
                    onClick={() => handleQuantidadeChange(quantidade + 1)}
                    disabled={isSaving}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* VALOR TOTAL */}
              <div className="form-grupo form-grupo-valor">
                <label>
                  <DollarSign size={15} />
                  <span>Valor Total (R$) *</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 50,00"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  required
                  disabled={isSaving}
                  className="input-valor-venda"
                />
              </div>
            </div>

            <div className="form-linha-dupla">
              {/* DATA */}
              <div className="form-grupo">
                <label>
                  <Calendar size={15} />
                  <span>Data *</span>
                </label>
                <input
                  type="date"
                  value={dataRecebimento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* FORMA DE PAGAMENTO */}
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
            </div>

            <div className="form-linha-dupla">
              {/* VENDEDORA / PROFISSIONAL */}
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
                  <option value="" disabled>Selecione a profissional...</option>
                  {profissionais.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* CLIENTE (OPCIONAL) */}
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
                  <option value="">Não informado</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
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
            <button type="submit" className="btn-salvar" disabled={isSaving}>
              {isSaving
                ? "Salvando..."
                : isEdicao
                ? "Salvar Alterações"
                : "Salvar Recebimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

