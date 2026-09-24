import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, spacing, toneColors, typography, type StatusTone } from '@/theme';

interface KpiCardProps {
  label: string;
  value: string;
  tone?: StatusTone;
  icon?: keyof typeof Ionicons.glyphMap;
  helperText?: string;
}

export function KpiCard({ label, value, tone = 'neutral', icon, helperText }: KpiCardProps) {
  const toneColor = toneColors[tone];
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: toneColor.bg }]}>
            <Ionicons name={icon} size={16} color={toneColor.fg} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: toneColor.fg }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 160,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  value: {
    ...typography.kpiValue,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
