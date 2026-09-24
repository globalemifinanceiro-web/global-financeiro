import { demoDataSource } from '@/services/demo/demoDataSource';
import { realDataSource } from '@/services/real/realDataSource';
import type { FinanceDataSource } from './FinanceDataSource';

/**
 * Único ponto de troca entre modo de demonstração e modo real.
 * Definido por variável de ambiente pública do Expo — nunca por lógica espalhada pelas telas.
 */
export const dataMode: 'demo' | 'real' = process.env.EXPO_PUBLIC_DATA_MODE === 'real' ? 'real' : 'demo';

export const financeDataSource: FinanceDataSource = dataMode === 'real' ? realDataSource : demoDataSource;

export type { FinanceDataSource } from './FinanceDataSource';
