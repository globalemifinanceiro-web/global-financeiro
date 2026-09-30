import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LeituraPlanilha } from '@/services/importacao/planilhaContasPagar';
import { desfazerImportacaoContasPagar, importarContasPagar, listarImportacoesContasPagar } from '@/services/supabase/contasPagarPlanilhas';

// Tudo que depende das contas a pagar precisa recarregar depois de importar ou desfazer.
const CHAVES_AFETADAS = [
  'importacoes-contas-pagar',
  'contas-pagar',
  'resumo',
  'fluxo-caixa',
  'despesas-categoria',
  'resultado-projeto',
  'proximos-vencimentos',
  'opcoes-filtro',
];

export function useImportacoesContasPagar() {
  return useQuery({ queryKey: ['importacoes-contas-pagar'], queryFn: listarImportacoesContasPagar });
}

export function useImportarContasPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empresa, arquivoNome, leitura }: { empresa: string; arquivoNome: string; leitura: LeituraPlanilha }) =>
      importarContasPagar(empresa, arquivoNome, leitura),
    onSuccess: () => CHAVES_AFETADAS.forEach((chave) => queryClient.invalidateQueries({ queryKey: [chave] })),
  });
}

export function useDesfazerImportacaoContasPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => desfazerImportacaoContasPagar(id),
    onSuccess: () => CHAVES_AFETADAS.forEach((chave) => queryClient.invalidateQueries({ queryKey: [chave] })),
  });
}
