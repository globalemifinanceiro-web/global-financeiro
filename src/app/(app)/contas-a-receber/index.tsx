import { ContasScreenContent } from '@/components/ContasScreenContent';
import { useContasReceber } from '@/hooks/useFinanceData';

export default function ContasAReceberScreen() {
  return <ContasScreenContent query={useContasReceber()} />;
}
