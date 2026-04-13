import { MapGridBackground } from "@/components/MapGridBackground";
import { FormErrorText } from "@/components/ui/FormErrorText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SwipeButton } from "@/components/ui/SwipeButton";
import { AnimDuration } from "@/constants/animations";
import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { getDriverHomeSummary } from "@/lib/api/driver-home";
import {
    postAcceptDriverOrder,
    postDeclineDriverOrder,
} from "@/lib/api/driver-orders";
import { mockTripFromNewOrder, useDriverStore } from "@/lib/driver-store";
import { useDriverOnlineWebSocket } from "@/lib/hooks/useDriverOnlineWebSocket";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
import { Ionicons } from "@expo/vector-icons";
import {
    DrawerActions,
    useFocusEffect,
    useNavigation,
} from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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
    setTripStatus,
    driverSocketStatus,
    pendingNewOrder,
    setPendingNewOrder,
    canGoOnline,
    homeBlock,
    homeSummaryLoading,
    setHomeSummaryLoading,
    applyHomeSummary,
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
      setTripStatus: s.setTripStatus,
      driverSocketStatus: s.driverSocketStatus,
      pendingNewOrder: s.pendingNewOrder,
      setPendingNewOrder: s.setPendingNewOrder,
      canGoOnline: s.canGoOnline,
      homeBlock: s.homeBlock,
      homeSummaryLoading: s.homeSummaryLoading,
      setHomeSummaryLoading: s.setHomeSummaryLoading,
      applyHomeSummary: s.applyHomeSummary,
    })),
  );

  useDriverOnlineWebSocket(isOnline);

  const [searching, setSearching] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerSeconds, setOfferSeconds] = useState(30);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [homeError, setHomeError] = useState<string | null>(null);
  const offerShake = useShakeAnimation({ durationMs: 380, amplitude: 10 });
  const searchWave = useRef(new Animated.Value(0)).current;
  const shimmerPhase = useRef(new Animated.Value(0)).current;
  const bottomPanelOpacity = useRef(new Animated.Value(1)).current;
  const prevOnlineRef = useRef(isOnline);
  const livePulse = useRef(new Animated.Value(1)).current;

  const loadHomeSummary = useCallback(async () => {
    setHomeSummaryLoading(true);
    setHomeError(null);
    try {
      const data = await getDriverHomeSummary();
      applyHomeSummary(data);
    } catch (e) {
      setHomeError(
        e instanceof Error ? e.message : "Could not load home summary.",
      );
    } finally {
      setHomeSummaryLoading(false);
    }
  }, [applyHomeSummary, setHomeSummaryLoading]);

  useEffect(() => {
    void loadHomeSummary();
  }, [loadHomeSummary]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeSummary();
    }, [loadHomeSummary]),
  );

  useEffect(() => {
    if (!isOnline || driverSocketStatus !== "connected") {
      livePulse.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 0.55,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isOnline, driverSocketStatus, livePulse]);

  useEffect(() => {
    if (!searching) {
      searchWave.setValue(0);
      shimmerPhase.setValue(0);
      return;
    }
    const wave = Animated.loop(
      Animated.sequence([
        Animated.timing(searchWave, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(searchWave, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const shimmer = Animated.loop(
      Animated.timing(shimmerPhase, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    wave.start();
    shimmer.start();
    return () => {
      wave.stop();
      shimmer.stop();
    };
  }, [searching, searchWave, shimmerPhase]);

  useEffect(() => {
    if (prevOnlineRef.current === isOnline) return;
    prevOnlineRef.current = isOnline;
    bottomPanelOpacity.setValue(0.86);
    Animated.timing(bottomPanelOpacity, {
      toValue: 1,
      duration: AnimDuration.homePanelCrossfadeMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isOnline, bottomPanelOpacity]);

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

  const ringOpacity = searchWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.62],
  });
  const corePulse = searchWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });
  const labelOpacity = searchWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const shimmerX = shimmerPhase.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 220],
  });

  const goOnline = () => {
    if (!canGoOnline) {
      return;
    }
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
      setTripPhase("to_pickup");
      setTripStatus("ASSIGNED");
      setPendingNewOrder(null);
      setShowOffer(false);
      setSearching(false);
      setOfferError(null);
      offerShake.reset();
      router.push("/active-trip");
    } catch (e) {
      void e;
      setOfferError(t("errors.could_not_accept_order"));
      offerShake.shake();
    } finally {
      setOfferBusy(false);
    }
  };

  const decline = async () => {
    if (!pendingNewOrder || offerBusy) return;
    setOfferBusy(true);
    try {
      await postDeclineDriverOrder(pendingNewOrder.orderId);
      setOfferError(null);
      offerShake.reset();
    } catch (e) {
      void e;
      setOfferError(t("errors.could_not_decline_order"));
      offerShake.shake();
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

  const onBlockBannerPress = () => {
    if (!homeBlock) return;
    if (homeBlock.redirectTo === "WALLET") {
      router.push("/bank-details");
      return;
    }
    router.push("/onboarding/owner");
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

      {homeBlock ? (
        <Pressable
          style={[styles.blockBanner, { top: insets.top + 48 }]}
          onPress={onBlockBannerPress}
        >
          <Ionicons name="alert-circle" size={18} color={Colors.warning} />
          <Text style={styles.blockText}>{homeBlock.message}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.textSecondary}
          />
        </Pressable>
      ) : null}

      {!isOnline ? (
        <View
          style={[
            styles.summaryWrap,
            { top: insets.top + (homeBlock ? 138 : 88) },
          ]}
        >
          <Text style={styles.summaryTitle}>Today&apos;s Summary</Text>
          <View style={styles.grid}>
            <SummaryTile
              icon="₹"
              label="Earnings"
              value={`₹${todayEarnings.toLocaleString("en-IN")}`}
              highlight
            />
            <SummaryTile
              icon="car-outline"
              label="Trips"
              value={String(todayTrips)}
              ion
            />
            <SummaryTile
              icon="time-outline"
              label="Hours Online"
              value={hoursOnline}
              ion
            />
            <SummaryTile
              icon="navigate-outline"
              label="Distance"
              value={distanceKm}
              ion
            />
          </View>
          <FormErrorText error={homeError} />
        </View>
      ) : (
        <View
          style={[
            styles.compactCard,
            { top: insets.top + (homeBlock ? 138 : 88) },
          ]}
        >
          <View style={styles.compactLeft}>
            <View style={styles.miniIcon}>
              <Text style={styles.rupee}>₹</Text>
            </View>
            <View>
              <Text style={styles.compactLabel}>Today</Text>
              <Text style={styles.compactValue}>
                ₹{todayEarnings.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
          <View style={styles.compactRight}>
            <View style={styles.miniIcon}>
              <Ionicons
                name="car-outline"
                size={18}
                color={Colors.primaryDark}
              />
            </View>
            <View>
              <Text style={styles.compactLabel}>Trips</Text>
              <Text style={styles.compactValue}>{todayTrips}</Text>
            </View>
          </View>
          <FormErrorText error={homeError} />
        </View>
      )}

      {isOnline && searching && !showOffer && (
        <View style={styles.searchingWrap} pointerEvents="none">
          <Animated.View
            style={[
              styles.searchRing,
              styles.searchRingOuter,
              { opacity: ringOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.searchRing,
              styles.searchRingMid,
              { opacity: ringOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.searchRing,
              styles.searchRingInner,
              { opacity: ringOpacity },
            ]}
          />
          <Animated.View style={[styles.radarCore, { opacity: corePulse }]}>
            <Ionicons name="time-outline" size={26} color={Colors.white} />
          </Animated.View>
          <Animated.Text
            style={[styles.searchingText, { opacity: labelOpacity }]}
          >
            Searching for orders nearby...
          </Animated.Text>
          <View style={styles.shimmerTrack}>
            <Animated.View
              style={[
                styles.shimmerBar,
                { transform: [{ translateX: shimmerX }] },
              ]}
            />
          </View>
        </View>
      )}

      <Animated.View
        style={[
          styles.bottom,
          {
            paddingBottom: insets.bottom + Spacing.lg,
            opacity: bottomPanelOpacity,
          },
        ]}
      >
        {!isOnline ? (
          <>
            <Text style={styles.offlineLabel}>You are Offline</Text>
            <SwipeButton
              key="slider-go-online"
              label={
                homeSummaryLoading
                  ? "Loading summary..."
                  : canGoOnline
                    ? "Swipe to go online"
                    : "Go online unavailable"
              }
              onComplete={goOnline}
              disabled={!canGoOnline || homeSummaryLoading}
            />
          </>
        ) : (
          <>
            <View style={styles.onlineLabelRow}>
              <Text style={styles.onlineLabel}>You are Online</Text>
              {driverSocketStatus === "connected" ? (
                <Animated.Text
                  style={[styles.socketLive, { opacity: livePulse }]}
                >
                  {" "}
                  • Live
                </Animated.Text>
              ) : driverSocketStatus === "connecting" ||
                driverSocketStatus === "reconnecting" ? (
                <Text style={styles.socketPending}>Connecting…</Text>
              ) : driverSocketStatus === "error" ? (
                <Text style={styles.socketError}>Connection issue</Text>
              ) : null}
            </View>
            <SwipeButton
              key="slider-go-offline"
              label="Swipe to go offline"
              variant="offline"
              onComplete={goOffline}
            />
          </>
        )}
      </Animated.View>

      <Modal
        visible={showOffer && !!pendingNewOrder}
        transparent
        animationType="slide"
      >
        <View style={styles.offerBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => void decline()}
            disabled={offerBusy}
          />
          <Animated.View style={[styles.offerSheet, offerShake.style]}>
            <View style={styles.offerHeader}>
              <Text style={styles.offerTitle}>New Order!</Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{offerSeconds}s</Text>
              </View>
            </View>
            {pendingNewOrder?.helperRequired ? (
              <View style={styles.warnBanner}>
                <Ionicons
                  name="warning"
                  size={18}
                  color={Colors.helperBannerText}
                />
                <Text style={styles.warnText}>
                  Helper required — loading assistance
                </Text>
              </View>
            ) : null}
            <View style={styles.route}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDotOuter, styles.routeDotPickup]}>
                  <View style={styles.routeDotInner} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routePlace}>
                    {pendingNewOrder?.pickup ?? "—"}
                  </Text>
                </View>
              </View>
              <View style={styles.dotted} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDotOuter, styles.routeDotDrop]}>
                  <View style={styles.routeDotInner} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>DROP</Text>
                  <Text style={styles.routePlace}>
                    {pendingNewOrder?.drop ?? "—"}
                  </Text>
                  <Text style={styles.routeMeta}>
                    ~{pendingNewOrder?.distanceKm?.toFixed(1) ?? "—"} km trip
                  </Text>
                </View>
              </View>
            </View>
            {pendingNewOrder?.customerName ? (
              <Text style={styles.customerName}>
                Customer: {pendingNewOrder.customerName}
              </Text>
            ) : null}
            <View style={styles.fareBar}>
              <Text style={styles.fareLabel}>Estimated fare</Text>
              <Text style={styles.fareAmt}>
                ₹
                {pendingNewOrder
                  ? Math.round(pendingNewOrder.estimatedFare).toLocaleString(
                      "en-IN",
                    )
                  : "—"}
              </Text>
            </View>
            {offerError ? <FormErrorText error={offerError} /> : null}
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
          </Animated.View>
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
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={Colors.textSecondary}
        />
      ) : (
        <Text style={styles.tileRupee}>{icon}</Text>
      )}
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  menuBtn: {
    position: "absolute",
    left: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    ...Shadows.floatMd,
  },
  blockBanner: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.warningSoft,
    borderWidth: 1,
    borderColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.floatSm,
  },
  blockText: {
    flex: 1,
    color: Colors.text,
    fontSize: 12.5,
    fontWeight: "600",
  },
  summaryWrap: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    zIndex: 1,
    ...Shadows.floatMd,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  tileHighlight: { backgroundColor: Colors.primarySoft },
  tileRupee: { fontSize: 16, fontWeight: "800", color: Colors.primary },
  tileLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  tileValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 2,
  },
  compactCard: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xxl,
    padding: Spacing.md + 2,
    justifyContent: "space-between",
    zIndex: 1,
    ...Shadows.floatMd,
  },
  compactLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  compactRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  miniIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rupee: { fontSize: 18, fontWeight: "800", color: Colors.primaryDark },
  compactLabel: { fontSize: 12, color: Colors.textSecondary },
  compactValue: { fontSize: 18, fontWeight: "800", color: Colors.text },
  searchingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  searchRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: Colors.mapPulseRing,
  },
  searchRingInner: {
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  searchRingMid: {
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1.5,
  },
  searchRingOuter: {
    width: 288,
    height: 288,
    borderRadius: 144,
    borderWidth: 1,
  },
  radarCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.floatSm,
  },
  searchingText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  shimmerTrack: {
    marginTop: Spacing.md,
    width: 200,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.shimmerBase,
    overflow: "hidden",
  },
  shimmerBar: {
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.shimmerHighlight,
  },
  bottom: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: 0,
    alignItems: "stretch",
    zIndex: 4,
  },
  offlineLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: "center",
    alignSelf: "center",
  },
  onlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
    alignSelf: "center",
  },
  onlineLabel: { fontSize: 16, color: Colors.primary, fontWeight: "700" },
  socketLive: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  socketPending: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  socketError: { fontSize: 13, fontWeight: "600", color: Colors.danger },
  offerBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  offerSheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadows.sheetTop,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerTitle: { fontSize: 20, fontWeight: "800", color: Colors.text },
  timerBadge: {
    backgroundColor: Colors.timerPink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  timerText: { fontWeight: "800", color: Colors.timerRed, fontSize: 13 },
  warnBanner: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.helperBannerBg,
    borderWidth: 1,
    borderColor: Colors.helperBannerBorder,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  warnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.helperBannerText,
  },
  customerName: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  route: { marginTop: Spacing.lg },
  routeRow: { flexDirection: "row", gap: Spacing.md },
  routeDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  routeDotPickup: { backgroundColor: Colors.primary },
  routeDotDrop: { backgroundColor: Colors.danger },
  routeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  dotted: {
    width: 2,
    height: 20,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  routeLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: "700" },
  routePlace: { fontSize: 16, fontWeight: "800", color: Colors.text },
  routeMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  fareBar: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fareLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: "600" },
  fareAmt: { fontSize: 22, fontWeight: "800", color: Colors.primaryDark },
  offerActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
