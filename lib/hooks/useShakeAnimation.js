import { useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";
/** Clamp for total shake duration (horizontal ease-in-out sequence). */
export const SHAKE_DURATION_MS_MIN = 300;
export const SHAKE_DURATION_MS_MAX = 600;
export function useShakeAnimation(opts = {}) {
    const { durationMs = 360, amplitude = 10 } = opts;
    const x = useRef(new Animated.Value(0)).current;
    const running = useRef(false);
    const style = useMemo(() => ({ transform: [{ translateX: x }] }), [x]);
    const reset = () => {
        x.stopAnimation();
        x.setValue(0);
        running.current = false;
    };
    const shake = () => {
        if (running.current)
            return;
        running.current = true;
        const t = Math.max(SHAKE_DURATION_MS_MIN, Math.min(SHAKE_DURATION_MS_MAX, durationMs));
        const step = Math.floor(t / 5);
        const a = Math.max(6, Math.min(16, amplitude));
        x.setValue(0);
        Animated.sequence([
            Animated.timing(x, {
                toValue: a,
                duration: step,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(x, {
                toValue: -a,
                duration: step,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(x, {
                toValue: a * 0.8,
                duration: step,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(x, {
                toValue: -a * 0.8,
                duration: step,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(x, {
                toValue: 0,
                duration: step,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start(() => {
            running.current = false;
        });
    };
    return { style, shake, reset, value: x };
}
