import { supabase } from "./supabase";

// --- Métricas gerais (aba "Recebimentos") ---
export async function fetchPagamentosPeriodo({ inicioFiltro, fimFiltro, apenasProfissionalId }) {
  let query = supabase
    .from("appointments")
    .select(
      `id, valor, servico, data_horario, forma_pagamento, duracao, customer_id, profissional_id, customers ( id, nome ), profissionais ( id, nome )`
    )
    .gte("data_horario", inicioFiltro)
    .lte("data_horario", fimFiltro)
    .eq("pagamento", "pago")
    .neq("status", "bloqueio")
    .neq("status", "cancelado");

  if (apenasProfissionalId) {
    query = query.eq("profissional_id", apenasProfissionalId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchComissaoProfissional(profissionalId) {
  const { data, error } = await supabase
    .from("profissionais")
    .select("comissao")
    .eq("id", profissionalId)
    .single();
  if (error) throw error;
  return data;
}

// --- Desempenho da equipe ---
export async function fetchDesempenhoPeriodo({ inicioFiltro, fimFiltro, apenasProfissionalId }) {
  let query = supabase
    .from("appointments")
    .select(
      `id, valor, servico, data_horario, duracao, customer_id, profissionais ( id, nome, comissao ), customers ( nome )`
    )
    .gte("data_horario", inicioFiltro)
    .lte("data_horario", fimFiltro)
    .eq("pagamento", "pago")
    .neq("status", "bloqueio")
    .neq("status", "cancelado");

  if (apenasProfissionalId) {
    query = query.eq("profissional_id", apenasProfissionalId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function atualizarComissaoProfissional(profissionalId, comissao) {
  const { error } = await supabase
    .from("profissionais")
    .update({ comissao })
    .eq("id", profissionalId);
  if (error) throw error;
}

// --- Exclusão de venda avulsa e controle de estoque ---
export async function buscarProdutoPorNome(tenantId, nomeProduto) {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, estoque")
    .eq("tenant_id", tenantId)
    .ilike("nome", nomeProduto)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export async function ajustarEstoqueProduto(produtoId, tenantId, novoEstoque) {
  const { error } = await supabase
    .from("produtos")
    .update({ estoque: novoEstoque })
    .eq("id", produtoId)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

export async function excluirVendaAvulsa(appointmentId) {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);
  if (error) throw error;
}

// --- ModalRecebimentoAvulso: selects de apoio ---
export async function fetchProdutosVenda(tenantId) {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, preco, estoque")
    .eq("tenant_id", tenantId)
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchProfissionaisVenda(tenantId) {
  const { data, error } = await supabase
    .from("profissionais")
    .select("id, nome")
    .eq("tenant_id", tenantId)
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchClientesVenda(tenantId) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, nome")
    .eq("tenant_id", tenantId)
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

// --- ModalRecebimentoAvulso: criar e editar vendas avulsas ---
export async function criarVendaAvulsa(payload) {
  const { data, error } = await supabase
    .from("appointments")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarVendaAvulsa(id, tenantId, payload) {
  const { data, error } = await supabase
    .from("appointments")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
