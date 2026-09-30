import { StyleSheet, View } from 'react-native';
import { KpiCard } from '@/components/ui/KpiCard';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import type { ResumoFinanceiro } from '@/types/finance';
import { formatBRL } from '@/utils/currency';
import { ANO_VIGENTE, MESES } from '@/utils/periodo';
import { spacing } from '@/theme';

export function ResumoGrid({ resumo }: { resumo: ResumoFinanceiro }) {
  const mesFiltro = useFiltrosStore((state) => state.filtros.mes);
  const doMes = mesFiltro ? `de ${MESES[mesFiltro - 1].toLowerCase()}` : 'do mês';
  const periodoMedia = mesFiltro ? MESES[mesFiltro - 1].toLowerCase() : ANO_VIGENTE;

  return (
    <View style={styles.grid}>
      <KpiCard
        label="Saldo consolidado"
        value={formatBRL(resumo.saldoConsolidado)}
        tone={resumo.saldoConsolidado >= 0 ? 'positive' : 'negative'}
        icon="wallet-outline"
      />
      <KpiCard label="Total a receber" value={formatBRL(resumo.totalAReceber)} tone="info" icon="arrow-down-circle-outline" />
      <KpiCard label="Total a pagar" value={formatBRL(resumo.totalAPagar)} tone="warning" icon="arrow-up-circle-outline" />
      <KpiCard
        label={`Resultado previsto (${doMes})`}
        value={formatBRL(resumo.resultadoPrevisto)}
        tone={resumo.resultadoPrevisto >= 0 ? 'positive' : 'negative'}
        icon="trending-up-outline"
      />
      <KpiCard
        label="Resultado realizado"
        value={formatBRL(resumo.resultadoRealizado)}
        tone={resumo.resultadoRealizado >= 0 ? 'positive' : 'negative'}
        icon="checkmark-done-outline"
      />
      <KpiCard label="Valores vencidos" value={formatBRL(resumo.valoresVencidos)} tone="negative" icon="alert-circle-outline" />
      <KpiCard label="Vencimento em 7 dias" value={formatBRL(resumo.vencimento7Dias)} tone="warning" icon="time-outline" />
      <KpiCard label="Vencimento em 30 dias" value={formatBRL(resumo.vencimento30Dias)} tone="neutral" icon="calendar-outline" />
      <KpiCard label={`Receitas ${doMes}`} value={formatBRL(resumo.receitasDoMes)} tone="positive" icon="trending-up-outline" />
      <KpiCard label={`Despesas ${doMes}`} value={formatBRL(resumo.despesasDoMes)} tone="negative" icon="trending-down-outline" />
      <KpiCard
        label={`Média mensal de entradas (${periodoMedia})`}
        value={formatBRL(resumo.mediaMensalEntradas)}
        tone="positive"
        icon="enter-outline"
      />
      <KpiCard
        label={`Média mensal de saídas (${periodoMedia})`}
        value={formatBRL(resumo.mediaMensalSaidas)}
        tone="negative"
        icon="exit-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
