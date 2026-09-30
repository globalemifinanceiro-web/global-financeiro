export type TipoConciliacao = 'recebimento' | 'pagamento';

/** sem_vinculo | ok (título marcado como pago) | pendente_origem (baixa tem que ser feita no Projetos Global) | erro */
export type BaixaStatus = 'sem_vinculo' | 'ok' | 'pendente_origem' | 'erro';

export interface Conciliacao {
  id: string;
  tipo: TipoConciliacao;
  empresa: string | null;
  dataPagamento: string;
  valor: number;
  descricao: string | null;
  arquivoNome: string;
  driveUrl: string;
  tituloDescricao: string | null;
  baixaStatus: BaixaStatus;
  baixaErro: string | null;
  createdAt: string;
}

export type VinculoTitulo = { tipo: 'conta_receber'; linhaPlanilha: number } | { tipo: 'nota_fiscal'; id: string };

/** Título pendente que pode receber um comprovante (conta a receber da planilha ou nota fiscal). */
export interface TituloPendente {
  chave: string;
  vinculo: VinculoTitulo;
  tipo: TipoConciliacao;
  empresa: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  /** Nota vinda do Projetos Global: o comprovante é vinculado, mas a baixa acontece lá. */
  baixaNaOrigem: boolean;
}

export interface NovoComprovante {
  tipo: TipoConciliacao;
  empresa: string | null;
  dataPagamento: string;
  valor: number;
  descricao: string | null;
  arquivo: { uri: string; nome: string; mimeType?: string };
  vinculo: VinculoTitulo | null;
}

export interface ResultadoComprovante {
  id: string;
  driveUrl: string;
  baixaStatus: BaixaStatus;
  baixaErro: string | null;
}
