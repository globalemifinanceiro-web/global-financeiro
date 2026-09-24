import { StyleSheet, Text, View } from 'react-native';
import { ContaListItem } from '@/components/ContaListItem';
import { FiltersBar } from '@/components/FiltersBar';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ContaFinanceira } from '@/types/finance';
import { formatBRL } from '@/utils/currency';
import { colors, spacing, typography } from '@/theme';

interface ContasScreenContentProps {
  query: UseQueryResult<ContaFinanceira[], Error>;
}

export function ContasScreenContent({ query }: ContasScreenContentProps) {
  const { data, isLoading, isError, refetch } = query;
  const total = data?.reduce((sum, conta) => sum + conta.valorLiquido, 0) ?? 0;

  return (
    <View style={styles.container}>
      <DemoBanner />
      <FiltersBar />

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState description="Ajuste os filtros para ver outros resultados." />
        ) : (
          <>
            <Text style={styles.resumo}>
              {data.length} título(s) · Total {formatBRL(total)}
            </Text>
            {data.map((conta) => (
              <ContaListItem key={conta.id} conta={conta} />
            ))}
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  resumo: { ...typography.captionStrong, color: colors.textSecondary, marginBottom: spacing.sm },
});
