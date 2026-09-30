import type { FinanceDataSource } from '@/services/data/FinanceDataSource';
import { toLocalDate } from '@/utils/date';
import {
  agruparPorCategoria,
  agruparPorProjeto,
  aplicarFiltros,
  calcularFluxoCaixaMensal,
  calcularResumoFinanceiro,
} from '@/utils/financeCalculations';
import { mesesDoAno } from '@/utils/periodo';
import { getDemoDataset } from './mockData';

const SIMULATED_DELAY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

export const demoDataSource: FinanceDataSource = {
  modo: 'demo',

  async getResumo(filtros) {
    const dataset = getDemoDataset();
    const contasPagar = aplicarFiltros(dataset.contasPagar, filtros);
    const contasReceber = aplicarFiltros(dataset.contasReceber, filtros);
    const resumo = calcularResumoFinanceiro(contasPagar, contasReceber, new Date(), new Date().toISOString(), filtros.mes);
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
    const anoTodo = { ...filtros, mes: undefined };
    const contasPagar = aplicarFiltros(dataset.contasPagar, anoTodo);
    const contasReceber = aplicarFiltros(dataset.contasReceber, anoTodo);
    return delay(calcularFluxoCaixaMensal(contasPagar, contasReceber, mesesDoAno()));
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
