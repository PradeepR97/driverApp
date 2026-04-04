import { OnboardingHeader } from '@/components/OnboardingHeader';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { postOnboardingOwner } from '@/lib/api/onboarding';
import { uploadLocalImageToS3 } from '@/lib/api/upload';
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

type UploadKey = 'aadhaar' | 'pan' | 'selfie';

type Slot = { localUri: string | null; remoteUrl: string | null; uploading: boolean };

const STEPS = [
  { key: 'owner', label: 'Owner' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'driver', label: 'Driver' },
];

const emptySlot = (): Slot => ({ localUri: null, remoteUrl: null, uploading: false });

export default function OwnerDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<Record<UploadKey, Slot>>({
    aadhaar: emptySlot(),
    pan: emptySlot(),
    selfie: emptySlot(),
  });
  const [submitting, setSubmitting] = useState(false);

  const pick = async (key: UploadKey) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload documents.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? `${key}-${Date.now()}.jpg`,
        purpose: `onboarding_owner_${key}`,
        logContext: `onboarding/owner/${key}`,
      });
      setFiles((f) => ({
        ...f,
        [key]: { localUri: asset.uri, remoteUrl: url, uploading: false },
      }));
    } catch (e) {
      setFiles((f) => ({
        ...f,
        [key]: emptySlot(),
      }));
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const clearFile = (key: UploadKey) => setFiles((f) => ({ ...f, [key]: emptySlot() }));

  const anyUploading = files.aadhaar.uploading || files.pan.uploading || files.selfie.uploading;
  const allUrls =
    !!files.aadhaar.remoteUrl && !!files.pan.remoteUrl && !!files.selfie.remoteUrl;
  const canContinue = name.trim().length > 0 && allUrls && !anyUploading && !submitting;

  const onContinue = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    try {
      await postOnboardingOwner({
        name: name.trim(),
        ownerAdharUrl: files.aadhaar.remoteUrl!,
        ownerPanUrl: files.pan.remoteUrl!,
        ownerSelfieUrl: files.selfie.remoteUrl!,
      });
      router.push('/onboarding/vehicle');
    } catch (e) {
      Alert.alert('Could not save owner details', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OnboardingHeader title="Owner Details" onHelp={() => Alert.alert('Help', 'Contact support for assistance.')} />
      <OnboardingStepper steps={STEPS} currentIndex={0} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.fieldLabel}>
          Name <Text style={styles.req}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          editable={!submitting}
        />

        <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>
          Upload the following <Text style={styles.req}>*</Text>
        </Text>

        <UploadRow
          label="Owner Aadhaar Card *"
          slot={files.aadhaar}
          onUpload={() => pick('aadhaar')}
          onClear={() => clearFile('aadhaar')}
          disabled={submitting}
        />
        <UploadRow
          label="Owner PAN Card *"
          slot={files.pan}
          onUpload={() => pick('pan')}
          onClear={() => clearFile('pan')}
          disabled={submitting}
        />
        <UploadRow
          label="Owner Selfie *"
          slot={files.selfie}
          onUpload={() => pick('selfie')}
          onClear={() => clearFile('selfie')}
          disabled={submitting}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <PrimaryButton
          title={submitting ? 'Saving…' : 'Continue'}
          disabled={!canContinue}
          loading={submitting}
          onPress={() => void onContinue()}
        />
      </View>
    </View>
  );
}

function UploadRow({
  label,
  slot,
  onUpload,
  onClear,
  disabled,
}: {
  label: string;
  slot: Slot;
  onUpload: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const done = !!slot.remoteUrl;
  const sub = slot.remoteUrl
    ? slot.remoteUrl.length > 48
      ? `${slot.remoteUrl.slice(0, 44)}…`
      : slot.remoteUrl
    : slot.localUri
      ? 'Uploading…'
      : null;

  return (
    <View style={[styles.uploadCard, done && styles.uploadDone]}>
      {slot.uploading ? (
        <>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.uploadTitle}>{label.replace(' *', '')}</Text>
          <Text style={styles.fileName}>Uploading to storage…</Text>
        </>
      ) : done ? (
        <>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadTitle}>{label.replace(' *', '')}</Text>
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
          <Text style={styles.uploadTitle}>{label}</Text>
          <Pressable style={styles.uploadBtn} onPress={onUpload} disabled={disabled}>
            <Ionicons name="camera" size={18} color={Colors.link} />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  req: { color: Colors.danger },
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
  uploadCard: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  uploadDone: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  fileName: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uploadBtnText: { color: Colors.link, fontWeight: '700' },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
