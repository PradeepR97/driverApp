import { Colors, Radius, Spacing, Type } from '@/config/theme';
import { useShakeAnimation } from '@/lib/hooks/useShakeAnimation';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, } from 'react-native';
import { FormError } from './FormError';
/**
 * Standard label + field shell for consistent spacing and error outline.
 */
export function FormField({ label, hasError, error, shakeTrigger = 0, shakeDurationMs = 360, children, style, }) {
    const shake = useShakeAnimation({ durationMs: shakeDurationMs, amplitude: 10 });
    const prevTrigger = useRef(shakeTrigger);
    useEffect(() => {
        if (shakeTrigger > prevTrigger.current) {
            shake.shake();
        }
        prevTrigger.current = shakeTrigger;
    }, [shake, shakeTrigger]);
    return (<View style={[styles.root, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={shake.style}>
        <View style={[styles.fieldShell, hasError ? styles.fieldShellError : null]}>{children}</View>
      </Animated.View>
      <FormError message={error} visible={!!hasError && !!error}/>
    </View>);
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
