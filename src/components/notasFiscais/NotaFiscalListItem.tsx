import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { useAtualizarSituacaoNotaFiscal, useExcluirNotaFiscal } from '@/hooks/useNotasFiscais';
import { urlAssinadaNotaFiscal } from '@/services/supabase/notasFiscais';
import type { NotaFiscal } from '@/types/notaFiscal';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import { STATUS_NF_LABEL, diasParaVencimento, statusVencimento } from '@/utils/notaFiscalStatus';
import { STATUS_NF_TONE } from '@/utils/statusMappers';
import { colors, spacing, typography } from '@/theme';

function descricaoPrazo(dias: number, situacaoPaga: boolean): string {
  if (situacaoPaga) return 'Paga';
  if (dias < 0) return `${Math.abs(dias)} dia(s) em atraso`;
  if (dias === 0) return 'Vence hoje';
  return `Faltam ${dias} dia(s)`;
}

export function NotaFiscalListItem({ nota }: { nota: NotaFiscal }) {
  const [abrindo, setAbrindo] = useState(false);
  const atualizarSituacao = useAtualizarSituacaoNotaFiscal();
  const excluir = useExcluirNotaFiscal();

  const status = statusVencimento(nota);
  const dias = diasParaVencimento(nota.vencimento);

  async function abrirAnexo() {
    if (!nota.arquivoPath) return;
    setAbrindo(true);
    try {
      const url = await urlAssinadaNotaFiscal(nota.arquivoPath);
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

  function marcarComoPaga() {
    atualizarSituacao.mutate({ id: nota.id, situacao: 'paga' });
  }

  function excluirNota() {
    // Alert.alert não tem implementação garantida na versão web do React Native — usa confirm()
    // nativo do navegador ali, e o diálogo do React Native nas plataformas móveis.
    if (Platform.OS === 'web') {
      if (window.confirm(`Remover a nota de ${nota.clienteOuFornecedor}?`)) {
        excluir.mutate({ id: nota.id, arquivoPath: nota.arquivoPath });
      }
      return;
    }
    Alert.alert('Excluir nota fiscal', `Remover a nota de ${nota.clienteOuFornecedor}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => excluir.mutate({ id: nota.id, arquivoPath: nota.arquivoPath }) },
    ]);
  }

  return (
    <View style={styles.item}>
      <View style={styles.info}>
        <Text style={styles.cliente} numberOfLines={1}>
          {nota.clienteOuFornecedor}
        </Text>
        <Text style={styles.meta}>
          Vencimento {formatDateBR(nota.vencimento)} · {descricaoPrazo(dias, nota.situacao === 'paga')}
        </Text>
        {nota.numeroDocumento ? <Text style={styles.meta}>Doc. {nota.numeroDocumento}</Text> : null}
      </View>

      <View style={styles.direita}>
        <Text style={styles.valor}>{formatBRL(nota.valor)}</Text>
        <Badge label={STATUS_NF_LABEL[status]} tone={STATUS_NF_TONE[status]} />
        <View style={styles.acoes}>
          {nota.arquivoPath ? (
            <Pressable onPress={abrirAnexo} disabled={abrindo} hitSlop={8}>
              <Ionicons name="document-attach-outline" size={18} color={colors.blue} />
            </Pressable>
          ) : null}
          {nota.situacao === 'pendente' ? (
            <Pressable onPress={marcarComoPaga} hitSlop={8}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.positive} />
            </Pressable>
          ) : null}
          <Pressable onPress={excluirNota} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.negative} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flexShrink: 1, gap: 2 },
  cliente: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  direita: { alignItems: 'flex-end', gap: 6 },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
  acoes: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
});
