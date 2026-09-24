import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BottomTabBar } from './BottomTabBar';
import { EmpresaSwitcher } from './EmpresaSwitcher';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NAV_ITEMS } from '@/constants/navigation';
import { breakpoints, colors, spacing } from '@/theme';

const TITULOS_EXTRA: Record<string, string> = {
  '/perfil': 'Perfil do Usuário',
};

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isWide = width >= breakpoints.tablet;
  const title =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? TITULOS_EXTRA[pathname] ?? 'Global Financeiro';

  if (isWide) {
    return (
      <View style={styles.wideRoot}>
        <Sidebar />
        <View style={styles.wideContent}>
          <TopBar title={title} />
          <EmpresaSwitcher />
          <ScrollView contentContainerStyle={styles.scrollContentWide}>
            <View style={styles.maxWidth}>{children}</View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileRoot}>
      <TopBar title={title} compact />
      <EmpresaSwitcher />
      <ScrollView contentContainerStyle={styles.scrollContentMobile}>{children}</ScrollView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wideRoot: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  wideContent: { flex: 1 },
  scrollContentWide: { padding: spacing.xl, alignItems: 'center' },
  maxWidth: { width: '100%', maxWidth: 1200, gap: spacing.lg },
  mobileRoot: { flex: 1, backgroundColor: colors.background },
  scrollContentMobile: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
});
