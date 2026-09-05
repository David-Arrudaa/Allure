import { supabase } from "./supabase";

export async function fetchProdutos(tenantId) {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createProduto(payload) {
  const { data, error } = await supabase.from("produtos").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduto(id, tenantId, payload) {
  const { data, error } = await supabase
    .from("produtos")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduto(id, tenantId) {
  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}
