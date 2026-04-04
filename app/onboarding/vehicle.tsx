import { OnboardingHeader } from '@/components/OnboardingHeader';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { MetaOptionItem } from '@/lib/api/meta';
import { getVehicleOnboardingMeta } from '@/lib/api/meta';
import { postOnboardingVehicle } from '@/lib/api/onboarding';
import { uploadLocalImageToS3 } from '@/lib/api/upload';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = [
  { key: 'owner', label: 'Owner' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'driver', label: 'Driver' },
];

const CITIES = ['Chennai', 'Coimbatore', 'Bengaluru', 'Hyderabad', 'Mumbai'];

const VEHICLE_ICONS: Record<string, string> = {
  TRUCK: '🚛',
  MINI_TRUCK: '🚚',
  THREE_WHEELER: '🛺',
  PICKUP: '🛻',
};

const BODY_ICONS: Record<string, string> = {
  OPEN: '🛻',
  CLOSED: '📦',
  SEMI_OPEN: '🚚',
};

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicleNo, setVehicleNo] = useState('');
  const [rcUrl, setRcUrl] = useState<string | null>(null);
  const [rcUploading, setRcUploading] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [cityOpen, setCityOpen] = useState(false);

  const [vehicleTypes, setVehicleTypes] = useState<MetaOptionItem[]>([]);
  const [bodyTypes, setBodyTypes] = useState<MetaOptionItem[]>([]);
  const [bodySpecs, setBodySpecs] = useState<MetaOptionItem[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [vTypeCode, setVTypeCode] = useState<string | null>(null);
  const [bodyTypeCode, setBodyTypeCode] = useState<string | null>(null);
  const [bodySpec, setBodySpec] = useState<MetaOptionItem | null>(null);
  const [bodySpecOpen, setBodySpecOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

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
        setMetaError('No options returned from server.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load options';
      setMetaError(msg);
      setVehicleTypes([]);
      setBodyTypes([]);
      setBodySpecs([]);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const pickRc = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload RC.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (res.canceled || !res.assets[0]) return;

    const asset = res.assets[0];
    setRcUrl(null);
    setRcUploading(true);
    try {
      const url = await uploadLocalImageToS3({
        localUri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? `rc-${Date.now()}.jpg`,
        purpose: 'onboarding_vehicle_rc',
        logContext: 'onboarding/vehicle/rc',
      });
      setRcUrl(url);
    } catch (e) {
      setRcUrl(null);
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
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

  const canContinue =
    metaReady &&
    vehicleNo.trim().length > 0 &&
    !!rcUrl &&
    !!city &&
    !!vTypeCode &&
    !!bodyTypeCode &&
    !!bodySpec &&
    !anyUploading &&
    !submitting;

  const onContinue = async () => {
    if (!canContinue || !bodySpec) return;
    setSubmitting(true);
    try {
      await postOnboardingVehicle({
        registrationNumber: vehicleNo.trim().toUpperCase(),
        rcUrl: rcUrl!,
        city: city!,
        vehicleType: vTypeCode!,
        bodyType: bodyTypeCode!,
        bodySpec: bodySpec.code,
      });
      router.push('/onboarding/driver');
    } catch (e) {
      Alert.alert('Could not save vehicle', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBodySpecLabel = bodySpec?.displayName ?? null;

  return (
    <View style={styles.screen}>
      <OnboardingHeader title="Vehicle Details" onHelp={() => Alert.alert('Help', 'Contact support.')} />
      <OnboardingStepper steps={STEPS} currentIndex={1} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {metaLoading ? (
          <View style={styles.metaLoading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.metaLoadingText}>Loading vehicle options…</Text>
          </View>
        ) : null}

        {metaError ? (
          <View style={styles.metaError}>
            <Text style={styles.metaErrorText}>{metaError}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void loadMeta()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <FieldLabel>Vehicle Number</FieldLabel>
        <TextInput
          style={styles.input}
          placeholder="TN01AB1234"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          value={vehicleNo}
          onChangeText={setVehicleNo}
          editable={!submitting && !metaLoading}
        />

        <FieldLabel top>Vehicle RC</FieldLabel>
        <Pressable
          style={[styles.uploadCard, rcUrl && styles.uploadDone]}
          onPress={pickRc}
          disabled={rcUploading || submitting || metaLoading}
        >
          {rcUploading ? (
            <>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.uploadLabel}>Uploading RC…</Text>
            </>
          ) : rcUrl ? (
            <>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadLabel}>RC uploaded</Text>
                <Text style={styles.rcUrl} numberOfLines={2}>
                  {rcUrl.length > 56 ? `${rcUrl.slice(0, 52)}…` : rcUrl}
                </Text>
              </View>
              <Pressable onPress={() => setRcUrl(null)} hitSlop={8} disabled={submitting}>
                <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.uploadLabel}>Vehicle RC *</Text>
              <View style={styles.uploadBtn}>
                <Ionicons name="camera" size={18} color={Colors.primary} />
                <Text style={styles.uploadBtnText}>Upload</Text>
              </View>
            </>
          )}
        </Pressable>

        <FieldLabel top>City of Operation</FieldLabel>
        <Pressable
          style={styles.inputLike}
          onPress={() => setCityOpen(true)}
          disabled={submitting || metaLoading}
        >
          <Text style={city ? styles.inputText : styles.placeholder}>
            {city ?? 'Select your city'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </Pressable>

        <FieldLabel top>Vehicle Type</FieldLabel>
        <View style={styles.typeGrid}>
          {vehicleTypes.map((vt) => (
            <Pressable
              key={vt.code}
              style={[styles.typeCard, vTypeCode === vt.code && styles.typeCardActive]}
              onPress={() => setVTypeCode(vt.code)}
              disabled={submitting || metaLoading || !metaReady}
            >
              <Text style={styles.typeEmoji}>{VEHICLE_ICONS[vt.code] ?? '🚗'}</Text>
              <Text style={styles.typeLabel} numberOfLines={2}>
                {vt.displayName}
              </Text>
            </Pressable>
          ))}
        </View>

        <FieldLabel top>Body Type</FieldLabel>
        <View style={styles.bodyRow}>
          {bodyTypes.map((b) => (
            <Pressable
              key={b.code}
              style={[styles.bodyCard, bodyTypeCode === b.code && styles.typeCardActive]}
              onPress={() => setBodyTypeCode(b.code)}
              disabled={submitting || metaLoading || !metaReady}
            >
              <Text style={styles.typeEmoji}>{BODY_ICONS[b.code] ?? '📦'}</Text>
              <Text style={styles.typeLabel} numberOfLines={2}>
                {b.displayName}
              </Text>
            </Pressable>
          ))}
        </View>

        <FieldLabel top>Body Details</FieldLabel>
        <Pressable
          style={styles.inputLike}
          onPress={() => setBodySpecOpen(true)}
          disabled={submitting || metaLoading || !metaReady}
        >
          <Text style={selectedBodySpecLabel ? styles.inputText : styles.placeholder}>
            {selectedBodySpecLabel ?? 'Select capacity/size'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <PrimaryButton
          title={submitting ? 'Saving…' : 'Continue'}
          disabled={!canContinue}
          loading={submitting}
          onPress={() => void onContinue()}
        />
      </View>

      <Modal visible={cityOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setCityOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select city</Text>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {CITIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.modalRow, city === c && styles.modalRowActive]}
                onPress={() => {
                  setCity(c);
                  setCityOpen(false);
                }}
              >
                <Text style={styles.modalRowText}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={bodySpecOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setBodySpecOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select capacity / size</Text>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {bodySpecs.map((item) => {
              const active = bodySpec?.code === item.code;
              return (
                <Pressable
                  key={item.code}
                  style={[styles.modalRow, active && styles.modalRowActive]}
                  onPress={() => {
                    setBodySpec(item);
                    setBodySpecOpen(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{item.displayName}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FieldLabel({ children, top }: { children: ReactNode; top?: boolean }) {
  return (
    <Text style={[styles.fieldLabel, top && { marginTop: Spacing.lg }]}>
      {children}
      <Text style={styles.req}>*</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  metaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaLoadingText: { fontSize: 14, color: Colors.textSecondary },
  metaError: {
    padding: Spacing.md,
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  metaErrorText: { fontSize: 14, color: Colors.text, marginBottom: Spacing.sm },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  retryBtnText: { fontWeight: '700', color: Colors.primary },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  req: { color: Colors.danger },
  input: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    fontSize: 16,
    color: Colors.text,
  },
  inputLike: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: { fontSize: 16, color: Colors.text, flex: 1, paddingRight: Spacing.sm },
  placeholder: { fontSize: 16, color: Colors.textMuted, flex: 1 },
  uploadCard: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  uploadDone: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 },
  rcUrl: { fontSize: 11, color: Colors.primary, marginTop: 4 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uploadBtnText: { color: Colors.primary, fontWeight: '700' },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  typeCard: {
    width: '23%',
    minWidth: 76,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  typeEmoji: { fontSize: 28 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center', marginTop: 4 },
  bodyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  bodyCard: {
    minWidth: '30%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 96,
    justifyContent: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    top: '22%',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    maxHeight: '58%',
  },
  modalScroll: { maxHeight: 360 },
  modalTitle: { fontSize: 17, fontWeight: '800', marginBottom: Spacing.sm },
  modalRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalRowActive: { backgroundColor: Colors.primarySoft },
  modalRowText: { fontSize: 16, color: Colors.text },
});
