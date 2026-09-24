import type { FinanceDataSource } from '@/services/data/FinanceDataSource';

/**
 * Implementação real: chamará as Supabase Edge Functions que fazem proxy da Omie e do Google
 * Sheets (nunca a Omie/Sheets diretamente do app). Ainda não implementada — isso será feito na
 * Etapa 2/3 do projeto, depois da aprovação do protótipo visual e da configuração das credenciais.
 */
function naoImplementado(metodo: string): never {
  throw new Error(
    `[Global Financeiro] Integração real ainda não configurada (${metodo}). ` +
      'Defina EXPO_PUBLIC_DATA_MODE=demo ou finalize a Etapa 2 (backend Supabase) antes de usar o modo real.'
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
