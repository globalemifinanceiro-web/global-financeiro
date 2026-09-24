import type { SeveridadeAlerta, SituacaoTitulo } from '@/types/finance';
import type { StatusTone } from '@/theme';

export const SITUACAO_LABEL: Record<SituacaoTitulo, string> = {
  aberto: 'Em aberto',
  vencido: 'Vencido',
  liquidado: 'Liquidado',
};

export const SITUACAO_TONE: Record<SituacaoTitulo, StatusTone> = {
  aberto: 'info',
  vencido: 'negative',
  liquidado: 'positive',
};

export const SEVERIDADE_TONE: Record<SeveridadeAlerta, StatusTone> = {
  critico: 'negative',
  atencao: 'warning',
  info: 'info',
};

export const SEVERIDADE_LABEL: Record<SeveridadeAlerta, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  info: 'Informativo',
};
