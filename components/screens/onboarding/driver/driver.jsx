import { normalizePhoneDigits } from "@/api/auth";
import {
    getOnboardingOwner,
    getOnboardingVehicle,
    postOnboardingDriver,
} from "@/api/onboarding";
import { uploadLocalImageToS3 } from "@/api/upload";
import { Colors, Spacing } from "@/config/theme";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
import { syncAndRouteFromAppState } from "@/lib/navigation/sync-app-state";
import { getStoredPhoneNumber } from "@/lib/storage/driver-session-storage";
import { clearOnboardingCaches } from "@/lib/storage/onboarding-cache";
import { setCachedDriverOnboarding } from "@/lib/storage/onboarding-driver-cache";
import {
    getCachedOwnerOnboarding,
    setCachedOwnerOnboarding,
} from "@/lib/storage/onboarding-owner-cache";
import { setCachedVehicleOnboarding } from "@/lib/storage/onboarding-vehicle-cache";
import { OnboardingHeader } from "@/shared/OnboardingHeader";
import { OnboardingStepper } from "@/shared/OnboardingStepper";
import { FormErrorText } from "@/shared/ui/FormErrorText";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
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
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./driver.styles.js";
const STEPS = [
  { key: "owner", label: "Owner" },
  { key: "vehicle", label: "Vehicle" },
  { key: "driver", label: "Driver" },
];
export default function OnboardingDriverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selfDrive, setSelfDrive] = useState(null);
  const [driverName, setDriverName] = useState("");
  const [phone, setPhone] = useState("");
  const [dlUrl, setDlUrl] = useState(null);
  const [dlUploading, setDlUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [invalid, setInvalid] = useState({});
  const nameShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
  const phoneShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
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
  const sanitizeName = (raw) =>
    raw
      .replace(/[^A-Za-z ]+/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
  const isValidName = (v) =>
    v.trim().length > 0 && /^[A-Za-z ]+$/.test(v.trim());
  const phone10 = normalizePhoneDigits(phone);
  const isValidPhone = (d) => d.replace(/\D/g, "").length === 10;
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
    const nextInvalid = {};
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
        driverLicenseUrl: dlUrl,
      });
      await setCachedDriverOnboarding({
        isSelfDriving: selfDrive,
        name: nameForApi || null,
        phoneNumber: phoneForApi || null,
        driverLicenseUrl: dlUrl ?? null,
      });
      // Clear draft caches after successful driver submit.
      await clearOnboardingCaches();
      await syncAndRouteFromAppState(router).catch(() => {
        router.replace("/verificationInProgressScreen");
      });
    } catch (e) {
      // No popup: show red borders + shake feedback.
      const failInvalid = {};
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
        rcDocumentUrl: data.rcDocumentUrl ?? null,
      });
    } catch (e) {
      if (__DEV__)
        console.warn("[onboarding] vehicle prefill fetch failed:", e);
    } finally {
      router.replace({
        pathname: "/onboarding/onboardingVehicleScreen",
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
              <Ionicons name="checkmark" size={18} color={Colors.white} />
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
