import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import type { ContaFinanceira } from '@/types/finance';
import { formatBRL } from '@/utils/currency';
import { daysUntil, formatDateBR } from '@/utils/date';
import { SITUACAO_LABEL, SITUACAO_TONE } from '@/utils/statusMappers';
import { colors, spacing, typography } from '@/theme';

export function ContaListItem({ conta }: { conta: ContaFinanceira }) {
  const dias = daysUntil(conta.vencimento);
  const prazoLabel =
    conta.situacao === 'liquidado'
      ? undefined
      : dias < 0
        ? `${Math.abs(dias)} dia(s) em atraso`
        : dias === 0
          ? 'Vence hoje'
          : `Vence em ${dias} dia(s)`;

  return (
    <View style={styles.item}>
      <View style={styles.info}>
        <Text style={styles.entidade} numberOfLines={1}>
          {conta.clienteOuFornecedor}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {conta.projeto} · {conta.categoria}
        </Text>
        <Text style={styles.meta}>
          Vencimento {formatDateBR(conta.vencimento)}
          {prazoLabel ? ` · ${prazoLabel}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.valor}>{formatBRL(conta.valorLiquido)}</Text>
        <Badge label={SITUACAO_LABEL[conta.situacao]} tone={SITUACAO_TONE[conta.situacao]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flexShrink: 1, gap: 2 },
  entidade: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  right: { alignItems: 'flex-end', gap: 6 },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
});
