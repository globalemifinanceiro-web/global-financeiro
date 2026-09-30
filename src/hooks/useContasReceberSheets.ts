import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resumoContasReceberSheets, sincronizarContasReceberSheets } from '@/services/supabase/contasReceberSheets';

const CHAVE = 'contas-receber-sheets';

export function useResumoContasReceberSheets() {
  return useQuery({
    queryKey: [CHAVE, 'resumo'],
    queryFn: resumoContasReceberSheets,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useSincronizarContasReceberSheets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sincronizarContasReceberSheets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAVE] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['resumo'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-vencimentos'] });
      queryClient.invalidateQueries({ queryKey: ['opcoes-filtro'] });
    },
  });
}
