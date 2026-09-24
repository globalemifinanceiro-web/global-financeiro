import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { MonthlyCashFlowChart } from '@/components/charts/MonthlyCashFlowChart';
import { useFluxoCaixaMensal } from '@/hooks/useFinanceData';

export function FluxoCaixaCard() {
  const { data, isLoading } = useFluxoCaixaMensal();

  return (
    <Card>
      <SectionHeader title="Fluxo de caixa mensal" subtitle="Receitas x despesas nos últimos meses" />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : <MonthlyCashFlowChart data={data} />}
    </Card>
  );
}
