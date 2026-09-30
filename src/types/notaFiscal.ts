export type SituacaoNF = 'pendente' | 'paga' | 'cancelada';

export type FormaPagamento = 'Pix' | 'Boleto' | 'Transferência' | 'Cartão' | 'Dinheiro' | 'Outra';
export const FORMAS_PAGAMENTO: FormaPagamento[] = ['Pix', 'Boleto', 'Transferência', 'Cartão', 'Dinheiro', 'Outra'];

export type OrigemNF = 'manual' | 'projetos_global';

export interface NotaFiscal {
  id: string;
  /** Nula enquanto uma nota vinda do Projetos Global ainda não foi classificada por empresa. */
  empresa: string | null;
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
  origem: OrigemNF;
  /** Id da solicitação no Projetos Global (para buscar o documento assinado e os anexos). */
  projetosGlobalRequestId: string | null;
  /** Status original da solicitação no Projetos Global (liberado_financeiro/pagamento_agendado/pago), quando vem de lá. */
  projetosGlobalStatus: string | null;
  projetoPcg: string | null;
  projetoNome: string | null;
}

/** Criação manual (formulário) — sempre tem empresa definida e nunca vem do Projetos Global. */
export type NovaNotaFiscal = Pick<
  NotaFiscal,
  'clienteOuFornecedor' | 'numeroDocumento' | 'valor' | 'vencimento' | 'formaPagamento' | 'assinado' | 'arquivoPath' | 'arquivoNome' | 'observacoes'
> & { empresa: string; situacao?: SituacaoNF };

/**
 * Status de vencimento, na régua exata pedida:
 * 5 dias antes → lembrete · 1 dia antes → atenção · no dia → vence hoje · depois → vencido.
 */
export type StatusVencimentoNF = 'vencido' | 'vence_hoje' | 'atencao' | 'lembrete' | 'em_dia' | 'paga' | 'cancelada';
