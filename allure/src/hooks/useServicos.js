import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchServicos,
  createServico,
  updateServico,
  deleteServico,
} from "../services/servicosService";

export function useServicos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["servicos"],
    queryFn: fetchServicos,
  });

  const criarMutation = useMutation({
    mutationFn: (payload) => createServico(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, payload }) => updateServico(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id) => deleteServico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
    },
  });

  return {
    servicos: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    criarServico: criarMutation.mutateAsync,
    atualizarServico: atualizarMutation.mutateAsync,
    excluirServico: excluirMutation.mutateAsync,
    isSalvando: criarMutation.isPending || atualizarMutation.isPending,
  };
}
