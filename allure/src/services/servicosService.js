import { supabase } from "./supabase";

export async function fetchServicos() {
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createServico(payload) {
  const { data, error } = await supabase.from("servicos").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateServico(id, payload) {
  const { data, error } = await supabase.from("servicos").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteServico(id) {
  const { error } = await supabase.from("servicos").delete().eq("id", id);
  if (error) throw error;
}
