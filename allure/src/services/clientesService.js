import { supabase } from "./supabase";

export async function fetchClientes(paginaAtual = 1, itensPorPagina = 25, termoBusca = "") {
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

      if (passados.length > 0) {
        const maxDate = new Date(Math.max(...passados));
        ultimaVisitaStr = `${String(maxDate.getDate()).padStart(2, "0")}/${String(maxDate.getMonth() + 1).padStart(2, "0")}/${maxDate.getFullYear()}`;
      }
    }

    return {
      id: item.id,
      nome: item.nome || "Cliente sem nome",
      telefone: item.telefone || "Não informado",
      is_whatsapp: item.is_whatsapp ?? true,
      observacoes: item.observacoes,
      ultimaVisita: ultimaVisitaStr,
      originalData: item
    };
  });

  return {
    clientes: listaFormatada,
    totalCount: count || 0
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
