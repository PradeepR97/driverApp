import { MapGridBackground } from '@/components/MapGridBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import {
  postArrivedAtDrop,
  postArrivedAtPickup,
  postConfirmStartTrip,
  postEndTrip,
} from '@/lib/api/driver-orders';
import type { TripFlowPhase } from '@/lib/driver-store';
import { useDriverStore } from '@/lib/driver-store';
import { getDriverCoordsOrNull } from '@/lib/location/driver-coords';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const START_TRIP_OTP_LENGTH = 4;

function formatWait(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ActiveTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = useDriverStore((s) => s.activeTrip);
  const phase = useDriverStore((s) => s.tripPhase);
  const setPhase = useDriverStore((s) => s.setTripPhase);
  const resetTripFlow = useDriverStore((s) => s.resetTripFlow);
  const patchActiveTrip = useDriverStore((s) => s.patchActiveTrip);

  const [waitSec, setWaitSec] = useState(0);
  const [otp, setOtp] = useState(() => Array.from({ length: START_TRIP_OTP_LENGTH }, () => ''));
  const [apiBusy, setApiBusy] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (phase !== 'waiting_pickup' && phase !== 'unloading') return;
    const id = setInterval(() => setWaitSec((w) => w + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!trip) {
      router.replace('/home');
    }
  }, [trip, router]);

  if (!trip) {
    return null;
  }

  const openMaps = (address: string) => {
    const q = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`);
  };

  const confirmCancel = () => {
    Alert.alert('Cancel Trip', 'Are you sure you want to cancel this trip?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: () => {
          resetTripFlow();
          router.replace('/home');
        },
      },
    ]);
  };

  const topBanner = (): { text: string; showWait?: boolean } | null => {
    switch (phase) {
      case 'to_pickup':
        return { text: 'Head to pickup location' };
      case 'waiting_pickup':
        return { text: 'Waiting for customer...', showWait: true };
      case 'start_otp':
        return { text: 'Enter OTP to start trip', showWait: true };
      case 'to_drop':
      case 'unloading':
      case 'done':
        return null;
    }
  };

  const banner = topBanner();
  const isPickupPhase = phase === 'to_pickup' || phase === 'waiting_pickup' || phase === 'start_otp';
  const contactName = isPickupPhase ? trip.pickupContact : trip.dropContact;
  const contactRole = isPickupPhase ? trip.pickupRole : trip.dropRole;
  const address = isPickupPhase ? trip.pickupAddress : trip.dropAddress;
  const detail = isPickupPhase ? trip.pickupDetail : trip.dropDetail;

  const setDigit = (index: number, char: string) => {
    const c = char.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = c;
    setOtp(next);
    if (c && index < START_TRIP_OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const otpFilled = otp.every((d) => d.length === 1);

  const advance = (next: TripFlowPhase) => setPhase(next);

  const requireOrderId = (): number | null => {
    if (trip.orderId == null) {
      Alert.alert(
        'Missing order',
        'This trip has no order ID. Go back home and accept an order from the offer screen.',
      );
      return null;
    }
    return trip.orderId;
  };

  const requireCoords = async (): Promise<{ latitude: number; longitude: number } | null> => {
    const c = await getDriverCoordsOrNull();
    if (!c) {
      Alert.alert(
        'Location needed',
        'Turn on location and grant permission so we can confirm you are at the right place.',
      );
      return null;
    }
    return { latitude: c.lat, longitude: c.lon };
  };

  const onArrivedAtPickup = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    setApiBusy(true);
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postArrivedAtPickup(orderId, coords);
      patchActiveTrip({
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
      });
      advance('waiting_pickup');
    } catch (e) {
      Alert.alert('Arrival failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setApiBusy(false);
    }
  };

  const onConfirmStartTrip = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    const code = otp.join('');
    if (code.length !== START_TRIP_OTP_LENGTH) return;
    setApiBusy(true);
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postConfirmStartTrip(orderId, { ...coords, otp: code });
      patchActiveTrip({
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
      });
      setOtp(Array.from({ length: START_TRIP_OTP_LENGTH }, () => ''));
      advance('to_drop');
    } catch (e) {
      Alert.alert('Start trip failed', e instanceof Error ? e.message : 'Check OTP and try again.');
    } finally {
      setApiBusy(false);
    }
  };

  const onArrivedAtDrop = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    setApiBusy(true);
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postArrivedAtDrop(orderId, coords);
      patchActiveTrip({
        dropLatitude: coords.latitude,
        dropLongitude: coords.longitude,
      });
      advance('unloading');
    } catch (e) {
      Alert.alert('Arrival failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setApiBusy(false);
    }
  };

  const onEndTrip = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    setApiBusy(true);
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postEndTrip(orderId, coords);
      router.push('/collect-payment');
    } catch (e) {
      Alert.alert('End trip failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <MapGridBackground />

      <Pressable
        style={[styles.sos, { top: insets.top + Spacing.md }]}
        onPress={() => Alert.alert('Safety', 'Emergency options would open here.')}
      >
        <Ionicons name="shield" size={20} color="#fff" />
      </Pressable>

      <Pressable
        style={[styles.more, { top: insets.top + Spacing.md }]}
        onPress={() =>
          Alert.alert('Menu', undefined, [
            { text: 'Cancel Trip', style: 'destructive', onPress: confirmCancel },
            { text: 'Close', style: 'cancel' },
          ])
        }
      >
        <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
      </Pressable>

      {phase === 'to_pickup' && (
        <Pressable style={[styles.cancelPill, { top: insets.top + 56 }]} onPress={confirmCancel}>
          <Text style={styles.cancelPillText}>⚠️ Cancel Trip</Text>
        </Pressable>
      )}

      {banner && (
        <View style={[styles.floatBanner, { top: insets.top + (phase === 'to_pickup' ? 100 : 56) }]}>
          <Text style={styles.floatBannerText}>{banner.text}</Text>
          {banner.showWait ? (
            <View style={styles.waitBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.warning} />
              <Text style={styles.waitBadgeText}>Waiting time {formatWait(waitSec)}</Text>
            </View>
          ) : null}
        </View>
      )}

      {phase === 'to_drop' ? (
        <View style={[styles.greenBanner, { top: insets.top + 56 }]}>
          <Text style={styles.greenBannerText}>Trip in progress — Drop-off</Text>
        </View>
      ) : null}

      {phase === 'unloading' ? (
        <View style={[styles.greenBanner, { top: insets.top + 56 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greenBannerText}>Unloading at drop location</Text>
          </View>
          <View style={styles.waitBadgeLight}>
            <Ionicons name="time-outline" size={14} color={Colors.warning} />
            <Text style={styles.waitBadgeTextDark}>Waiting time {formatWait(waitSec)}</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={Colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{contactName}</Text>
            <Text style={styles.role}>{contactRole}</Text>
          </View>
          <Pressable style={styles.call} onPress={() => Linking.openURL('tel:+919444444444')}>
            <Ionicons name="call" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.locBox}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addr}>{address}</Text>
            <Text style={styles.addrSub}>{detail}</Text>
          </View>
        </View>

        <PrimaryButton
          title="Navigate with Google Maps"
          variant="outline"
          onPress={() => openMaps(address)}
          style={styles.navBtn}
        />

        {phase === 'to_pickup' && (
          <PrimaryButton
            title="Arrived at Pickup"
            variant="outline"
            onPress={() => void onArrivedAtPickup()}
            loading={apiBusy}
            disabled={apiBusy}
          />
        )}

        {phase === 'waiting_pickup' && (
          <Pressable
            style={[styles.startTripBar, apiBusy && styles.disabledBar]}
            disabled={apiBusy}
            onPress={() => advance('start_otp')}
          >
            <View style={styles.startTripIcon}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
            <Text style={styles.startTripText}>Start Trip</Text>
          </Pressable>
        )}

        {phase === 'start_otp' && (
          <>
            <Text style={styles.otpHint}>Ask customer for 4-digit OTP</Text>
            <View style={styles.otpRow}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => {
                    inputs.current[i] = r;
                  }}
                  style={[styles.otpBox, otpFilled && styles.otpBoxOk]}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!apiBusy}
                  value={d}
                  onChangeText={(t) => setDigit(i, t)}
                />
              ))}
            </View>
            <Text style={styles.demoOtp}>Enter the OTP the customer received after you arrived.</Text>
            <PrimaryButton
              title="Start Trip"
              onPress={() => void onConfirmStartTrip()}
              loading={apiBusy}
              disabled={!otpFilled || apiBusy}
            />
          </>
        )}

        {phase === 'to_drop' && (
          <PrimaryButton
            title="Arrived at Drop"
            variant="outline"
            onPress={() => void onArrivedAtDrop()}
            loading={apiBusy}
            disabled={apiBusy}
          />
        )}

        {phase === 'unloading' && (
          <Pressable
            style={[styles.endTripBar, apiBusy && styles.disabledBar]}
            disabled={apiBusy}
            onPress={() => void onEndTrip()}
          >
            <View style={styles.endTripIcon}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
            <Text style={styles.endTripText}>End Trip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  sos: {
    position: 'absolute',
    left: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...Shadows.floatSm,
  },
  more: {
    position: 'absolute',
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...Shadows.floatSm,
  },
  cancelPill: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 2,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.danger,
    ...Shadows.floatSm,
  },
  cancelPillText: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  floatBanner: {
    position: 'absolute',
    alignSelf: 'center',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    ...Shadows.floatMd,
  },
  floatBannerText: { flex: 1, fontWeight: '800', color: Colors.text, fontSize: 15 },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  waitBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.warning },
  greenBanner: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  greenBannerText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  waitBadgeLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  waitBadgeTextDark: { fontSize: 12, fontWeight: '700', color: Colors.text },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sheetTop,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  name: { fontSize: 18, fontWeight: '800', color: Colors.text },
  role: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  call: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  addr: { fontSize: 16, fontWeight: '800', color: Colors.text },
  addrSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  navBtn: { marginBottom: 0 },
  startTripBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.xl,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: Spacing.md,
    minHeight: 56,
  },
  startTripIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTripText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  otpHint: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md },
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    backgroundColor: Colors.surfaceElevated,
  },
  otpBoxOk: { borderColor: Colors.primary },
  startTripSolid: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  startTripSolidText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  disabledBtn: { backgroundColor: Colors.border },
  disabledText: { color: Colors.textMuted },
  demoOtp: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  disabledBar: { opacity: 0.55 },
  endTripBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FECACA',
    borderRadius: Radius.xl,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: Spacing.md,
    minHeight: 56,
  },
  endTripIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endTripText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: Colors.danger,
  },
});
