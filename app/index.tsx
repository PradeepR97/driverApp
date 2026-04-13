import { FormErrorText } from "@/components/ui/FormErrorText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Colors, Radius, Shadows, Spacing, Type } from "@/constants/theme";
import { setAppLanguage, type AppLanguage } from "@/lib/i18n";
import { setStoredLanguageCode } from "@/lib/language-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Easing,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRequiredSelection } from "../lib/hooks/useRequiredSelection";
import { useShakeAnimation } from "../lib/hooks/useShakeAnimation";

/** `apiCode` is sent in `POST /users/language` after sign-in. */
const LANGUAGES = [
  {
    code: "GB",
    nameKey: "language.english",
    native: "English",
    apiCode: "EN",
    ui: "en",
  },
  {
    code: "IN",
    nameKey: "language.hindi",
    native: "हिंदी",
    apiCode: "HI",
    ui: "hi",
  },
  {
    code: "IN",
    nameKey: "language.tamil",
    native: "தமிழ்",
    apiCode: "TA",
    ui: "ta",
  },
  { code: "IN", en: "Telugu", native: "తెలుగు", apiCode: "TE" },
  { code: "IN", en: "Kannada", native: "ಕನ್ನಡ", apiCode: "KN" },
  { code: "IN", en: "Marathi", native: "मराठी", apiCode: "MR" },
] as const;

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const selection = useRequiredSelection<number>(t("language.error_required"));
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

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.xl }]}>
      <Animated.View
        style={[
          styles.hero,
          { opacity: heroOpacity, transform: [{ scale: heroScale }] },
        ]}
      >
        <View style={styles.globeWrap}>
          <Ionicons name="globe-outline" size={36} color={Colors.white} />
        </View>
        <Text style={styles.title}>{t("language.title")}</Text>
        <Text style={styles.subtitle}>{t("language.subtitle")}</Text>
      </Animated.View>

      <Animated.View style={shake.style}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {LANGUAGES.map((lang, index) => {
            const active = selected === index;
            return (
              <Pressable
                key={`${lang.code}-${"nameKey" in lang ? lang.nameKey : lang.en}`}
                onPress={() => {
                  setSelected((prev) => {
                    const next = prev === index ? null : index;
                    if (next != null) {
                      if (selection.error) selection.clearError();
                      shake.reset();
                    }
                    return next;
                  });
                }}
                style={({ pressed }) => [
                  styles.card,
                  active && styles.cardActive,
                  pressed && styles.cardPressed,
                ]}
              >
                <Text style={styles.cardCode}>{lang.code}</Text>
                <Text style={styles.cardEn}>
                  {"nameKey" in lang ? t(lang.nameKey) : lang.en}
                </Text>
                <Text style={styles.cardNative}>{lang.native}</Text>
              </Pressable>
            );
          })}

          <View style={styles.languageError}>
            <FormErrorText error={selection.error} />
          </View>
        </ScrollView>
      </Animated.View>

      <View style={{ flex: 1 }} />
      <Text style={styles.region}>{t("language.region")}</Text>
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <PrimaryButton
          title={t("common.continue")}
          onPress={() => {
            const selectedIndex = selected;
            if (!selection.validate(selectedIndex)) {
              shake.shake();
              return;
            }
            const lang = LANGUAGES[selectedIndex];
            if ("ui" in lang) {
              void setAppLanguage(lang.ui as AppLanguage);
            }
            void setStoredLanguageCode(lang.apiCode);
            router.push("/login");
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  hero: { alignItems: "center", marginBottom: Spacing.lg },
  globeWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadows.floatSm,
  },
  title: {
    ...Type.h1,
    textAlign: "center",
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  card: {
    width: "47%",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.96 },
  cardCode: { fontSize: 12, fontWeight: "700", color: Colors.text },
  cardEn: { fontSize: 16, fontWeight: "700", color: Colors.text, marginTop: 4 },
  cardNative: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  languageError: {
    width: "100%",
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  region: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  footer: {},
});
