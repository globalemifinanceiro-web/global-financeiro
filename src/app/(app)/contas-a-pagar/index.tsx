import { ContasScreenContent } from '@/components/ContasScreenContent';
import { useContasPagar } from '@/hooks/useFinanceData';

export default function ContasAPagarScreen() {
  return <ContasScreenContent query={useContasPagar()} />;
}
