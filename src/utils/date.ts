const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
});

/**
 * Datas "somente data" (YYYY-MM-DD, como vencimentos vindos da Omie) não carregam fuso horário.
 * `new Date('2026-09-18')` é interpretado como UTC e pode "virar o dia" ao converter para o
 * horário local da máquina. Para essas, construímos a data manualmente no horário local.
 */
export function toLocalDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function formatDateBR(value: string | Date): string {
  return dateFormatter.format(toLocalDate(value));
}

export function formatDateTimeBR(value: string | Date): string {
  // datas com horário (ex.: última sincronização) já carregam fuso horário no próprio ISO string.
  const date = typeof value === 'string' ? new Date(value) : value;
  return dateTimeFormatter.format(date);
}

export function formatMonthShortBR(value: string | Date): string {
  const label = monthFormatter.format(toLocalDate(value)).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysUntil(value: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = toLocalDate(value);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
