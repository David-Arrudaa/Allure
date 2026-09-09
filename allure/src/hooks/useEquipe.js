import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProfissionais,
  atualizarOrdemProfissional,
  criarProfissional,
  atualizarProfissional,
  excluirProfissional,
  criarUsuarioAuth,
} from "../services/equipeService";

export function useEquipe() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profissionais"],
    queryFn: fetchProfissionais,
  });

  const criarMutation = useMutation({
    mutationFn: (payload) => criarProfissional(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, payload }) => atualizarProfissional(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id) => excluirProfissional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });

  const reordenarMutation = useMutation({
    mutationFn: ({ id, novaOrdem }) =>
      atualizarOrdemProfissional(id, novaOrdem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });

  return {
    equipe: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    criarProfissional: criarMutation.mutateAsync,
    atualizarProfissional: atualizarMutation.mutateAsync,
    excluirProfissional: excluirMutation.mutateAsync,
    reordenarProfissional: reordenarMutation.mutateAsync,
    criarUsuarioAuth,
    isSalvando:
      criarMutation.isPending ||
      atualizarMutation.isPending ||
      excluirMutation.isPending,
  };
}
