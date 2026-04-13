import { OtpInput } from "@/components/ui/OtpInput";
import { FormErrorText } from "@/components/ui/FormErrorText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Colors, Radius, Shadows, Spacing, Type } from "@/constants/theme";
import { getAppState, postUserLanguage } from "@/lib/api/app";
import {
    formatPhoneForDisplay,
    normalizePhoneDigits,
    postOtpRequest,
    postOtpVerify,
} from "@/lib/api/auth";
import { extractAccessToken } from "@/lib/api/token";
import { setAccessToken } from "@/lib/auth-session";
import {
    AUTH_USER_TYPE,
    DEFAULT_COUNTRY_CODE,
    OTP_DIGIT_COUNT,
} from "@/lib/config";
import { AnimDuration } from "@/constants/animations";
import { getStoredLanguageCode } from "@/lib/language-storage";
import { replaceForAppState } from "@/lib/navigation/route-after-auth";
import { setStoredPhoneNumber } from "@/lib/storage/driver-session-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    phone?: string;
    countryCode?: string;
    expiresIn?: string;
  }>();

  const phone10 =
    typeof params.phone === "string" ? normalizePhoneDigits(params.phone) : "";
  const countryCode =
    typeof params.countryCode === "string"
      ? params.countryCode
      : DEFAULT_COUNTRY_CODE;

  const [values, setValues] = useState(() =>
    Array.from({ length: OTP_DIGIT_COUNT }, () => ""),
  );
  const [cooldown, setCooldown] = useState(() => 30);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const verifyAttempted = useRef<string | null>(null);
  const [otpShake, setOtpShake] = useState(0);

  useEffect(() => {
    if (phone10.length !== 10) {
      router.replace("/login");
    }
  }, [phone10, router]);

  const cooldownActive = cooldown > 0;
  useEffect(() => {
    if (!cooldownActive) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldownActive]);

  const verifyAndContinue = useCallback(
    async (code: string) => {
      if (phone10.length !== 10) return;
      setBusy(true);
      try {
        const data = await postOtpVerify({
          user_type: AUTH_USER_TYPE,
          countryCode,
          phoneNumber: phone10,
          otp: code,
        });
        const token = extractAccessToken(data);
        if (!token) {
          verifyAttempted.current = null;
          setError(t("errors.no_session_token"));
          setOtpShake((n) => n + 1);
          return;
        }
        await setAccessToken(token);
        await setStoredPhoneNumber(phone10);

        const langCode = await getStoredLanguageCode();
        if (langCode) {
          try {
            await postUserLanguage(langCode);
          } catch (err) {
            if (__DEV__) {
              console.warn(
                "[api] language sync failed (continuing to app state):",
                err,
              );
            }
          }
        }

        try {
          const state = await getAppState();
          replaceForAppState(router, state);
        } catch {
          router.replace("/onboarding/owner");
        }
      } catch (e) {
        verifyAttempted.current = null;
        void e;
        setError(t("errors.invalid_otp"));
        setOtpShake((n) => n + 1);
      } finally {
        setBusy(false);
      }
    },
    [countryCode, phone10, router, t],
  );

  const maybeAutoVerify = useCallback(
    (nextValues: string[]) => {
      const joined = nextValues.join("");
      if (
        joined.length === OTP_DIGIT_COUNT &&
        verifyAttempted.current !== joined
      ) {
        verifyAttempted.current = joined;
        void verifyAndContinue(joined);
      }
    },
    [verifyAndContinue],
  );

  const onOtpChange = (next: string[]) => {
    if (busy) return;
    if (error) setError(null);
    if (info) setInfo(null);
    setValues(next);
    maybeAutoVerify(next);
  };

  const onResend = async () => {
    if (phone10.length !== 10 || cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await postOtpRequest({
        user_type: AUTH_USER_TYPE,
        countryCode,
        phoneNumber: phone10,
      });
      setCooldown(30);
      setValues(Array.from({ length: OTP_DIGIT_COUNT }, () => ""));
      verifyAttempted.current = null;
      setError(null);
      setInfo(res.message ?? "OTP sent successfully");
    } catch (e) {
      void e;
      setInfo(null);
      setError(t("errors.try_again_later"));
      setOtpShake((n) => n + 1);
    } finally {
      setResending(false);
    }
  };

  const displayPhone = formatPhoneForDisplay(countryCode, phone10);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.back}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color={Colors.primary} />
      </Pressable>
      <View style={styles.hairline} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shieldWrap}>
          <Ionicons
            name="shield-checkmark-outline"
            size={36}
            color={Colors.primaryDark}
          />
        </View>
        <Text style={styles.title}>{t("auth.otp.title")}</Text>
        <Text style={styles.sub}>
          {t("auth.otp.subtitle_prefix", { count: OTP_DIGIT_COUNT })}
        </Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phone}>{displayPhone}</Text>
          <Pressable onPress={() => router.back()} disabled={busy}>
            <Text style={styles.change}>{t("common.change")}</Text>
          </Pressable>
        </View>

        <View style={styles.otpWrap}>
          <OtpInput
            length={OTP_DIGIT_COUNT}
            value={values}
            onChange={onOtpChange}
            disabled={busy}
            hasError={!!error}
            shakeTrigger={otpShake}
            shakeDurationMs={AnimDuration.shakeNormalMs}
          />
          <FormErrorText error={error} />
        </View>

        {!error && info ? <Text style={styles.info}>{info}</Text> : null}

        {busy ? (
          <Text style={styles.status}>{t("auth.otp.verifying")}</Text>
        ) : cooldown > 0 ? (
          <Text style={styles.resend}>
            {t("auth.otp.resend_in")}{" "}
            <Text style={styles.timer}>{cooldown}s</Text>
          </Text>
        ) : (
          <PrimaryButton
            title={
              resending ? t("auth.otp.sending") : t("auth.otp.resend_code")
            }
            variant="outline"
            loading={resending}
            disabled={resending}
            onPress={() => void onResend()}
            style={styles.resendBtn}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  back: { marginLeft: Spacing.md, marginBottom: Spacing.sm },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  body: {
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  shieldWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    ...Shadows.floatSm,
  },
  title: { ...Type.h1 },
  sub: { marginTop: Spacing.md, fontSize: 15, color: Colors.textSecondary },
  phoneRow: {
    flexDirection: "row",
    marginTop: Spacing.xs,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  phone: { fontSize: 16, fontWeight: "700", color: Colors.text },
  change: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.link,
    marginLeft: 4,
  },
  otpWrap: { marginTop: Spacing.xl, alignSelf: "stretch" },
  resend: { marginTop: Spacing.xl, fontSize: 14, color: Colors.textSecondary },
  timer: { fontWeight: "800", color: Colors.text },
  status: { marginTop: Spacing.xl, fontSize: 14, color: Colors.textSecondary },
  info: {
    marginTop: Spacing.sm,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  resendBtn: {
    marginTop: Spacing.lg,
    alignSelf: "stretch",
    width: "100%",
    maxWidth: 280,
  },
});
