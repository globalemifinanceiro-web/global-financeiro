import type {
  AlertaFinanceiro,
  ContaFinanceira,
  FiltrosFinanceiros,
  FluxoCaixaMensal,
  OpcoesFiltro,
  ResultadoPorProjeto,
  ResumoFinanceiro,
  ValorPorCategoria,
} from '@/types/finance';

/**
 * Contrato único entre as telas e a origem dos dados financeiros.
 * As telas nunca sabem se estão falando com o modo de demonstração ou com o backend real —
 * só dependem desta interface (ver `src/services/data/index.ts`).
 */
export interface FinanceDataSource {
  readonly modo: 'demo' | 'real';
  getResumo(filtros: FiltrosFinanceiros): Promise<ResumoFinanceiro>;
  getContasPagar(filtros: FiltrosFinanceiros): Promise<ContaFinanceira[]>;
  getContasReceber(filtros: FiltrosFinanceiros): Promise<ContaFinanceira[]>;
  getFluxoCaixaMensal(filtros: FiltrosFinanceiros): Promise<FluxoCaixaMensal[]>;
  getDespesasPorCategoria(filtros: FiltrosFinanceiros): Promise<ValorPorCategoria[]>;
  getResultadoPorProjeto(filtros: FiltrosFinanceiros): Promise<ResultadoPorProjeto[]>;
  getProximosVencimentos(filtros: FiltrosFinanceiros): Promise<ContaFinanceira[]>;
  getAlertas(): Promise<AlertaFinanceiro[]>;
  /** As opções de projeto/cliente/fornecedor/conta corrente são específicas de cada empresa (CNPJ). */
  getOpcoesFiltro(filtros: FiltrosFinanceiros): Promise<OpcoesFiltro>;
}
