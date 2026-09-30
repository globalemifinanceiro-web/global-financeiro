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

function naoImplementado(metodo: string): never {
  throw new Error(`[Global Financeiro] Este painel (${metodo}) depende de uma integração ainda não implementada.`);
}

function ultimosMeses(quantidade: number): string[] {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, index) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - (quantidade - 1 - index), 1);
    return data.toISOString().slice(0, 10);
  });
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
      new Date().toISOString()
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
    return calcularFluxoCaixaMensal(aplicarFiltros(contasPagar, filtros), aplicarFiltros(contasReceber, filtros), ultimosMeses(6));
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
