import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useShakeAnimation } from '@/lib/hooks/useShakeAnimation';
import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FormError } from './FormError';

type Props = {
  label?: string;
  /** When true, children wrapper gets a danger border (validation). */
  hasError?: boolean;
  error?: string | null;
  /** Increase value to trigger shake on validation failure. */
  shakeTrigger?: number;
  shakeDurationMs?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Standard label + field shell for consistent spacing and error outline.
 */
export function FormField({
  label,
  hasError,
  error,
  shakeTrigger = 0,
  shakeDurationMs = 360,
  children,
  style,
}: Props) {
  const shake = useShakeAnimation({ durationMs: shakeDurationMs, amplitude: 10 });
  const prevTrigger = useRef(shakeTrigger);

  useEffect(() => {
    if (shakeTrigger > prevTrigger.current) {
      shake.shake();
    }
    prevTrigger.current = shakeTrigger;
  }, [shakeTrigger]);

  return (
    <View style={[styles.root, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={shake.style}>
        <View style={[styles.fieldShell, hasError ? styles.fieldShellError : null]}>{children}</View>
      </Animated.View>
      <FormError message={error} visible={!!hasError && !!error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.sm },
  label: {
    ...Type.caption,
    fontWeight: '700',
    color: Colors.text,
  },
  fieldShell: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  fieldShellError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
});
