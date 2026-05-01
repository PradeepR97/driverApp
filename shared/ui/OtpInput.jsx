import { Colors, Radius, Spacing } from '@/config/theme';
import { useShakeAnimation } from '@/lib/hooks/useShakeAnimation';
import { useEffect, useRef } from 'react';
import { Animated, Keyboard, StyleSheet, TextInput, View, } from 'react-native';
const BOX_MIN = 44;
export function OtpInput({ length, value, onChange, disabled, hasError, shakeTrigger = 0, shakeDurationMs = 400, autoFocus = true, }) {
    const inputs = useRef([]);
    const shake = useShakeAnimation({ durationMs: shakeDurationMs, amplitude: 10 });
    useEffect(() => {
        if (shakeTrigger > 0)
            shake.shake();
    }, [shake, shakeTrigger]);
    useEffect(() => {
        if (!autoFocus)
            return;
        const id = requestAnimationFrame(() => inputs.current[0]?.focus());
        return () => cancelAnimationFrame(id);
    }, [autoFocus]);
    const focusInput = (index) => {
        const safe = Math.max(0, Math.min(index, length - 1));
        requestAnimationFrame(() => inputs.current[safe]?.focus());
    };
    const setDigit = (index, char) => {
        if (disabled)
            return;
        const digits = char.replace(/\D/g, '');
        const next = [...value];
        if (digits.length > 1) {
            for (let i = index; i < length; i += 1) {
                const src = i - index;
                next[i] = digits[src] ?? '';
            }
            onChange(next);
            const lastFilled = Math.min(index + digits.length - 1, length - 1);
            focusInput(lastFilled);
            if (next.length === length && next.every((d) => d.length === 1)) {
                requestAnimationFrame(() => Keyboard.dismiss());
            }
            return;
        }
        const c = digits.slice(-1);
        next[index] = c;
        onChange(next);
        if (c && index < length - 1)
            focusInput(index + 1);
        else if (next.length === length && next.every((d) => d.length === 1)) {
            requestAnimationFrame(() => Keyboard.dismiss());
        }
    };
    const onKeyPress = (index, key) => {
        if (key !== 'Backspace' || disabled)
            return;
        const next = [...value];
        if (next[index]) {
            next[index] = '';
            onChange(next);
            if (index > 0)
                focusInput(index - 1);
            return;
        }
        if (index > 0) {
            const prev = index - 1;
            if (next[prev])
                next[prev] = '';
            onChange(next);
            focusInput(prev);
        }
    };
    const gap = length > 4 ? Spacing.sm : Spacing.md;
    const boxW = length > 6 ? 40 : BOX_MIN;
    return (<Animated.View style={shake.style}>
      <View style={[styles.row, { gap }]}>
        {Array.from({ length }, (_, i) => (<TextInput key={i} ref={(r) => {
                inputs.current[i] = r;
            }} style={[
                styles.box,
                { width: boxW, height: boxW },
                value[i] ? styles.boxFilled : null,
                hasError ? styles.boxError : null,
            ]} keyboardType="number-pad" maxLength={1} value={value[i] ?? ''} editable={!disabled} onChangeText={(t) => setDigit(i, t)} onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}/>))}
      </View>
    </Animated.View>);
}
const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    box: {
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        backgroundColor: Colors.surfaceElevated,
    },
    boxFilled: { borderColor: Colors.primary },
    boxError: {
        borderColor: Colors.border,
        borderWidth: 1.5,
    },
});
