import { getDriverHomeSummary } from "@/api/driver-home";
import {
  postAcceptDriverOrder,
  postDeclineDriverOrder,
} from "@/api/driver-orders";
import { AnimDuration } from "@/config/animations";
import { Colors, Spacing } from "@/config/theme";
import { getAccessToken } from "@/lib/auth-session";
import { mockTripFromNewOrder, useDriverStore } from "@/lib/driver-store";
import { normalizeRouteStops, pickupStopContacts } from "@/lib/tripRouteStops";
import { useDriverOnlineWebSocket } from "@/lib/hooks/useDriverOnlineWebSocket";
import { stopNewOrderAlertPlayback } from "@/services/notifications/orderAlertSound";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
import { syncAndRouteFromAppState } from "@/lib/navigation/sync-app-state";
import { MapGridBackground } from "@/shared/MapGridBackground";
import { FormErrorText } from "@/shared/ui/FormErrorText";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { SwipeButton } from "@/shared/ui/SwipeButton";
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
  AppState,
  BackHandler,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";
import { styles } from "./home.styles";

function stopContactLine(stop) {
  if (!stop || typeof stop !== "object") {
    return null;
  }
  const name = typeof stop.contactName === "string" ? stop.contactName.trim() : "";
  const phone = typeof stop.contactPhone === "string" ? stop.contactPhone.trim() : "";
  const bits = [];
  if (name)
    bits.push(name);
  if (phone)
    bits.push(phone);
  return bits.length > 0 ? bits.join(" · ") : null;
}

function OfferRouteSummary({ pendingNewOrder }) {
  const stops = normalizeRouteStops(pendingNewOrder?.stops);
  const pickupStop = stops.find((s) => s.stopType === "PICKUP");
  const dropStops = stops.filter((s) => s.stopType === "DROP");
  const pu = pickupStopContacts(stops);
  const pickupAddress = (pickupStop?.address?.trim() || pendingNewOrder?.pickup || "—");
  const pickupContactLine = pickupStop
    ? stopContactLine(pickupStop)
    : [pu.name !== "Customer" ? pu.name : null, pu.phone || null]
        .filter(Boolean)
        .join(" · ") || null;
  const tripKmText = `~${pendingNewOrder?.distanceKm?.toFixed(1) ?? "—"} km trip`;

  return (<View style={styles.route}>
      <View style={styles.routeRow}>
        <View style={[styles.routeDotOuter, styles.routeDotPickup]}>
          <View style={styles.routeDotInner} />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.routeLabel}>PICKUP</Text>
          <Text style={styles.routePlace}>{pickupAddress}</Text>
          {pickupContactLine ? (<Text style={styles.routeMeta}>{pickupContactLine}</Text>) : null}
        </View>
      </View>
      <View style={styles.dotted} />
      {dropStops.length <= 1 ? (<View style={styles.routeRow}>
          <View style={[styles.routeDotOuter, styles.routeDotDrop]}>
            <View style={styles.routeDotInner} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.routeLabel}>DROP</Text>
            <Text style={styles.routePlace}>
              {pendingNewOrder?.drop ?? dropStops[0]?.address ?? "—"}
            </Text>
            {dropStops[0] ? (stopContactLine(dropStops[0])
        ? (<Text style={styles.routeMeta}>{stopContactLine(dropStops[0])}</Text>)
        : null) : null}
            <Text style={styles.routeMeta}>{tripKmText}</Text>
          </View>
        </View>) : (dropStops.map((d, idx) => (<View key={d.sequenceNumber ?? idx}>
              {idx > 0 ? <View style={styles.dotted} /> : null}
              <View style={styles.routeRow}>
                <View style={[styles.routeDotOuter, styles.routeDotDrop]}>
                  <View style={styles.routeDotInner} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.routeLabel}>
                    DROP
                    {" "}
                    {idx + 1}
                  </Text>
                  <Text style={styles.routePlace}>{d.address || "—"}</Text>
                  {stopContactLine(d) ? (<Text style={styles.routeMeta}>{stopContactLine(d)}</Text>) : null}
                  {idx === dropStops.length - 1 ? (<Text style={styles.routeMeta}>{tripKmText}</Text>) : null}
                </View>
              </View>
            </View>)))}
    </View>);
}

export default function HomeDashboardScreen() {
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
    appStateBlock,
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
      appStateBlock: s.appStateBlock,
      homeSummaryLoading: s.homeSummaryLoading,
      setHomeSummaryLoading: s.setHomeSummaryLoading,
      applyHomeSummary: s.applyHomeSummary,
    })),
  );
  const effectiveBlock = appStateBlock ?? homeBlock;
  useDriverOnlineWebSocket(isOnline);
  const [searching, setSearching] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerSeconds, setOfferSeconds] = useState(30);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerError, setOfferError] = useState(null);
  const [homeError, setHomeError] = useState(null);
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
    if (!isOnline) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [isOnline]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && getAccessToken()) {
        void syncAndRouteFromAppState(router).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [router]);
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
        stopNewOrderAlertPlayback();
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
    stopNewOrderAlertPlayback();
    setOnline(false);
    setSearching(false);
    setShowOffer(false);
    setPendingNewOrder(null);
  };
  const accept = async () => {
    if (!pendingNewOrder || offerBusy) return;
    stopNewOrderAlertPlayback();
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
      router.push("/driverSearchingScreen");
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
    stopNewOrderAlertPlayback();
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
    if (!effectiveBlock) return;
    if (effectiveBlock.redirectTo === "WALLET") {
      router.push("/home/bankDetailsScreen");
      return;
    }
    router.push("/onboarding/onboardingOwnerScreen");
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

      {effectiveBlock ? (
        <Pressable
          style={[styles.blockBanner, { top: insets.top + 48 }]}
          onPress={onBlockBannerPress}
        >
          <Ionicons name="alert-circle" size={18} color={Colors.warning} />
          <Text style={styles.blockText}>
            {effectiveBlock.message || "Account action required."}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.textSecondary}
          />
        </Pressable>
      ) : null}
      {effectiveBlock ? (
        <View style={[styles.blockCard, { top: insets.top + 94 }]}>
          <Text style={styles.blockCardTitle}>Account Restricted</Text>
          <Text style={styles.blockCardReason}>
            {effectiveBlock.reason ||
              effectiveBlock.message ||
              "Your account is currently blocked."}
          </Text>
          <PrimaryButton
            title={
              effectiveBlock.redirectTo === "WALLET"
                ? "Go to Wallet"
                : "Update Details"
            }
            onPress={onBlockBannerPress}
          />
        </View>
      ) : null}

      {!isOnline ? (
        <View
          style={[
            styles.summaryWrap,
            { top: insets.top + (effectiveBlock ? 208 : 88) },
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
            { top: insets.top + (effectiveBlock ? 208 : 88) },
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
            <OfferRouteSummary pendingNewOrder={pendingNewOrder} />
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
                style={styles.flex1}
                disabled={offerBusy}
              />
              <PrimaryButton
                title="Accept"
                onPress={() => void accept()}
                style={styles.flex1}
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
function SummaryTile({ icon, label, value, highlight, ion }) {
  return (
    <View style={[styles.tile, highlight && styles.tileHighlight]}>
      {ion ? (
        <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      ) : (
        <Text style={styles.tileRupee}>{icon}</Text>
      )}
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}
