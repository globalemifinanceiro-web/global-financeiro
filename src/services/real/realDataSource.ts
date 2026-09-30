import type { FinanceDataSource } from '@/services/data/FinanceDataSource';
import { listarContasReceberSheets } from '@/services/supabase/contasReceberSheets';
import type { ContaFinanceira } from '@/types/finance';
import { toLocalDate } from '@/utils/date';
import {
  agruparPorProjeto,
  aplicarFiltros,
  calcularFluxoCaixaMensal,
  calcularResumoFinanceiro,
} from '@/utils/financeCalculations';
import { mesesDoAno } from '@/utils/periodo';

function naoImplementado(metodo: string): never {
  throw new Error(`[Global Financeiro] Este painel (${metodo}) depende de uma integração ainda não implementada.`);
}

// Contas a pagar ainda não têm fonte real (dependem de outra planilha/integração) — entram vazias
// por enquanto, então os KPIs combinados (resumo, fluxo de caixa) já funcionam com o lado real do
// que existe (contas a receber) sem travar em erro, e passam a refletir os dois lados assim que a
// próxima integração for ligada aqui.
async function contasPagarReal(): Promise<ContaFinanceira[]> {
  return [];
}

export const realDataSource: FinanceDataSource = {
  modo: 'real',

  async getResumo(filtros) {
    const [contasPagar, contasReceber] = await Promise.all([contasPagarReal(), listarContasReceberSheets()]);
    return calcularResumoFinanceiro(
      aplicarFiltros(contasPagar, filtros),
      aplicarFiltros(contasReceber, filtros),
      new Date(),
      new Date().toISOString(),
      filtros.mes
    );
  },

  async getContasPagar() {
    return naoImplementado('Contas a Pagar');
  },

  async getContasReceber(filtros) {
    const contasReceber = await listarContasReceberSheets();
    return aplicarFiltros(contasReceber, filtros);
  },

  async getFluxoCaixaMensal(filtros) {
    const [contasPagar, contasReceber] = await Promise.all([contasPagarReal(), listarContasReceberSheets()]);
    const anoTodo = { ...filtros, mes: undefined };
    return calcularFluxoCaixaMensal(aplicarFiltros(contasPagar, anoTodo), aplicarFiltros(contasReceber, anoTodo), mesesDoAno());
  },

  async getDespesasPorCategoria() {
    return naoImplementado('Despesas por categoria');
  },

  async getResultadoPorProjeto(filtros) {
    const [contasPagar, contasReceber] = await Promise.all([contasPagarReal(), listarContasReceberSheets()]);
    return agruparPorProjeto(aplicarFiltros(contasPagar, filtros), aplicarFiltros(contasReceber, filtros));
  },

  async getProximosVencimentos(filtros) {
    const contasReceber = await listarContasReceberSheets();
    const abertas = aplicarFiltros(contasReceber, filtros).filter((conta) => conta.situacao === 'aberto');
    return abertas.sort((a, b) => toLocalDate(a.vencimento).getTime() - toLocalDate(b.vencimento).getTime()).slice(0, 10);
  },

  async getAlertas() {
    return [];
  },

  async getOpcoesFiltro(filtros) {
    const contasReceber = await listarContasReceberSheets();
    const filtradas = filtros.empresa ? contasReceber.filter((c) => c.empresa === filtros.empresa) : contasReceber;
    const unico = (valores: string[]) => Array.from(new Set(valores)).filter(Boolean);
    return {
      empresas: unico(contasReceber.map((c) => c.empresa)),
      projetos: [],
      clientes: unico(filtradas.map((c) => c.clienteOuFornecedor)),
      fornecedores: [],
      categorias: unico(filtradas.map((c) => c.categoria)),
      departamentos: [],
      contasCorrentes: [],
    };
  },
};
