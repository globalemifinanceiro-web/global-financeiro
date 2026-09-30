import { toLocalDate } from '@/utils/date';
import { ANO_VIGENTE, dataReferencia, noPeriodo } from '@/utils/periodo';
import type {
  ContaFinanceira,
  FiltrosFinanceiros,
  FluxoCaixaMensal,
  ResultadoPorProjeto,
  ResumoFinanceiro,
  ValorPorCategoria,
} from '@/types/finance';

/** Aplica os filtros do FiltersBar a uma lista de contas — comum ao modo demo e ao real. */
export function aplicarFiltros(contas: ContaFinanceira[], filtros: FiltrosFinanceiros): ContaFinanceira[] {
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
    return noPeriodo(dataReferencia(conta), conta.situacao !== 'liquidado', filtros.mes);
  });
}

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

function somarLiquidados(contas: ContaFinanceira[]): number {
  return contas.filter((conta) => conta.situacao === 'liquidado').reduce((total, conta) => total + conta.valorLiquido, 0);
}

/**
 * Monta o resumo financeiro consolidado a partir das listas de contas a pagar e a receber (já
 * filtradas pelo período). `mesFiltro` é o mês escolhido no filtro: vira o "mês" dos KPIs de mês;
 * sem ele, vale o mês corrente.
 */
export function calcularResumoFinanceiro(
  contasPagar: ContaFinanceira[],
  contasReceber: ContaFinanceira[],
  referenceDate: Date,
  ultimaSincronizacao: string,
  mesFiltro?: number
): ResumoFinanceiro {
  const totalAPagar = somarEmAberto(contasPagar);
  const totalAReceber = somarEmAberto(contasReceber);

  const mesReferencia = mesFiltro ? new Date(ANO_VIGENTE, mesFiltro - 1, 1) : referenceDate;
  const receitasDoMes = contasReceber
    .filter((conta) => isMesmoMes(dataReferencia(conta), mesReferencia))
    .reduce((total, conta) => total + conta.valorLiquido, 0);
  const despesasDoMes = contasPagar
    .filter((conta) => isMesmoMes(dataReferencia(conta), mesReferencia))
    .reduce((total, conta) => total + conta.valorLiquido, 0);

  const entradasRealizadas = somarLiquidados(contasReceber);
  const saidasRealizadas = somarLiquidados(contasPagar);

  // Saídas: as planilhas de contas a pagar não dizem o que foi pago, então tudo conta pelo mês de
  // referência, e a média divide só pelos meses que já têm planilha (não pelo ano todo).
  const saidasDoAno = contasPagar.filter((conta) => toLocalDate(dataReferencia(conta)).getFullYear() === ANO_VIGENTE);
  const mesesComSaidas = new Set(saidasDoAno.map((conta) => dataReferencia(conta).slice(0, 7))).size;
  const totalSaidas = saidasDoAno.reduce((total, conta) => total + conta.valorLiquido, 0);

  // Entradas: só o que efetivamente entrou, pelos meses já decorridos do ano (ou 1, com mês filtrado).
  const mesesConsiderados = mesFiltro
    ? 1
    : referenceDate.getFullYear() > ANO_VIGENTE
      ? 12
      : referenceDate.getFullYear() < ANO_VIGENTE
        ? 1
        : referenceDate.getMonth() + 1;

  return {
    saldoConsolidado: totalAReceber - totalAPagar,
    totalAReceber,
    totalAPagar,
    resultadoPrevisto: receitasDoMes - despesasDoMes,
    resultadoRealizado: entradasRealizadas - saidasRealizadas,
    valoresVencidos: somarVencidos(contasPagar, referenceDate) + somarVencidos(contasReceber, referenceDate),
    vencimento7Dias: somarVencendoEm(contasPagar, referenceDate, 7) + somarVencendoEm(contasReceber, referenceDate, 7),
    vencimento30Dias: somarVencendoEm(contasPagar, referenceDate, 30) + somarVencendoEm(contasReceber, referenceDate, 30),
    receitasDoMes,
    despesasDoMes,
    mediaMensalEntradas: entradasRealizadas / mesesConsiderados,
    mediaMensalSaidas: mesesComSaidas > 0 ? totalSaidas / mesesComSaidas : 0,
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
      .filter((conta) => isMesmoMes(dataReferencia(conta), referencia))
      .reduce((total, conta) => total + conta.valorLiquido, 0);
    const despesas = contasPagar
      .filter((conta) => isMesmoMes(dataReferencia(conta), referencia))
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
