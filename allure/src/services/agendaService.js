import { supabase } from "./supabase";

export async function fetchAgendamentosPorPeriodo(inicioFiltro, fimFiltro) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`*, customers ( id, nome, telefone ), profissionais ( id, nome )`)
    .gte("data_horario", inicioFiltro)
    .lte("data_horario", fimFiltro);
  if (error) throw error;
  return data || [];
}

export async function fetchProfissionaisParaAgenda() {
  const { data, error } = await supabase
    .from("profissionais")
    .select("id, nome, especialidade, foto")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data || [];
}
