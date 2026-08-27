import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientes, createCliente, updateCliente, deleteCliente } from "../services/clientesService";

export function useClientes(paginaAtual, itensPorPagina, termoBusca) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clientes", paginaAtual, itensPorPagina, termoBusca],
    queryFn: () => fetchClientes(paginaAtual, itensPorPagina, termoBusca),
    placeholderData: (previousData) => previousData,
  });

  const criarMutation = useMutation({
    mutationFn: (payload) => createCliente(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCliente(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id) => deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });

  return {
    clientes: query.data?.clientes || [],
    totalClientes: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    criarCliente: criarMutation.mutateAsync,
    atualizarCliente: atualizarMutation.mutateAsync,
    excluirCliente: excluirMutation.mutateAsync,
    isSalvando: criarMutation.isPending || atualizarMutation.isPending,
  };
}
