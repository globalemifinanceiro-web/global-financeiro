import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Logo } from '@/components/Logo';
import { colors, spacing, typography } from '@/theme';

interface AuthScreenFrameProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthScreenFrame({ title, subtitle, children }: AuthScreenFrameProps) {
  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={64} />
            <Text style={styles.appName}>Global Financeiro</Text>
            <Text style={styles.company}>Global Engenharia</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={styles.form}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  header: { alignItems: 'center', gap: 4 },
  appName: { ...typography.title, color: colors.textInverse, marginTop: spacing.sm },
  company: { ...typography.caption, color: 'rgba(255,255,255,0.65)' },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { ...typography.heading, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  form: { marginTop: spacing.md, gap: spacing.md },
});
