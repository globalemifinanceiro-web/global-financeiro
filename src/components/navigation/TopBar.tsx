import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Logo } from '@/components/Logo';
import { colors, spacing, typography } from '@/theme';

interface TopBarProps {
  title: string;
  compact?: boolean;
}

export function TopBar({ title, compact }: TopBarProps) {
  return (
    <View style={[styles.bar, compact && styles.barCompact]}>
      {compact ? <Logo size={28} /> : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
      <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  barCompact: { paddingTop: spacing.md },
  title: { ...typography.heading, color: colors.textPrimary },
  spacer: { flex: 1 },
});
