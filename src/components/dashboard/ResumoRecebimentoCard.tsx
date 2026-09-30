import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LoadingState } from '@/components/ui/StateViews';
import { useResumoContasReceberSheets, useSincronizarContasReceberSheets } from '@/hooks/useContasReceberSheets';
import { formatBRL } from '@/utils/currency';
import { colors, radius, spacing, typography } from '@/theme';

/** Os 3 totais pedidos: a receber (pendente), recebido (pago) e cancelado — vindos da planilha do Google Sheets. */
export function ResumoRecebimentoCard() {
  const { data: resumo, isLoading } = useResumoContasReceberSheets();
  const sincronizar = useSincronizarContasReceberSheets();
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleSincronizar() {
    setMensagem(null);
    try {
      const resultado = await sincronizar.mutateAsync();
      setMensagem(`${resultado.sincronizadas} título(s) atualizado(s) a partir da planilha.`);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Não foi possível sincronizar com o Google Sheets.');
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Contas a Receber — Google Sheets</Text>
        <PrimaryButton
          label={sincronizar.isPending ? 'Sincronizando...' : 'Sincronizar planilha'}
          variant="ghost"
          onPress={handleSincronizar}
          disabled={sincronizar.isPending}
        />
      </View>

      {isLoading || !resumo ? (
        <LoadingState label="Carregando resumo..." />
      ) : (
        <View style={styles.grid}>
          <View style={[styles.item, styles.itemPendente]}>
            <Text style={styles.label}>A receber</Text>
            <Text style={styles.valor}>{formatBRL(resumo.totalPendente)}</Text>
            <Text style={styles.contagem}>{resumo.quantidadePendente} título(s)</Text>
          </View>
          <View style={[styles.item, styles.itemPago]}>
            <Text style={styles.label}>Recebido</Text>
            <Text style={[styles.valor, styles.valorPago]}>{formatBRL(resumo.totalPago)}</Text>
            <Text style={styles.contagem}>{resumo.quantidadePago} título(s)</Text>
          </View>
          <View style={[styles.item, styles.itemCancelado]}>
            <Text style={styles.label}>Cancelado</Text>
            <Text style={styles.valor}>{formatBRL(resumo.totalCancelado)}</Text>
            <Text style={styles.contagem}>{resumo.quantidadeCancelado} título(s)</Text>
          </View>
        </View>
      )}

      {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  titulo: { ...typography.subheading, color: colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: { flexGrow: 1, flexBasis: 160, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  itemPendente: { backgroundColor: colors.warningSoft },
  itemPago: { backgroundColor: colors.positiveSoft },
  itemCancelado: { backgroundColor: colors.border },
  label: { ...typography.captionStrong, color: colors.textSecondary },
  valor: { ...typography.heading, color: colors.textPrimary },
  valorPago: { color: colors.positive },
  contagem: { ...typography.caption, color: colors.textSecondary },
  mensagem: { ...typography.caption, color: colors.blue },
});
