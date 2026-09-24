import type { FinanceDataSource } from '@/services/data/FinanceDataSource';
import type { ContaFinanceira, FiltrosFinanceiros } from '@/types/finance';
import { toLocalDate } from '@/utils/date';
import {
  agruparPorCategoria,
  agruparPorProjeto,
  calcularFluxoCaixaMensal,
  calcularResumoFinanceiro,
} from '@/utils/financeCalculations';
import { getDemoDataset } from './mockData';

const SIMULATED_DELAY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

function aplicarFiltros(contas: ContaFinanceira[], filtros: FiltrosFinanceiros): ContaFinanceira[] {
  return contas.filter((conta) => {
    if (filtros.empresa && conta.empresa !== filtros.empresa) return false;
    if (filtros.projeto && conta.projeto !== filtros.projeto) return false;
    if (filtros.clienteOuFornecedor && conta.clienteOuFornecedor !== filtros.clienteOuFornecedor) return false;
    if (filtros.categoria && conta.categoria !== filtros.categoria) return false;
    if (filtros.departamento && conta.departamento !== filtros.departamento) return false;
    if (filtros.contaCorrente && conta.contaCorrente !== filtros.contaCorrente) return false;
    if (filtros.situacao && conta.situacao !== filtros.situacao) return false;
    if (filtros.periodoInicio && toLocalDate(conta.vencimento) < toLocalDate(filtros.periodoInicio)) return false;
    if (filtros.periodoFim && toLocalDate(conta.vencimento) > toLocalDate(filtros.periodoFim)) return false;
    return true;
  });
}

function ultimosMeses(quantidade: number): string[] {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, index) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - (quantidade - 1 - index), 1);
    return data.toISOString().slice(0, 10);
  });
}

export const demoDataSource: FinanceDataSource = {
  modo: 'demo',

  async getResumo(filtros) {
    const dataset = getDemoDataset();
    const contasPagar = aplicarFiltros(dataset.contasPagar, filtros);
    const contasReceber = aplicarFiltros(dataset.contasReceber, filtros);
    const resumo = calcularResumoFinanceiro(contasPagar, contasReceber, new Date(), new Date().toISOString());
    return delay(resumo);
  },

  async getContasPagar(filtros) {
    const dataset = getDemoDataset();
    return delay(aplicarFiltros(dataset.contasPagar, filtros));
  },

  async getContasReceber(filtros) {
    const dataset = getDemoDataset();
    return delay(aplicarFiltros(dataset.contasReceber, filtros));
  },

  async getFluxoCaixaMensal(filtros) {
    const dataset = getDemoDataset();
    const contasPagar = aplicarFiltros(dataset.contasPagar, filtros);
    const contasReceber = aplicarFiltros(dataset.contasReceber, filtros);
    return delay(calcularFluxoCaixaMensal(contasPagar, contasReceber, ultimosMeses(6)));
  },

  async getDespesasPorCategoria(filtros) {
    const dataset = getDemoDataset();
    return delay(agruparPorCategoria(aplicarFiltros(dataset.contasPagar, filtros)));
  },

  async getResultadoPorProjeto(filtros) {
    const dataset = getDemoDataset();
    const contasPagar = aplicarFiltros(dataset.contasPagar, filtros);
    const contasReceber = aplicarFiltros(dataset.contasReceber, filtros);
    return delay(agruparPorProjeto(contasPagar, contasReceber));
  },

  async getProximosVencimentos(filtros) {
    const dataset = getDemoDataset();
    const todas = [...dataset.contasPagar, ...dataset.contasReceber];
    // "Próximos vencimentos" mostra só o que ainda vai vencer — títulos já vencidos entram em
    // alertas/KPI de vencidos, não nesta lista (senão os mais atrasados dominariam o topo).
    const abertas = aplicarFiltros(todas, filtros).filter((conta) => conta.situacao === 'aberto');
    const ordenadas = abertas.sort(
      (a, b) => toLocalDate(a.vencimento).getTime() - toLocalDate(b.vencimento).getTime()
    );
    return delay(ordenadas.slice(0, 10));
  },

  async getAlertas() {
    const dataset = getDemoDataset();
    return delay(dataset.alertas);
  },

  async getOpcoesFiltro(filtros) {
    const dataset = getDemoDataset(filtros.empresa);
    return delay(dataset.opcoesFiltro);
  },
};
