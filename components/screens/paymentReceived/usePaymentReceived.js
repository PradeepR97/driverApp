import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { useOnlineTripNavigationGuard } from "@/lib/hooks/useOnlineTripNavigationGuard";
const RECEIVED_ANIMATION_MS = 2000;
export function usePaymentReceived() {
    const router = useRouter();
    useOnlineTripNavigationGuard({ enabled: true });
    const scale = useRef(new Animated.Value(0.7)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const animatedStyle = useMemo(() => ({ opacity, transform: [{ scale }] }), [opacity, scale]);
    useEffect(() => {
        const anim = Animated.parallel([
            Animated.timing(scale, {
                toValue: 1,
                duration: 550,
                easing: Easing.out(Easing.back(1.1)),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 380,
                useNativeDriver: true,
            }),
        ]);
        anim.start();
        const id = setTimeout(() => {
            router.replace("/ratingScreen");
        }, RECEIVED_ANIMATION_MS);
        return () => {
            clearTimeout(id);
            anim.stop();
        };
    }, [opacity, router, scale]);
    return { animatedStyle };
}
