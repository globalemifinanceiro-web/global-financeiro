import { useQuery } from '@tanstack/react-query';
import { financeDataSource } from '@/services/data';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import type { FiltrosFinanceiros } from '@/types/finance';

function chaveFiltros(filtros: FiltrosFinanceiros) {
  return JSON.stringify(filtros);
}

export function useFiltrosAtuais() {
  return useFiltrosStore((state) => state.filtros);
}

export function useResumoFinanceiro() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['resumo', chaveFiltros(filtros)],
    queryFn: () => financeDataSource.getResumo(filtros),
  });
}

export function useContasPagar() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['contas-pagar', chaveFiltros(filtros)],
    queryFn: () => financeDataSource.getContasPagar(filtros),
  });
}

export function useContasReceber() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['contas-receber', chaveFiltros(filtros)],
    queryFn: () => financeDataSource.getContasReceber(filtros),
  });
}

export function useFluxoCaixaMensal() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['fluxo-caixa', chaveFiltros(filtros)],
    queryFn: () => financeDataSource.getFluxoCaixaMensal(filtros),
  });
}

export function useDespesasPorCategoria() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['despesas-categoria', chaveFiltros(filtros)],
    queryFn: () => financeDataSource.getDespesasPorCategoria(filtros),
  });
}

export function useResultadoPorProjeto() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['resultado-projeto', chaveFiltros(filtros)],
    queryFn: () => financeDataSource.getResultadoPorProjeto(filtros),
  });
}

export function useProximosVencimentos() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['proximos-vencimentos', chaveFiltros(filtros)],
    queryFn: () => financeDataSource.getProximosVencimentos(filtros),
  });
}

export function useAlertas() {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: () => financeDataSource.getAlertas(),
  });
}

export function useOpcoesFiltro() {
  const filtros = useFiltrosAtuais();
  return useQuery({
    queryKey: ['opcoes-filtro', filtros.empresa],
    queryFn: () => financeDataSource.getOpcoesFiltro(filtros),
  });
}
