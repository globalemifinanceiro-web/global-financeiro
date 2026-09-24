import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_ITEMS, NAV_ITEMS_PRIMARIOS } from '@/constants/navigation';
import { podeAcessar } from '@/constants/permissions';
import { useSessionStore } from '@/stores/useSessionStore';
import { colors, radius, spacing, typography } from '@/theme';

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const usuario = useSessionStore((state) => state.usuario);
  const [maisAberto, setMaisAberto] = useState(false);

  if (!usuario) return null;

  const primarios = NAV_ITEMS.filter(
    (item) => NAV_ITEMS_PRIMARIOS.includes(item.id) && podeAcessar(usuario.perfil, item.id)
  );
  const secundarios = NAV_ITEMS.filter(
    (item) => !NAV_ITEMS_PRIMARIOS.includes(item.id) && podeAcessar(usuario.perfil, item.id)
  );

  return (
    <>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {primarios.map((item) => {
          const ativo = pathname.startsWith(item.href);
          return (
            <Link key={item.id} href={item.href as never} asChild>
              <Pressable style={styles.tab}>
                <Ionicons name={item.icon} size={20} color={ativo ? colors.blue : colors.textSecondary} />
                <Text style={[styles.tabLabel, ativo && styles.tabLabelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
        {secundarios.length > 0 ? (
          <Pressable style={styles.tab} onPress={() => setMaisAberto(true)}>
            <Ionicons name="menu-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.tabLabel}>Mais</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={maisAberto} transparent animationType="fade" onRequestClose={() => setMaisAberto(false)}>
        <Pressable style={styles.overlay} onPress={() => setMaisAberto(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]} onPress={(e) => e.stopPropagation()}>
            {secundarios.map((item) => (
              <Link key={item.id} href={item.href as never} asChild>
                <Pressable style={styles.sheetItem} onPress={() => setMaisAberto(false)}>
                  <Ionicons name={item.icon} size={18} color={colors.textPrimary} />
                  <Text style={styles.sheetItemLabel}>{item.label}</Text>
                </Pressable>
              </Link>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
  tabLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  tabLabelActive: { color: colors.blue, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(11,37,69,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 14 },
  sheetItemLabel: { ...typography.body, color: colors.textPrimary },
});
