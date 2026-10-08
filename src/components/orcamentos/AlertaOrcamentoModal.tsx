import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { CNPJ_POR_EMPRESA, type NomeEmpresa } from '@/constants/empresas';
import type { OrcamentoProjetos } from '@/types/orcamento';
import { formatBRL } from '@/utils/currency';
import { colors, radius, spacing, typography } from '@/theme';

function linha(o: OrcamentoProjetos): string {
  return [
    o.projetoPcg ? `PCG ${o.projetoPcg}` : null,
    o.projetoCliente,
    o.fornecedor,
    o.valor !== null ? formatBRL(o.valor) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** "Orçamento aprovado — PCG {pcg} · {cliente} · {fornecedor} · R$ {valor}", separado por empresa (CNPJ). */
export function AlertaOrcamentoModal({ orcamentos, onFechar }: { orcamentos: OrcamentoProjetos[]; onFechar: () => void }) {
  const porEmpresa = new Map<string, OrcamentoProjetos[]>();
  for (const o of orcamentos) {
    const chave = o.empresa ?? 'Empresa não informada';
    porEmpresa.set(chave, [...(porEmpresa.get(chave) ?? []), o]);
  }

  return (
    <Modal visible={orcamentos.length > 0} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={22} color={colors.positive} />
            <Text style={styles.titulo}>
              {orcamentos.length === 1 ? 'Orçamento aprovado' : `${orcamentos.length} orçamentos aprovados`}
            </Text>
          </View>
          <ScrollView style={styles.lista}>
            {[...porEmpresa.entries()].map(([empresa, itens]) => (
              <View key={empresa} style={styles.grupo}>
                <Text style={styles.empresa}>
                  {empresa}
                  {CNPJ_POR_EMPRESA[empresa as NomeEmpresa] ? ` · ${CNPJ_POR_EMPRESA[empresa as NomeEmpresa]}` : ''}
                </Text>
                {itens.map((o) => (
                  <View key={o.id} style={styles.item}>
                    <Text style={styles.texto}>Orçamento aprovado — {linha(o)}</Text>
                    {o.codigo || o.diretoriaNome ? (
                      <Text style={styles.detalhe}>
                        {[o.codigo, o.diretoriaNome ? `aprovado por ${o.diretoriaNome}` : null].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <Text style={styles.detalhe}>Veja todos na aba Orçamentos.</Text>
          <PrimaryButton label="Ciente" onPress={onFechar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,37,69,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 460, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titulo: { ...typography.heading, color: colors.textPrimary, flexShrink: 1 },
  lista: { maxHeight: 380 },
  grupo: { gap: spacing.xs, marginBottom: spacing.sm },
  empresa: { ...typography.captionStrong, color: colors.blue },
  item: { gap: 2, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  texto: { ...typography.bodyStrong, color: colors.textPrimary },
  detalhe: { ...typography.caption, color: colors.textSecondary },
});
