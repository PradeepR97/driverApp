import { Radius, Shadows, Spacing } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

type Variant = 'cash' | 'upi';

type Props = {
  title: string;
  onPress: () => void;
  variant: Variant;
  disabled?: boolean;
};

const BG: Record<Variant, string> = {
  cash: '#16A34A',
  upi: '#2563EB',
};

export function PaymentButton({ title, onPress, variant, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: BG[variant] },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Shadows.floatSm,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.92 },
});
