import { StyleSheet, Text, View } from 'react-native';
import { FiltersBar } from '@/components/FiltersBar';
import { AlertasCard } from '@/components/dashboard/AlertasCard';
import { DespesasPorCategoriaCard } from '@/components/dashboard/DespesasPorCategoriaCard';
import { FluxoCaixaCard } from '@/components/dashboard/FluxoCaixaCard';
import { ProximosVencimentosCard } from '@/components/dashboard/ProximosVencimentosCard';
import { ResultadoPorProjetoCard } from '@/components/dashboard/ResultadoPorProjetoCard';
import { ResumoGrid } from '@/components/dashboard/ResumoGrid';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useResumoFinanceiro } from '@/hooks/useFinanceData';
import { formatDateTimeBR } from '@/utils/date';
import { colors, spacing, typography } from '@/theme';

export default function DashboardScreen() {
  const { data: resumo, isLoading, isError, refetch } = useResumoFinanceiro();

  return (
    <View style={styles.container}>
      <DemoBanner />
      <FiltersBar />

      {isLoading ? (
        <LoadingState label="Carregando resumo financeiro..." />
      ) : isError || !resumo ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <ResumoGrid resumo={resumo} />
          <Text style={styles.sincronizacao}>Última sincronização: {formatDateTimeBR(resumo.ultimaSincronizacao)}</Text>
        </>
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

      <View style={styles.row}>
        <View style={styles.half}>
          <ProximosVencimentosCard />
        </View>
        <View style={styles.half}>
          <AlertasCard />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  half: { flexGrow: 1, flexBasis: 380, gap: spacing.lg },
  sincronizacao: { ...typography.caption, color: colors.textSecondary },
});
