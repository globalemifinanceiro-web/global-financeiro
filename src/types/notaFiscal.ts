export type SituacaoNF = 'pendente' | 'paga' | 'cancelada';

export type FormaPagamento = 'Pix' | 'Boleto' | 'Transferência' | 'Cartão' | 'Dinheiro' | 'Outra';
export const FORMAS_PAGAMENTO: FormaPagamento[] = ['Pix', 'Boleto', 'Transferência', 'Cartão', 'Dinheiro', 'Outra'];

export interface NotaFiscal {
  id: string;
  empresa: string;
  clienteOuFornecedor: string;
  numeroDocumento: string | null;
  valor: number;
  vencimento: string; // ISO date (YYYY-MM-DD)
  situacao: SituacaoNF;
  formaPagamento: string | null;
  /** Já chegou assinada pelos responsáveis (aprovação registrada fora deste app, por enquanto). */
  assinado: boolean;
  arquivoPath: string | null;
  arquivoNome: string | null;
  observacoes: string | null;
  createdAt: string;
}

export type NovaNotaFiscal = Omit<NotaFiscal, 'id' | 'createdAt' | 'situacao'> & { situacao?: SituacaoNF };

/**
 * Status de vencimento, na régua exata pedida:
 * 5 dias antes → lembrete · 1 dia antes → atenção · no dia → vence hoje · depois → vencido.
 */
export type StatusVencimentoNF = 'vencido' | 'vence_hoje' | 'atencao' | 'lembrete' | 'em_dia' | 'paga' | 'cancelada';
