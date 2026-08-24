import { supabase } from "./supabase";

export async function fetchAgendamentos() {
  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes (id, nome, telefone),
      servicos (id, nome, preco)
    `);
  if (error) throw new Error(error.message);
  return data;
}

export async function createAgendamento(agendamento) {
  const { data, error } = await supabase
    .from("agendamentos")
    .insert([agendamento])
    .select();
  if (error) throw new Error(error.message);
  return data;
}
