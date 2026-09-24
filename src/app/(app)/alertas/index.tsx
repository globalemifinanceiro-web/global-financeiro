import { StyleSheet, View } from 'react-native';
import { AlertaListItem } from '@/components/AlertaListItem';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useAlertas } from '@/hooks/useFinanceData';
import { spacing } from '@/theme';

export default function AlertasScreen() {
  const { data, isLoading, isError, refetch } = useAlertas();

  return (
    <View style={styles.container}>
      <DemoBanner />
      <Card>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Nenhum alerta no momento" />
        ) : (
          data.map((alerta) => <AlertaListItem key={alerta.id} alerta={alerta} />)
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
