import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LeituraPlanilha } from '@/services/importacao/planilhaContasPagar';
import { importarContasPagar, listarImportacoesContasPagar } from '@/services/supabase/contasPagarPlanilhas';

export function useImportacoesContasPagar() {
  return useQuery({ queryKey: ['importacoes-contas-pagar'], queryFn: listarImportacoesContasPagar });
}

export function useImportarContasPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empresa, arquivoNome, leitura }: { empresa: string; arquivoNome: string; leitura: LeituraPlanilha }) =>
      importarContasPagar(empresa, arquivoNome, leitura),
    onSuccess: () => {
      for (const chave of [
        'importacoes-contas-pagar',
        'contas-pagar',
        'resumo',
        'fluxo-caixa',
        'despesas-categoria',
        'resultado-projeto',
        'proximos-vencimentos',
        'opcoes-filtro',
      ]) {
        queryClient.invalidateQueries({ queryKey: [chave] });
      }
    },
  });
}
