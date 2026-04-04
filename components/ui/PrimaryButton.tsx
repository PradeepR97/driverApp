import { Colors, Radius, Spacing } from '@/constants/theme';
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
        <ActivityIndicator color={variant === 'filled' ? '#fff' : Colors.primary} />
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
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  filled: {
    backgroundColor: Colors.primary,
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
  pressed: { opacity: 0.92 },
  label: { fontSize: 16, fontWeight: '700' },
  labelFilled: { color: '#fff' },
  labelOutline: { color: Colors.text },
  labelDanger: { color: Colors.danger },
});
