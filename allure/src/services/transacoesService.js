import { supabase } from "./supabase";

/**
 * Normaliza a lista de pagamentos e devolve um rótulo legível para
 * `transacoes.forma_pagamento`, que as telas legadas (Financeiro, Relatórios,
 * Agenda) ainda leem como string única.
 * Uma forma -> o nome dela. Várias -> "Misto (Pix + Dinheiro)".
 */
function resolverPagamentos(pagamentos, formaPagamentoFallback, valorTotal) {
  const lista = (pagamentos || [])
    .map((p) => ({
      forma: p.forma || p.forma_pagamento || formaPagamentoFallback,
      valor: Math.round((Number(p.valor) || 0) * 100) / 100,
    }))
    .filter((p) => p.valor > 0);

  // Venda sem divisão (ou fluxo legado): uma linha com o total.
  if (lista.length === 0) {
    return {
      lista: [{ forma: formaPagamentoFallback, valor: valorTotal }],
      rotulo: formaPagamentoFallback,
    };
  }

  if (lista.length === 1) return { lista, rotulo: lista[0].forma };

  return {
    lista,
    rotulo: `Misto (${lista.map((p) => p.forma).join(" + ")})`,
  };
}

/**
 * Grava as parcelas de pagamento de uma transação em `transacao_pagamentos`.
 * ponytail: não é atômico com o header — se falhar, o chamador desfaz a
 * transação. Migrar para RPC transacional junto com a baixa de estoque.
 */
async function salvarPagamentos(tenantId, transacaoId, lista) {
  if (!lista || lista.length === 0) return;
  const { error } = await supabase.from("transacao_pagamentos").insert(
    lista.map((p) => ({
      tenant_id: tenantId,
      transacao_id: transacaoId,
      forma_pagamento: p.forma,
      valor: p.valor,
    })),
  );
  if (error) throw error;
}

/**
 * Cria uma nova venda avulsa de produtos ou serviços com múltiplos itens (Header / Detail).
 * - Cria registro na tabela `transacoes`
 * - Cria as parcelas de pagamento em `transacao_pagamentos` (pagamento misto)
 * - Cria múltiplos itens na tabela `transacao_itens`
 * - Atualiza o estoque de cada produto vendido
 * - Cria registro espelho em `appointments` para manter compatibilidade com telas legadas
 */
