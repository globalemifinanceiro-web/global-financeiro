import { StyleSheet, Text, View } from 'react-native';
import { FiltersBar } from '@/components/FiltersBar';
import { MonthlyCashFlowChart } from '@/components/charts/MonthlyCashFlowChart';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useFluxoCaixaMensal } from '@/hooks/useFinanceData';
import { formatBRL } from '@/utils/currency';
import { formatMonthShortBR } from '@/utils/date';
import { colors, spacing, typography } from '@/theme';

export default function FluxoDeCaixaScreen() {
  const { data, isLoading, isError, refetch } = useFluxoCaixaMensal();

  return (
    <View style={styles.container}>
      <DemoBanner />
      <FiltersBar />

      <Card>
        <SectionHeader title="Fluxo de caixa mensal" subtitle="Receitas, despesas e saldo por mês" />
        {isLoading ? (
          <LoadingState />
        ) : isError || !data ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <MonthlyCashFlowChart data={data} height={240} />
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.headerCell, styles.mesCell]}>Mês</Text>
                <Text style={styles.headerCell}>Receitas</Text>
                <Text style={styles.headerCell}>Despesas</Text>
                <Text style={styles.headerCell}>Saldo</Text>
              </View>
              {data.map((item) => (
                <View key={item.mes} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.mesCell]}>{formatMonthShortBR(item.mes)}</Text>
                  <Text style={[styles.cell, { color: colors.positive }]}>{formatBRL(item.receitas)}</Text>
                  <Text style={[styles.cell, { color: colors.negative }]}>{formatBRL(item.despesas)}</Text>
                  <Text style={[styles.cell, { color: item.saldo >= 0 ? colors.positive : colors.negative }]}>
                    {formatBRL(item.saldo)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  table: { marginTop: spacing.lg },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  headerCell: { ...typography.captionStrong, color: colors.textSecondary, flex: 1 },
  cell: { ...typography.body, flex: 1 },
  mesCell: { flex: 0.7 },
});
