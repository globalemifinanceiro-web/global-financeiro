import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { colors, radius, spacing, typography } from '@/theme';
import type { StatusTone } from '@/theme';

interface IntegracaoInfo {
  id: string;
  nome: string;
  descricao: string;
  icone: keyof typeof Ionicons.glyphMap;
  status: string;
  tone: StatusTone;
  detalhe: string;
}

const INTEGRACOES: IntegracaoInfo[] = [
  {
    id: 'projetos-global',
    nome: 'Projetos Global (PWA)',
    descricao: 'Custos, notas fiscais, recibos, fotos e documentos anexados nos projetos, para aprovação e pagamento.',
    icone: 'link-outline',
    status: 'Conectado (leitura)',
    tone: 'positive',
    detalhe:
      'Botão "Sincronizar Projetos Global" na Central de Pagamentos busca as solicitações liberadas para o Financeiro. Registrar pagamento de volta lá ainda não foi implementado.',
  },
  {
    id: 'sheets-receber',
    nome: 'Google Sheets — Contas a Receber',
    descricao: 'Planilha "Controle Contas à Receber", aba "à Receber".',
    icone: 'grid-outline',
    status: 'Conectado',
    tone: 'positive',
    detalhe:
      'Botão "Sincronizar planilha" no Dashboard e em Contas a Receber relê a planilha. Comprovantes vinculados na Conciliação gravam a data na coluna DT PGTO.',
  },
  {
    id: 'drive-comprovantes',
    nome: 'Google Drive — Comprovantes',
    descricao: 'Pasta "comprovantes", onde ficam os anexos da Conciliação.',
    icone: 'folder-open-outline',
    status: 'Conectado (gravação)',
    tone: 'positive',
    detalhe:
      'Cada comprovante enviado na Conciliação é salvo nessa pasta. Quando vinculado a uma conta a receber, a data também é gravada na coluna DT PGTO da planilha.',
  },
  {
    id: 'sheets-pagar',
    nome: 'Google Sheets — Contas a Pagar',
    descricao: 'Planilha de contas a pagar.',
    icone: 'grid-outline',
    status: 'Não configurado',
    tone: 'negative',
    detalhe: 'Contas a Pagar, Despesas por categoria e o lado de despesas do Fluxo de Caixa dependem desta integração.',
  },
];

export default function IntegracoesScreen() {
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
            <Badge label={integracao.status} tone={integracao.tone} />
          </View>
          <View style={styles.footer}>
            <Text style={styles.detalhe}>{integracao.detalhe}</Text>
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
