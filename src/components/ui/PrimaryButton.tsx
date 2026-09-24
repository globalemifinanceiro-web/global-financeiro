import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, radius, typography } from '@/theme';

interface PrimaryButtonProps extends PressableProps {
  label: string;
  variant?: 'solid' | 'ghost';
}

export function PrimaryButton({ label, variant = 'solid', disabled, style, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        styles.base,
        variant === 'solid' ? styles.solid : styles.ghost,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text style={variant === 'solid' ? styles.solidLabel : styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: { backgroundColor: colors.blue },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  solidLabel: { ...typography.bodyStrong, color: colors.textInverse },
  ghostLabel: { ...typography.bodyStrong, color: colors.blue },
});
