import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.blue} size="small" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title = 'Nada por aqui ainda',
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="file-tray-outline" size={28} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.text}>{description}</Text> : null}
    </View>
  );
}

export function ErrorState({
  title = 'Não foi possível carregar os dados',
  description = 'Tente novamente em instantes.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="alert-circle-outline" size={28} color={colors.negative} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{description}</Text>
      {onRetry ? (
        <Text style={styles.retry} onPress={onRetry}>
          Tentar novamente
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  title: { ...typography.subheading, color: colors.textPrimary },
  text: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  retry: { ...typography.captionStrong, color: colors.blue, marginTop: spacing.xs },
});
