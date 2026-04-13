import { OnboardingHeader } from "@/components/OnboardingHeader";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import { FormErrorText } from "@/components/ui/FormErrorText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { normalizePhoneDigits } from "@/lib/api/auth";
import {
    getOnboardingOwner,
    getOnboardingVehicle,
    postOnboardingDriver,
} from "@/lib/api/onboarding";
import { uploadLocalImageToS3 } from "@/lib/api/upload";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
import { getStoredPhoneNumber } from "@/lib/storage/driver-session-storage";
import { clearOnboardingCaches } from "@/lib/storage/onboarding-cache";
import { setCachedDriverOnboarding } from "@/lib/storage/onboarding-driver-cache";
import {
    getCachedOwnerOnboarding,
    setCachedOwnerOnboarding,
} from "@/lib/storage/onboarding-owner-cache";
import { setCachedVehicleOnboarding } from "@/lib/storage/onboarding-vehicle-cache";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = [
  { key: "owner", label: "Owner" },
  { key: "vehicle", label: "Vehicle" },
  { key: "driver", label: "Driver" },
];

export default function DriverDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selfDrive, setSelfDrive] = useState<boolean | null>(null);
  const [driverName, setDriverName] = useState("");
  const [phone, setPhone] = useState("");
  const [dlUrl, setDlUrl] = useState<string | null>(null);
  const [dlUploading, setDlUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<
    Partial<Record<"driverName" | "driverPhone", boolean>>
  >({});

  const nameShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
  const phoneShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });

  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Toggle change reset: remove borders + reset shakes.
    setInvalid({});
    nameShake.reset();
    phoneShake.reset();

    // Prevent focus/keyboard when switching to YES.
    Keyboard.dismiss();
    nameInputRef.current?.blur();
    phoneInputRef.current?.blur();

    if (selfDrive === false) {
      // YES -> NO: clear immediately.
      setDriverName("");
      setPhone("");
      return;
    }
    if (selfDrive === true) {
      void (async () => {
        const cachedOwner = await getCachedOwnerOnboarding();
        const ownerName =
          (cachedOwner?.name ?? "").trim() ||
          (await (async () => {
            try {
              const fresh = await getOnboardingOwner();
              const nm = (fresh.name ?? "").trim();
              if (nm) await setCachedOwnerOnboarding({ name: nm });
              return nm;
            } catch {
              return "";
            }
          })());
        const storedPhone = await getStoredPhoneNumber();
        setDriverName(ownerName);
        setPhone(storedPhone ?? "");
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfDrive]);

  const pickDl = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setFormError(t("errors.upload_permission_required"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;

    const asset = res.assets[0];
    setDlUrl(null);
    setDlUploading(true);
    try {
      const url = await uploadLocalImageToS3({
        localUri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `dl-${Date.now()}.jpg`,
        purpose: "onboarding_driver_license",
        logContext: "onboarding/driver/license",
      });
      setDlUrl(url);
      if (formError) setFormError(null);
    } catch (e) {
      setDlUrl(null);
      void e;
      setFormError(t("errors.try_again"));
    } finally {
      setDlUploading(false);
    }
  };

  const sanitizeName = (raw: string) =>
    raw
      .replace(/[^A-Za-z ]+/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
  const isValidName = (v: string) =>
    v.trim().length > 0 && /^[A-Za-z ]+$/.test(v.trim());
  const phone10 = normalizePhoneDigits(phone);
  const isValidPhone = (d: string) => d.replace(/\D/g, "").length === 10;
  const canSubmit =
    selfDrive !== null &&
    (selfDrive === true || isValidName(driverName)) &&
    (selfDrive === true || isValidPhone(phone10)) &&
    !!dlUrl &&
    !dlUploading &&
    !submitting;

  const onSubmit = async () => {
    if (selfDrive === null || !dlUrl || dlUploading || submitting) return;

    // Validation: skip name/phone when self-driving (per requirement).
    const nextInvalid: typeof invalid = {};
    if (selfDrive === false) {
      if (!isValidName(driverName)) nextInvalid.driverName = true;
      if (!isValidPhone(phone10)) nextInvalid.driverPhone = true;
    }
    setInvalid(nextInvalid);
    if (nextInvalid.driverName) nameShake.shake();
    if (nextInvalid.driverPhone) phoneShake.shake();
    if (Object.keys(nextInvalid).length > 0) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const cachedOwner = await getCachedOwnerOnboarding();
      const storedPhone = await getStoredPhoneNumber();
      const nameForApi =
        selfDrive === true
          ? (cachedOwner?.name ?? "").trim()
          : driverName.trim();
      const phoneForApi = selfDrive === true ? (storedPhone ?? "") : phone10;

      await postOnboardingDriver({
        isSelfDriving: selfDrive,
        name: nameForApi,
        phoneNumber: phoneForApi,
        driverLicenseUrl: dlUrl!,
      });

      await setCachedDriverOnboarding({
        isSelfDriving: selfDrive,
        name: nameForApi || null,
        phoneNumber: phoneForApi || null,
        driverLicenseUrl: dlUrl ?? null,
      });
      // Clear draft caches after successful driver submit.
      await clearOnboardingCaches();
      router.replace("/verification-pending");
    } catch (e) {
      // No popup: show red borders + shake feedback.
      const failInvalid: typeof invalid = {};
      if (selfDrive === false) {
        failInvalid.driverName = true;
        failInvalid.driverPhone = true;
      }
      setInvalid((m) => ({ ...m, ...failInvalid }));
      nameShake.shake();
      phoneShake.shake();
      void e;
      setFormError(t("errors.try_again"));
    } finally {
      setSubmitting(false);
    }
  };

  const onBackToVehicle = async () => {
    try {
      const data = await getOnboardingVehicle();
      await setCachedVehicleOnboarding({
        registrationNumber: data.registrationNumber ?? null,
        city: data.city ?? null,
        vehicleType: data.vehicleType ?? null,
        bodyType: data.bodyType ?? null,
        bodySpec: data.bodySpec ?? null,
        rcDocumentId: data.rcDocumentId ?? null,
      });
    } catch (e) {
      if (__DEV__)
        console.warn("[onboarding] vehicle prefill fetch failed:", e);
    } finally {
      router.replace({
        pathname: "/onboarding/vehicle",
        params: { refresh: "1" },
      });
    }
  };

  return (
    <View style={styles.screen}>
      <OnboardingHeader
        title={t("onboarding.driver.title")}
        onBack={onBackToVehicle}
        onHelp={() => setFormError(t("errors.support_contact"))}
      />
      <OnboardingStepper steps={STEPS} currentIndex={2} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <FormErrorText error={formError} />
        <Text style={styles.fieldLabel}>
          {t("onboarding.driver.will_drive")} <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.toggleCard,
              selfDrive === true && styles.toggleActive,
            ]}
            onPress={() => setSelfDrive(true)}
            disabled={submitting}
          >
            <View
              style={[styles.radio, selfDrive === true && styles.radioOn]}
            />
            <Text style={styles.toggleText}>{t("common.yes")}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleCard,
              selfDrive === false && styles.toggleActive,
            ]}
            onPress={() => setSelfDrive(false)}
            disabled={submitting}
          >
            <View
              style={[styles.radio, selfDrive === false && styles.radioOnInner]}
            />
            <Text style={styles.toggleText}>{t("common.no")}</Text>
          </Pressable>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
          {t("onboarding.driver.name_label")} <Text style={styles.req}>*</Text>
        </Text>
        <Animated.View style={nameShake.style}>
          <TextInput
            ref={nameInputRef}
            style={[
              styles.input,
              selfDrive === true && styles.inputDisabled,
              invalid.driverName && styles.inputError,
            ]}
            value={driverName}
            onChangeText={(v) => {
              if (selfDrive === true) return;
              const next = sanitizeName(v);
              setDriverName(next);
              if (invalid.driverName)
                setInvalid((m) => ({ ...m, driverName: false }));
              if (formError) setFormError(null);
              nameShake.reset();
            }}
            onFocus={() => {
              if (selfDrive === true) {
                nameInputRef.current?.blur();
                Keyboard.dismiss();
              }
            }}
            placeholder={t("onboarding.driver.name_placeholder")}
            placeholderTextColor={Colors.textMuted}
            editable={!submitting && selfDrive !== true}
            focusable={!submitting && selfDrive !== true}
            showSoftInputOnFocus={selfDrive !== true}
            selectTextOnFocus={selfDrive !== true}
            caretHidden={selfDrive === true}
          />
          <FormErrorText
            error={invalid.driverName ? t("errors.invalid_name") : null}
          />
        </Animated.View>

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
          {t("onboarding.driver.phone_label")} <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.phoneRow}>
          <View style={styles.cc}>
            <Text style={styles.ccText}>IN +91</Text>
          </View>
          <Animated.View style={[phoneShake.style, { flex: 1 }]}>
            <TextInput
              ref={phoneInputRef}
              style={[
                styles.input,
                selfDrive === true && styles.inputDisabled,
                { flex: 1, marginTop: 0 },
                invalid.driverPhone && styles.inputError,
              ]}
              keyboardType="number-pad"
              value={phone}
              onChangeText={(v) => {
                if (selfDrive === true) return;
                const next = normalizePhoneDigits(v);
                setPhone(next);
                if (invalid.driverPhone)
                  setInvalid((m) => ({ ...m, driverPhone: false }));
                if (formError) setFormError(null);
                phoneShake.reset();
              }}
              onFocus={() => {
                if (selfDrive === true) {
                  phoneInputRef.current?.blur();
                  Keyboard.dismiss();
                }
              }}
              placeholder={t("onboarding.driver.phone_placeholder")}
              placeholderTextColor={Colors.textMuted}
              maxLength={10}
              editable={!submitting && selfDrive !== true}
              focusable={!submitting && selfDrive !== true}
              showSoftInputOnFocus={selfDrive !== true}
              selectTextOnFocus={selfDrive !== true}
              caretHidden={selfDrive === true}
            />
          </Animated.View>
        </View>
        <FormErrorText
          error={invalid.driverPhone ? t("auth.login.invalid_mobile") : null}
        />

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
          {t("onboarding.driver.license_label")} *
        </Text>
        {dlUploading ? (
          <View style={[styles.dlCard, styles.dlDone]}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.dlTitle}>
              {t("onboarding.driver.uploading_license")}
            </Text>
          </View>
        ) : dlUrl ? (
          <View style={[styles.dlCard, styles.dlDone]}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dlTitle}>
                {t("onboarding.driver.license_label")}
              </Text>
              <Text style={styles.dlFile} numberOfLines={2}>
                {dlUrl.length > 56 ? `${dlUrl.slice(0, 52)}…` : dlUrl}
              </Text>
            </View>
            <Pressable
              onPress={() => setDlUrl(null)}
              hitSlop={8}
              disabled={submitting}
            >
              <Ionicons
                name="close-circle"
                size={22}
                color={Colors.textMuted}
              />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.dlCard}
            onPress={pickDl}
            disabled={submitting}
          >
            <Text style={styles.dlTitle}>
              {t("onboarding.driver.license_label")} *
            </Text>
            <View style={styles.uploadBtn}>
              <Ionicons name="camera" size={18} color={Colors.link} />
              <Text style={styles.uploadBtnText}>{t("common.upload")}</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.note}>
          <Text style={styles.noteIcon}>💡</Text>
          <Text style={styles.noteText}>
            <Text style={{ fontWeight: "700" }}>{t("common.note")}</Text>{" "}
            {t("onboarding.driver.note_text")}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <PrimaryButton
          title={
            submitting
              ? t("onboarding.driver.submitting")
              : t("onboarding.driver.submit_verification")
          }
          disabled={!canSubmit}
          loading={submitting}
          onPress={() => void onSubmit()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
  req: { color: Colors.danger },
  toggleRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  toggleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  toggleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  radioOnInner: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  toggleText: { fontSize: 16, fontWeight: "600", color: Colors.text },
  input: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surfaceElevated,
  },
  inputError: {
    borderColor: Colors.border,
  },
  inputDisabled: {
    opacity: 0.75,
    backgroundColor: Colors.surface,
  },
  phoneRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  cc: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    minHeight: 52,
    backgroundColor: Colors.surface,
  },
  ccText: { fontWeight: "600", color: Colors.text },
  dlCard: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  dlDone: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dlTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
  dlFile: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  uploadBtnText: { color: Colors.link, fontWeight: "700" },
  note: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "flex-start",
  },
  noteIcon: { fontSize: 18 },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
