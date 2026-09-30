import { StyleSheet, View } from 'react-native';
import { ContasScreenContent } from '@/components/ContasScreenContent';
import { ResumoRecebimentoCard } from '@/components/dashboard/ResumoRecebimentoCard';
import { useContasReceber } from '@/hooks/useFinanceData';
import { spacing } from '@/theme';

export default function ContasAReceberScreen() {
  return (
    <View style={styles.container}>
      <ResumoRecebimentoCard />
      <ContasScreenContent query={useContasReceber()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
