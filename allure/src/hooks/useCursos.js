import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCursos,
  createCurso,
  updateCurso,
  deleteCurso,
  fetchTurmas,
  fetchTurmaDetalhes,
  createTurma,
  updateTurma,
  deleteTurma,
  matricularAluna,
  deleteMatricula,
  registrarPagamentoMatricula,
  deletePagamentoMatricula,
  fetchMetricasFinanceirasCursos,
} from "../services/cursosService";

export function useCursos() {
  const queryClient = useQueryClient();

  // Queries
  const cursosQuery = useQuery({
    queryKey: ["cursos"],
    queryFn: fetchCursos,
  });

  const turmasQuery = useQuery({
    queryKey: ["turmas"],
    queryFn: fetchTurmas,
  });

  const metricasQuery = useQuery({
    queryKey: ["cursos-financeiro"],
    queryFn: fetchMetricasFinanceirasCursos,
  });

  // Mutations - Cursos
  const criarCursoMutation = useMutation({
    mutationFn: (payload) => createCurso(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
    },
  });

  const atualizarCursoMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCurso(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });

  const excluirCursoMutation = useMutation({
    mutationFn: (id) => deleteCurso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });

  // Mutations - Turmas
  const criarTurmaMutation = useMutation({
    mutationFn: (payload) => createTurma(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["cursos-financeiro"] });
    },
  });

  const atualizarTurmaMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTurma(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["turma-detalhes"] });
      queryClient.invalidateQueries({ queryKey: ["cursos-financeiro"] });
    },
  });

  const excluirTurmaMutation = useMutation({
    mutationFn: (id) => deleteTurma(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["cursos-financeiro"] });
    },
  });

  return {
    cursos: cursosQuery.data || [],
    turmas: turmasQuery.data || [],
    metricas: metricasQuery.data || {
      totalArrecadado: 0,
      totalPrevisto: 0,
      totalPendente: 0,
      totalAlunas: 0,
      porFormaPagamento: {},
      extrato: [],
    },
    isLoading: cursosQuery.isLoading || turmasQuery.isLoading,
    isError: cursosQuery.isError || turmasQuery.isError,

    // Actions Cursos
    criarCurso: criarCursoMutation.mutateAsync,
    atualizarCurso: atualizarCursoMutation.mutateAsync,
    excluirCurso: excluirCursoMutation.mutateAsync,

    // Actions Turmas
    criarTurma: criarTurmaMutation.mutateAsync,
    atualizarTurma: atualizarTurmaMutation.mutateAsync,
    excluirTurma: excluirTurmaMutation.mutateAsync,

    isSalvando:
      criarCursoMutation.isPending ||
      atualizarCursoMutation.isPending ||
      criarTurmaMutation.isPending ||
      atualizarTurmaMutation.isPending,
  };
}

export function useTurmaDetalhes(turmaId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["turma-detalhes", turmaId],
    queryFn: () => fetchTurmaDetalhes(turmaId),
    enabled: Boolean(turmaId),
  });

  const matricularMutation = useMutation({
    mutationFn: (payload) => matricularAluna(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turma-detalhes", turmaId] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["cursos-financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });

  const excluirMatriculaMutation = useMutation({
    mutationFn: (matriculaId) => deleteMatricula(matriculaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turma-detalhes", turmaId] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["cursos-financeiro"] });
    },
  });

  const registrarPagamentoMutation = useMutation({
    mutationFn: (payload) => registrarPagamentoMatricula(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turma-detalhes", turmaId] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["cursos-financeiro"] });
    },
  });

  const excluirPagamentoMutation = useMutation({
    mutationFn: (pagamentoId) => deletePagamentoMatricula(pagamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turma-detalhes", turmaId] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["cursos-financeiro"] });
    },
  });

  return {
    turma: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,

    matricularAluna: matricularMutation.mutateAsync,
    excluirMatricula: excluirMatriculaMutation.mutateAsync,
    registrarPagamento: registrarPagamentoMutation.mutateAsync,
    excluirPagamento: excluirPagamentoMutation.mutateAsync,

    isSalvando:
      matricularMutation.isPending ||
      registrarPagamentoMutation.isPending ||
      excluirMatriculaMutation.isPending,
  };
}

