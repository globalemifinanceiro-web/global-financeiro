import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { useResultadoPorProjeto } from '@/hooks/useFinanceData';
import { colors, spacing, typography } from '@/theme';
import { formatBRLCompact } from '@/utils/currency';

export function ResultadoPorProjetoCard() {
  const { data, isLoading } = useResultadoPorProjeto();

  return (
    <Card>
      <SectionHeader title="Resultado por projeto/obra" />
      {isLoading ? (
        <LoadingState />
      ) : !data || data.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {data.slice(0, 8).map((item) => (
            <View key={item.projeto} style={styles.row}>
              <Text style={styles.projeto} numberOfLines={1}>
                {item.projeto}
              </Text>
              <Text style={[styles.resultado, { color: item.resultado >= 0 ? colors.positive : colors.negative }]}>
                {formatBRLCompact(item.resultado)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 4 },
  projeto: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
  resultado: { ...typography.bodyStrong },
});
