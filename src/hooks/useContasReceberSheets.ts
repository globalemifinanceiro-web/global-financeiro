import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resumoContasReceberSheets, sincronizarContasReceberSheets } from '@/services/supabase/contasReceberSheets';
import { useFiltrosStore } from '@/stores/useFiltrosStore';

const CHAVE = 'contas-receber-sheets';

export function useResumoContasReceberSheets() {
  const empresa = useFiltrosStore((state) => state.filtros.empresa);
  const mes = useFiltrosStore((state) => state.filtros.mes);
  return useQuery({
    queryKey: [CHAVE, 'resumo', empresa, mes],
    queryFn: () => resumoContasReceberSheets({ empresa, mes }),
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
