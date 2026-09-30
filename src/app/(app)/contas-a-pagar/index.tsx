import { StyleSheet, View } from 'react-native';
import { ContasScreenContent } from '@/components/ContasScreenContent';
import { ImportarPlanilhaCard } from '@/components/contasPagar/ImportarPlanilhaCard';
import { useContasPagar } from '@/hooks/useFinanceData';
import { spacing } from '@/theme';

export default function ContasAPagarScreen() {
  return (
    <View style={styles.container}>
      <ImportarPlanilhaCard />
      <ContasScreenContent query={useContasPagar()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
