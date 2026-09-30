import type { FinanceDataSource } from '@/services/data/FinanceDataSource';

/**
 * Implementação real: chamará as Supabase Edge Functions que buscam custos/NFs/recibos do app
 * Projetos Global e dados complementares do Google Sheets (nunca diretamente do app). Ainda não
 * implementada — isso será feito quando a integração com o Projetos Global for construída.
 */
function naoImplementado(metodo: string): never {
  throw new Error(
    `[Global Financeiro] Este painel (${metodo}) depende da integração com o Google Sheets, que ainda não foi implementada.`
  );
}

export const realDataSource: FinanceDataSource = {
  modo: 'real',
  getResumo: () => naoImplementado('getResumo'),
  getContasPagar: () => naoImplementado('getContasPagar'),
  getContasReceber: () => naoImplementado('getContasReceber'),
  getFluxoCaixaMensal: () => naoImplementado('getFluxoCaixaMensal'),
  getDespesasPorCategoria: () => naoImplementado('getDespesasPorCategoria'),
  getResultadoPorProjeto: () => naoImplementado('getResultadoPorProjeto'),
  getProximosVencimentos: () => naoImplementado('getProximosVencimentos'),
  getAlertas: () => naoImplementado('getAlertas'),
  getOpcoesFiltro: () => naoImplementado('getOpcoesFiltro'),
};
