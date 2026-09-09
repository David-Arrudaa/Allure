import { supabase } from "./supabase";

/**
 * Cria uma nova venda avulsa de produtos ou serviços com múltiplos itens (Header / Detail).
 * - Cria registro na tabela `transacoes`
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
  itens = [], // Array de { tipo: 'produto'|'servico', produtoId, servicoId, descricao, quantidade, valorUnitario }
}) {
  if (!tenantId) throw new Error("tenantId é obrigatório.");
  if (!itens || itens.length === 0) throw new Error("A venda deve conter pelo menos um item.");

  // 1. Calcula os totais dos itens
  let valorTotal = 0;
  const itensCalculados = itens.map((item) => {
    const qtd = Math.max(1, Number(item.quantidade) || 1);
    const vUnit = Math.max(0, Number(item.valorUnitario) || 0);
    const subtotal = Math.round(qtd * vUnit * 100) / 100;
    valorTotal += subtotal;

    return {
      tenant_id: tenantId,
      tipo: item.tipo || "produto",
      produto_id: item.tipo === "servico" ? null : (item.produtoId || null),
      servico_id: item.tipo === "produto" ? null : (item.servicoId || null),
      descricao: item.descricao || "Item sem descrição",
      quantidade: qtd,
      valor_unitario: vUnit,
      subtotal,
    };
  });

  const descontoNum = Math.max(0, Number(desconto) || 0);
  const valorTotalFinal = Math.max(0, Math.round(valorTotal * 100) / 100);

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
        forma_pagamento: formaPagamento,
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

  // 4. Baixa estoque dos produtos vendidos
  for (const item of itensCalculados) {
    if (item.tipo === "produto" && item.produto_id) {
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
  formaPagamento,
  statusPagamento,
  dataTransacao,
  desconto = 0,
  observacoes = null,
  itensNovos = [],
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

  // 2. Devolve todo o estoque dos itens antigos de produto
  for (const itemAntigo of (itensAntigos || [])) {
    if (itemAntigo.tipo === "produto" && itemAntigo.produto_id) {
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

  // 3. Remove itens antigos da transação
  await supabase
    .from("transacao_itens")
    .delete()
    .eq("transacao_id", transacaoId)
    .eq("tenant_id", tenantId);

  // 4. Calcula novos itens e debita estoque
  let valorTotal = 0;
  const itensCalculados = itensNovos.map((item) => {
    const qtd = Math.max(1, Number(item.quantidade) || 1);
    const vUnit = Math.max(0, Number(item.valorUnitario) || 0);
    const subtotal = Math.round(qtd * vUnit * 100) / 100;
    valorTotal += subtotal;

    return {
      transacao_id: transacaoId,
      tenant_id: tenantId,
      tipo: item.tipo || "produto",
      produto_id: item.tipo === "servico" ? null : (item.produtoId || null),
      servico_id: item.tipo === "produto" ? null : (item.servicoId || null),
      descricao: item.descricao || "Item sem descrição",
      quantidade: qtd,
      valor_unitario: vUnit,
      subtotal,
    };
  });

  // Insere novos itens
  const { data: itensSalvos, error: errNovosItens } = await supabase
    .from("transacao_itens")
    .insert(itensCalculados)
    .select();

  if (errNovosItens) throw errNovosItens;

  // Debita novo estoque
  for (const item of itensCalculados) {
    if (item.tipo === "produto" && item.produto_id) {
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

  const descontoNum = Math.max(0, Number(desconto) || 0);
  const valorTotalFinal = Math.max(0, Math.round(valorTotal * 100) / 100);

  // 5. Atualiza o cabeçalho em transacoes
  const { data: transacaoAtualizada, error: errUpdateTransacao } = await supabase
    .from("transacoes")
    .update({
      customer_id: customerId,
      profissional_id: profissionalId,
      data_transacao: dataTransacao,
      forma_pagamento: formaPagamento,
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

    // 4. Cria o item do serviço em transacao_itens
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
      },
    ]);
  }

  // 5. Atualiza o agendamento em appointments
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

