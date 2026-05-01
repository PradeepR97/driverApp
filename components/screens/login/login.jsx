import { FormField } from "@/shared/ui/FormField";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Colors, Spacing } from "@/config/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loginStyles } from "./login.styles";
import { useLogin } from "./useLogin";
export default function RequestOtpScreen() {
    const insets = useSafeAreaInsets();
    const { t, router, phone, loading, error, shakeTrigger, inputRef, onLogin, onChangePhone, } = useLogin();
    return (<View style={[loginStyles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={loginStyles.back} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color={Colors.primary}/>
      </Pressable>
      <View style={loginStyles.hairline}/>

      <View style={loginStyles.hero}>
        <View style={loginStyles.phoneWrap}>
          <Ionicons name="phone-portrait-outline" size={32} color={Colors.primaryDark}/>
        </View>
        <Text style={loginStyles.title}>{t("auth.login.title")}</Text>
        <Text style={loginStyles.subtitle}>{t("auth.login.subtitle")}</Text>
      </View>

      <View style={loginStyles.formWrap}>
        <FormField label={t("auth.login.mobile_label")} hasError={!!error} error={error} shakeTrigger={shakeTrigger} shakeDurationMs={420}>
          <View style={loginStyles.phoneRow}>
            <View style={loginStyles.cc}>
              <Text style={loginStyles.ccText}>IN +91</Text>
            </View>
            <TextInput ref={(r) => {
            inputRef.current = r;
        }} style={loginStyles.input} placeholder={t("auth.login.mobile_placeholder")} placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={10} value={phone} onChangeText={onChangePhone} editable={!loading} returnKeyType="done"/>
          </View>
        </FormField>
      </View>

      <View style={loginStyles.spacer}/>

      <View style={[loginStyles.bottom, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title={t("common.login")} loading={loading} onPress={() => void onLogin()}/>
        <Text style={loginStyles.legal}>
          {t("auth.login.terms_prefix")}{" "}
          <Text style={loginStyles.link}>{t("auth.login.terms")}</Text>,{" "}
          <Text style={loginStyles.link}>{t("auth.login.privacy")}</Text>{" "}
          {t("common.and")}{" "}
          <Text style={loginStyles.link}>{t("auth.login.tds")}</Text>
        </Text>
        <Text style={loginStyles.help}>
          {t("auth.login.need_help")}{" "}
          <Text style={loginStyles.link}>{t("auth.login.contact_support")}</Text>
        </Text>
      </View>
    </View>);
}
