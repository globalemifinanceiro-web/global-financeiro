import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, secureTextEntry, ...rest }: TextFieldProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const ehSenha = !!secureTextEntry;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, ehSenha && styles.inputComIcone, style]}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={ehSenha && !mostrarSenha}
          {...rest}
        />
        {ehSenha ? (
          <Pressable
            style={styles.icone}
            onPress={() => setMostrarSenha((valor) => !valor)}
            hitSlop={8}
            accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...typography.captionStrong, color: colors.textPrimary },
  inputWrap: { justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputComIcone: { paddingRight: 44 },
  icone: {
    position: 'absolute',
    right: spacing.sm,
    padding: 4,
  },
});
