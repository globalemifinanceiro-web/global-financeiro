import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, toneColors, typography, type StatusTone } from '@/theme';

interface BadgeProps {
  label: string;
  tone: StatusTone;
}

export function Badge({ label, tone }: BadgeProps) {
  const { fg, bg } = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  label: {
    ...typography.captionStrong,
  },
});
