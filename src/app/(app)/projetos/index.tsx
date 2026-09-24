import { StyleSheet, Text, View } from 'react-native';
import { FiltersBar } from '@/components/FiltersBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useResultadoPorProjeto } from '@/hooks/useFinanceData';
import { formatBRL } from '@/utils/currency';
import { colors, spacing, typography } from '@/theme';

export default function ProjetosScreen() {
  const { data, isLoading, isError, refetch } = useResultadoPorProjeto();

  return (
    <View style={styles.container}>
      <DemoBanner />
      <FiltersBar />

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState description="Nenhum projeto encontrado para os filtros selecionados." />
      ) : (
        <View style={styles.grid}>
          {data.map((item) => (
            <Card key={item.projeto} style={styles.card}>
              <Text style={styles.projeto} numberOfLines={2}>
                {item.projeto}
              </Text>
              <View style={styles.linha}>
                <Text style={styles.label}>Receitas</Text>
                <Text style={[styles.valor, { color: colors.positive }]}>{formatBRL(item.receitas)}</Text>
              </View>
              <View style={styles.linha}>
                <Text style={styles.label}>Despesas</Text>
                <Text style={[styles.valor, { color: colors.negative }]}>{formatBRL(item.despesas)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.linha}>
                <Text style={styles.labelResultado}>Resultado</Text>
                <Badge
                  label={formatBRL(item.resultado)}
                  tone={item.resultado >= 0 ? 'positive' : 'negative'}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexGrow: 1, flexBasis: 260, gap: spacing.xs },
  projeto: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.xs },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.caption, color: colors.textSecondary },
  labelResultado: { ...typography.bodyStrong, color: colors.textPrimary },
  valor: { ...typography.bodyStrong },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
});
