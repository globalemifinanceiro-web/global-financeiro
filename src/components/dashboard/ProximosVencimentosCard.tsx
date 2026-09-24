import { View } from 'react-native';
import { ContaListItem } from '@/components/ContaListItem';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { useProximosVencimentos } from '@/hooks/useFinanceData';

export function ProximosVencimentosCard() {
  const { data, isLoading } = useProximosVencimentos();

  return (
    <Card>
      <SectionHeader title="Próximos vencimentos" subtitle="Títulos em aberto, ordenados por data" />
      {isLoading ? (
        <LoadingState />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nenhum vencimento em aberto" />
      ) : (
        <View>
          {data.map((conta) => (
            <ContaListItem key={conta.id} conta={conta} />
          ))}
        </View>
      )}
    </Card>
  );
}
