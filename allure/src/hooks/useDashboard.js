import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMetricasDashboard,
  baixarPagamentoPendente,
} from "../services/dashboardService";

const METRICAS_VAZIAS = {
  faturamento: 0,
  totalAtendimentos: 0,
  ticketMedio: 0,
  pendentesValor: 0,
  pendentesQtd: 0,
};

export function useDashboard({ dataInicio, dataFim, inicioHojeStr, profissionalId }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard", dataInicio, dataFim, profissionalId],
    queryFn: () =>
      fetchMetricasDashboard({ dataInicio, dataFim, inicioHojeStr, profissionalId }),
    enabled: Boolean(dataInicio && dataFim),
  });

  const baixarPagamentoMutation = useMutation({
    mutationFn: (payload) => baixarPagamentoPendente(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    metricas: query.data?.metricas || METRICAS_VAZIAS,
    rankingProfissionais: query.data?.rankingProfissionais || [],
    rankingServicos: query.data?.rankingServicos || [],
    listaPendentes: query.data?.listaPendentes || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    baixarPagamento: baixarPagamentoMutation.mutateAsync,
  };
}
