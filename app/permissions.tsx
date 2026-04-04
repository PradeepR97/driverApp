import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { requestNotificationPermissionIfAvailable } from '@/lib/request-notification-permission';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const grant = async () => {
    setLoading(true);
    try {
      await Location.requestForegroundPermissionsAsync();
      await requestNotificationPermissionIfAvailable();
      await ImagePicker.requestCameraPermissionsAsync();
      router.replace('/home');
    } catch {
      Alert.alert('Permissions', 'Some permissions were not granted. You can enable them in Settings.');
      router.replace('/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.xl }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.lockWrap}>
          <Text style={styles.lockEmoji}>🔐</Text>
        </View>
        <Text style={styles.title}>App Permissions</Text>
        <Text style={styles.subtitle}>We need a few permissions to provide you with the best experience</Text>

        <PermissionCard
          icon={<Ionicons name="location" size={22} color={Colors.primary} />}
          iconBg={Colors.primarySoft}
          title="Location Access"
          description="Required for live tracking and navigation to pickup/drop locations"
        />
        <PermissionCard
          icon={<Ionicons name="notifications" size={22} color={Colors.orange} />}
          iconBg="#FFEDD5"
          title="Push Notifications"
          description="Get instant alerts for new orders and important updates"
        />
        <PermissionCard
          icon={<Ionicons name="camera" size={22} color="#2563EB" />}
          iconBg="#DBEAFE"
          title="Camera Access"
          description="Scan documents and capture proof of delivery"
        />

        <Text style={styles.footerNote}>
          You can change these permissions anytime from your device settings
        </Text>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title="Grant Permissions" loading={loading} onPress={grant} />
      </View>
    </View>
  );
}

function PermissionCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconSquare, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  lockWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  lockEmoji: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardDesc: { marginTop: 4, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  footerNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  bottom: { paddingHorizontal: Spacing.lg },
});
