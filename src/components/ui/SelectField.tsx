import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface SelectFieldProps {
  label: string;
  value?: string;
  options: string[];
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export function SelectField({ label, value, options, onChange, placeholder = 'Todos' }: SelectFieldProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setAberto(true)}>
        <Text style={styles.value} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.overlay} onPress={() => setAberto(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={[undefined, ...options]}
              keyExtractor={(item, index) => item ?? `all-${index}`}
              style={styles.list}
              renderItem={({ item }) => {
                const selecionado = item === value || (item === undefined && value === undefined);
                return (
                  <Pressable
                    style={[styles.option, selecionado && styles.optionSelected]}
                    onPress={() => {
                      onChange(item);
                      setAberto(false);
                    }}
                  >
                    <Text style={[styles.optionText, selecionado && styles.optionTextSelected]}>
                      {item ?? placeholder}
                    </Text>
                    {selecionado ? <Ionicons name="checkmark" size={16} color={colors.blue} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, minWidth: 160 },
  label: { ...typography.caption, color: colors.textSecondary },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  value: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11,37,69,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '70%',
  },
  sheetTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  optionSelected: { backgroundColor: colors.blueSoft },
  optionText: { ...typography.body, color: colors.textPrimary },
  optionTextSelected: { color: colors.blue, fontWeight: '600' },
});
