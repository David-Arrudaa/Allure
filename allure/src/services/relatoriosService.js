import { supabase } from "./supabase";

// Busca todos os agendamentos/vendas do período (sem filtrar por status/pagamento):
// a página deriva as 4 abas (Financeiro, Serviços, Agendamentos, Funcionários) a
// partir desse único resultado, evitando 4 queries separadas para o mesmo período.
export async function fetchDadosRelatorio({ inicioFiltro, fimFiltro, apenasProfissionalId }) {
  let query = supabase
    .from("appointments")
    .select(
      `id, valor, servico, data_horario, status, pagamento, forma_pagamento, duracao, customer_id, profissional_id, profissionais ( id, nome, comissao ), customers ( id, nome )`
    )
    .gte("data_horario", inicioFiltro)
    .lte("data_horario", fimFiltro);

  if (apenasProfissionalId) {
    query = query.eq("profissional_id", apenasProfissionalId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
