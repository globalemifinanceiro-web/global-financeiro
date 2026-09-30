import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import {
  atribuirEmpresaNotaFiscal,
  atualizarSituacaoNotaFiscal,
  criarNotaFiscal,
  excluirNotaFiscal,
  listarNotasFiscais,
  sincronizarProjetosGlobal,
} from '@/services/supabase/notasFiscais';
import type { NovaNotaFiscal, SituacaoNF } from '@/types/notaFiscal';

const CHAVE = 'notas-fiscais';

export function useNotasFiscais() {
  const empresa = useFiltrosStore((state) => state.filtros.empresa);
  return useQuery({
    queryKey: [CHAVE, empresa],
    queryFn: () => listarNotasFiscais(empresa),
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Todas as notas, de todas as empresas — usada pela Central de Pagamentos (3 painéis lado a lado). */
export function useTodasNotasFiscais() {
  return useQuery({
    queryKey: [CHAVE, 'todas'],
    queryFn: () => listarNotasFiscais(),
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useCriarNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nota: NovaNotaFiscal) => criarNotaFiscal(nota),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}

export function useAtualizarSituacaoNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, situacao }: { id: string; situacao: SituacaoNF }) => atualizarSituacaoNotaFiscal(id, situacao),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}

export function useExcluirNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, arquivoPath }: { id: string; arquivoPath: string | null }) => excluirNotaFiscal(id, arquivoPath),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}

export function useAtribuirEmpresaNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, empresa }: { id: string; empresa: string }) => atribuirEmpresaNotaFiscal(id, empresa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}

export function useSincronizarProjetosGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sincronizarProjetosGlobal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}
