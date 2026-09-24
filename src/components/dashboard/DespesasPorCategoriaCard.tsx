import { View } from 'react-native';
import { BarRow } from '@/components/charts/BarRow';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { useDespesasPorCategoria } from '@/hooks/useFinanceData';
import { colors, spacing } from '@/theme';

export function DespesasPorCategoriaCard() {
  const { data, isLoading } = useDespesasPorCategoria();
  const maxValue = data && data.length > 0 ? data[0].valor : 0;

  return (
    <Card>
      <SectionHeader title="Despesas por categoria" />
      {isLoading ? (
        <LoadingState />
      ) : !data || data.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {data.slice(0, 8).map((item) => (
            <BarRow key={item.categoria} label={item.categoria} value={item.valor} maxValue={maxValue} color={colors.blue} />
          ))}
        </View>
      )}
    </Card>
  );
}
