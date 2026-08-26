import { supabase } from "./supabase";
import { z } from "zod";

const AgendamentoSchema = z.object({
  id: z.any(),
  data_horario: z.string(),
  status: z.string().optional().nullable(),
  clientes: z.object({
    id: z.any(),
    nome: z.string().optional().nullable(),
    telefone: z.string().optional().nullable()
  }).optional().nullable(),
  servicos: z.object({
    id: z.any(),
    nome: z.string().optional().nullable(),
    preco: z.number().optional().nullable()
  }).optional().nullable()
}).passthrough();

export async function fetchAgendamentos() {
  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes (id, nome, telefone),
      servicos (id, nome, preco)
    `);
  if (error) throw new Error(error.message);
  
  const result = z.array(AgendamentoSchema).safeParse(data);
  if (!result.success) {
    console.error("Erro de validação em fetchAgendamentos:", result.error);
    return data; // fallback
  }
  return result.data;
}

export async function createAgendamento(agendamento) {
  let tenantId = agendamento.tenant_id;
  if (!tenantId) {
    try {
      const profStr = localStorage.getItem("@Allure:profissional");
      if (profStr) {
        const prof = JSON.parse(profStr);
        tenantId = prof.tenant_id;
      }
    } catch (e) {}
  }
  const payload = tenantId ? { ...agendamento, tenant_id: tenantId } : agendamento;

  const { data, error } = await supabase
    .from("agendamentos")
    .insert([payload])
    .select();
  if (error) throw new Error(error.message);
  return data;
}
