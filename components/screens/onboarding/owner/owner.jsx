import { postOnboardingOwner } from "@/api/onboarding";
import { uploadLocalImageToS3 } from "@/api/upload";
import { Colors, Spacing } from "@/config/theme";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
import {
    getCachedOwnerOnboarding,
    setCachedOwnerOnboarding,
} from "@/lib/storage/onboarding-owner-cache";
import { OnboardingHeader } from "@/shared/OnboardingHeader";
import { OnboardingStepper } from "@/shared/OnboardingStepper";
import { FormErrorText } from "@/shared/ui/FormErrorText";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./owner.styles.js";
const STEPS = [
  { key: "owner", label: "onboarding.steps.owner" },
  { key: "vehicle", label: "onboarding.steps.vehicle" },
  { key: "driver", label: "onboarding.steps.driver" },
];
const emptySlot = () => ({
  localUri: null,
  remoteUrl: null,
  uploading: false,
});
export default function OnboardingOwnerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const nameShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
  const aadhaarShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
  const panShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
  const photoShake = useShakeAnimation({ durationMs: 420, amplitude: 10 });
  const [files, setFiles] = useState({
    aadhaar: emptySlot(),
    pan: emptySlot(),
    selfie: emptySlot(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [invalid, setInvalid] = useState({});
  useEffect(() => {
    // Prefill quickly from cache (do not overwrite user-entered values).
    void (async () => {
      const cached = await getCachedOwnerOnboarding();
      if (!cached) return;
      setName((prev) => (prev.trim() ? prev : (cached.name ?? "")));
      setFiles((prev) => {
        // Mark as done in UI if backend says docs exist (IDs only).
        const next = { ...prev };
        const aadhaarRef =
          cached.ownerAdharDocumentId ?? cached.ownerAdharDocumentUrl ?? null;
        const panRef =
          cached.ownerPanDocumentId ?? cached.ownerPanDocumentUrl ?? null;
        const selfieRef =
          cached.ownerSelfieDocumentId ?? cached.ownerSelfieDocumentUrl ?? null;
        if (!next.aadhaar.remoteUrl && aadhaarRef) {
          next.aadhaar = {
            ...next.aadhaar,
            remoteUrl: `${aadhaarRef}`,
          };
        }
        if (!next.pan.remoteUrl && panRef) {
          next.pan = {
            ...next.pan,
            remoteUrl: `${panRef}`,
          };
        }
        if (!next.selfie.remoteUrl && selfieRef) {
          next.selfie = {
            ...next.selfie,
            remoteUrl: `${selfieRef}`,
          };
        }
        return next;
      });
    })();
  }, []);
  // Mandatory step: disable gesture + hardware back.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );
  const pick = async (key) => {
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
    setFiles((f) => ({
      ...f,
      [key]: { localUri: asset.uri, remoteUrl: null, uploading: true },
    }));
    try {
      const url = await uploadLocalImageToS3({
        localUri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `${key}-${Date.now()}.jpg`,
        purpose: `onboarding_owner_${key}`,
        logContext: `onboarding/owner/${key}`,
      });
      setFiles((f) => ({
        ...f,
        [key]: { localUri: asset.uri, remoteUrl: url, uploading: false },
      }));
      setInvalid((m) => (m[key] ? { ...m, [key]: false } : m));
      if (key === "aadhaar") aadhaarShake.reset();
      if (key === "pan") panShake.reset();
      if (key === "selfie") photoShake.reset();
      if (formError) setFormError(null);
    } catch (e) {
      setFiles((f) => ({
        ...f,
        [key]: emptySlot(),
      }));
      console.error(`[owner upload] ${key} failed`, e);
      setFormError(t("errors.try_again"));
    }
  };
  const clearFile = (key) => {
    setFiles((f) => ({ ...f, [key]: emptySlot() }));
    setInvalid((m) => (m[key] ? { ...m, [key]: false } : m));
    if (key === "aadhaar") aadhaarShake.reset();
    if (key === "pan") panShake.reset();
    if (key === "selfie") photoShake.reset();
  };
  const anyUploading =
    files.aadhaar.uploading || files.pan.uploading || files.selfie.uploading;
  const sanitizeName = (raw) => {
    // Allow only alphabets and spaces; trim edges.
    const only = raw.replace(/[^A-Za-z ]+/g, "").replace(/\s+/g, " ");
    const trimmed = only.trimStart(); // keep cursor behavior smoother while typing
    // Optional: capitalize first letter
    return trimmed.length
      ? trimmed[0].toUpperCase() + trimmed.slice(1)
      : trimmed;
  };
  const isValidName = (v) =>
    v.trim().length > 0 && /^[A-Za-z ]+$/.test(v.trim());
  const validateOnContinue = () => {
    const next = {};
    if (!isValidName(name)) next.name = true;
    if (!files.aadhaar.remoteUrl) next.aadhaar = true;
    if (!files.pan.remoteUrl) next.pan = true;
    if (!files.selfie.remoteUrl) next.selfie = true;
    setInvalid(next);
    if (next.name) nameShake.shake();
    if (next.aadhaar) aadhaarShake.shake();
    if (next.pan) panShake.shake();
    if (next.selfie) photoShake.shake();
    return Object.keys(next).length === 0;
  };
  const onContinue = async () => {
    if (submitting) return;
    if (anyUploading) return;
    if (!validateOnContinue()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await postOnboardingOwner({
        name: name.trim(),
        ownerAdharUrl: files.aadhaar.remoteUrl,
        ownerPanUrl: files.pan.remoteUrl,
        ownerSelfieUrl: files.selfie.remoteUrl,
      });
      // Ensure Driver screen can autofill owner name immediately.
      await setCachedOwnerOnboarding({ name: name.trim() });
      router.push("/onboarding/onboardingVehicleScreen");
    } catch (e) {
      void e;
      setFormError(t("errors.try_again"));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <OnboardingHeader
        title={t("onboarding.owner.title")}
        showBack={false}
        onHelp={() => setFormError(t("errors.support_contact"))}
      />
      <OnboardingStepper
        steps={STEPS.map((s) => ({ ...s, label: t(s.label) }))}
        currentIndex={0}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormErrorText error={formError} />
        <Animated.View style={nameShake.style}>
          <Text style={styles.fieldLabel}>
            {t("onboarding.owner.name_label")} <Text style={styles.req}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, invalid.name && styles.inputError]}
            placeholder={t("onboarding.owner.name_placeholder")}
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={(v) => {
              const next = sanitizeName(v);
              setName(next);
              if (invalid.name) setInvalid((m) => ({ ...m, name: false }));
              if (formError) setFormError(null);
              nameShake.reset();
            }}
            editable={!submitting}
          />
          <FormErrorText
            error={invalid.name ? t("errors.invalid_name") : null}
          />
        </Animated.View>

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
          {t("onboarding.owner.upload_following")}{" "}
          <Text style={styles.req}>*</Text>
        </Text>

        <Animated.View style={aadhaarShake.style}>
          <UploadRow
            label={t("onboarding.owner.aadhaar")}
            required
            slot={files.aadhaar}
            invalid={!!invalid.aadhaar}
            onUpload={() => pick("aadhaar")}
            onClear={() => clearFile("aadhaar")}
            disabled={submitting}
          />
          <FormErrorText
            error={invalid.aadhaar ? t("errors.required_upload") : null}
          />
        </Animated.View>
        <Animated.View style={panShake.style}>
          <UploadRow
            label={t("onboarding.owner.pan")}
            required
            slot={files.pan}
            invalid={!!invalid.pan}
            onUpload={() => pick("pan")}
            onClear={() => clearFile("pan")}
            disabled={submitting}
          />
          <FormErrorText
            error={invalid.pan ? t("errors.required_upload") : null}
          />
        </Animated.View>
        <Animated.View style={photoShake.style}>
          <UploadRow
            label={t("onboarding.owner.selfie")}
            required
            slot={files.selfie}
            invalid={!!invalid.selfie}
            onUpload={() => pick("selfie")}
            onClear={() => clearFile("selfie")}
            disabled={submitting}
          />
          <FormErrorText
            error={invalid.selfie ? t("errors.required_upload") : null}
          />
        </Animated.View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <PrimaryButton
          title={submitting ? t("onboarding.saving") : t("common.continue")}
          loading={submitting}
          onPress={() => void onContinue()}
        />
      </View>
    </View>
  );
}
function UploadRow({
  label,
  required,
  slot,
  invalid,
  onUpload,
  onClear,
  disabled,
}) {
  const done = !!slot.remoteUrl;
  const sub = slot.remoteUrl
    ? slot.remoteUrl.length > 48
      ? `${slot.remoteUrl.slice(0, 44)}…`
      : slot.remoteUrl
    : slot.localUri
      ? "Uploading…"
      : null;
  return (
    <View
      style={[
        styles.uploadCard,
        done && styles.uploadDone,
        invalid && styles.uploadError,
      ]}
    >
      {slot.uploading ? (
        <>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.uploadTitle}>
            {label} {required ? <Text style={styles.req}>*</Text> : null}
          </Text>
          <Text style={styles.fileName}>Uploading to storage…</Text>
        </>
      ) : done ? (
        <>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadTitle}>
              {label} {required ? <Text style={styles.req}>*</Text> : null}
            </Text>
            <Text style={styles.fileName} numberOfLines={2}>
              {sub}
            </Text>
          </View>
          <Pressable onPress={onClear} hitSlop={8} disabled={disabled}>
            <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.uploadTitle}>
            {label} {required ? <Text style={styles.req}>*</Text> : null}
          </Text>
          <Pressable
            style={styles.uploadBtn}
            onPress={onUpload}
            disabled={disabled}
          >
            <Ionicons name="camera" size={18} color={Colors.link} />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
