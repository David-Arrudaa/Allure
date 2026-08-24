import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAgendamentos, createAgendamento } from '../services/agendaService';

export function useAgenda() {
  const queryClient = useQueryClient();

  const { data: agendamentos, isLoading, error } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: fetchAgendamentos
  });

  const addAgendamento = useMutation({
    mutationFn: createAgendamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    }
  });

  return {
    agendamentos,
    isLoading,
    error,
    addAgendamento
  };
}
