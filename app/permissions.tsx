import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import {
  getNotificationPermissionStateIfAvailable,
  requestNotificationPermissionStateIfAvailable,
} from '@/lib/request-notification-permission';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type PermissionState = 'granted' | 'denied' | 'blocked' | 'unavailable';
type PermissionKey = 'location' | 'notifications' | 'camera';
type PermissionMap = Record<PermissionKey, PermissionState>;

const PERMISSION_ORDER: PermissionKey[] = ['location', 'notifications', 'camera'];

const INITIAL_PERMISSION_STATE: PermissionMap = {
  location: 'denied',
  notifications: 'denied',
  camera: 'denied',
};

function mapState(status?: string, canAskAgain?: boolean): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return canAskAgain === false ? 'blocked' : 'denied';
  return 'denied';
}

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [statusMap, setStatusMap] = useState<PermissionMap>(
    INITIAL_PERMISSION_STATE,
  );
  const { t } = useTranslation();

  const logStatus = (context: string, next: PermissionMap) => {
    console.info('[permissions]', context, next);
  };

  const refreshStatuses = useCallback(async () => {
    try {
      const [loc, cam, notifications] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        ImagePicker.getCameraPermissionsAsync(),
        getNotificationPermissionStateIfAvailable(),
      ]);
      const next: PermissionMap = {
        location: mapState(loc.status, loc.canAskAgain),
        camera: mapState(cam.status, cam.canAskAgain),
        notifications,
      };
      setStatusMap(next);
      logStatus('refresh', next);
    } catch (error) {
      console.warn('[permissions] refresh failed', error);
    }
  }, []);

  useEffect(() => {
    void refreshStatuses();
  }, [refreshStatuses]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshStatuses();
      }
    });
    return () => sub.remove();
  }, [refreshStatuses]);

  const grant = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const next = { ...statusMap };

      if (next.location !== 'granted' && next.location !== 'blocked') {
        const loc = await Location.requestForegroundPermissionsAsync();
        next.location = mapState(loc.status, loc.canAskAgain);
      }

      if (next.notifications !== 'granted' && next.notifications !== 'blocked') {
        next.notifications = await requestNotificationPermissionStateIfAvailable();
      }

      if (next.camera !== 'granted' && next.camera !== 'blocked') {
        const cam = await ImagePicker.requestCameraPermissionsAsync();
        next.camera = mapState(cam.status, cam.canAskAgain);
      }

      setStatusMap(next);
      logStatus('request', next);

      const allGranted = PERMISSION_ORDER.every((key) => next[key] === 'granted');
      if (allGranted) {
        router.replace('/home');
      }
    } catch (error) {
      console.warn('[permissions] request flow failed', error);
      await refreshStatuses();
    } finally {
      setLoading(false);
    }
  };

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.warn('[permissions] open settings failed', error);
    }
  };

  const hasBlocked = PERMISSION_ORDER.some((key) => statusMap[key] === 'blocked');
  const allGranted = PERMISSION_ORDER.every((key) => statusMap[key] === 'granted');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.xl }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.lockWrap}>
          <Text style={styles.lockEmoji}>🔐</Text>
        </View>
        <Text style={styles.title}>{t('permissions.title')}</Text>
        <Text style={styles.subtitle}>{t('permissions.subtitle')}</Text>

        <PermissionCard
          icon={<Ionicons name="location-outline" size={22} color={Colors.primaryDark} />}
          iconBg={Colors.primarySoft}
          title={t('permissions.location_title')}
          description={t('permissions.location_desc')}
          state={statusMap.location}
        />
        <PermissionCard
          icon={<Ionicons name="notifications-outline" size={22} color={Colors.orange} />}
          iconBg="#FFEDD5"
          title={t('permissions.notifications_title')}
          description={t('permissions.notifications_desc')}
          state={statusMap.notifications}
        />
        <PermissionCard
          icon={<Ionicons name="camera-outline" size={22} color="#2563EB" />}
          iconBg="#DBEAFE"
          title={t('permissions.camera_title')}
          description={t('permissions.camera_desc')}
          state={statusMap.camera}
        />

        <Text style={styles.footerNote}>
          {t('permissions.footer_note')}
        </Text>
        {hasBlocked ? (
          <Text style={styles.settingsHint}>
            Enable blocked permissions from your device settings.
          </Text>
        ) : null}
        <Text style={styles.platformNote}>
          {Platform.OS === 'ios'
            ? 'iOS permissions are managed per-app in Settings.'
            : 'Android permission behavior may vary by OS version.'}
        </Text>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton
          title={allGranted ? 'All permissions granted' : t('permissions.grant')}
          loading={loading}
          disabled={allGranted}
          onPress={grant}
        />
        {hasBlocked ? (
          <PrimaryButton
            title="Open Settings"
            variant="outline"
            style={styles.secondaryBtn}
            onPress={() => void openAppSettings()}
          />
        ) : null}
        <PrimaryButton
          title="Continue"
          variant="outline"
          style={styles.secondaryBtn}
          onPress={() => router.replace('/home')}
        />
      </View>
    </View>
  );
}

function PermissionCard({
  icon,
  iconBg,
  title,
  description,
  state,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  state: PermissionState;
}) {
  const statusConfig =
    state === 'granted'
      ? { icon: 'checkmark-circle', color: Colors.primary, label: 'Granted' }
      : state === 'blocked'
        ? { icon: 'alert-circle', color: Colors.danger, label: "Blocked" }
        : state === 'unavailable'
          ? { icon: 'remove-circle', color: Colors.textMuted, label: 'Unavailable' }
          : { icon: 'close-circle', color: Colors.warning, label: 'Denied' };
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <View style={styles.statusWrap}>
        <Ionicons name={statusConfig.icon as never} size={18} color={statusConfig.color} />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
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
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.floatSm,
  },
  lockEmoji: { fontSize: 32 },
  title: { ...Type.h1, fontSize: 24, textAlign: 'center' },
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
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  settingsHint: {
    marginTop: Spacing.sm,
    color: Colors.danger,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  platformNote: {
    marginTop: Spacing.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
  },
  statusWrap: {
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottom: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  secondaryBtn: {
    backgroundColor: Colors.surfaceElevated,
  },
});
