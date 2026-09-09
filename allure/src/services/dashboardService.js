import { supabase } from "./supabase";
import { registrarPagamentoAgendamento } from "./transacoesService";

export async function fetchMetricasDashboard({
  dataInicio,
  dataFim,
  inicioHojeStr,
  profissionalId = null,
}) {
  let queryAgendamentos = supabase
    .from("appointments")
    .select(
      `id, valor, servico, status, pagamento, data_horario, profissionais ( nome )`,
    )
    .gte("data_horario", dataInicio)
    .lte("data_horario", dataFim)
    .neq("status", "bloqueio")
    .neq("status", "cancelado");

  if (profissionalId) {
    queryAgendamentos = queryAgendamentos.eq("profissional_id", profissionalId);
  }

  const { data: agendamentos, error: errAgendamentos } = await queryAgendamentos;
  if (errAgendamentos) throw errAgendamentos;

  let queryPendentes = supabase
    .from("appointments")
    .select(
      `id, valor, servico, data_horario, customer_id, customers ( nome )`,
    )
    .lt("data_horario", inicioHojeStr)
    .eq("pagamento", "pendente")
    .neq("status", "bloqueio")
    .neq("status", "cancelado")
    .order("data_horario", { ascending: true });

  if (profissionalId) {
    queryPendentes = queryPendentes.eq("profissional_id", profissionalId);
  }

  const { data: pendentesPassados, error: errPendentes } = await queryPendentes;
  if (errPendentes) throw errPendentes;

  let faturamento = 0;
  let atendimentosPagos = 0;
  const contagemProfissionais = {};
  const contagemServicos = {};

  if (agendamentos) {
    agendamentos.forEach((ag) => {
      if (ag.pagamento === "pago") {
        const valorFormatado = Number(ag.valor) || 0;
        faturamento += valorFormatado;
        atendimentosPagos += 1;

        const nomeProf = ag.profissionais?.nome || "Equipe";
        contagemProfissionais[nomeProf] =
          (contagemProfissionais[nomeProf] || 0) + 1;

        const nomeServ = ag.servico || "Outros";
        if (!contagemServicos[nomeServ]) {
          contagemServicos[nomeServ] = { count: 0, valorTotal: 0 };
        }
        contagemServicos[nomeServ].count += 1;
        contagemServicos[nomeServ].valorTotal += valorFormatado;
      }
    });
  }

  let pendentesValor = 0;
  if (pendentesPassados) {
    pendentesPassados.forEach((p) => {
      pendentesValor += Number(p.valor) || 0;
    });
  }

  const rankingProfissionais = Object.entries(contagemProfissionais)
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  const rankingServicos = Object.entries(contagemServicos)
    .map(([nome, stats]) => ({
      nome,
      qtd: stats.count,
      porcentagem:
        atendimentosPagos > 0
          ? Math.round((stats.count / atendimentosPagos) * 100)
          : 0,
      valorTotal: stats.valorTotal,
    }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 3);

  return {
    metricas: {
      faturamento,
      totalAtendimentos: atendimentosPagos,
      ticketMedio:
        atendimentosPagos > 0 ? faturamento / atendimentosPagos : 0,
      pendentesValor,
      pendentesQtd: pendentesPassados?.length || 0,
    },
    rankingProfissionais,
    rankingServicos,
    listaPendentes: pendentesPassados || [],
  };
}

// Integrado ao modelo normalizado: registra pagamento e cria itens em transacoes
export async function baixarPagamentoPendente({ appointmentId, tenantId, metodoPagamento, valor }) {
  return registrarPagamentoAgendamento({
    appointmentId,
    tenantId,
    formaPagamento: metodoPagamento,
    valor,
  });
}
