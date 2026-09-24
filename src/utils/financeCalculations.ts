import { toLocalDate } from '@/utils/date';
import type {
  ContaFinanceira,
  FluxoCaixaMensal,
  ResultadoPorProjeto,
  ResumoFinanceiro,
  ValorPorCategoria,
} from '@/types/finance';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function diffInDays(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function isMesmoMes(isoDate: string, reference: Date): boolean {
  const date = toLocalDate(isoDate);
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

/** Soma o valor líquido dos títulos ainda em aberto (não liquidados). */
export function somarEmAberto(contas: ContaFinanceira[]): number {
  return contas
    .filter((conta) => conta.situacao !== 'liquidado')
    .reduce((total, conta) => total + conta.valorLiquido, 0);
}

/** Soma o valor líquido dos títulos com vencimento estritamente anterior à data de referência e ainda não liquidados. */
export function somarVencidos(contas: ContaFinanceira[], referenceDate: Date): number {
  return contas
    .filter((conta) => conta.situacao !== 'liquidado' && diffInDays(referenceDate, toLocalDate(conta.vencimento)) < 0)
    .reduce((total, conta) => total + conta.valorLiquido, 0);
}

/** Soma o valor líquido dos títulos em aberto cujo vencimento cai dentro dos próximos N dias (incluindo hoje). */
export function somarVencendoEm(contas: ContaFinanceira[], referenceDate: Date, dias: number): number {
  return contas
    .filter((conta) => {
      if (conta.situacao === 'liquidado') return false;
      const delta = diffInDays(referenceDate, toLocalDate(conta.vencimento));
      return delta >= 0 && delta <= dias;
    })
    .reduce((total, conta) => total + conta.valorLiquido, 0);
}

/** Monta o resumo financeiro consolidado a partir das listas de contas a pagar e a receber. */
export function calcularResumoFinanceiro(
  contasPagar: ContaFinanceira[],
  contasReceber: ContaFinanceira[],
  referenceDate: Date,
  ultimaSincronizacao: string
): ResumoFinanceiro {
  const totalAPagar = somarEmAberto(contasPagar);
  const totalAReceber = somarEmAberto(contasReceber);

  const receitasDoMes = contasReceber
    .filter((conta) => isMesmoMes(conta.vencimento, referenceDate))
    .reduce((total, conta) => total + conta.valorLiquido, 0);
  const despesasDoMes = contasPagar
    .filter((conta) => isMesmoMes(conta.vencimento, referenceDate))
    .reduce((total, conta) => total + conta.valorLiquido, 0);

  const resultadoRealizado = contasReceber
    .filter((conta) => conta.situacao === 'liquidado')
    .reduce((total, conta) => total + conta.valorLiquido, 0)
    - contasPagar
      .filter((conta) => conta.situacao === 'liquidado')
      .reduce((total, conta) => total + conta.valorLiquido, 0);

  return {
    saldoConsolidado: totalAReceber - totalAPagar,
    totalAReceber,
    totalAPagar,
    resultadoPrevisto: receitasDoMes - despesasDoMes,
    resultadoRealizado,
    valoresVencidos: somarVencidos(contasPagar, referenceDate) + somarVencidos(contasReceber, referenceDate),
    vencimento7Dias: somarVencendoEm(contasPagar, referenceDate, 7) + somarVencendoEm(contasReceber, referenceDate, 7),
    vencimento30Dias: somarVencendoEm(contasPagar, referenceDate, 30) + somarVencendoEm(contasReceber, referenceDate, 30),
    receitasDoMes,
    despesasDoMes,
    ultimaSincronizacao,
  };
}

/** Agrupa receitas, despesas e saldo por mês (ordem cronológica) para o fluxo de caixa. */
export function calcularFluxoCaixaMensal(
  contasPagar: ContaFinanceira[],
  contasReceber: ContaFinanceira[],
  meses: string[] // ISO do primeiro dia de cada mês, em ordem
): FluxoCaixaMensal[] {
  return meses.map((mes) => {
    const referencia = toLocalDate(mes);
    const receitas = contasReceber
      .filter((conta) => isMesmoMes(conta.vencimento, referencia))
      .reduce((total, conta) => total + conta.valorLiquido, 0);
    const despesas = contasPagar
      .filter((conta) => isMesmoMes(conta.vencimento, referencia))
      .reduce((total, conta) => total + conta.valorLiquido, 0);
    return { mes, receitas, despesas, saldo: receitas - despesas };
  });
}

/** Agrupa o valor das despesas (contas a pagar) por categoria, ordenado do maior para o menor. */
export function agruparPorCategoria(contasPagar: ContaFinanceira[]): ValorPorCategoria[] {
  const totals = new Map<string, number>();
  for (const conta of contasPagar) {
    totals.set(conta.categoria, (totals.get(conta.categoria) ?? 0) + conta.valorLiquido);
  }
  return Array.from(totals.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
}

/** Agrupa receitas, despesas e resultado por projeto/obra. */
export function agruparPorProjeto(
  contasPagar: ContaFinanceira[],
  contasReceber: ContaFinanceira[]
): ResultadoPorProjeto[] {
  const projetos = new Set<string>([
    ...contasPagar.map((conta) => conta.projeto),
    ...contasReceber.map((conta) => conta.projeto),
  ]);

  return Array.from(projetos)
    .map((projeto) => {
      const receitas = contasReceber
        .filter((conta) => conta.projeto === projeto)
        .reduce((total, conta) => total + conta.valorLiquido, 0);
      const despesas = contasPagar
        .filter((conta) => conta.projeto === projeto)
        .reduce((total, conta) => total + conta.valorLiquido, 0);
      return { projeto, receitas, despesas, resultado: receitas - despesas };
    })
    .sort((a, b) => b.resultado - a.resultado);
}
