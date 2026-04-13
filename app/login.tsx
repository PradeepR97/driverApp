import { FormField } from "@/components/ui/FormField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Colors, Radius, Shadows, Spacing, Type } from "@/constants/theme";
import { normalizePhoneDigits, postOtpRequest } from "@/lib/api/auth";
import { AUTH_USER_TYPE, DEFAULT_COUNTRY_CODE } from "@/lib/config";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (phone.length === 10) {
      inputRef.current?.blur();
    }
  }, [phone]);

  const onLogin = async () => {
    const digits = normalizePhoneDigits(phone);
    if (digits.length !== 10) {
      setError(t("auth.login.invalid_mobile"));
      setShakeTrigger((n) => n + 1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await postOtpRequest({
        user_type: AUTH_USER_TYPE,
        countryCode: DEFAULT_COUNTRY_CODE,
        phoneNumber: digits,
      });
      const expiresIn =
        typeof res.expires_in === "number" ? res.expires_in : 300;
      router.push({
        pathname: "/verify-otp",
        params: {
          phone: digits,
          countryCode: DEFAULT_COUNTRY_CODE,
          expiresIn: String(Math.min(expiresIn, 600)),
        },
      });
    } catch (e) {
      void e;
      setError(t("errors.try_again"));
      setShakeTrigger((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const onChangePhone = (text: string) => {
    const digits = normalizePhoneDigits(text);
    setPhone(digits);
    if (error) setError(null);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={styles.back}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color={Colors.primary} />
      </Pressable>
      <View style={styles.hairline} />

      <View style={styles.hero}>
        <View style={styles.phoneWrap}>
          <Ionicons
            name="phone-portrait-outline"
            size={32}
            color={Colors.primaryDark}
          />
        </View>
        <Text style={styles.title}>{t("auth.login.title")}</Text>
        <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>
      </View>

      <View style={{ marginTop: Spacing.xl }}>
        <FormField
          label={t("auth.login.mobile_label")}
          hasError={!!error}
          error={error}
          shakeTrigger={shakeTrigger}
          shakeDurationMs={420}
        >
          <View style={styles.phoneRow}>
            <View style={styles.cc}>
              <Text style={styles.ccText}>IN +91</Text>
            </View>
            <TextInput
              ref={(r) => {
                inputRef.current = r;
              }}
              style={styles.input}
              placeholder={t("auth.login.mobile_placeholder")}
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={onChangePhone}
              editable={!loading}
              returnKeyType="done"
            />
          </View>
        </FormField>
      </View>

      <View style={{ flex: 1 }} />

      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <PrimaryButton
          title={t("common.login")}
          loading={loading}
          onPress={() => void onLogin()}
        />
        <Text style={styles.legal}>
          {t("auth.login.terms_prefix")}{" "}
          <Text style={styles.link}>{t("auth.login.terms")}</Text>,{" "}
          <Text style={styles.link}>{t("auth.login.privacy")}</Text>{" "}
          {t("common.and")}{" "}
          <Text style={styles.link}>{t("auth.login.tds")}</Text>
        </Text>
        <Text style={styles.help}>
          {t("auth.login.need_help")}{" "}
          <Text style={styles.link}>{t("auth.login.contact_support")}</Text>
        </Text>
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
  back: { alignSelf: "flex-start", marginBottom: Spacing.sm },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  hero: { alignItems: "center", marginTop: Spacing.sm },
  phoneWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    ...Shadows.floatSm,
  },
  title: { ...Type.h1, textAlign: "center" },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  phoneRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.sm,
    alignItems: "center",
  },
  cc: {
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    borderRadius: Radius.sm,
    minHeight: 48,
    backgroundColor: Colors.surface,
  },
  ccText: { fontWeight: "600", color: Colors.text },
  input: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
    fontSize: 17,
    color: Colors.text,
    minHeight: 48,
    backgroundColor: "transparent",
  },
  bottom: { gap: Spacing.md },
  legal: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    color: Colors.link,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  help: { fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
});
