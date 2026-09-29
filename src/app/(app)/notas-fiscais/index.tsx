import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NotaFiscalForm } from '@/components/notasFiscais/NotaFiscalForm';
import { NotaFiscalListItem } from '@/components/notasFiscais/NotaFiscalListItem';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useNotasFiscais } from '@/hooks/useNotasFiscais';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import { spacing } from '@/theme';

export default function NotasFiscaisScreen() {
  const empresaAtiva = useFiltrosStore((state) => state.filtros.empresa);
  const { data: notas, isLoading, isError, refetch } = useNotasFiscais();
  const [formAberto, setFormAberto] = useState(false);

  const pendentes = notas?.filter((n) => n.situacao === 'pendente') ?? [];
  const outras = notas?.filter((n) => n.situacao !== 'pendente') ?? [];

  return (
    <View style={styles.container}>
      <DemoBanner />

      <Card>
        <SectionHeader
          title="Notas fiscais"
          subtitle="Controle de prazos de pagamento — anexe o documento e acompanhe o vencimento."
          right={<PrimaryButton label="Nova nota" onPress={() => setFormAberto(true)} />}
        />

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            description="Confira se a tabela 'notas_fiscais' já foi criada no Supabase (ver supabase/migrations)."
            onRetry={() => refetch()}
          />
        ) : !notas || notas.length === 0 ? (
          <EmptyState title="Nenhuma nota fiscal cadastrada" description="Clique em 'Nova nota' para anexar a primeira." />
        ) : (
          <>
            {pendentes.map((nota) => (
              <NotaFiscalListItem key={nota.id} nota={nota} />
            ))}
            {outras.map((nota) => (
              <NotaFiscalListItem key={nota.id} nota={nota} />
            ))}
          </>
        )}
      </Card>

      <NotaFiscalForm visivel={formAberto} empresaPadrao={empresaAtiva ?? 'Global Engenharia'} onFechar={() => setFormAberto(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
