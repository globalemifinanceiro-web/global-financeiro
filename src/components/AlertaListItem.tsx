import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { AlertaFinanceiro } from '@/types/finance';
import { formatDateTimeBR } from '@/utils/date';
import { SEVERIDADE_TONE } from '@/utils/statusMappers';
import { colors, radius, spacing, toneColors, typography } from '@/theme';

const ICONE: Record<AlertaFinanceiro['severidade'], keyof typeof Ionicons.glyphMap> = {
  critico: 'alert-circle',
  atencao: 'warning',
  info: 'information-circle',
};

export function AlertaListItem({ alerta }: { alerta: AlertaFinanceiro }) {
  const tone = toneColors[SEVERIDADE_TONE[alerta.severidade]];
  return (
    <View style={styles.item}>
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <Ionicons name={ICONE[alerta.severidade]} size={16} color={tone.fg} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.titulo}>{alerta.titulo}</Text>
        <Text style={styles.descricao}>{alerta.descricao}</Text>
        <Text style={styles.data}>{formatDateTimeBR(alerta.data)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flexShrink: 1, gap: 2 },
  titulo: { ...typography.bodyStrong, color: colors.textPrimary },
  descricao: { ...typography.caption, color: colors.textSecondary },
  data: { ...typography.caption, color: colors.textSecondary },
});
