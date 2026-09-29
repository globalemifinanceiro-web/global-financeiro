import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { NotaFiscal } from '@/types/notaFiscal';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import { STATUS_NF_LABEL, statusVencimento } from '@/utils/notaFiscalStatus';
import { STATUS_NF_TONE } from '@/utils/statusMappers';
import { colors, radius, spacing, typography } from '@/theme';

export function AlertaVencimentoModal({ notas, onFechar }: { notas: NotaFiscal[]; onFechar: () => void }) {
  const visivel = notas.length > 0;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="alert-circle" size={22} color={colors.negative} />
            <Text style={styles.titulo}>Notas fiscais precisando de atenção</Text>
          </View>
          <ScrollView style={styles.lista}>
            {notas.map((nota) => {
              const status = statusVencimento(nota);
              return (
                <View key={nota.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cliente} numberOfLines={1}>
                      {nota.clienteOuFornecedor}
                    </Text>
                    <Text style={styles.detalhe}>
                      Vencimento {formatDateBR(nota.vencimento)} · {formatBRL(nota.valor)}
                    </Text>
                  </View>
                  <Badge label={STATUS_NF_LABEL[status]} tone={STATUS_NF_TONE[status]} />
                </View>
              );
            })}
          </ScrollView>
          <PrimaryButton label="Ciente" onPress={onFechar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,37,69,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titulo: { ...typography.heading, color: colors.textPrimary, flexShrink: 1 },
  lista: { maxHeight: 320 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cliente: { ...typography.bodyStrong, color: colors.textPrimary },
  detalhe: { ...typography.caption, color: colors.textSecondary },
});
