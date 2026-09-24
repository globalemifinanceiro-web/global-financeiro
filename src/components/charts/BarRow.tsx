import { StyleSheet, Text, View } from 'react-native';
import { formatBRLCompact } from '@/utils/currency';
import { colors, radius, spacing, typography } from '@/theme';

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

export function BarRow({ label, value, maxValue, color = colors.blue }: BarRowProps) {
  const percent = maxValue > 0 ? Math.max(4, Math.round((value / maxValue) * 100)) : 0;
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value}>{formatBRLCompact(value)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  label: { ...typography.caption, color: colors.textPrimary, flexShrink: 1 },
  value: { ...typography.captionStrong, color: colors.textSecondary },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.neutralSoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
});
