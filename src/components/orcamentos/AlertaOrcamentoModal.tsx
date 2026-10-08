import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { OrcamentoProjetos } from '@/types/orcamento';
import { formatBRL } from '@/utils/currency';
import { colors, radius, spacing, typography } from '@/theme';

export function AlertaOrcamentoModal({ orcamentos, onFechar }: { orcamentos: OrcamentoProjetos[]; onFechar: () => void }) {
  return (
    <Modal visible={orcamentos.length > 0} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={22} color={colors.positive} />
            <Text style={styles.titulo}>
              {orcamentos.length === 1 ? 'Orçamento aprovado pela Diretoria' : `${orcamentos.length} orçamentos aprovados pela Diretoria`}
            </Text>
          </View>
          <ScrollView style={styles.lista}>
            {orcamentos.map((o) => (
              <View key={o.id} style={styles.item}>
                <Text style={styles.nome} numberOfLines={2}>
                  {[o.codigo, o.fornecedor].filter(Boolean).join(' · ') || 'Orçamento'}
                </Text>
                <Text style={styles.detalhe}>
                  {[o.projetoPcg ? `PCG ${o.projetoPcg}` : null, o.projetoCliente, o.empresa].filter(Boolean).join(' · ')}
                </Text>
                {o.valor !== null ? <Text style={styles.valor}>{formatBRL(o.valor)}</Text> : null}
                {o.diretoriaNome ? <Text style={styles.detalhe}>Aprovado por {o.diretoriaNome}</Text> : null}
              </View>
            ))}
          </ScrollView>
          <Text style={styles.detalhe}>Veja todos na aba Orçamentos. A NF da compra chega depois, pelo fluxo normal.</Text>
          <PrimaryButton label="Ciente" onPress={onFechar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,37,69,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 440, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titulo: { ...typography.heading, color: colors.textPrimary, flexShrink: 1 },
  lista: { maxHeight: 360 },
  item: { gap: 2, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  nome: { ...typography.bodyStrong, color: colors.textPrimary },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
  detalhe: { ...typography.caption, color: colors.textSecondary },
});
