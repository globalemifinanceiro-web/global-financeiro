export type SituacaoSolicitacao =
  | 'enviado'
  | 'pendente_gestor'
  | 'pendente_diretor'
  | 'devolvido'
  | 'liberado_financeiro'
  | 'pagamento_agendado'
  | 'pago'
  | 'rejeitado'
  | 'cancelado';

export interface ResponsavelEtapa {
  nome: string;
  cargo?: string | null;
}

export interface EventoHistorico {
  acao: string;
  de?: string | null;
  para?: string | null;
  etapa?: string | null;
  nome?: string | null;
  cargo?: string | null;
  comentario?: string | null;
  data: string;
}

export interface SolicitacaoProjetos {
  id: string;
  codigo: number | null;
  titulo: string;
  situacao: SituacaoSolicitacao;
  valor: number | null;
  empresa: string | null;
  projetoPcg: string | null;
  projetoCliente: string | null;
  fornecedor: string | null;
  lancadoPorNome: string | null;
  lancadoEm: string | null;
  atualizadoEm: string;
  etapaNome: string | null;
  etapaPapel: string | null;
  etapaDesde: string | null;
  etapaPrazo: string | null;
  responsaveis: ResponsavelEtapa[];
  historico: EventoHistorico[];
}

export const SITUACAO_SOLICITACAO_LABEL: Record<SituacaoSolicitacao, string> = {
  enviado: 'Lançada',
  pendente_gestor: 'Com o Gestor',
  pendente_diretor: 'Com o Diretor',
  devolvido: 'Devolvida para ajuste',
  liberado_financeiro: 'Liberada ao Financeiro',
  pagamento_agendado: 'Pagamento agendado',
  pago: 'Paga',
  rejeitado: 'Rejeitada',
  cancelado: 'Cancelada',
};

/** Etapas em que a solicitação ainda está sendo aprovada — as que disparam o alerta de "nova". */
export const EM_APROVACAO: SituacaoSolicitacao[] = ['enviado', 'pendente_gestor', 'pendente_diretor'];
