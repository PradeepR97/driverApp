import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type Props = PressableProps & {
  title: string;
  variant?: 'filled' | 'outline' | 'dangerOutline';
  loading?: boolean;
  textStyle?: TextStyle;
  style?: ViewStyle;
};

export function PrimaryButton({
  title,
  variant = 'filled',
  loading,
  disabled,
  textStyle,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'filled' && styles.filled,
        variant === 'outline' && styles.outline,
        variant === 'dangerOutline' && styles.dangerOutline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? Colors.white : Colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'filled' && styles.labelFilled,
            variant === 'outline' && styles.labelOutline,
            variant === 'dangerOutline' && styles.labelDanger,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  filled: {
    backgroundColor: Colors.primary,
    ...Shadows.floatSm,
  },
  outline: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerOutline: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.96 }] },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  labelFilled: { color: Colors.white },
  labelOutline: { color: Colors.text },
  labelDanger: { color: Colors.danger },
});
