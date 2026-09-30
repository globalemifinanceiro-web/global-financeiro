import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { SolicitacaoProjetos } from '@/types/solicitacao';
import { formatBRL } from '@/utils/currency';
import { colors, radius, spacing, typography } from '@/theme';
import { comQuemEsta } from './comQuemEsta';

export function AlertaSolicitacaoModal({ solicitacoes, onFechar }: { solicitacoes: SolicitacaoProjetos[]; onFechar: () => void }) {
  return (
    <Modal visible={solicitacoes.length > 0} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="notifications" size={22} color={colors.blue} />
            <Text style={styles.titulo}>
              {solicitacoes.length === 1 ? 'Nova solicitação no Projetos Global' : `${solicitacoes.length} novas solicitações no Projetos Global`}
            </Text>
          </View>
          <ScrollView style={styles.lista}>
            {solicitacoes.map((s) => (
              <View key={s.id} style={styles.item}>
                <Text style={styles.nome} numberOfLines={2}>
                  {s.titulo}
                </Text>
                <Text style={styles.detalhe}>
                  {[s.projetoPcg ? `PCG ${s.projetoPcg}` : null, s.fornecedor, s.valor !== null ? formatBRL(s.valor) : null].filter(Boolean).join(' · ')}
                </Text>
                {s.lancadoPorNome ? <Text style={styles.detalhe}>Lançada por {s.lancadoPorNome}</Text> : null}
                <Text style={styles.aguardando}>Aguardando {comQuemEsta(s)}</Text>
              </View>
            ))}
          </ScrollView>
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
  detalhe: { ...typography.caption, color: colors.textSecondary },
  aguardando: { ...typography.captionStrong, color: colors.warning },
});
