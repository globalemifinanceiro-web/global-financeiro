import type { NotaFiscal, StatusVencimentoNF } from '@/types/notaFiscal';
import { toLocalDate } from '@/utils/date';

function diasAte(vencimento: string, referencia: Date): number {
  const hoje = new Date(referencia);
  hoje.setHours(0, 0, 0, 0);
  const alvo = toLocalDate(vencimento);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/** Régua de status: 5 dias antes = lembrete, 1 dia antes = atenção, no dia = vence hoje, depois = vencido. */
export function statusVencimento(nota: Pick<NotaFiscal, 'situacao' | 'vencimento'>, referencia = new Date()): StatusVencimentoNF {
  if (nota.situacao === 'paga') return 'paga';
  if (nota.situacao === 'cancelada') return 'cancelada';

  const dias = diasAte(nota.vencimento, referencia);
  if (dias < 0) return 'vencido';
  if (dias === 0) return 'vence_hoje';
  if (dias === 1) return 'atencao';
  if (dias <= 5) return 'lembrete';
  return 'em_dia';
}

export function diasParaVencimento(vencimento: string, referencia = new Date()): number {
  return diasAte(vencimento, referencia);
}

export const STATUS_NF_LABEL: Record<StatusVencimentoNF, string> = {
  vencido: 'Vencido',
  vence_hoje: 'Vence hoje',
  atencao: 'Atenção',
  lembrete: 'Lembrete',
  em_dia: 'Em dia',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

/** Precisa de pop-up/alerta (tudo que já entrou na janela de aviso e ainda não foi resolvido). */
export function precisaAlertar(status: StatusVencimentoNF): boolean {
  return status === 'lembrete' || status === 'atencao' || status === 'vence_hoje' || status === 'vencido';
}
