import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { dataMode } from '@/services/data';
import { formatDateTimeBR } from '@/utils/date';
import { colors, radius, spacing, typography } from '@/theme';
import type { StatusTone } from '@/theme';

interface IntegracaoInfo {
  id: string;
  nome: string;
  descricao: string;
  icone: keyof typeof Ionicons.glyphMap;
}

const INTEGRACOES: IntegracaoInfo[] = [
  { id: 'omie', nome: 'Omie ERP', descricao: 'Contas a pagar/receber, extrato, clientes, fornecedores e mais.', icone: 'link-outline' },
  { id: 'sheets', nome: 'Google Sheets', descricao: 'Metas, orçamentos, projeções e indicadores complementares.', icone: 'grid-outline' },
];

function statusAtual(): { label: string; tone: StatusTone } {
  if (dataMode === 'demo') return { label: 'Modo de demonstração', tone: 'warning' };
  return { label: 'Não configurado', tone: 'negative' };
}

export default function IntegracoesScreen() {
  const status = statusAtual();

  return (
    <View style={styles.container}>
      <DemoBanner />

      {INTEGRACOES.map((integracao) => (
        <Card key={integracao.id} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name={integracao.icone} size={18} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nome}>{integracao.nome}</Text>
              <Text style={styles.descricao}>{integracao.descricao}</Text>
            </View>
            <Badge label={status.label} tone={status.tone} />
          </View>
          <View style={styles.footer}>
            <Text style={styles.detalhe}>
              {dataMode === 'demo'
                ? 'Nenhuma chamada real é feita — os dados exibidos no app são fictícios.'
                : `Última sincronização: ${formatDateTimeBR(new Date())}`}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { ...typography.subheading, color: colors.textPrimary },
  descricao: { ...typography.caption, color: colors.textSecondary },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  detalhe: { ...typography.caption, color: colors.textSecondary },
});
