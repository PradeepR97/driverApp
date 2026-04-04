import { MapGridBackground } from '@/components/MapGridBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { postAcceptDriverOrder, postDeclineDriverOrder } from '@/lib/api/driver-orders';
import { mockTripFromNewOrder, useDriverStore } from '@/lib/driver-store';
import { useDriverOnlineWebSocket } from '@/lib/hooks/useDriverOnlineWebSocket';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    isOnline,
    setOnline,
    activeTrip,
    todayEarnings,
    todayTrips,
    hoursOnline,
    distanceKm,
    setActiveTrip,
    setTripPhase,
    driverSocketStatus,
    pendingNewOrder,
    setPendingNewOrder,
  } = useDriverStore(
    useShallow((s) => ({
      isOnline: s.isOnline,
      setOnline: s.setOnline,
      activeTrip: s.activeTrip,
      todayEarnings: s.todayEarnings,
      todayTrips: s.todayTrips,
      hoursOnline: s.hoursOnline,
      distanceKm: s.distanceKm,
      setActiveTrip: s.setActiveTrip,
      setTripPhase: s.setTripPhase,
      driverSocketStatus: s.driverSocketStatus,
      pendingNewOrder: s.pendingNewOrder,
      setPendingNewOrder: s.setPendingNewOrder,
    })),
  );

  useDriverOnlineWebSocket(isOnline);

  const [searching, setSearching] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerSeconds, setOfferSeconds] = useState(30);
  const [offerBusy, setOfferBusy] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!searching) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [searching, pulse]);

  useEffect(() => {
    if (pendingNewOrder && isOnline && !activeTrip) {
      setShowOffer(true);
      setOfferSeconds(30);
      setSearching(false);
    }
  }, [pendingNewOrder, isOnline, activeTrip]);

  useEffect(() => {
    if (!isOnline || activeTrip) {
      setSearching(false);
      setShowOffer(false);
      return;
    }
    if (showOffer || pendingNewOrder) {
      return;
    }
    let cancelled = false;
    const t1 = setTimeout(() => {
      if (!cancelled) setSearching(true);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t1);
    };
  }, [isOnline, activeTrip, showOffer, pendingNewOrder]);

  useEffect(() => {
    if (!showOffer) return;
    let seconds = 30;
    setOfferSeconds(seconds);
    const id = setInterval(() => {
      seconds -= 1;
      setOfferSeconds(seconds);
      if (seconds <= 0) {
        clearInterval(id);
        const pending = useDriverStore.getState().pendingNewOrder;
        setShowOffer(false);
        setSearching(true);
        if (pending) {
          void postDeclineDriverOrder(pending.orderId)
            .catch(() => {})
            .finally(() => {
              useDriverStore.getState().setPendingNewOrder(null);
            });
        } else {
          useDriverStore.getState().setPendingNewOrder(null);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [showOffer]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  const goOnline = () => {
    setOnline(true);
    setSearching(false);
    setShowOffer(false);
  };

  const goOffline = () => {
    setOnline(false);
    setSearching(false);
    setShowOffer(false);
    setPendingNewOrder(null);
  };

  const accept = async () => {
    if (!pendingNewOrder || offerBusy) return;
    setOfferBusy(true);
    try {
      await postAcceptDriverOrder(pendingNewOrder.orderId);
      setActiveTrip(mockTripFromNewOrder(pendingNewOrder));
      setTripPhase('to_pickup');
      setPendingNewOrder(null);
      setShowOffer(false);
      setSearching(false);
      router.push('/active-trip');
    } catch (e) {
      Alert.alert('Could not accept', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setOfferBusy(false);
    }
  };

  const decline = async () => {
    if (!pendingNewOrder || offerBusy) return;
    setOfferBusy(true);
    try {
      await postDeclineDriverOrder(pendingNewOrder.orderId);
    } catch (e) {
      Alert.alert('Could not decline', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setPendingNewOrder(null);
      setShowOffer(false);
      setSearching(true);
      setOfferBusy(false);
    }
  };

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.screen}>
      <MapGridBackground showChevron={false} showCenterPulse={!isOnline} />

      <Pressable
        style={[styles.menuBtn, { top: insets.top + Spacing.md }]}
        onPress={openDrawer}
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu" size={22} color={Colors.text} />
      </Pressable>

      {!isOnline ? (
        <View style={[styles.summaryWrap, { top: insets.top + 88 }]}>
          <Text style={styles.summaryTitle}>Today&apos;s Summary</Text>
          <View style={styles.grid}>
            <SummaryTile icon="₹" label="Earnings" value={`₹${todayEarnings.toLocaleString('en-IN')}`} highlight />
            <SummaryTile icon="car-outline" label="Trips" value={String(todayTrips)} ion />
            <SummaryTile icon="time-outline" label="Hours Online" value={hoursOnline} ion />
            <SummaryTile icon="navigate-outline" label="Distance" value={distanceKm} ion />
          </View>
        </View>
      ) : (
        <View style={[styles.compactCard, { top: insets.top + 88 }]}>
          <View style={styles.compactLeft}>
            <View style={styles.miniIcon}>
              <Text style={styles.rupee}>₹</Text>
            </View>
            <View>
              <Text style={styles.compactLabel}>Today</Text>
              <Text style={styles.compactValue}>₹{todayEarnings.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <View style={styles.compactRight}>
            <View style={styles.miniIcon}>
              <Ionicons name="car-outline" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.compactLabel}>Trips</Text>
              <Text style={styles.compactValue}>{todayTrips}</Text>
            </View>
          </View>
        </View>
      )}

      {isOnline && searching && !showOffer && (
        <View style={styles.radarWrap}>
          <Animated.View style={[styles.radarRing, { transform: [{ scale }], opacity }]} />
          <Animated.View
            style={[styles.radarRing, styles.radarRing2, { transform: [{ scale }], opacity }]}
          />
          <View style={styles.radarCore}>
            <View style={styles.radarDot} />
          </View>
          <Text style={styles.searchingText}>Searching for orders...</Text>
        </View>
      )}

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {!isOnline ? (
          <>
            <Text style={styles.offlineLabel}>You are Offline</Text>
            <Pressable style={styles.goOnline} onPress={goOnline}>
              <View style={styles.goOnlineIcon}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
              <Text style={styles.goOnlineText}>Go online</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.onlineLabelRow}>
              <Text style={styles.onlineLabel}>You are Online</Text>
              {driverSocketStatus === 'connected' ? (
                <Text style={styles.socketLive}>● Live</Text>
              ) : driverSocketStatus === 'connecting' || driverSocketStatus === 'reconnecting' ? (
                <Text style={styles.socketPending}>Connecting…</Text>
              ) : driverSocketStatus === 'error' ? (
                <Text style={styles.socketError}>Connection issue</Text>
              ) : null}
            </View>
            <Pressable style={styles.goOffline} onPress={goOffline}>
              <View style={styles.goOfflineIcon}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
              <Text style={styles.goOfflineText}>Go offline</Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal visible={showOffer && !!pendingNewOrder} transparent animationType="slide">
        <View style={styles.offerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => void decline()} disabled={offerBusy} />
          <View style={styles.offerSheet}>
            <View style={styles.offerHeader}>
              <Text style={styles.offerTitle}>New Order!</Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{offerSeconds}s</Text>
              </View>
            </View>
            {pendingNewOrder?.helperRequired ? (
              <View style={styles.warnBanner}>
                <Ionicons name="warning" size={18} color={Colors.warning} />
                <Text style={styles.warnText}>Helper required — loading assistance</Text>
              </View>
            ) : null}
            <View style={styles.route}>
              <View style={styles.routeRow}>
                <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routePlace}>{pendingNewOrder?.pickup ?? '—'}</Text>
                </View>
              </View>
              <View style={styles.dotted} />
              <View style={styles.routeRow}>
                <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>DROP</Text>
                  <Text style={styles.routePlace}>{pendingNewOrder?.drop ?? '—'}</Text>
                  <Text style={styles.routeMeta}>
                    ~{pendingNewOrder?.distanceKm?.toFixed(1) ?? '—'} km trip
                  </Text>
                </View>
              </View>
            </View>
            {pendingNewOrder?.customerName ? (
              <Text style={styles.customerName}>Customer: {pendingNewOrder.customerName}</Text>
            ) : null}
            <View style={styles.fareBar}>
              <Text style={styles.fareLabel}>Estimated fare</Text>
              <Text style={styles.fareAmt}>
                ₹{pendingNewOrder ? Math.round(pendingNewOrder.estimatedFare).toLocaleString('en-IN') : '—'}
              </Text>
            </View>
            <View style={styles.offerActions}>
              <PrimaryButton
                title="Decline"
                variant="outline"
                onPress={() => void decline()}
                style={{ flex: 1 }}
                disabled={offerBusy}
              />
              <PrimaryButton
                title="Accept"
                onPress={() => void accept()}
                style={{ flex: 1 }}
                loading={offerBusy}
                disabled={offerBusy}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  highlight,
  ion,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  ion?: boolean;
}) {
  return (
    <View style={[styles.tile, highlight && styles.tileHighlight]}>
      {ion ? (
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={Colors.textSecondary} />
      ) : (
        <Text style={styles.tileRupee}>{icon}</Text>
      )}
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  menuBtn: {
    position: 'absolute',
    left: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 2,
  },
  summaryWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 1,
  },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  tileHighlight: { backgroundColor: Colors.primarySoft },
  tileRupee: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  tileLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  tileValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 2 },
  compactCard: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 1,
  },
  compactLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  compactRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  miniIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupee: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  compactLabel: { fontSize: 12, color: Colors.textSecondary },
  compactValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  radarWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  radarRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  radarRing2: { width: 220, height: 220, borderRadius: 110 },
  radarCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  searchingText: { marginTop: Spacing.lg, fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  bottom: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: 0,
    alignItems: 'center',
  },
  offlineLabel: { fontSize: 16, color: Colors.textSecondary, marginBottom: Spacing.md },
  goOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.xl,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: Spacing.md,
    minHeight: 56,
  },
  goOnlineIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goOnlineText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  onlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  onlineLabel: { fontSize: 16, color: Colors.primary, fontWeight: '700' },
  socketLive: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  socketPending: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  socketError: { fontSize: 13, fontWeight: '600', color: Colors.danger },
  goOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.xl,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: Spacing.md,
    minHeight: 56,
  },
  goOfflineIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goOfflineText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: Colors.danger,
  },
  offerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  offerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  timerBadge: {
    backgroundColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  timerText: { fontWeight: '800', color: Colors.danger },
  warnBanner: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  warnText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  customerName: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  route: { marginTop: Spacing.lg },
  routeRow: { flexDirection: 'row', gap: Spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  dotted: {
    width: 2,
    height: 20,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  routeLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700' },
  routePlace: { fontSize: 16, fontWeight: '800', color: Colors.text },
  routeMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  fareBar: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: { fontSize: 14, color: Colors.textSecondary },
  fareAmt: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  offerActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
});
