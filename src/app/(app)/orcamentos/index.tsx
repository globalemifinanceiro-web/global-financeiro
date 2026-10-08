import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { usePainelOrcamentos } from '@/hooks/useOrcamentosProjetos';
import { urlArquivoOrcamento } from '@/services/supabase/orcamentosProjetos';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import type { OrcamentoProjetos } from '@/types/orcamento';
import { formatBRL } from '@/utils/currency';
import { formatDateBR, formatDateTimeBR } from '@/utils/date';
import { colors, spacing, typography } from '@/theme';

function LinkArquivo({ caminho, rotulo }: { caminho: string; rotulo: string }) {
  const [abrindo, setAbrindo] = useState(false);

  async function abrir() {
    setAbrindo(true);
    try {
      const url = await urlArquivoOrcamento(caminho);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const { openURL } = await import('expo-linking');
        await openURL(url);
      }
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <Pressable onPress={abrir} disabled={abrindo} hitSlop={8}>
      <Text style={styles.link}>{abrindo ? 'Abrindo...' : rotulo}</Text>
    </Pressable>
  );
}

function OrcamentoItem({ o }: { o: OrcamentoProjetos }) {
  return (
    <View style={styles.item}>
      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={2}>
          {[o.codigo, o.fornecedor].filter(Boolean).join(' · ') || 'Orçamento'}
        </Text>
        <Text style={styles.meta}>
          {[o.projetoPcg ? `PCG ${o.projetoPcg}` : null, o.projetoCliente, o.empresa].filter(Boolean).join(' · ')}
        </Text>
        {o.descricao ? (
          <Text style={styles.meta} numberOfLines={2}>
            {o.descricao}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          Aprovado pela Diretoria em {formatDateTimeBR(o.aprovadoEm)}
          {o.diretoriaNome ? ` (${o.diretoriaNome})` : ''}
          {o.gestorNome ? ` · Gestor: ${o.gestorNome}` : ''}
        </Text>
        {o.enviadoPor ? <Text style={styles.meta}>Enviado por {o.enviadoPor}</Text> : null}
        <View style={styles.links}>
          {o.assinadoPath ? <LinkArquivo caminho={o.assinadoPath} rotulo="Orçamento assinado ›" /> : null}
          {o.arquivoPath ? <LinkArquivo caminho={o.arquivoPath} rotulo="Arquivo original ›" /> : null}
          {!o.assinadoPath && !o.arquivoPath ? <Text style={styles.meta}>Arquivo ainda não copiado do Projetos</Text> : null}
        </View>
      </View>
      <View style={styles.direita}>
        {o.valor !== null ? <Text style={styles.valor}>{formatBRL(o.valor)}</Text> : null}
        {o.validade ? <Text style={styles.meta}>Válido até {formatDateBR(o.validade)}</Text> : null}
        {o.condicaoPagamento ? <Text style={styles.meta}>{o.condicaoPagamento.replace(/_/g, ' ')}</Text> : null}
        {o.quantidadeItens > 0 ? <Text style={styles.meta}>{o.quantidadeItens} item(ns)</Text> : null}
      </View>
    </View>
  );
}

export default function OrcamentosScreen() {
  const empresaAtiva = useFiltrosStore((state) => state.filtros.empresa);
  const { data, isLoading, dataUpdatedAt } = usePainelOrcamentos();
  const orcamentos = (data?.orcamentos ?? []).filter((o) => !empresaAtiva || !o.empresa || o.empresa === empresaAtiva);
  const total = orcamentos.reduce((soma, o) => soma + (o.valor ?? 0), 0);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <SectionHeader
          title="Orçamentos aprovados — Projetos Global"
          subtitle="Orçamentos/propostas aprovados pelo Gestor e pela Diretoria: compras que vão gerar pagamento quando a NF chegar."
        />
        {dataUpdatedAt ? <Text style={styles.meta}>Última atualização: {formatDateTimeBR(new Date(dataUpdatedAt))}</Text> : null}
        {data?.erroSincronizacao ? <Text style={styles.erro}>{data.erroSincronizacao}</Text> : null}
        {orcamentos.length > 0 ? (
          <Text style={styles.resumo}>
            {orcamentos.length} orçamento(s) · Total {formatBRL(total)}
          </Text>
        ) : null}

        {isLoading ? (
          <LoadingState label="Buscando orçamentos..." />
        ) : orcamentos.length === 0 ? (
          <EmptyState title="Nenhum orçamento aprovado" description="Os orçamentos aparecem aqui assim que a Diretoria aprova no Projetos." />
        ) : (
          orcamentos.map((o) => <OrcamentoItem key={o.id} o={o} />)
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.xs },
  resumo: { ...typography.captionStrong, color: colors.textSecondary, marginVertical: spacing.xs },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flexShrink: 1, gap: 3 },
  titulo: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  erro: { ...typography.caption, color: colors.negative },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 2 },
  link: { ...typography.captionStrong, color: colors.blue },
  direita: { alignItems: 'flex-end', gap: 2 },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
});
