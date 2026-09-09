import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
} from "../services/produtosService";

export function useProdutos(tenantId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["produtos", tenantId],
    queryFn: () => fetchProdutos(tenantId),
    enabled: Boolean(tenantId),
  });

  const criarMutation = useMutation({
    mutationFn: (payload) => createProduto(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos", tenantId] });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, tenantId, payload }) =>
      updateProduto(id, tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos", tenantId] });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: ({ id, tenantId }) => deleteProduto(id, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos", tenantId] });
    },
  });

  return {
    produtos: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    criarProduto: criarMutation.mutateAsync,
    atualizarProduto: atualizarMutation.mutateAsync,
    excluirProduto: excluirMutation.mutateAsync,
    isSalvando: criarMutation.isPending || atualizarMutation.isPending,
    isExcluindo: excluirMutation.isPending,
  };
}
