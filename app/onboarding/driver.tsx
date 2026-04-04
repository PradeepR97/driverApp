import { OnboardingHeader } from '@/components/OnboardingHeader';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { postOnboardingDriver } from '@/lib/api/onboarding';
import { uploadLocalImageToS3 } from '@/lib/api/upload';
import { normalizePhoneDigits } from '@/lib/api/auth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function DriverDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selfDrive, setSelfDrive] = useState<boolean | null>(null);
  const [driverName, setDriverName] = useState('');
  const [phone, setPhone] = useState('');
  const [dlUrl, setDlUrl] = useState<string | null>(null);
  const [dlUploading, setDlUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickDl = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload license.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (res.canceled || !res.assets[0]) return;

    const asset = res.assets[0];
    setDlUrl(null);
    setDlUploading(true);
    try {
      const url = await uploadLocalImageToS3({
        localUri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? `dl-${Date.now()}.jpg`,
        purpose: 'onboarding_driver_license',
        logContext: 'onboarding/driver/license',
      });
      setDlUrl(url);
    } catch (e) {
      setDlUrl(null);
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setDlUploading(false);
    }
  };

  const phone10 = normalizePhoneDigits(phone);
  const canSubmit =
    selfDrive !== null &&
    driverName.trim().length > 0 &&
    phone10.length === 10 &&
    !!dlUrl &&
    !dlUploading &&
    !submitting;

  const onSubmit = async () => {
    if (!canSubmit || selfDrive === null) return;
    setSubmitting(true);
    try {
      await postOnboardingDriver({
        isSelfDriving: selfDrive,
        driverName: driverName.trim(),
        driverPhone: phone10,
        driverLicenseUrl: dlUrl!,
      });
      router.replace('/verification-pending');
    } catch (e) {
      Alert.alert('Could not submit', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OnboardingHeader title="Driver Details" onHelp={() => Alert.alert('Help', 'Contact support.')} />
      <OnboardingStepper steps={STEPS} currentIndex={2} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLabel}>
          I will be driving this vehicle <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleCard, selfDrive === true && styles.toggleActive]}
            onPress={() => setSelfDrive(true)}
            disabled={submitting}
          >
            <View style={[styles.radio, selfDrive === true && styles.radioOn]} />
            <Text style={styles.toggleText}>Yes</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleCard, selfDrive === false && styles.toggleActive]}
            onPress={() => setSelfDrive(false)}
            disabled={submitting}
          >
            <View style={[styles.radio, selfDrive === false && styles.radioOnInner]} />
            <Text style={styles.toggleText}>No</Text>
          </Pressable>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
          Driver Name <Text style={styles.req}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={driverName}
          onChangeText={setDriverName}
          placeholder="Driver name"
          placeholderTextColor={Colors.textMuted}
          editable={!submitting}
        />

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
          Driver Phone Number <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.phoneRow}>
          <View style={styles.cc}>
            <Text style={styles.ccText}>IN +91</Text>
          </View>
          <TextInput
            style={[styles.input, { flex: 1, marginTop: 0 }]}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile"
            placeholderTextColor={Colors.textMuted}
            maxLength={15}
            editable={!submitting}
          />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Driving License *</Text>
        {dlUploading ? (
          <View style={[styles.dlCard, styles.dlDone]}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.dlTitle}>Uploading license…</Text>
          </View>
        ) : dlUrl ? (
          <View style={[styles.dlCard, styles.dlDone]}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dlTitle}>Driving License</Text>
              <Text style={styles.dlFile} numberOfLines={2}>
                {dlUrl.length > 56 ? `${dlUrl.slice(0, 52)}…` : dlUrl}
              </Text>
            </View>
            <Pressable onPress={() => setDlUrl(null)} hitSlop={8} disabled={submitting}>
              <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.dlCard} onPress={pickDl} disabled={submitting}>
            <Text style={styles.dlTitle}>Driving License *</Text>
            <View style={styles.uploadBtn}>
              <Ionicons name="camera" size={18} color={Colors.primary} />
              <Text style={styles.uploadBtnText}>Upload</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.note}>
          <Text style={styles.noteIcon}>💡</Text>
          <Text style={styles.noteText}>
            <Text style={{ fontWeight: '700' }}>Note:</Text> The driver will receive trip notifications and OTPs on
            their phone number.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <PrimaryButton
          title={submitting ? 'Submitting…' : 'Submit for Verification'}
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
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  req: { color: Colors.danger },
  toggleRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  toggleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  radioOnInner: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  toggleText: { fontSize: 16, fontWeight: '600', color: Colors.text },
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
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cc: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    minHeight: 50,
  },
  ccText: { fontWeight: '600', color: Colors.text },
  dlCard: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dlDone: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  dlFile: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uploadBtnText: { color: Colors.primary, fontWeight: '700' },
  note: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  noteIcon: { fontSize: 18 },
  noteText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
