import { StyleSheet, Text, View } from 'react-native';
import { FiltersBar } from '@/components/FiltersBar';
import { DespesasPorCategoriaCard } from '@/components/dashboard/DespesasPorCategoriaCard';
import { FluxoCaixaCard } from '@/components/dashboard/FluxoCaixaCard';
import { ResultadoPorProjetoCard } from '@/components/dashboard/ResultadoPorProjetoCard';
import { ResumoGrid } from '@/components/dashboard/ResumoGrid';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useResumoFinanceiro } from '@/hooks/useFinanceData';
import { colors, spacing, typography } from '@/theme';

export default function RelatoriosScreen() {
  const { data: resumo, isLoading, isError, refetch } = useResumoFinanceiro();

  return (
    <View style={styles.container}>
      <DemoBanner />
      <FiltersBar />

      <Card style={styles.intro}>
        <Text style={styles.introTitle}>Relatório financeiro — Previsto x Realizado</Text>
        <Text style={styles.introText}>
          Consolidado com os filtros selecionados acima. Exportação em PDF/planilha e relatórios adicionais (ex.:
          ordens de serviço e contratos) entram em uma etapa futura, junto da integração real com a Omie.
        </Text>
      </Card>

      {isLoading ? (
        <LoadingState label="Carregando relatório..." />
      ) : isError || !resumo ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <ResumoGrid resumo={resumo} />
      )}

      <FluxoCaixaCard />

      <View style={styles.row}>
        <View style={styles.half}>
          <DespesasPorCategoriaCard />
        </View>
        <View style={styles.half}>
          <ResultadoPorProjetoCard />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  intro: { gap: spacing.xs },
  introTitle: { ...typography.subheading, color: colors.textPrimary },
  introText: { ...typography.caption, color: colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  half: { flexGrow: 1, flexBasis: 380 },
});
