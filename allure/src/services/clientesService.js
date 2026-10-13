import { supabase } from "./supabase";

export async function fetchClientes(paginaAtual = 1, itensPorPagina = 25, termoBusca = "", filtroInatividade = "") {
  let countQuery = supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (termoBusca && termoBusca.length >= 3) {
    countQuery = countQuery.ilike("nome", `%${termoBusca}%`);
  }
  const { count, error: countError } = await countQuery;
  
  if (countError) throw countError;

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina - 1;

  let query = supabase
    .from("customers")
    .select("id, nome, telefone, is_whatsapp, observacoes, appointments(data_horario, status)")
    .order("nome", { ascending: true })
    .range(inicio, fim);

  if (termoBusca && termoBusca.length >= 3) {
    query = query.ilike("nome", `%${termoBusca}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  const listaFormatada = data.map((item) => {
    let ultimaVisitaStr = "A definir";
    // Declarada fora do if: o return abaixo a referencia mesmo quando a
    // cliente não tem agendamento (fica null = nunca visitou).
    let diasSemVisita = null;
    if (item.appointments && item.appointments.length > 0) {
      const hoje = new Date();
      const passados = item.appointments
        .filter(
          (a) =>
            new Date(a.data_horario) <= hoje &&
            a.status !== "cancelado" &&
            a.status !== "bloqueio"
        )
        .map((a) => new Date(a.data_horario));

      let diasSemVisita = null;
      if (passados.length > 0) {
        const maxDate = new Date(Math.max(...passados));
        ultimaVisitaStr = `${String(maxDate.getDate()).padStart(2, "0")}/${String(maxDate.getMonth() + 1).padStart(2, "0")}/${maxDate.getFullYear()}`;
        diasSemVisita = Math.floor((hoje - maxDate) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      id: item.id,
      nome: item.nome || "Cliente sem nome",
      telefone: item.telefone || "Não informado",
      is_whatsapp: item.is_whatsapp ?? true,
      observacoes: item.observacoes,
      ultimaVisita: ultimaVisitaStr,
      diasSemVisita,
      originalData: item
    };
  });

  // Aplica filtro de inatividade de clientes (+30 ou +60 dias sem visita)
  let listaFinal = listaFormatada;
  if (filtroInatividade === "ausentes_30") {
    listaFinal = listaFormatada.filter((c) => c.diasSemVisita !== null && c.diasSemVisita >= 30);
  } else if (filtroInatividade === "ausentes_60") {
    listaFinal = listaFormatada.filter((c) => c.diasSemVisita !== null && c.diasSemVisita >= 60);
  }

  return {
    clientes: listaFinal,
    totalCount: filtroInatividade ? listaFinal.length : (count || 0)
  };
}

export async function createCliente(payload) {
  const { data, error } = await supabase.from("customers").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateCliente(id, payload) {
  const { data, error } = await supabase.from("customers").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCliente(id) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}
