import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/lib/i18n";
import { setStoredLanguageCode } from "@/lib/language-storage";
import { useRequiredSelection } from "@/lib/hooks/useRequiredSelection";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
const LANGUAGES = [
    { code: "GB", nameKey: "language.english", native: "English", apiCode: "EN", ui: "en" },
    { code: "IN", nameKey: "language.hindi", native: "हिंदी", apiCode: "HI", ui: "hi" },
    { code: "IN", nameKey: "language.tamil", native: "தமிழ்", apiCode: "TA", ui: "ta" },
    { code: "IN", en: "Telugu", native: "తెలుగు", apiCode: "TE" },
    { code: "IN", en: "Kannada", native: "ಕನ್ನಡ", apiCode: "KN" },
    { code: "IN", en: "Marathi", native: "मराठी", apiCode: "MR" },
];
export function useIndex() {
    const router = useRouter();
    const { t } = useTranslation();
    const [selected, setSelected] = useState(null);
    const selection = useRequiredSelection(t("language.error_required"));
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroScale = useRef(new Animated.Value(0.92)).current;
    const shake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroOpacity, {
                toValue: 1,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(heroScale, {
                toValue: 1,
                friction: 7,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, [heroOpacity, heroScale]);
    const onContinue = () => {
        const selectedIndex = selected;
        if (!selection.validate(selectedIndex)) {
            shake.shake();
            return;
        }
        const lang = LANGUAGES[selectedIndex];
        if ("ui" in lang) {
            void setAppLanguage(lang.ui);
        }
        void setStoredLanguageCode(lang.apiCode);
        router.push("/requestOtpScreen");
    };
    return {
        t,
        selected,
        setSelected,
        selection,
        heroOpacity,
        heroScale,
        shake,
        onContinue,
        languages: LANGUAGES,
    };
}
