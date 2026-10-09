import { supabase } from "./supabase";

/**
 * ============================================================================
 * CATÁLOGO DE CURSOS (BASE)
 * ============================================================================
 */

export async function fetchCursos() {
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCurso(payload) {
  const { data, error } = await supabase
    .from("cursos")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCurso(id, payload) {
  const { data, error } = await supabase
    .from("cursos")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCurso(id) {
  const { error } = await supabase
    .from("cursos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * ============================================================================
 * TURMAS (EDIÇÕES DOS CURSOS)
 * ============================================================================
 */

export async function fetchTurmas() {
  const { data, error } = await supabase
    .from("turmas")
    .select(`
      *,
      curso:cursos(id, nome, carga_horaria, valor_padrao),
      instrutor:profissionais(id, nome),
      matriculas:matriculas(
        id,
        valor_acordado,
        status_pagamento,
        pagamentos:matricula_pagamentos(id, valor, forma_pagamento, data_pagamento)
      )
    `)
    .order("data_inicio", { ascending: false });

  if (error) throw error;

  // Processa métricas resumidas por turma
  return (data || []).map((turma) => {
    const totalMatriculas = turma.matriculas?.length || 0;
    let totalPrevisto = 0;
    let totalArrecadado = 0;

    (turma.matriculas || []).forEach((m) => {
      totalPrevisto += Number(m.valor_acordado) || 0;
      (m.pagamentos || []).forEach((p) => {
        totalArrecadado += Number(p.valor) || 0;
      });
    });

    const totalPendente = Math.max(0, totalPrevisto - totalArrecadado);

    return {
      ...turma,
      totalMatriculas,
      totalPrevisto,
      totalArrecadado,
      totalPendente,
    };
  });
}

export async function fetchTurmaDetalhes(turmaId) {
  const { data, error } = await supabase
    .from("turmas")
    .select(`
      *,
      curso:cursos(id, nome, carga_horaria, valor_padrao, descricao),
      instrutor:profissionais(id, nome),
      matriculas:matriculas(
        id,
        turma_id,
        customer_id,
        valor_acordado,
        status_pagamento,
        data_matricula,
        observacoes,
        aluna:customers(id, nome, telefone),
        pagamentos:matricula_pagamentos(
          id,
          valor,
          forma_pagamento,
          data_pagamento,
          tipo_lancamento,
          observacoes,
          created_at
        )
      )
    `)
    .eq("id", turmaId)
    .single();

  if (error) throw error;

  if (data?.matriculas) {
    data.matriculas = data.matriculas.map((m) => {
      const valorAcordado = Number(m.valor_acordado) || 0;
      const totalPago = (m.pagamentos || []).reduce(
        (acc, cur) => acc + (Number(cur.valor) || 0),
        0
      );
      const saldoDevedor = Math.max(0, valorAcordado - totalPago);

      return {
        ...m,
        totalPago,
        saldoDevedor,
      };
    });
  }

  return data;
}

export async function createTurma(payload) {
  const { data, error } = await supabase
    .from("turmas")
    .insert([payload])
    .select(`
      *,
      curso:cursos(id, nome, carga_horaria, valor_padrao),
      instrutor:profissionais(id, nome)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateTurma(id, payload) {
  const { data, error } = await supabase
    .from("turmas")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      curso:cursos(id, nome, carga_horaria, valor_padrao),
      instrutor:profissionais(id, nome)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTurma(id) {
  const { error } = await supabase
    .from("turmas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * ============================================================================
 * MATRÍCULAS & ALUNAS (INTEGRADO COM CUSTOMERS)
 * ============================================================================
 */

export async function buscarClientesParaMatricula(termo) {
  if (!termo || termo.trim().length < 2) return [];

  const { data, error } = await supabase
    .from("customers")
    .select("id, nome, telefone")
    .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%`)
    .order("nome", { ascending: true })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function matricularAluna({
  tenantId,
  turmaId,
  customerId = null,
  novaAluna = null, // { nome, telefone } caso não exista no cadastro ainda
  valorAcordado,
  observacoes = "",
  primeiroPagamento = null, // { valor, formaPagamento, tipoLancamento, dataPagamento } opcional
}) {
  let targetCustomerId = customerId;

  // Se não foi selecionada cliente existente, cria primeiro na base de customers
  if (!targetCustomerId && novaAluna && novaAluna.nome?.trim()) {
    const { data: novoCliente, error: errCliente } = await supabase
      .from("customers")
      .insert([
        {
          tenant_id: tenantId,
          nome: novaAluna.nome.trim(),
          telefone: novaAluna.telefone?.trim() || "Não informado",
          observacoes: "Cadastrada via Módulo de Cursos",
        },
      ])
      .select("id")
      .single();

    if (errCliente) throw errCliente;
    targetCustomerId = novoCliente.id;
  }

  if (!targetCustomerId) {
    throw new Error("Selecione uma cliente ou preencha os dados da nova aluna.");
  }

  // 1. Cria a Matrícula
  const { data: matricula, error: errMatricula } = await supabase
    .from("matriculas")
    .insert([
      {
        tenant_id: tenantId,
        turma_id: turmaId,
        customer_id: targetCustomerId,
        valor_acordado: Number(valorAcordado) || 0,
        observacoes,
      },
    ])
    .select()
    .single();

  if (errMatricula) throw errMatricula;

  // 2. Se houver pagamento inicial (ex: sinal ou à vista integral)
  if (primeiroPagamento && Number(primeiroPagamento.valor) > 0) {
    const { error: errPagamento } = await supabase
      .from("matricula_pagamentos")
      .insert([
        {
          tenant_id: tenantId,
          matricula_id: matricula.id,
          valor: Number(primeiroPagamento.valor),
          forma_pagamento: primeiroPagamento.formaPagamento || "Pix",
          data_pagamento:
            primeiroPagamento.dataPagamento ||
            new Date().toISOString().split("T")[0],
          tipo_lancamento: primeiroPagamento.tipoLancamento || "sinal",
          observacoes: primeiroPagamento.observacoes || null,
        },
      ]);

    if (errPagamento) throw errPagamento;
  }

  return matricula;
}

export async function updateMatricula(id, payload) {
  const { data, error } = await supabase
    .from("matriculas")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMatricula(id) {
  const { error } = await supabase
    .from("matriculas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * ============================================================================
 * LANÇAMENTOS FINANCEIROS DOS CURSOS (TOTALMENTE ISOLADOS)
 * ============================================================================
 */

export async function registrarPagamentoMatricula({
  tenantId,
  matriculaId,
  valor,
  formaPagamento = "Pix",
  dataPagamento = new Date().toISOString().split("T")[0],
  tipoLancamento = "restante",
  observacoes = "",
}) {
  const { data, error } = await supabase
    .from("matricula_pagamentos")
    .insert([
      {
        tenant_id: tenantId,
        matricula_id: matriculaId,
        valor: Number(valor),
        forma_pagamento: formaPagamento,
        data_pagamento: dataPagamento,
        tipo_lancamento: tipoLancamento,
        observacoes: observacoes || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePagamentoMatricula(pagamentoId) {
  const { error } = await supabase
    .from("matricula_pagamentos")
    .delete()
    .eq("id", pagamentoId);

  if (error) throw error;
}

/**
 * ============================================================================
 * RELATÓRIO / BALANÇO FINANCEIRO EXCLUSIVO DE CURSOS
 * ============================================================================
 */

export async function fetchMetricasFinanceirasCursos() {
  const { data: pagamentos, error: errPagamentos } = await supabase
    .from("matricula_pagamentos")
    .select(`
      id,
      valor,
      forma_pagamento,
      data_pagamento,
      tipo_lancamento,
      observacoes,
      created_at,
      matricula:matriculas(
        id,
        valor_acordado,
        aluna:customers(id, nome, telefone),
        turma:turmas(
          id,
          identificador,
          curso:cursos(id, nome)
        )
      )
    `)
    .order("data_pagamento", { ascending: false })
    .order("created_at", { ascending: false });

  if (errPagamentos) throw errPagamentos;

  const { data: matriculas, error: errMatriculas } = await supabase
    .from("matriculas")
    .select("id, valor_acordado, status_pagamento");

  if (errMatriculas) throw errMatriculas;

  let totalArrecadado = 0;
  const porFormaPagamento = {};

  const extrato = (pagamentos || []).map((p) => {
    const v = Number(p.valor) || 0;
    totalArrecadado += v;
    porFormaPagamento[p.forma_pagamento] =
      (porFormaPagamento[p.forma_pagamento] || 0) + v;

    return {
      id: p.id,
      valor: v,
      formaPagamento: p.forma_pagamento || "Pix",
      dataPagamento: p.data_pagamento,
      tipoLancamento: p.tipo_lancamento || "integral",
      observacoes: p.observacoes,
      alunaNome: p.matricula?.aluna?.nome || "Aluna não identificada",
      alunaTelefone: p.matricula?.aluna?.telefone || "-",
      cursoNome: p.matricula?.turma?.curso?.nome || "Curso",
      turmaIdentificador: p.matricula?.turma?.identificador || "Turma",
      turmaId: p.matricula?.turma?.id,
    };
  });

  let totalPrevisto = 0;
  (matriculas || []).forEach((m) => {
    totalPrevisto += Number(m.valor_acordado) || 0;
  });

  const totalPendente = Math.max(0, totalPrevisto - totalArrecadado);

  return {
    totalArrecadado,
    totalPrevisto,
    totalPendente,
    totalAlunas: matriculas?.length || 0,
    porFormaPagamento,
    extrato,
  };
}

