import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ComprovanteForm } from '@/components/conciliacao/ComprovanteForm';
import { ConciliacaoListItem } from '@/components/conciliacao/ConciliacaoListItem';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useConciliacoes } from '@/hooks/useConciliacoes';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import type { ResultadoComprovante } from '@/types/conciliacao';
import { colors, spacing, typography } from '@/theme';

function mensagemResultado(resultado: ResultadoComprovante): { texto: string; erro: boolean } {
  switch (resultado.baixaStatus) {
    case 'ok':
      return { texto: 'Comprovante salvo no Drive e baixa realizada.', erro: false };
    case 'pendente_origem':
      return { texto: 'Comprovante salvo e vinculado. Essa nota vem do Projetos Global — a baixa precisa ser feita lá.', erro: false };
    case 'erro':
      return { texto: `Comprovante salvo no Drive, mas a baixa falhou: ${resultado.baixaErro ?? 'erro desconhecido'}`, erro: true };
    default:
      return { texto: 'Comprovante salvo no Drive (sem vínculo com título).', erro: false };
  }
}

export default function ConciliacaoScreen() {
  const empresaAtiva = useFiltrosStore((state) => state.filtros.empresa);
  const { data, isLoading, isError, refetch } = useConciliacoes();
  const [formAberto, setFormAberto] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null);

  const itens = (data ?? []).filter((c) => !empresaAtiva || c.empresa === empresaAtiva);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <SectionHeader
          title="Conciliação"
          subtitle="Comprovantes de pagamentos e recebimentos, salvos na pasta 'comprovantes' do Google Drive."
          right={
            <PrimaryButton
              label="Novo comprovante"
              onPress={() => {
                setMensagem(null);
                setFormAberto(true);
              }}
            />
          }
        />
        {mensagem ? <Text style={[styles.mensagem, mensagem.erro && styles.mensagemErro]}>{mensagem.texto}</Text> : null}

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState description="Confira se a tabela 'conciliacoes' já foi criada no Supabase (ver supabase/migrations)." onRetry={() => refetch()} />
        ) : itens.length === 0 ? (
          <EmptyState title="Nenhum comprovante ainda" description="Clique em 'Novo comprovante' para anexar o primeiro." />
        ) : (
          itens.map((item) => <ConciliacaoListItem key={item.id} item={item} />)
        )}
      </Card>

      <ComprovanteForm
        visivel={formAberto}
        onFechar={() => setFormAberto(false)}
        onSalvo={(resultado) => {
          setFormAberto(false);
          setMensagem(mensagemResultado(resultado));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.xs },
  mensagem: { ...typography.caption, color: colors.positive },
  mensagemErro: { color: colors.negative },
});
