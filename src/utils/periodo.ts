import { toLocalDate } from '@/utils/date';

/**
 * Ano exibido no app. Tudo fora dele some, exceto títulos ainda em aberto de anos anteriores
 * (continuam aparecendo como vencidos, para não sumirem da cobrança). Troque aqui na virada do ano.
 */
export const ANO_VIGENTE = 2026;

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export const INICIO_ANO = `${ANO_VIGENTE}-01-01`;
export const FIM_ANO = `${ANO_VIGENTE}-12-31`;

/** Data que decide o mês do título: pagos contam pela data do pagamento; o resto, pelo vencimento. */
export function dataReferencia(conta: { situacao: string; vencimento: string; dataLiquidacao?: string }): string {
  return conta.situacao === 'liquidado' && conta.dataLiquidacao ? conta.dataLiquidacao : conta.vencimento;
}

/**
 * `mes` (1–12) restringe a um mês do ANO_VIGENTE; sem ele, vale o ano todo — mais os títulos em
 * aberto de anos anteriores.
 */
export function noPeriodo(dataIso: string, emAberto: boolean, mes?: number): boolean {
  const data = toLocalDate(dataIso);
  if (mes) return data.getFullYear() === ANO_VIGENTE && data.getMonth() + 1 === mes;
  return data.getFullYear() === ANO_VIGENTE || (emAberto && data.getFullYear() < ANO_VIGENTE);
}

/** Primeiro dia de cada mês do ANO_VIGENTE, no formato ISO — eixo do fluxo de caixa. */
export function mesesDoAno(): string[] {
  return MESES.map((_, indice) => `${ANO_VIGENTE}-${String(indice + 1).padStart(2, '0')}-01`);
}
