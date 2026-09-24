import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LABEL_PERFIL } from '@/constants/permissions';
import { useSessionStore } from '@/stores/useSessionStore';
import { colors, spacing, typography } from '@/theme';

export default function PerfilScreen() {
  const usuario = useSessionStore((state) => state.usuario);
  const sair = useSessionStore((state) => state.sair);

  if (!usuario) return null;

  return (
    <View style={styles.container}>
      <DemoBanner />
      <Card style={styles.card}>
        <View style={styles.header}>
          <Logo size={56} />
          <View>
            <Text style={styles.nome}>{usuario.nome}</Text>
            <Text style={styles.email}>{usuario.email}</Text>
          </View>
        </View>

        <View style={styles.linha}>
          <Text style={styles.label}>Perfil de acesso</Text>
          <Text style={styles.valor}>{LABEL_PERFIL[usuario.perfil]}</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.label}>Empresa</Text>
          <Text style={styles.valor}>Global Engenharia</Text>
        </View>

        <Text style={styles.nota}>
          Os dados financeiros exibidos no app ainda são de demonstração — apenas o login já é real (Supabase).
        </Text>

        <PrimaryButton
          label="Sair"
          variant="ghost"
          onPress={async () => {
            await sair();
            router.replace('/login');
          }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.md, maxWidth: 480 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nome: { ...typography.heading, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary },
  linha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { ...typography.caption, color: colors.textSecondary },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
  nota: { ...typography.caption, color: colors.textSecondary },
});