export async function criarVendaAvulsa({
  tenantId,
  profissionalId,
  customerId = null,
  formaPagamento = "Pix",
  statusPagamento = "pago",
  dataTransacao = new Date().toISOString(),
  desconto = 0,
  observacoes = null,
  itens = [], // Array de { tipo: 'produto'|'servico', produtoId, servicoId, descricao, quantidade, valorUnitario, profissionalId, comissao_percentual }
  pagamentos = [], // Array de { forma, valor }. Vazio = uma forma só, com o total.
}) {
  if (!tenantId) throw new Error("tenantId é obrigatório.");
  if (!itens || itens.length === 0) throw new Error("A venda deve conter pelo menos um item.");

  // 1. Busca dados da profissional pra fallback da comissão
  let comissaoPadraoProduto = 0;
  let comissaoPadraoServico = 0;
  if (profissionalId) {
    const { data: prof } = await supabase
      .from("profissionais")
      .select("comissao_produtos, comissao_servicos")
      .eq("id", profissionalId)
      .single();
    if (prof) {
      comissaoPadraoProduto = Number(prof.comissao_produtos) || 0;
      comissaoPadraoServico = Number(prof.comissao_servicos) || 0;
    }
  }

  // Busca config de taxa do tenant
  const { data: tenantConf } = await supabase
    .from("tenants")
    .select("taxa_cartao_debito, taxa_cartao_credito, descontar_taxa_cartao_comissao")
    .eq("id", tenantId)
    .single();

  let taxaCartao = 0;
  if (tenantConf?.descontar_taxa_cartao_comissao) {
    const fPag = formaPagamento.toLowerCase();
    if (fPag.includes("débito") || fPag.includes("debito")) taxaCartao = Number(tenantConf.taxa_cartao_debito) || 0;
    else if (fPag.includes("crédito") || fPag.includes("credito") || fPag.includes("cartão")) taxaCartao = Number(tenantConf.taxa_cartao_credito) || 0;
  }

  // 1. Calcula os totais dos itens e resolve comissão
  let valorTotal = 0;
  const itensCalculados = itens.map((item) => {
    const qtd = Math.max(1, Number(item.quantidade) || 1);
    const vUnit = Math.max(0, Number(item.valorUnitario) || 0);
    const subtotal = Math.round(qtd * vUnit * 100) / 100;
    valorTotal += subtotal;

    const tipo = item.tipo || "produto";
    let pctComissao = Number(item.comissao_percentual);
    if (isNaN(pctComissao) || item.comissao_percentual === undefined || item.comissao_percentual === null) {
      pctComissao = tipo === "produto" ? comissaoPadraoProduto : comissaoPadraoServico;
    }

    const valorBaseComissao = subtotal - (subtotal * (taxaCartao / 100));
    const valComissao = Math.round(valorBaseComissao * (pctComissao / 100) * 100) / 100;

    return {
      tenant_id: tenantId,
      tipo,
      produto_id: tipo === "servico" ? null : (item.produtoId || null),
      servico_id: tipo === "produto" ? null : (item.servicoId || null),
      profissional_id: item.profissionalId || profissionalId, // Suporte a multiprofissional (Fase 3)
      descricao: item.descricao || "Item sem descrição",
      quantidade: qtd,
      valor_unitario: vUnit,
      subtotal,
      comissao_percentual_aplicada: pctComissao,
      valor_comissao: valComissao,
    };
  });

  const descontoNum = Math.max(0, Number(desconto) || 0);
  const valorTotalFinal = Math.max(0, Math.round(valorTotal * 100) / 100);
  const valorLiquido = Math.max(0, Math.round((valorTotalFinal - descontoNum) * 100) / 100);

  // Resolve pagamentos ANTES do insert: o header grava o rótulo consolidado
  // que as telas legadas leem como string única.
  const { lista: listaPagamentos, rotulo: rotuloPagamento } = resolverPagamentos(
    pagamentos,
    formaPagamento,
    valorLiquido,
  );

  // Validação prévia de estoque insuficiente para todos os itens de produto
  for (const item of itensCalculados) {
    if (item.tipo === "produto" && item.produto_id) {
      const { data: prodCheck } = await supabase
        .from("produtos")
        .select("nome, estoque")
        .eq("id", item.produto_id)
        .eq("tenant_id", tenantId)
        .single();

      if (prodCheck) {
        const estAtual = Number(prodCheck.estoque || 0);
        if (estAtual < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para "${prodCheck.nome}". Disponível: ${estAtual} un., Solicitado: ${item.quantidade} un.`
          );
        }
      }
    }
  }

  // 2. Insere a transação Header
  const { data: transacao, error: errTransacao } = await supabase
    .from("transacoes")
    .insert([
      {
        tenant_id: tenantId,
        tipo: "venda_avulsa",
        customer_id: customerId,
        profissional_id: profissionalId,
        data_transacao: dataTransacao,
        forma_pagamento: rotuloPagamento,
        status_pagamento: statusPagamento,
        valor_total: valorTotalFinal,
        desconto: descontoNum,
        observacoes,
      },
    ])
    .select()
    .single();

  if (errTransacao) throw errTransacao;

  // 3. Insere os itens vinculados ao transacao_id
  const itensParaSalvar = itensCalculados.map((it) => ({
    ...it,
    transacao_id: transacao.id,
  }));

  const { data: itensCriados, error: errItens } = await supabase
    .from("transacao_itens")
    .insert(itensParaSalvar)
    .select();

  if (errItens) {
    // Se falhar os itens, desfaz a transação para não ficar órfão
    await supabase.from("transacoes").delete().eq("id", transacao.id);
    throw errItens;
  }

  // 3b. Grava as parcelas de pagamento (pagamento misto)
  try {
    await salvarPagamentos(tenantId, transacao.id, listaPagamentos);
  } catch (errPagamentos) {
    // Mesmo desfazer em cascata dos itens: sem as parcelas o caixa não fecha.
    await supabase.from("transacao_itens").delete().eq("transacao_id", transacao.id);
    await supabase.from("transacoes").delete().eq("id", transacao.id);
    throw errPagamentos;
  }

  // 4. Baixa atômica de estoque dos produtos vendidos via RPC (seguro contra race condition)
  for (const item of itensCalculados) {
    if (item.tipo === "produto" && item.produto_id) {
      const { error: errEstoque } = await supabase.rpc("ajustar_estoque", {
        p_produto_id: item.produto_id,
        p_delta: -item.quantidade,
      });

      if (errEstoque) {
        console.error("Erro na baixa atômica de estoque:", errEstoque);
        // Fallback defensivo caso a RPC não esteja acessível por permissão
        const { data: prodAtual } = await supabase
          .from("produtos")
          .select("id, estoque")
          .eq("id", item.produto_id)
          .eq("tenant_id", tenantId)
          .single();

        if (prodAtual && prodAtual.estoque !== undefined) {
          const novoEstoque = Math.max(0, Number(prodAtual.estoque || 0) - item.quantidade);
          await supabase
            .from("produtos")
            .update({ estoque: novoEstoque })
            .eq("id", prodAtual.id)
            .eq("tenant_id", tenantId);
        }
      }
    }
  }

  // 5. Cria registro espelho em appointments para compatibilidade retroativa com a agenda/relatórios
  const resumoDescricao = itensCalculados.length === 1
    ? `Venda: ${itensCalculados[0].descricao}${itensCalculados[0].quantidade > 1 ? ` (${itensCalculados[0].quantidade}x)` : ""}`
    : `Venda: ${itensCalculados.length} itens`;

  const primeiroProdutoId = itensCalculados.find((i) => i.produto_id)?.produto_id || null;
  const quantidadeTotal = itensCalculados.reduce((acc, curr) => acc + curr.quantidade, 0);

  const { error: errEspelho } = await supabase.from("appointments").insert([
    {
      tenant_id: tenantId,
      transacao_id: transacao.id,
      customer_id: customerId,
      profissional_id: profissionalId,
      servico: resumoDescricao,
      valor: valorTotalFinal - descontoNum,
      data_horario: dataTransacao,
      status: "confirmado",
      pagamento: statusPagamento,
      forma_pagamento: formaPagamento,
      duracao: 0,
      produto_id: primeiroProdutoId,
      quantidade: quantidadeTotal,
    },
  ]);

  if (errEspelho) {
    console.warn("Aviso ao criar registro espelho em appointments:", errEspelho.message);
  }

  return {
    ...transacao,
    itens: itensCriados,
  };
}

/**
 * Atualiza uma venda avulsa existente (recalcula estoque, altera cabeçalho e itens).
 */
export async function atualizarVendaAvulsa({
  transacaoId,
  tenantId,
  profissionalId,
  customerId = null,
  formaPagamento = "Pix",
  statusPagamento = "pago",
  dataTransacao,
  desconto = 0,
  observacoes = null,
  itensNovos = [],
  pagamentos = [], // Array de { forma, valor }. Vazio = uma forma só, com o total.
}) {
  if (!transacaoId || !tenantId) throw new Error("transacaoId e tenantId são obrigatórios.");
  if (!itensNovos || itensNovos.length === 0) throw new Error("A venda deve conter pelo menos um item.");

  // 1. Busca itens antigos para reconciliar estoque
  const { data: itensAntigos, error: errBuscaAntigos } = await supabase
    .from("transacao_itens")
    .select("*")
    .eq("transacao_id", transacaoId)
    .eq("tenant_id", tenantId);

  if (errBuscaAntigos) throw errBuscaAntigos;

  // Busca dados da profissional pra fallback da comissão
  let comissaoPadraoProduto = 0;
  let comissaoPadraoServico = 0;
  if (profissionalId) {
    const { data: prof } = await supabase
      .from("profissionais")
      .select("comissao_produtos, comissao_servicos")
      .eq("id", profissionalId)
      .single();
    if (prof) {
      comissaoPadraoProduto = Number(prof.comissao_produtos) || 0;
      comissaoPadraoServico = Number(prof.comissao_servicos) || 0;
    }
  }

  // Busca config de taxa do tenant
  const { data: tenantConf } = await supabase
    .from("tenants")
    .select("taxa_cartao_debito, taxa_cartao_credito, descontar_taxa_cartao_comissao")
    .eq("id", tenantId)
    .single();

  let taxaCartao = 0;
  if (tenantConf?.descontar_taxa_cartao_comissao) {
    const fPag = formaPagamento.toLowerCase();
    if (fPag.includes("débito") || fPag.includes("debito")) taxaCartao = Number(tenantConf.taxa_cartao_debito) || 0;
    else if (fPag.includes("crédito") || fPag.includes("credito") || fPag.includes("cartão")) taxaCartao = Number(tenantConf.taxa_cartao_credito) || 0;
  }

  // 2. Devolve todo o estoque dos itens antigos de produto via RPC atômica
  for (const itemAntigo of (itensAntigos || [])) {
    if (itemAntigo.tipo === "produto" && itemAntigo.produto_id) {
      const { error: errDev } = await supabase.rpc("ajustar_estoque", {
        p_produto_id: itemAntigo.produto_id,
        p_delta: Number(itemAntigo.quantidade || 0),
      });

      if (errDev) {
        // Fallback defensivo
        const { data: prod } = await supabase
          .from("produtos")
          .select("id, estoque")
          .eq("id", itemAntigo.produto_id)
          .eq("tenant_id", tenantId)
          .single();

        if (prod) {
          await supabase
            .from("produtos")
            .update({ estoque: Number(prod.estoque || 0) + Number(itemAntigo.quantidade || 0) })
            .eq("id", prod.id)
            .eq("tenant_id", tenantId);
        }
      }
    }
  }

  // 3. Remove itens antigos da transação
  await supabase
    .from("transacao_itens")
    .delete()
    .eq("transacao_id", transacaoId)
    .eq("tenant_id", tenantId);

  // 4. Calcula novos itens e debita estoque (preserva comissão e profissional por item)
  let valorTotal = 0;
  const itensCalculados = itensNovos.map((item) => {
    const qtd = Math.max(1, Number(item.quantidade) || 1);
    const vUnit = Math.max(0, Number(item.valorUnitario) || 0);
    const subtotal = Math.round(qtd * vUnit * 100) / 100;
    valorTotal += subtotal;

    const tipo = item.tipo || "produto";
    let pctComissao = Number(item.comissao_percentual);
    if (
      isNaN(pctComissao) ||
      item.comissao_percentual === undefined ||
      item.comissao_percentual === null
    ) {
      pctComissao = tipo === "produto" ? comissaoPadraoProduto : comissaoPadraoServico;
    }

    const valorBaseComissao = subtotal - subtotal * (taxaCartao / 100);
    const valComissao = Math.round(valorBaseComissao * (pctComissao / 100) * 100) / 100;

    return {
      transacao_id: transacaoId,
      tenant_id: tenantId,
      tipo,
      produto_id: tipo === "servico" ? null : (item.produtoId || null),
      servico_id: tipo === "produto" ? null : (item.servicoId || null),
      profissional_id: item.profissionalId || profissionalId,
      descricao: item.descricao || "Item sem descrição",
      quantidade: qtd,
      valor_unitario: vUnit,
      subtotal,
      comissao_percentual_aplicada: pctComissao,
      valor_comissao: valComissao,
    };
  });

  // Insere novos itens
  const { data: itensSalvos, error: errNovosItens } = await supabase
    .from("transacao_itens")
    .insert(itensCalculados)
    .select();

  if (errNovosItens) throw errNovosItens;

  // Debita novo estoque via RPC atômica
  for (const item of itensCalculados) {
    if (item.tipo === "produto" && item.produto_id) {
      const { error: errDeb } = await supabase.rpc("ajustar_estoque", {
        p_produto_id: item.produto_id,
        p_delta: -item.quantidade,
      });

      if (errDeb) {
        // Fallback defensivo
        const { data: prod } = await supabase
          .from("produtos")
          .select("id, estoque")
          .eq("id", item.produto_id)
          .eq("tenant_id", tenantId)
          .single();

        if (prod) {
          const novoEstoque = Math.max(0, Number(prod.estoque || 0) - item.quantidade);
          await supabase
            .from("produtos")
            .update({ estoque: novoEstoque })
            .eq("id", prod.id)
            .eq("tenant_id", tenantId);
        }
      }
    }
  }

  const descontoNum = Math.max(0, Number(desconto) || 0);
  const valorTotalFinal = Math.max(0, Math.round(valorTotal * 100) / 100);
  const valorLiquido = Math.max(0, Math.round((valorTotalFinal - descontoNum) * 100) / 100);

  // Resolve pagamentos e substitui em transacao_pagamentos
  const { lista: listaPagamentos, rotulo: rotuloPagamento } = resolverPagamentos(
    pagamentos,
    formaPagamento,
    valorLiquido,
  );

  await supabase
    .from("transacao_pagamentos")
    .delete()
    .eq("transacao_id", transacaoId)
    .eq("tenant_id", tenantId);

  await salvarPagamentos(tenantId, transacaoId, listaPagamentos);

  // 5. Atualiza o cabeçalho em transacoes
  const { data: transacaoAtualizada, error: errUpdateTransacao } = await supabase
    .from("transacoes")
    .update({
      customer_id: customerId,
      profissional_id: profissionalId,
      data_transacao: dataTransacao,
      forma_pagamento: rotuloPagamento,
      status_pagamento: statusPagamento,
      valor_total: valorTotalFinal,
      desconto: descontoNum,
      observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transacaoId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (errUpdateTransacao) throw errUpdateTransacao;

  // 6. Atualiza o registro espelho em appointments
  const resumoDescricao = itensCalculados.length === 1
    ? `Venda: ${itensCalculados[0].descricao}${itensCalculados[0].quantidade > 1 ? ` (${itensCalculados[0].quantidade}x)` : ""}`
    : `Venda: ${itensCalculados.length} itens`;

  const primeiroProdutoId = itensCalculados.find((i) => i.produto_id)?.produto_id || null;
  const quantidadeTotal = itensCalculados.reduce((acc, curr) => acc + curr.quantidade, 0);

  await supabase
    .from("appointments")
    .update({
      customer_id: customerId,
      profissional_id: profissionalId,
      servico: resumoDescricao,
      valor: valorTotalFinal - descontoNum,
      data_horario: dataTransacao,
      forma_pagamento: formaPagamento,
      produto_id: primeiroProdutoId,
      quantidade: quantidadeTotal,
    })
    .eq("transacao_id", transacaoId)
    .eq("tenant_id", tenantId);

  return {
    ...transacaoAtualizada,
    itens: itensSalvos,
  };
}

/**
 * Exclui uma venda avulsa:
 * - Devolve o estoque de todos os produtos que compunham a venda
 * - Deleta o registro em transacoes (os itens são apagados em cascata)
 * - Deleta o registro espelho em appointments
 */
export async function excluirVendaAvulsa({ transacaoId, tenantId }) {
  if (!transacaoId || !tenantId) throw new Error("transacaoId e tenantId são obrigatórios.");

  // 1. Busca os itens da transação para devolução de estoque
  const { data: itens, error: errItens } = await supabase
    .from("transacao_itens")
    .select("*")
    .eq("transacao_id", transacaoId)
    .eq("tenant_id", tenantId);

  if (errItens) throw errItens;

  // 2. Devolve estoque dos produtos
  for (const item of (itens || [])) {
    if (item.tipo === "produto" && item.produto_id) {
      const { data: prod } = await supabase
        .from("produtos")
        .select("id, estoque")
        .eq("id", item.produto_id)
        .eq("tenant_id", tenantId)
        .single();

      if (prod) {
        await supabase
          .from("produtos")
          .update({ estoque: Number(prod.estoque || 0) + Number(item.quantidade || 0) })
          .eq("id", prod.id)
          .eq("tenant_id", tenantId);
      }
    }
  }

  // 3. Deleta o espelho em appointments primeiro (se houver)
  await supabase
    .from("appointments")
    .delete()
    .eq("transacao_id", transacaoId)
    .eq("tenant_id", tenantId);

  // 4. Deleta a transação (transacao_itens deleta em cascata)
  const { error: errDelete } = await supabase
    .from("transacoes")
    .delete()
    .eq("id", transacaoId)
    .eq("tenant_id", tenantId);

  if (errDelete) throw errDelete;

  return true;
}

/**
 * Lista transações filtradas por período, profissional e texto, trazendo os itens associados.
 */
export async function listarTransacoes({
  tenantId,
  dataInicio,
  dataFim,
  profissionalId = null,
  tipo = null, // 'atendimento', 'venda_avulsa'
  busca = "",
  pagina = 1,
  itensPorPagina = 20,
}) {
  if (!tenantId) return { transacoes: [], total: 0 };

  let query = supabase
    .from("transacoes")
    .select(
      `
      id,
      tenant_id,
      tipo,
      customer_id,
      profissional_id,
      data_transacao,
      forma_pagamento,
      status_pagamento,
      valor_total,
      desconto,
      valor_liquido,
      observacoes,
      created_at,
      customers ( id, nome, telefone ),
      profissionais ( id, nome ),
      transacao_itens ( id, tipo, produto_id, servico_id, descricao, quantidade, valor_unitario, subtotal )
    `,
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .order("data_transacao", { ascending: false });

  if (dataInicio) query = query.gte("data_transacao", dataInicio);
  if (dataFim) query = query.lte("data_transacao", dataFim);
  if (profissionalId) query = query.eq("profissional_id", profissionalId);
  if (tipo) query = query.eq("tipo", tipo);

  const offset = (pagina - 1) * itensPorPagina;
  query = query.range(offset, offset + itensPorPagina - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  let resultado = data || [];

  // Filtro de busca textual em memória se preenchido (nome do cliente ou descrição do item)
  if (busca && busca.trim().length > 0) {
    const termo = busca.trim().toLowerCase();
    resultado = resultado.filter((t) => {
      const nomeCliente = t.customers?.nome?.toLowerCase() || "";
      const temNoItem = (t.transacao_itens || []).some((it) =>
        it.descricao?.toLowerCase().includes(termo)
      );
      return nomeCliente.includes(termo) || temNoItem;
    });
  }

  return {
    transacoes: resultado,
    total: count || resultado.length,
  };
}

/**
 * Registra consumo interno (lavatório, uso profissional)
 */
export async function registrarConsumoInterno({
  tenantId,
  produtoId,
  quantidade,
  profissionalId,
  motivo = "Uso Interno"
}) {
  if (!tenantId || !produtoId) throw new Error("Faltam dados obrigatórios");

  const qtd = Math.max(1, Number(quantidade) || 1);

  // Header com valor zero
  const { data: transacao, error: errTr } = await supabase
    .from("transacoes")
    .insert([{
      tenant_id: tenantId,
      tipo: "consumo_interno",
      profissional_id: profissionalId || null,
      data_transacao: new Date().toISOString(),
      forma_pagamento: "N/A",
      status_pagamento: "concluido",
      valor_total: 0,
      desconto: 0,
      motivo
    }])
    .select().single();
  if (errTr) throw errTr;

  // Busca dados do produto
  const { data: prod } = await supabase
    .from("produtos")
    .select("nome, estoque")
    .eq("id", produtoId)
    .single();

  // Detail
  const { error: errIt } = await supabase
    .from("transacao_itens")
    .insert([{
      tenant_id: tenantId,
      transacao_id: transacao.id,
      tipo: "produto",
      produto_id: produtoId,
      profissional_id: profissionalId || null,
      descricao: prod ? prod.nome : "Consumo",
      quantidade: qtd,
      valor_unitario: 0,
      subtotal: 0,
      comissao_percentual_aplicada: 0,
      valor_comissao: 0
    }]);
  if (errIt) throw errIt;

  // Baixa atômica de estoque via RPC
  const { error: errEstoque } = await supabase.rpc("ajustar_estoque", {
    p_produto_id: produtoId,
    p_delta: -qtd,
  });

  if (errEstoque) {
    // Fallback defensivo
    if (prod && prod.estoque !== undefined) {
      const novoEstoque = Math.max(0, Number(prod.estoque || 0) - qtd);
      await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", produtoId);
    }
  }

  return transacao;
}

/**
 * Processa o pagamento de um agendamento da Agenda:
 * - Garante a criação ou atualização do cabeçalho em `transacoes`
 * - Garante o registro do item de serviço em `transacao_itens`
 * - Atualiza `appointments` marcando como pago e associando a forma de pagamento
 */
export async function registrarPagamentoAgendamento({
  appointmentId,
  tenantId,
  formaPagamento = "Pix",
  valor = null,
  observacao = null,
}) {
  if (!appointmentId || !tenantId) {
    throw new Error("appointmentId e tenantId são obrigatórios.");
  }

  // Busca config de taxa do tenant
  const { data: tenantConf } = await supabase
    .from("tenants")
    .select("taxa_cartao_debito, taxa_cartao_credito, descontar_taxa_cartao_comissao")
    .eq("id", tenantId)
    .single();

  let taxaCartao = 0;
  if (tenantConf?.descontar_taxa_cartao_comissao) {
    const fPag = formaPagamento.toLowerCase();
    if (fPag.includes("débito") || fPag.includes("debito")) taxaCartao = Number(tenantConf.taxa_cartao_debito) || 0;
    else if (fPag.includes("crédito") || fPag.includes("credito") || fPag.includes("cartão")) taxaCartao = Number(tenantConf.taxa_cartao_credito) || 0;
  }

  // 1. Busca os dados atuais do agendamento
  const { data: agendamento, error: errAg } = await supabase
    .from("appointments")
    .select("*, customers(id, nome)")
    .eq("id", appointmentId)
    .eq("tenant_id", tenantId)
    .single();

  if (errAg || !agendamento) {
    throw new Error("Agendamento não encontrado: " + (errAg?.message || ""));
  }

  const valorFinal = valor !== null && valor !== undefined
    ? Math.max(0, Number(valor) || 0)
    : Math.max(0, Number(agendamento.valor) || 0);

  let transacaoId = agendamento.transacao_id;

  if (transacaoId) {
    // 2. Atualiza a transação existente
    await supabase
      .from("transacoes")
      .update({
        forma_pagamento: formaPagamento,
        status_pagamento: "pago",
        valor_total: valorFinal,
        observacoes: observacao || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transacaoId)
      .eq("tenant_id", tenantId);

    // Atualiza subtotal do item se existir
    await supabase
      .from("transacao_itens")
      .update({
        valor_unitario: valorFinal,
        subtotal: valorFinal,
      })
      .eq("transacao_id", transacaoId)
      .eq("tenant_id", tenantId);
  } else {
    // 3. Cria uma nova transação Header
    const { data: novaTransacao, error: errTransacao } = await supabase
      .from("transacoes")
      .insert([
        {
          tenant_id: tenantId,
          tipo: "atendimento",
          customer_id: agendamento.customer_id,
          profissional_id: agendamento.profissional_id,
          data_transacao: agendamento.data_horario || new Date().toISOString(),
          forma_pagamento: formaPagamento,
          status_pagamento: "pago",
          valor_total: valorFinal,
          desconto: 0.0,
          observacoes: observacao,
        },
      ])
      .select()
      .single();

    if (errTransacao) throw errTransacao;
    transacaoId = novaTransacao.id;

    // 4. Busca comissão padrão da profissional para fallback
    let pctComissao = 0;
    if (agendamento.profissional_id) {
      const { data: prof } = await supabase
        .from("profissionais")
        .select("comissao_servicos")
        .eq("id", agendamento.profissional_id)
        .single();
      if (prof) {
        pctComissao = Number(prof.comissao_servicos) || 0;
      }
    }
    const valorBaseComissao = valorFinal - (valorFinal * (taxaCartao / 100));
    const valComissao = Math.round(valorBaseComissao * (pctComissao / 100) * 100) / 100;

    // 5. Cria o item do serviço em transacao_itens
    await supabase.from("transacao_itens").insert([
      {
        tenant_id: tenantId,
        transacao_id: transacaoId,
        tipo: "servico",
        servico_id: null,
        produto_id: null,
        descricao: agendamento.servico || "Atendimento",
        quantidade: 1,
        valor_unitario: valorFinal,
        subtotal: valorFinal,
        comissao_percentual_aplicada: pctComissao,
        valor_comissao: valComissao,
      },
    ]);
  }

  // 6. Atualiza o agendamento em appointments
  const { error: errApp } = await supabase
    .from("appointments")
    .update({
      transacao_id: transacaoId,
      pagamento: "pago",
      status: "confirmado",
      forma_pagamento: formaPagamento,
      valor: valorFinal,
    })
    .eq("id", appointmentId)
    .eq("tenant_id", tenantId);

  if (errApp) throw errApp;

  return { success: true, transacaoId };
}

/**
 * Estorna/desfaz o pagamento de um agendamento da Agenda:
 * - Atualiza `appointments.pagamento = 'pendente'`
 * - Atualiza `transacoes.status_pagamento = 'pendente'`
 */
export async function desfazerPagamentoAgendamento({ appointmentId, tenantId }) {
  if (!appointmentId || !tenantId) {
    throw new Error("appointmentId e tenantId são obrigatórios.");
  }

  // 1. Busca o agendamento para localizar o transacao_id
  const { data: agendamento, error: errAg } = await supabase
    .from("appointments")
    .select("id, transacao_id")
    .eq("id", appointmentId)
    .eq("tenant_id", tenantId)
    .single();

  if (errAg || !agendamento) {
    throw new Error("Agendamento não encontrado.");
  }

  // 2. Atualiza appointments
  await supabase
    .from("appointments")
    .update({
      pagamento: "pendente",
      forma_pagamento: null,
    })
    .eq("id", appointmentId)
    .eq("tenant_id", tenantId);

  // 3. Atualiza a transação correspondente para pendente
  if (agendamento.transacao_id) {
    await supabase
      .from("transacoes")
      .update({
        status_pagamento: "pendente",
        forma_pagamento: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agendamento.transacao_id)
      .eq("tenant_id", tenantId);
  }

  return { success: true };
}

