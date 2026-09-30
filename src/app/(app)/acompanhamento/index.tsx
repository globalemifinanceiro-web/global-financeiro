import { StyleSheet, Text, View } from 'react-native';
import { SolicitacaoCard } from '@/components/solicitacoes/SolicitacaoCard';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { usePainelSolicitacoes } from '@/hooks/useSolicitacoesProjetos';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import type { SituacaoSolicitacao, SolicitacaoProjetos } from '@/types/solicitacao';
import { formatBRL } from '@/utils/currency';
import { formatDateTimeBR } from '@/utils/date';
import { colors, spacing, typography } from '@/theme';

interface Coluna {
  titulo: string;
  situacoes: SituacaoSolicitacao[];
  /** Nas etapas em andamento mostra com quem está e há quantos dias. */
  emAndamento: boolean;
}

const COLUNAS: Coluna[] = [
  { titulo: 'Com o Gestor', situacoes: ['enviado', 'pendente_gestor'], emAndamento: true },
  { titulo: 'Com o Diretor', situacoes: ['pendente_diretor'], emAndamento: true },
  { titulo: 'Devolvidas para ajuste', situacoes: ['devolvido'], emAndamento: true },
  { titulo: 'No Financeiro', situacoes: ['liberado_financeiro', 'pagamento_agendado'], emAndamento: true },
  { titulo: 'Pagas', situacoes: ['pago'], emAndamento: false },
  { titulo: 'Rejeitadas ou canceladas', situacoes: ['rejeitado', 'cancelado'], emAndamento: false },
];

function total(lista: SolicitacaoProjetos[]): number {
  return lista.reduce((soma, s) => soma + (s.valor ?? 0), 0);
}

export default function AcompanhamentoScreen() {
  const empresaAtiva = useFiltrosStore((state) => state.filtros.empresa);
  const { data, isLoading, dataUpdatedAt } = usePainelSolicitacoes();
  const solicitacoes = (data?.solicitacoes ?? []).filter((s) => !empresaAtiva || !s.empresa || s.empresa === empresaAtiva);

  return (
    <View style={styles.container}>
      <Card style={styles.intro}>
        <SectionHeader
          title="Acompanhamento — Projetos Global"
          subtitle="Onde está cada NF/recibo/boleto lançado no Projetos e com quem está parado. Atualiza sozinho a cada 2 minutos."
        />
        {dataUpdatedAt ? <Text style={styles.nota}>Última atualização: {formatDateTimeBR(new Date(dataUpdatedAt))}</Text> : null}
        {data?.erroSincronizacao ? <Text style={styles.erro}>{data.erroSincronizacao}</Text> : null}
      </Card>

      {isLoading ? (
        <LoadingState label="Buscando solicitações..." />
      ) : (
        <View style={styles.colunas}>
          {COLUNAS.map((coluna) => {
            const itens = solicitacoes.filter((s) => coluna.situacoes.includes(s.situacao));
            return (
              <Card key={coluna.titulo} style={styles.coluna}>
                <Text style={styles.colunaTitulo}>
                  {coluna.titulo} ({itens.length})
                </Text>
                {itens.length > 0 ? <Text style={styles.nota}>{formatBRL(total(itens))}</Text> : null}
                {itens.length === 0 ? (
                  <EmptyState title="Nada aqui" />
                ) : (
                  itens.map((s) => <SolicitacaoCard key={s.id} solicitacao={s} mostrarResponsavel={coluna.emAndamento} />)
                )}
              </Card>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  intro: { gap: spacing.xs },
  nota: { ...typography.caption, color: colors.textSecondary },
  erro: { ...typography.caption, color: colors.negative },
  colunas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  coluna: { flexGrow: 1, flexBasis: 260, gap: spacing.sm },
  colunaTitulo: { ...typography.subheading, color: colors.textPrimary },
});
