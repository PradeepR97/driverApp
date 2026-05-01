import { getVehicleOnboardingMeta } from "@/api/meta";
import {
    getOnboardingOwner,
    getOnboardingVehicle,
    postOnboardingVehicle,
} from "@/api/onboarding";
import { uploadLocalImageToS3 } from "@/api/upload";
import { Colors, Spacing } from "@/config/theme";
import {
    SHAKE_DURATION_MS_MAX,
    SHAKE_DURATION_MS_MIN,
    useShakeAnimation,
} from "@/lib/hooks/useShakeAnimation";
import { setCachedOwnerOnboarding } from "@/lib/storage/onboarding-owner-cache";
import {
    getCachedVehicleOnboarding,
    setCachedVehicleOnboarding,
} from "@/lib/storage/onboarding-vehicle-cache";
import { OnboardingHeader } from "@/shared/OnboardingHeader";
import { OnboardingStepper } from "@/shared/OnboardingStepper";
import { FormErrorText } from "@/shared/ui/FormErrorText";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { styles } from "./vehicle.styles.js";
const STEPS = [
  { key: "owner", label: "onboarding.steps.owner" },
  { key: "vehicle", label: "onboarding.steps.vehicle" },
  { key: "driver", label: "onboarding.steps.driver" },
];
const STATIC_CITY = "Vellore";
const REG_NO_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
/** Vehicle screen: slightly stronger shake; kept within hook clamp for consistency. */
const VEHICLE_DETAILS_SHAKE_MS = Math.min(
  SHAKE_DURATION_MS_MAX,
  Math.max(SHAKE_DURATION_MS_MIN, 520),
);
const VEHICLE_DETAILS_SHAKE_AMPLITUDE = 14;
/** After scrolling to first invalid section, start shakes so motion is readable. */
const VEHICLE_VALIDATE_SHAKE_AFTER_SCROLL_MS = 200;
const VEHICLE_SECTION_ORDER = [
  "registrationNumber",
  "rcUrl",
  "vehicleType",
  "bodyType",
  "bodySpec",
];
const VEHICLE_ICONS = {
  TRUCK: "🚛",
  MINI_TRUCK: "🚚",
  THREE_WHEELER: "🛺",
  PICKUP: "🛻",
};
const BODY_ICONS = {
  OPEN: "🛻",
  CLOSED: "📦",
  SEMI_OPEN: "🚚",
};
export default function OnboardingVehicleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const [vehicleNo, setVehicleNo] = useState("");
  const [rcUrl, setRcUrl] = useState(null);
  const [rcUploading, setRcUploading] = useState(false);
  const [city] = useState(STATIC_CITY);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [bodyTypes, setBodyTypes] = useState([]);
  const [bodySpecs, setBodySpecs] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [vTypeCode, setVTypeCode] = useState(null);
  const [bodyTypeCode, setBodyTypeCode] = useState(null);
  const [bodySpec, setBodySpec] = useState(null);
  const [bodySpecOpen, setBodySpecOpen] = useState(false);
  const [sectionY, setSectionY] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState({});
  const regShake = useShakeAnimation({
    durationMs: VEHICLE_DETAILS_SHAKE_MS,
    amplitude: VEHICLE_DETAILS_SHAKE_AMPLITUDE,
  });
  const rcShake = useShakeAnimation({
    durationMs: VEHICLE_DETAILS_SHAKE_MS,
    amplitude: VEHICLE_DETAILS_SHAKE_AMPLITUDE,
  });
  const vehicleTypeShake = useShakeAnimation({
    durationMs: VEHICLE_DETAILS_SHAKE_MS,
    amplitude: VEHICLE_DETAILS_SHAKE_AMPLITUDE,
  });
  const bodyTypeShake = useShakeAnimation({
    durationMs: VEHICLE_DETAILS_SHAKE_MS,
    amplitude: VEHICLE_DETAILS_SHAKE_AMPLITUDE,
  });
  const bodySpecShake = useShakeAnimation({
    durationMs: VEHICLE_DETAILS_SHAKE_MS,
    amplitude: VEHICLE_DETAILS_SHAKE_AMPLITUDE,
  });
  const captureSectionY = useCallback((key) => {
    return (e) => {
      const y = e.nativeEvent.layout.y;
      setSectionY((prev) => (prev[key] === y ? prev : { ...prev, [key]: y }));
    };
  }, []);
  const closeDropdowns = useCallback(() => {
    setBodySpecOpen(false);
  }, []);
  const scrollToY = useCallback((y) => {
    const pad = 12;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - pad), animated: true });
  }, []);
  const onBackToOwner = async () => {
    // Fetch and cache owner data before showing Owner screen.
    try {
      const data = await getOnboardingOwner();
      await setCachedOwnerOnboarding({
        name: data.name ?? null,
        ownerSelfieDocumentId: data.ownerSelfieDocumentId ?? null,
        ownerAdharDocumentId: data.ownerAdharDocumentId ?? null,
        ownerPanDocumentId: data.ownerPanDocumentId ?? null,
      });
    } catch (e) {
      // Do not block UI; rely on cache if present.
      if (__DEV__) console.warn("[onboarding] owner prefill fetch failed:", e);
    } finally {
      router.replace("/onboarding/onboardingOwnerScreen");
    }
  };
  useEffect(() => {
    // Prefill quickly from cache (do not overwrite user edits).
    void (async () => {
      const cached = await getCachedVehicleOnboarding();
      if (!cached) return;
      setVehicleNo((prev) =>
        prev.trim() ? prev : (cached.registrationNumber ?? ""),
      );
      setRcUrl((prev) =>
        prev ? prev : cached.rcDocumentUrl ? `${cached.rcDocumentUrl}` : null,
      );
      setVTypeCode((prev) => (prev ? prev : (cached.vehicleType ?? null)));
      setBodyTypeCode((prev) => (prev ? prev : (cached.bodyType ?? null)));
      // bodySpec needs full MetaOptionItem; we will apply after meta loads below.
      if (cached.bodySpec) {
        setBodySpec(
          (prev) =>
            prev ?? {
              code: cached.bodySpec,
              displayName: cached.bodySpec,
            },
        );
      }
    })();
  }, []);
  const syncVehicle = useCallback(async (force = false) => {
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
      setVehicleNo((prev) =>
        force
          ? (data.registrationNumber ?? "")
          : prev.trim()
            ? prev
            : (data.registrationNumber ?? ""),
      );
      setRcUrl((prev) =>
        force
          ? data.rcDocumentUrl
            ? `${data.rcDocumentUrl}`
            : null
          : prev
            ? prev
            : data.rcDocumentUrl
              ? `${data.rcDocumentUrl}`
              : null,
      );
      setVTypeCode((prev) =>
        force
          ? (data.vehicleType ?? null)
          : prev
            ? prev
            : (data.vehicleType ?? null),
      );
      setBodyTypeCode((prev) =>
        force ? (data.bodyType ?? null) : prev ? prev : (data.bodyType ?? null),
      );
      if (data.bodySpec) {
        setBodySpec((prev) =>
          force
            ? {
                code: data.bodySpec,
                displayName: data.bodySpec,
              }
            : (prev ?? {
                code: data.bodySpec,
                displayName: data.bodySpec,
              }),
        );
      }
    } catch (e) {
      if (__DEV__) console.warn("[onboarding] vehicle sync failed:", e);
    }
  }, []);
  useEffect(() => {
    void syncVehicle(false);
  }, [syncVehicle]);
  useFocusEffect(
    useCallback(() => {
      const force = params.refresh === "1";
      void syncVehicle(force);
    }, [params.refresh, syncVehicle]),
  );
  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const data = await getVehicleOnboardingMeta();
      setVehicleTypes(data.VEHICLE_TYPE);
      setBodyTypes(data.BODY_TYPE);
      setBodySpecs(data.BODY_SPEC);
      if (
        data.VEHICLE_TYPE.length === 0 &&
        data.BODY_TYPE.length === 0 &&
        data.BODY_SPEC.length === 0
      ) {
        setMetaError(t("onboarding.vehicle.no_options"));
      }
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t("onboarding.could_not_load_options");
      setMetaError(msg);
      setVehicleTypes([]);
      setBodyTypes([]);
      setBodySpecs([]);
    } finally {
      setMetaLoading(false);
    }
  }, [t]);
  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);
  const pickRc = async () => {
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
    setRcUrl(null);
    setRcUploading(true);
    try {
      const url = await uploadLocalImageToS3({
        localUri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `rc-${Date.now()}.jpg`,
        purpose: "onboarding_vehicle_rc",
        logContext: "onboarding/vehicle/rc",
      });
      setRcUrl(url);
      if (formError) setFormError(null);
    } catch (e) {
      setRcUrl(null);
      void e;
      setFormError(t("errors.try_again"));
    } finally {
      setRcUploading(false);
    }
  };
  const anyUploading = rcUploading;
  const metaReady =
    !metaLoading &&
    !metaError &&
    vehicleTypes.length > 0 &&
    bodyTypes.length > 0 &&
    bodySpecs.length > 0;
  const sanitizeRegNo = (raw) =>
    raw
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
  const isValidRegNo = (raw) => REG_NO_REGEX.test(raw.trim().toUpperCase());
  const validateOnContinue = () => {
    const next = {};
    if (!isValidRegNo(vehicleNo)) next.registrationNumber = true;
    if (!rcUrl) next.rcUrl = true;
    if (!vTypeCode) next.vehicleType = true;
    if (!bodyTypeCode) next.bodyType = true;
    if (!bodySpec) next.bodySpec = true;
    setInvalid(next);
    const firstInvalid = VEHICLE_SECTION_ORDER.find((k) => next[k]);
    const scrollY =
      firstInvalid !== undefined ? sectionY[firstInvalid] : undefined;
    if (scrollY !== undefined) {
      setTimeout(() => scrollToY(scrollY), 50);
    }
    const runShakes = () => {
      if (next.registrationNumber) regShake.shake();
      if (next.rcUrl) rcShake.shake();
      if (next.vehicleType) vehicleTypeShake.shake();
      if (next.bodyType) bodyTypeShake.shake();
      if (next.bodySpec) bodySpecShake.shake();
    };
    if (scrollY !== undefined) {
      setTimeout(runShakes, VEHICLE_VALIDATE_SHAKE_AFTER_SCROLL_MS);
    } else {
      runShakes();
    }
    return Object.keys(next).length === 0;
  };
  const onContinue = async () => {
    if (submitting || anyUploading || !metaReady) return;
    if (!validateOnContinue() || !bodySpec) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await postOnboardingVehicle({
        registrationNumber: vehicleNo.trim().toUpperCase(),
        rcUrl: rcUrl,
        city,
        vehicleType: vTypeCode,
        bodyType: bodyTypeCode,
        bodySpec: bodySpec.code,
      });
      router.push("/onboarding/onboardingDriverScreen");
    } catch (e) {
      void e;
      setFormError(t("errors.try_again"));
    } finally {
      setSubmitting(false);
    }
  };
  const selectedBodySpecLabel = bodySpec?.displayName ?? null;
  return (
    <View style={styles.screen}>
      <OnboardingHeader
        title={t("onboarding.vehicle.title")}
        onBack={onBackToOwner}
        onHelp={() => setFormError(t("errors.support_contact"))}
      />
      <OnboardingStepper
        steps={STEPS.map((s) => ({ ...s, label: t(s.label) }))}
        currentIndex={1}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={closeDropdowns}
      >
        {metaLoading ? (
          <View style={styles.metaLoading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.metaLoadingText}>
              {t("onboarding.vehicle.loading_vehicle_options")}
            </Text>
          </View>
        ) : null}

        {metaError ? (
          <View style={styles.metaError}>
            <Text style={styles.metaErrorText}>{metaError}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void loadMeta()}>
              <Text style={styles.retryBtnText}>{t("common.retry")}</Text>
            </Pressable>
          </View>
        ) : null}
        <FormErrorText error={formError} />

        <View onLayout={captureSectionY("registrationNumber")}>
          <FieldLabel>{t("onboarding.vehicle.vehicle_number")}</FieldLabel>
          <Animated.View style={regShake.style}>
            <TextInput
              style={[
                styles.input,
                invalid.registrationNumber && styles.inputError,
              ]}
              placeholder={t("onboarding.vehicle.vehicle_number_placeholder")}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              value={vehicleNo}
              onChangeText={(v) => {
                const next = sanitizeRegNo(v);
                setVehicleNo(next);
                if (invalid.registrationNumber)
                  setInvalid((m) => ({ ...m, registrationNumber: false }));
                if (formError) setFormError(null);
                regShake.reset();
              }}
              editable={!submitting && !metaLoading}
            />
            <FormErrorText
              error={
                invalid.registrationNumber
                  ? t("errors.invalid_vehicle_number")
                  : null
              }
            />
          </Animated.View>
        </View>

        <View onLayout={captureSectionY("rcUrl")}>
          <FieldLabel top>{t("onboarding.vehicle.vehicle_rc")}</FieldLabel>
          <Animated.View style={rcShake.style}>
            <Pressable
              style={[
                styles.uploadCard,
                rcUrl && styles.uploadDone,
                invalid.rcUrl && styles.inputError,
              ]}
              onPress={() => {
                if (invalid.rcUrl) setInvalid((m) => ({ ...m, rcUrl: false }));
                rcShake.reset();
                void pickRc();
              }}
              disabled={rcUploading || submitting || metaLoading}
            >
              {rcUploading ? (
                <>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.uploadLabel}>
                    {t("onboarding.vehicle.uploading_rc")}
                  </Text>
                </>
              ) : rcUrl ? (
                <>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.uploadLabel}>
                      {t("onboarding.vehicle.rc_uploaded")}
                    </Text>
                    <Text style={styles.rcUrl} numberOfLines={2}>
                      {rcUrl.length > 56 ? `${rcUrl.slice(0, 52)}…` : rcUrl}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setRcUrl(null);
                      rcShake.reset();
                    }}
                    hitSlop={8}
                    disabled={submitting}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.uploadLabel}>
                    {t("onboarding.vehicle.vehicle_rc")} *
                  </Text>
                  <View style={styles.uploadBtn}>
                    <Ionicons name="camera" size={18} color={Colors.link} />
                    <Text style={styles.uploadBtnText}>
                      {t("common.upload")}
                    </Text>
                  </View>
                </>
              )}
            </Pressable>
            <FormErrorText
              error={invalid.rcUrl ? t("errors.required_upload") : null}
            />
          </Animated.View>
        </View>

        <FieldLabel top>{t("onboarding.vehicle.city")}</FieldLabel>
        <View style={[styles.inputLike, styles.inputDisabled]}>
          <Text style={styles.inputText}>{city}</Text>
        </View>

        <View onLayout={captureSectionY("vehicleType")}>
          <FieldLabel top>{t("onboarding.vehicle.vehicle_type")}</FieldLabel>
          <Animated.View
            style={[
              vehicleTypeShake.style,
              invalid.vehicleType && styles.fieldGroupErrorOutline,
            ]}
          >
            <View style={styles.typeGrid}>
              {vehicleTypes.map((vt) => (
                <Pressable
                  key={vt.code}
                  style={[
                    styles.typeCard,
                    vTypeCode === vt.code && styles.typeCardActive,
                  ]}
                  onPress={() => {
                    closeDropdowns();
                    setVTypeCode(vt.code);
                    setBodyTypeCode(null);
                    setBodySpec(null);
                    if (invalid.vehicleType)
                      setInvalid((m) => ({ ...m, vehicleType: false }));
                    if (invalid.bodyType)
                      setInvalid((m) => ({ ...m, bodyType: false }));
                    vehicleTypeShake.reset();
                    bodyTypeShake.reset();
                  }}
                  disabled={submitting || metaLoading || !metaReady}
                >
                  <Text style={styles.typeEmoji}>
                    {VEHICLE_ICONS[vt.code] ?? "🚗"}
                  </Text>
                  <Text style={styles.typeLabel} numberOfLines={2}>
                    {vt.displayName}
                  </Text>
                </Pressable>
              ))}
            </View>
            <FormErrorText
              error={invalid.vehicleType ? t("errors.choose_option") : null}
            />
          </Animated.View>
        </View>

        <View onLayout={captureSectionY("bodyType")}>
          <FieldLabel top>{t("onboarding.vehicle.body_type")}</FieldLabel>
          <Animated.View
            style={[
              bodyTypeShake.style,
              invalid.bodyType && styles.fieldGroupErrorOutline,
            ]}
          >
            <View style={styles.bodyRow}>
              {bodyTypes.map((b) => (
                <Pressable
                  key={b.code}
                  style={[
                    styles.bodyCard,
                    bodyTypeCode === b.code && styles.typeCardActive,
                  ]}
                  onPress={() => {
                    closeDropdowns();
                    setBodyTypeCode(b.code);
                    setBodySpec(null);
                    if (invalid.bodyType)
                      setInvalid((m) => ({ ...m, bodyType: false }));
                    bodyTypeShake.reset();
                  }}
                  disabled={submitting || metaLoading || !metaReady}
                >
                  <Text style={styles.typeEmoji}>
                    {BODY_ICONS[b.code] ?? "📦"}
                  </Text>
                  <Text style={styles.typeLabel} numberOfLines={2}>
                    {b.displayName}
                  </Text>
                </Pressable>
              ))}
            </View>
            <FormErrorText
              error={invalid.bodyType ? t("errors.choose_option") : null}
            />
          </Animated.View>
        </View>

        <View onLayout={captureSectionY("bodySpec")}>
          <FieldLabel top>{t("onboarding.vehicle.body_details")}</FieldLabel>
          <Animated.View style={bodySpecShake.style}>
            <Pressable
              style={[styles.inputLike, invalid.bodySpec && styles.inputError]}
              onPress={() => {
                Keyboard.dismiss();
                closeDropdowns();
                setBodySpecOpen(true);
                const y = sectionY.bodySpec;
                if (y !== undefined) setTimeout(() => scrollToY(y), 50);
                if (invalid.bodySpec)
                  setInvalid((m) => ({ ...m, bodySpec: false }));
                bodySpecShake.reset();
              }}
              disabled={submitting || metaLoading || !metaReady}
            >
              <Text
                style={
                  selectedBodySpecLabel ? styles.inputText : styles.placeholder
                }
              >
                {selectedBodySpecLabel ??
                  t("onboarding.vehicle.select_capacity")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={Colors.textSecondary}
              />
            </Pressable>

            {bodySpecOpen ? (
              <View style={styles.dropdown}>
                <ScrollView
                  style={styles.dropdownScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {bodySpecs.map((item) => {
                    const active = bodySpec?.code === item.code;
                    return (
                      <Pressable
                        key={item.code}
                        style={[
                          styles.dropdownRow,
                          active && styles.dropdownRowActive,
                        ]}
                        onPress={() => {
                          setBodySpec(item);
                          setBodySpecOpen(false);
                          closeDropdowns();
                          if (invalid.bodySpec)
                            setInvalid((m) => ({ ...m, bodySpec: false }));
                          bodySpecShake.reset();
                        }}
                      >
                        <Text style={styles.dropdownText}>
                          {item.displayName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
            <FormErrorText
              error={invalid.bodySpec ? t("errors.choose_option") : null}
            />
          </Animated.View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <PrimaryButton
          title={submitting ? t("onboarding.saving") : t("common.continue")}
          disabled={!metaReady || anyUploading || submitting}
          loading={submitting}
          onPress={() => void onContinue()}
        />
      </View>
    </View>
  );
}
function FieldLabel({ children, top }) {
  return (
    <Text style={[styles.fieldLabel, top && { marginTop: Spacing.lg }]}>
      {children}
      <Text style={styles.req}>*</Text>
    </Text>
  );
}
