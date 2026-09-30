import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import type { BaixaStatus, Conciliacao } from '@/types/conciliacao';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import { colors, spacing, typography, type StatusTone } from '@/theme';

const BAIXA_LABEL: Record<BaixaStatus, string> = {
  ok: 'Baixa feita',
  sem_vinculo: 'Sem vínculo',
  pendente_origem: 'Aguardando Projetos',
  erro: 'Baixa falhou',
};

const BAIXA_TONE: Record<BaixaStatus, StatusTone> = {
  ok: 'positive',
  sem_vinculo: 'neutral',
  pendente_origem: 'warning',
  erro: 'negative',
};

async function abrir(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
    return;
  }
  const { openURL } = await import('expo-linking');
  await openURL(url);
}

export function ConciliacaoListItem({ item }: { item: Conciliacao }) {
  return (
    <View style={styles.linha}>
      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={1}>
          {item.tituloDescricao ?? item.descricao ?? item.arquivoNome}
        </Text>
        <Text style={styles.meta}>
          {item.tipo === 'recebimento' ? 'Recebimento' : 'Pagamento'} · {formatDateBR(item.dataPagamento)}
          {item.empresa ? ` · ${item.empresa}` : ''}
        </Text>
        {item.tituloDescricao && item.descricao ? <Text style={styles.meta}>{item.descricao}</Text> : null}
        {item.baixaErro ? <Text style={styles.erro}>{item.baixaErro}</Text> : null}
      </View>

      <View style={styles.direita}>
        <Text style={[styles.valor, item.tipo === 'recebimento' ? styles.valorEntrada : null]}>{formatBRL(item.valor)}</Text>
        <Badge label={BAIXA_LABEL[item.baixaStatus]} tone={BAIXA_TONE[item.baixaStatus]} />
        <Pressable onPress={() => abrir(item.driveUrl)} hitSlop={8}>
          <Text style={styles.link}>Ver comprovante ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flexShrink: 1, gap: 2 },
  titulo: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  erro: { ...typography.caption, color: colors.negative },
  direita: { alignItems: 'flex-end', gap: 6 },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
  valorEntrada: { color: colors.positive },
  link: { ...typography.captionStrong, color: colors.blue },
});
