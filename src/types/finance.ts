export type TipoConta = 'pagar' | 'receber';

export type SituacaoTitulo = 'aberto' | 'vencido' | 'liquidado';

export interface ContaFinanceira {
  id: string;
  tipo: TipoConta;
  clienteOuFornecedor: string;
  projeto: string;
  categoria: string;
  departamento: string;
  contaCorrente: string;
  empresa: string;
  numeroDocumento: string;
  vencimento: string; // ISO date
  dataLiquidacao?: string; // ISO date, quando pago/recebido
  valorDocumento: number;
  valorLiquido: number;
  situacao: SituacaoTitulo;
}

export interface FiltrosFinanceiros {
  periodoInicio?: string;
  periodoFim?: string;
  empresa?: string;
  projeto?: string;
  clienteOuFornecedor?: string;
  categoria?: string;
  departamento?: string;
  contaCorrente?: string;
  situacao?: SituacaoTitulo;
}

export interface OpcoesFiltro {
  empresas: string[];
  projetos: string[];
  clientes: string[];
  fornecedores: string[];
  categorias: string[];
  departamentos: string[];
  contasCorrentes: string[];
}

export interface ResumoFinanceiro {
  saldoConsolidado: number;
  totalAReceber: number;
  totalAPagar: number;
  resultadoPrevisto: number;
  resultadoRealizado: number;
  valoresVencidos: number;
  vencimento7Dias: number;
  vencimento30Dias: number;
  receitasDoMes: number;
  despesasDoMes: number;
  ultimaSincronizacao: string; // ISO datetime
}

export interface FluxoCaixaMensal {
  mes: string; // ISO date (primeiro dia do mês)
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface ValorPorCategoria {
  categoria: string;
  valor: number;
}

export interface ResultadoPorProjeto {
  projeto: string;
  receitas: number;
  despesas: number;
  resultado: number;
}

export type SeveridadeAlerta = 'critico' | 'atencao' | 'info';

export interface AlertaFinanceiro {
  id: string;
  titulo: string;
  descricao: string;
  severidade: SeveridadeAlerta;
  data: string; // ISO datetime
}

export type PerfilAcesso = 'admin' | 'diretoria' | 'financeiro' | 'consulta';
