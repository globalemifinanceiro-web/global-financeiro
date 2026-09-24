import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { dataMode } from '@/services/data';

/** Sempre visível quando o app está rodando com dados fictícios, para nunca serem confundidos com reais. */
export function DemoBanner() {
  if (dataMode !== 'demo') return null;
  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle" size={16} color={colors.navy} />
      <Text style={styles.text}>Dados de demonstração — valores fictícios, não refletem a Omie ou o Google Sheets reais.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { ...typography.caption, color: colors.navy, flexShrink: 1 },
});
