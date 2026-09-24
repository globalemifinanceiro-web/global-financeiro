import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { dataMode } from '@/services/data';
import { colors, radius, spacing, typography } from '@/theme';

const SECOES = [
  {
    id: 'usuarios',
    titulo: 'Usuários e permissões',
    descricao: 'Gerenciar contas, perfis de acesso (Administrador, Diretoria, Financeiro, Consulta) e permissões por painel.',
    icone: 'people-outline' as const,
  },
  {
    id: 'omie',
    titulo: 'Integração com a Omie',
    descricao: 'Status da conexão e configuração das credenciais — App Key/Secret ficam somente no backend, nunca aqui.',
    icone: 'link-outline' as const,
  },
  {
    id: 'sheets',
    titulo: 'Planilhas do Google Sheets',
    descricao: 'Cadastro dos IDs de planilhas complementares (metas, orçamentos, projeções) por projeto/empresa.',
    icone: 'grid-outline' as const,
  },
  {
    id: 'auditoria',
    titulo: 'Auditoria',
    descricao: 'Histórico de login, logout, sincronizações manuais e alterações de permissão.',
    icone: 'shield-checkmark-outline' as const,
  },
];

export default function ConfiguracoesScreen() {
  return (
    <View style={styles.container}>
      <DemoBanner />

      <Card style={styles.modoCard}>
        <Text style={styles.modoLabel}>Modo de dados atual</Text>
        <Badge label={dataMode === 'demo' ? 'Demonstração' : 'Real'} tone={dataMode === 'demo' ? 'warning' : 'positive'} />
        <Text style={styles.modoTexto}>
          Definido pela variável EXPO_PUBLIC_DATA_MODE. Trocar para &ldquo;real&rdquo; exige que o backend (Supabase +
          Edge Functions da Omie/Sheets) já esteja configurado.
        </Text>
      </Card>

      {SECOES.map((secao) => (
        <Card key={secao.id} style={styles.secaoCard}>
          <View style={styles.secaoHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name={secao.icone} size={18} color={colors.blue} />
            </View>
            <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
            <Badge label="Em breve" tone="neutral" />
          </View>
          <Text style={styles.secaoDescricao}>{secao.descricao}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  modoCard: { gap: spacing.xs, alignItems: 'flex-start' },
  modoLabel: { ...typography.captionStrong, color: colors.textSecondary },
  modoTexto: { ...typography.caption, color: colors.textSecondary },
  secaoCard: { gap: spacing.xs },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secaoTitulo: { ...typography.subheading, color: colors.textPrimary, flex: 1 },
  secaoDescricao: { ...typography.caption, color: colors.textSecondary },
});
