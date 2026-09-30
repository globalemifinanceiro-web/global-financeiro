import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarConciliacoes, listarTitulosPendentes, registrarComprovante } from '@/services/supabase/conciliacoes';
import type { NovoComprovante } from '@/types/conciliacao';

export function useConciliacoes() {
  return useQuery({ queryKey: ['conciliacoes'], queryFn: listarConciliacoes });
}

export function useTitulosPendentes() {
  return useQuery({ queryKey: ['conciliacoes', 'titulos-pendentes'], queryFn: listarTitulosPendentes });
}

export function useRegistrarComprovante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (novo: NovoComprovante) => registrarComprovante(novo),
    onSuccess: () => {
      // A baixa muda contas a receber, notas fiscais e todos os KPIs que dependem deles.
      for (const chave of ['conciliacoes', 'contas-receber-sheets', 'contas-receber', 'notas-fiscais', 'resumo', 'fluxo-caixa', 'proximos-vencimentos']) {
        queryClient.invalidateQueries({ queryKey: [chave] });
      }
    },
  });
}
