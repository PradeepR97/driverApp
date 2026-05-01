import { FormErrorText } from "@/shared/ui/FormErrorText";
import { OtpInput } from "@/shared/ui/OtpInput";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { AnimDuration } from "@/config/animations";
import { Colors, Spacing } from "@/config/theme";
import { OTP_DIGIT_COUNT } from "@/config/appConfig";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { verifyOtpStyles } from "./verifyOtp.styles";
import { useVerifyOtp } from "./useVerifyOtp";
export default function VerifyOtpScreen() {
    const insets = useSafeAreaInsets();
    const { router, t, values, cooldown, busy, resending, error, info, otpShake, displayPhone, onOtpChange, onResend, } = useVerifyOtp();
    return (<View style={[verifyOtpStyles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={verifyOtpStyles.back} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color={Colors.primary}/>
      </Pressable>
      <View style={verifyOtpStyles.hairline}/>

      <ScrollView style={verifyOtpStyles.scroll} contentContainerStyle={verifyOtpStyles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={verifyOtpStyles.shieldWrap}>
          <Ionicons name="shield-checkmark-outline" size={36} color={Colors.primaryDark}/>
        </View>
        <Text style={verifyOtpStyles.title}>{t("auth.otp.title")}</Text>
        <Text style={verifyOtpStyles.sub}>
          {t("auth.otp.subtitle_prefix", { count: OTP_DIGIT_COUNT })}
        </Text>
        <View style={verifyOtpStyles.phoneRow}>
          <Text style={verifyOtpStyles.phone}>{displayPhone}</Text>
          <Pressable onPress={() => router.back()} disabled={busy}>
            <Text style={verifyOtpStyles.change}>{t("common.change")}</Text>
          </Pressable>
        </View>

        <View style={verifyOtpStyles.otpWrap}>
          <OtpInput length={OTP_DIGIT_COUNT} value={values} onChange={onOtpChange} disabled={busy} hasError={!!error} shakeTrigger={otpShake} shakeDurationMs={AnimDuration.shakeNormalMs}/>
          <FormErrorText error={error}/>
        </View>

        {!error && info ? <Text style={verifyOtpStyles.info}>{info}</Text> : null}

        {busy ? (<Text style={verifyOtpStyles.status}>{t("auth.otp.verifying")}</Text>) : cooldown > 0 ? (<Text style={verifyOtpStyles.resend}>
            {t("auth.otp.resend_in")}{" "}
            <Text style={verifyOtpStyles.timer}>{cooldown}s</Text>
          </Text>) : (<PrimaryButton title={resending ? t("auth.otp.sending") : t("auth.otp.resend_code")} variant="outline" loading={resending} disabled={resending} onPress={() => void onResend()} style={verifyOtpStyles.resendBtn}/>)}
      </ScrollView>
    </View>);
}
