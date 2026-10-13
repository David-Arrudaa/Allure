import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export async function fetchProfissionais() {
  const { data, error } = await supabase
    .from("profissionais")
    // Colunas explícitas: evita trafegar senha/comissao para quem não usa.
    // ponytail: defesa em profundidade, não isolamento — a policy de SELECT
    // ainda libera todas as colunas via PostgREST. Fechar de verdade exige
    // REVOKE SELECT por coluna + RPC de admin (ver docs/uso-usuarios.md).
    .select("id, nome, especialidade, telefone, ordem, foto, email, is_admin, comissao_servicos, comissao_produtos")
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function atualizarOrdemProfissional(id, novaOrdem) {
  const { error } = await supabase
    .from("profissionais")
    .update({ ordem: novaOrdem })
    .eq("id", id);
  if (error) throw error;
}

export async function criarProfissional(payload) {
  const { data, error } = await supabase
    .from("profissionais")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarProfissional(id, payload) {
  const { data, error } = await supabase
    .from("profissionais")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirProfissional(id) {
  const { error } = await supabase.from("profissionais").delete().eq("id", id);
  if (error) throw error;
}

// Criação de usuário isolada para não deslogar o admin logado (persistSession: false)
// Retorna { data, error } cru para que o componente trate as ramificações de erro (já registrado / reativação)
export async function criarUsuarioAuth(email, senha) {
  const adminAuthClient = createClient(
    import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
    import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  return adminAuthClient.auth.signUp({
    email,
    password: senha,
  });
}
