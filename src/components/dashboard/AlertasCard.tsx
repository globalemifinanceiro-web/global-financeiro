import { View } from 'react-native';
import { AlertaListItem } from '@/components/AlertaListItem';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { useAlertas } from '@/hooks/useFinanceData';

export function AlertasCard() {
  const { data, isLoading } = useAlertas();

  return (
    <Card>
      <SectionHeader title="Alertas financeiros" />
      {isLoading ? (
        <LoadingState />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nenhum alerta no momento" />
      ) : (
        <View>
          {data.map((alerta) => (
            <AlertaListItem key={alerta.id} alerta={alerta} />
          ))}
        </View>
      )}
    </Card>
  );
}
