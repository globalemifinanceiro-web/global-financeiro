import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { MonthlyCashFlowChart } from '@/components/charts/MonthlyCashFlowChart';
import { useFluxoCaixaMensal } from '@/hooks/useFinanceData';
import { ANO_VIGENTE } from '@/utils/periodo';

export function FluxoCaixaCard() {
  const { data, isLoading } = useFluxoCaixaMensal();

  return (
    <Card>
      <SectionHeader
        title="Fluxo de caixa mensal"
        subtitle={`Receitas x despesas de ${ANO_VIGENTE} — pagos pela data do pagamento, pendentes pelo vencimento`}
      />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : <MonthlyCashFlowChart data={data} />}
    </Card>
  );
}
