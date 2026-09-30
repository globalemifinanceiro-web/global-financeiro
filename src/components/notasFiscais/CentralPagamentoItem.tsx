import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { VerDocumentosProjetos } from '@/components/solicitacoes/VerDocumentosProjetos';
import { Badge } from '@/components/ui/Badge';
import { urlAssinadaNotaFiscal } from '@/services/supabase/notasFiscais';
import type { NotaFiscal } from '@/types/notaFiscal';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import { STATUS_NF_LABEL, diasParaVencimento, statusVencimento } from '@/utils/notaFiscalStatus';
import { STATUS_NF_TONE } from '@/utils/statusMappers';
import { colors, spacing, typography } from '@/theme';

function textoPrazo(dias: number): string {
  if (dias < 0) return `${Math.abs(dias)} dia(s) em atraso`;
  if (dias === 0) return 'Vence hoje';
  return `${dias} dia(s) para vencer`;
}

export function CentralPagamentoItem({ nota }: { nota: NotaFiscal }) {
  const [abrindo, setAbrindo] = useState(false);
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

  return (
    <View style={styles.linha}>
      <View style={styles.colunaEsquerda}>
        <Text style={styles.cliente} numberOfLines={1}>
          {nota.clienteOuFornecedor}
        </Text>
        <Badge label={STATUS_NF_LABEL[status]} tone={STATUS_NF_TONE[status]} />
        <Text style={styles.meta}>{textoPrazo(dias)}</Text>
      </View>

      <View style={styles.colunaMeio}>
        <Text style={styles.valor}>{formatBRL(nota.valor)}</Text>
        <Text style={styles.meta}>Vence {formatDateBR(nota.vencimento)}</Text>
        <Text style={styles.meta}>{nota.formaPagamento ?? 'Forma de pagamento não informada'}</Text>
        {nota.assinado ? <Text style={styles.assinado}>Assinado pelos responsáveis</Text> : null}
      </View>

      <View style={styles.colunaDireita}>
        {nota.arquivoPath ? (
          <Pressable onPress={abrirAnexo} disabled={abrindo}>
            <Text style={styles.link}>{abrindo ? 'Abrindo...' : 'Ver NF ›'}</Text>
          </Pressable>
        ) : nota.origem === 'projetos_global' && nota.projetosGlobalRequestId ? (
          <VerDocumentosProjetos solicitacaoId={nota.projetosGlobalRequestId} />
        ) : (
          <Text style={styles.semAnexo}>Sem anexo</Text>
        )}
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
  colunaEsquerda: { flex: 1.3, gap: 4, alignItems: 'flex-start' },
  colunaMeio: { flex: 1, gap: 2 },
  colunaDireita: { alignItems: 'flex-end', justifyContent: 'center' },
  cliente: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
  assinado: { ...typography.caption, color: colors.positive },
  link: { ...typography.captionStrong, color: colors.blue },
  semAnexo: { ...typography.caption, color: colors.textSecondary },
});
