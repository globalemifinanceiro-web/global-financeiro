import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Logo } from '@/components/Logo';
import { LABEL_PERFIL, podeAcessar } from '@/constants/permissions';
import { NAV_ITEMS } from '@/constants/navigation';
import { useSessionStore } from '@/stores/useSessionStore';
import { colors, radius, spacing, typography } from '@/theme';

export function Sidebar() {
  const pathname = usePathname();
  const usuario = useSessionStore((state) => state.usuario);
  const sair = useSessionStore((state) => state.sair);

  if (!usuario) return null;
  const itens = NAV_ITEMS.filter((item) => podeAcessar(usuario.perfil, item.id));

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Logo size={36} />
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.brandTitle}>Global Financeiro</Text>
          <Text style={styles.brandSubtitle}>Global Engenharia</Text>
        </View>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={styles.navContent}>
        {itens.map((item) => {
          const ativo = pathname.startsWith(item.href);
          return (
            <Link key={item.id} href={item.href as never} asChild>
              <Pressable style={StyleSheet.flatten([styles.navItem, ativo && styles.navItemActive])}>
                <Ionicons name={item.icon} size={18} color={ativo ? colors.blue : colors.textSecondary} />
                <Text style={[styles.navLabel, ativo && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Link href="/perfil" asChild>
          <Pressable style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{usuario.nome.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {usuario.nome}
              </Text>
              <Text style={styles.userRole}>{LABEL_PERFIL[usuario.perfil]}</Text>
            </View>
          </Pressable>
        </Link>
        <Pressable style={styles.logoutButton} onPress={sair}>
          <Ionicons name="log-out-outline" size={16} color={colors.negative} />
          <Text style={styles.logoutLabel}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

const SIDEBAR_WIDTH = 248;

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.navy,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  brandTitle: { ...typography.subheading, color: colors.textInverse },
  brandSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  nav: { flex: 1 },
  navContent: { paddingHorizontal: spacing.sm, gap: 2 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  navItemActive: { backgroundColor: 'rgba(46,143,238,0.16)' },
  navLabel: { ...typography.body, color: 'rgba(255,255,255,0.75)' },
  navLabelActive: { color: colors.textInverse, fontWeight: '600' },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: spacing.sm,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { color: colors.textInverse, fontWeight: '700' },
  userName: { ...typography.captionStrong, color: colors.textInverse },
  userRole: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  logoutLabel: { ...typography.caption, color: colors.negative },
});
