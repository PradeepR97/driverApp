import { MapGridBackground } from "@/components/MapGridBackground";
import { MapViewContainer } from "@/components/maps/MapViewContainer";
import { LocationCard } from "@/components/trip/LocationCard";
import { AppToast } from "@/components/ui/AppToast";
import { OtpInput } from "@/components/ui/OtpInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ReasonList } from "@/components/ui/ReasonList";
import { SwipeButton } from "@/components/ui/SwipeButton";
import { AnimDuration } from "@/constants/animations";
import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import {
  postArrivedAtDrop,
  postArrivedAtPickup,
  postCancelTrip,
  postConfirmStartTrip,
  postEndTrip,
} from "@/lib/api/driver-orders";
import type { TripFlowPhase } from "@/lib/driver-store";
import { useDriverStore } from "@/lib/driver-store";
import { getDriverCoordsOrNull } from "@/lib/location/driver-coords";
import {
  MetaCategory,
  type MetaOptionItem,
  getMetaOptions,
} from "@/lib/api/meta";
import {
  fetchRouteCoordinates,
  isValidLatLng,
  type RoutePoint,
} from "@/lib/maps/buildTripRoute";
import {
  popGlobalLoading,
  pushGlobalLoading,
} from "@/lib/stores/app-loading-store";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const START_TRIP_OTP_LENGTH = 4;
const MAP_EDGE_BOTTOM = 24;

function formatWait(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function toPoint(lat?: number, lng?: number): RoutePoint | null {
  if (!isValidLatLng(lat, lng)) return null;
  return { latitude: lat!, longitude: lng! };
}

export default function ActiveTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const bottomSafeInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? Spacing.lg : 0,
  );

  const trip = useDriverStore((s) => s.activeTrip);
  const phase = useDriverStore((s) => s.tripPhase);
  const setPhase = useDriverStore((s) => s.setTripPhase);
  const setTripStatus = useDriverStore((s) => s.setTripStatus);
  const setOnline = useDriverStore((s) => s.setOnline);
  const resetTripFlow = useDriverStore((s) => s.resetTripFlow);
  const patchActiveTrip = useDriverStore((s) => s.patchActiveTrip);

  const [waitSec, setWaitSec] = useState(0);
  const [otp, setOtp] = useState(() =>
    Array.from({ length: START_TRIP_OTP_LENGTH }, () => ""),
  );
  const [apiBusy, setApiBusy] = useState(false);
  const [driverCoord, setDriverCoord] = useState<RoutePoint | null>(null);
  const [routeCoords, setRouteCoords] = useState<RoutePoint[]>([]);
  const [tripError, setTripError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [otpShake, setOtpShake] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [cancelReasons, setCancelReasons] = useState<MetaOptionItem[]>([]);
  const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(
    null,
  );
  const [cancelErrorToast, setCancelErrorToast] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "start_otp" && phase !== "unloading") return;
    const id = setInterval(() => setWaitSec((w) => w + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!trip) {
      router.replace("/home");
    }
  }, [trip, router]);

  useEffect(() => {
    if (phase === "waiting_pickup") {
      setPhase("start_otp");
    }
  }, [phase, setPhase]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let sub: Location.LocationSubscription | null = null;
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const first = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setDriverCoord({
        latitude: first.coords.latitude,
        longitude: first.coords.longitude,
      });
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 12,
          timeInterval: 4000,
        },
        (loc) => {
          setDriverCoord({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
    })();
    return () => {
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;

    const pickup = toPoint(trip.pickupLatitude, trip.pickupLongitude);
    const drop = toPoint(trip.dropLatitude, trip.dropLongitude);

    void (async () => {
      if (phase === "to_pickup" || phase === "start_otp") {
        if (driverCoord && pickup) {
          const pts = await fetchRouteCoordinates(driverCoord, pickup);
          if (!cancelled) setRouteCoords(pts);
        } else {
          if (!cancelled) setRouteCoords([]);
        }
      } else if (phase === "to_drop" || phase === "unloading") {
        if (pickup && drop) {
          const pts = await fetchRouteCoordinates(pickup, drop);
          if (!cancelled) setRouteCoords(pts);
        } else {
          if (!cancelled) setRouteCoords([]);
        }
      } else {
        if (!cancelled) setRouteCoords([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trip, phase, driverCoord]);

  useEffect(() => {
    if (Platform.OS === "web" || !trip) return;
    const coords: RoutePoint[] = [];
    if (driverCoord) coords.push(driverCoord);
    const pickup = toPoint(trip.pickupLatitude, trip.pickupLongitude);
    const drop = toPoint(trip.dropLatitude, trip.dropLongitude);
    if (pickup) coords.push(pickup);
    if (
      (phase === "to_drop" || phase === "unloading" || phase === "done") &&
      drop
    ) {
      coords.push(drop);
    }

    if (coords.length === 0) return;

    const id = requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: {
          top: insets.top + 100,
          right: 40,
          bottom: MAP_EDGE_BOTTOM,
          left: 40,
        },
        animated: true,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [trip, phase, driverCoord, insets.top]);

  useEffect(() => {
    if (!cancelSheetOpen) return;
    let cancelled = false;
    void (async () => {
      setCancelReasonsLoading(true);
      try {
        const opts = await getMetaOptions([MetaCategory.CANCELLATION_REASON_ORDER]);
        if (cancelled) return;
        const reasons = opts.CANCELLATION_REASON_ORDER ?? [];
        setCancelReasons(reasons);
        if (!selectedCancelReason && reasons[0]) {
          setSelectedCancelReason(reasons[0].code);
        }
      } catch (e) {
        if (!cancelled) {
          setTripError(e instanceof Error ? e.message : "Could not load cancellation reasons.");
        }
      } finally {
        if (!cancelled) setCancelReasonsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cancelSheetOpen, selectedCancelReason]);

  if (!trip) {
    return null;
  }

  const openMaps = (address: string) => {
    const q = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`);
  };

  const callCustomer = () => {
    const digits = (trip.customerPhone ?? "").replace(/\D/g, "");
    if (!digits) {
      setTripError("Customer phone number is unavailable.");
      return;
    }
    void Linking.openURL(`tel:${digits}`);
  };

  const openCancelSheet = () => {
    const canCancel = phase === "to_pickup" || phase === "start_otp";
    if (!canCancel) {
      setTripError(
        "Trip can only be cancelled while ASSIGNED or ARRIVED_PICKUP.",
      );
      return;
    }
    setCancelSheetOpen(true);
  };

  const onCancelTrip = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    if (cancelReasons.length > 0 && !selectedCancelReason) {
      setTripError("Please select a cancellation reason.");
      return;
    }
    setApiBusy(true);
    setTripError(null);
    pushGlobalLoading();
    try {
      await postCancelTrip(orderId, selectedCancelReason ?? undefined);
      setTripStatus("CANCELLED");
      setOnline(true);
      resetTripFlow();
      router.replace("/home");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not cancel trip.";
      setTripError(msg);
      setCancelErrorToast(msg);
    } finally {
      popGlobalLoading();
      setApiBusy(false);
      setCancelSheetOpen(false);
      setMenuOpen(false);
    }
  };

  const statusStrip = (): {
    text: string;
    showWait?: boolean;
    variant: "neutral" | "primary";
  } | null => {
    switch (phase) {
      case "to_pickup":
        return { text: "Head to pickup location", variant: "neutral" };
      case "start_otp":
        return {
          text: "Enter OTP to start trip",
          showWait: true,
          variant: "neutral",
        };
      case "to_drop":
        return {
          text: "Trip in progress — heading to drop-off",
          variant: "primary",
        };
      case "unloading":
        return {
          text: "Unloading at drop location",
          showWait: true,
          variant: "primary",
        };
      case "waiting_pickup":
      case "done":
        return null;
    }
  };

  const strip = statusStrip();
  const isPickupPhase = phase === "to_pickup" || phase === "start_otp";
  const contactName = isPickupPhase ? trip.pickupContact : trip.dropContact;
  const contactRole = isPickupPhase ? trip.pickupRole : trip.dropRole;
  const address = isPickupPhase ? trip.pickupAddress : trip.dropAddress;

  const otpFilled = otp.every((d) => d.length === 1);

  const advance = (next: TripFlowPhase) => {
    setTripError(null);
    setPhase(next);
  };

  const requireOrderId = (): number | null => {
    if (trip.orderId == null) {
      setTripError(
        "This trip has no order ID. Return home and accept an order from the offer screen.",
      );
      return null;
    }
    return trip.orderId;
  };

  const requireCoords = async (): Promise<RoutePoint | null> => {
    const c = await getDriverCoordsOrNull();
    if (!c) {
      setTripError("Turn on location and grant permission to continue.");
      return null;
    }
    return { latitude: c.lat, longitude: c.lon };
  };

  const onArrivedAtPickup = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    setApiBusy(true);
    setTripError(null);
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postArrivedAtPickup(orderId, coords);
      patchActiveTrip({
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
      });
      setTripStatus("ARRIVED_PICKUP");
      advance("start_otp");
    } catch (e) {
      setTripError(e instanceof Error ? e.message : "Try again.");
    } finally {
      setApiBusy(false);
    }
  };

  const onConfirmStartTrip = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    const code = otp.join("");
    if (code.length !== START_TRIP_OTP_LENGTH) return;
    setApiBusy(true);
    setTripError(null);
    setOtpError(false);
    pushGlobalLoading();
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postConfirmStartTrip(orderId, { ...coords, otp: code });
      patchActiveTrip({
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
      });
      setOtp(Array.from({ length: START_TRIP_OTP_LENGTH }, () => ""));
      setTripStatus("STARTED");
      advance("to_drop");
    } catch (e) {
      setOtpError(true);
      setOtpShake((n) => n + 1);
      setTripError(e instanceof Error ? e.message : "Check OTP and try again.");
    } finally {
      popGlobalLoading();
      setApiBusy(false);
    }
  };

  const onArrivedAtDrop = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    setApiBusy(true);
    setTripError(null);
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postArrivedAtDrop(orderId, coords);
      patchActiveTrip({
        dropLatitude: coords.latitude,
        dropLongitude: coords.longitude,
      });
      advance("unloading");
    } catch (e) {
      setTripError(e instanceof Error ? e.message : "Try again.");
    } finally {
      setApiBusy(false);
    }
  };

  const onEndTrip = async () => {
    const orderId = requireOrderId();
    if (orderId == null) return;
    setApiBusy(true);
    setTripError(null);
    pushGlobalLoading();
    try {
      const coords = await requireCoords();
      if (!coords) return;
      await postEndTrip(orderId, coords);
      setTripStatus("COMPLETED");
      router.replace("/order-fare");
    } catch (e) {
      setTripError(e instanceof Error ? e.message : "Try again.");
    } finally {
      popGlobalLoading();
      setApiBusy(false);
    }
  };

  const pickupLL = toPoint(trip.pickupLatitude, trip.pickupLongitude);
  const dropLL = toPoint(trip.dropLatitude, trip.dropLongitude);

  const initialRegion = driverCoord
    ? {
        ...driverCoord,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }
    : pickupLL
      ? { ...pickupLL, latitudeDelta: 0.06, longitudeDelta: 0.06 }
      : {
          latitude: 13.0827,
          longitude: 80.2707,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };

  const mapChildren = (
    <>
      {routeCoords.length > 1 ? (
        <Polyline
          coordinates={routeCoords}
          strokeColor={Colors.primary}
          strokeWidth={4}
        />
      ) : null}
      {driverCoord ? (
        <Marker coordinate={driverCoord} title="You" identifier="driver" />
      ) : null}
      {pickupLL ? (
        <Marker coordinate={pickupLL} title="Pickup" identifier="pickup" />
      ) : null}
      {dropLL &&
      (phase === "to_drop" || phase === "unloading" || phase === "done") ? (
        <Marker coordinate={dropLL} title="Drop" identifier="drop" />
      ) : null}
    </>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.mapSection}>
        <View style={styles.mapFill}>
          {Platform.OS === "web" ? (
            <MapGridBackground />
          ) : (
            <MapViewContainer
              ref={mapRef}
              mapPadding={{
                top: insets.top + Spacing.md,
                right: Spacing.md,
                bottom: MAP_EDGE_BOTTOM,
                left: Spacing.md,
              }}
              initialRegion={initialRegion}
            >
              {mapChildren}
            </MapViewContainer>
          )}
        </View>

        <View style={styles.mapChrome} pointerEvents="box-none">
          <Pressable
            style={[styles.sos, { top: insets.top + Spacing.sm }]}
            onPress={() => setTripError("Safety options will be added here.")}
          >
            <Ionicons name="shield" size={20} color={Colors.white} />
          </Pressable>

          <Pressable
            style={[styles.more, { top: insets.top + Spacing.sm }]}
            onPress={() => setMenuOpen((v) => !v)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
          </Pressable>
          {menuOpen ? (
            <View
              style={[styles.menuCard, { top: insets.top + Spacing.sm + 50 }]}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  openCancelSheet();
                }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={Colors.danger}
                />
                <Text style={styles.menuItemText}>Cancel Trip</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={[
          styles.detailContent,
          { paddingBottom: bottomSafeInset + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: bottomSafeInset }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {strip ? (
          <View
            style={[
              styles.statusPill,
              strip.variant === "primary" ? styles.statusPillPrimary : null,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                strip.variant === "primary"
                  ? styles.statusPillTextInverse
                  : null,
              ]}
            >
              {strip.text}
            </Text>
            {strip.showWait ? (
              <View
                style={[
                  styles.waitBadge,
                  strip.variant === "primary"
                    ? styles.waitBadgeOnPrimary
                    : null,
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.warning}
                />
                <Text style={styles.waitBadgeText}>
                  Waiting {formatWait(waitSec)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={Colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{contactName}</Text>
            <Text style={styles.role}>{contactRole}</Text>
          </View>
          <Pressable
            style={styles.call}
            onPress={callCustomer}
          >
            <Ionicons name="call" size={22} color={Colors.white} />
          </Pressable>
        </View>

        <LocationCard
          pickup={trip.pickupAddress}
          drop={trip.dropAddress}
          distanceKm={trip.tripKm}
          fare={trip.estimatedFare}
          customerName={trip.pickupContact}
          onCall={trip.customerPhone ? callCustomer : undefined}
        />

        {tripError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{tripError}</Text>
          </View>
        ) : null}

        {phase === "to_pickup" ? (
          <>
            <PrimaryButton
              title="Navigate with Google Maps"
              variant="outline"
              onPress={() => openMaps(address)}
              style={styles.navBtn}
            />
            <PrimaryButton
              title="Arrived at Pickup"
              textStyle={{ color: Colors.white }}
              style={styles.arrivedPickupBtn}
              onPress={() => void onArrivedAtPickup()}
              loading={apiBusy}
              disabled={apiBusy}
            />
          </>
        ) : null}

        {phase === "start_otp" ? (
          <>
            <Text style={styles.otpHint}>Ask customer for 4-digit OTP</Text>
            <OtpInput
              length={START_TRIP_OTP_LENGTH}
              value={otp}
              onChange={(next) => {
                setOtp(next);
                if (otpError) setOtpError(false);
                setTripError(null);
              }}
              disabled={apiBusy}
              hasError={otpError}
              shakeTrigger={otpShake}
              shakeDurationMs={AnimDuration.shakeCriticalMs}
            />
            <Text style={styles.demoOtp}>
              Enter the OTP the customer received after you arrived.
            </Text>
            <SwipeButton
              key="swipe-start-trip"
              label="Swipe to start trip"
              variant="indigo"
              resetKey={phase}
              onComplete={() => void onConfirmStartTrip()}
              disabled={!otpFilled || apiBusy}
            />
          </>
        ) : null}

        {phase === "to_drop" ? (
          <PrimaryButton
            title="Arrived at Drop"
            textStyle={{ color: Colors.white }}
            style={styles.arrivedDropBtn}
            onPress={() => void onArrivedAtDrop()}
            loading={apiBusy}
            disabled={apiBusy}
          />
        ) : null}

        {phase === "unloading" ? (
          <SwipeButton
            key="swipe-end-trip"
            label="Swipe to end trip"
            variant="success"
            resetKey={phase}
            onComplete={() => void onEndTrip()}
            disabled={apiBusy}
          />
        ) : null}
      </ScrollView>
      <Modal visible={cancelSheetOpen} transparent animationType="fade">
        <Pressable
          style={[styles.modalBackdrop, { paddingBottom: bottomSafeInset }]}
          onPress={() => {
            if (!apiBusy) setCancelSheetOpen(false);
          }}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Cancel Trip?</Text>
            <Text style={styles.modalSub}>
              This trip will be marked as cancelled and you will return to
              dashboard.
            </Text>
            {cancelReasonsLoading ? (
              <Text style={styles.modalHint}>Loading reasons...</Text>
            ) : cancelReasons.length ? (
              <ReasonList
                options={cancelReasons}
                selectedCodes={selectedCancelReason ? [selectedCancelReason] : []}
                onToggle={(code) => setSelectedCancelReason(code)}
              />
            ) : (
              <Text style={styles.modalHint}>No reasons available. You can still continue.</Text>
            )}
            <View style={styles.modalActions}>
              <PrimaryButton
                title="Keep Trip"
                variant="outline"
                onPress={() => setCancelSheetOpen(false)}
                disabled={apiBusy}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Confirm Cancel"
                onPress={() => void onCancelTrip()}
                loading={apiBusy}
                disabled={apiBusy}
                style={styles.dangerButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <AppToast
        visible={!!cancelErrorToast}
        message={cancelErrorToast ?? ""}
        variant="error"
        onDismiss={() => setCancelErrorToast(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  mapSection: {
    height: "45%",
    minHeight: 260,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  mapFill: { flex: 1 },
  mapChrome: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  detailScroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  detailContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadows.floatSm,
  },
  statusPillPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusPillText: {
    flex: 1,
    fontWeight: "800",
    color: Colors.text,
    fontSize: 15,
  },
  statusPillTextInverse: { color: Colors.white },
  waitBadgeOnPrimary: { backgroundColor: Colors.onPrimaryMuted },
  sos: {
    position: "absolute",
    left: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    ...Shadows.floatSm,
  },
  more: {
    position: "absolute",
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    ...Shadows.floatSm,
  },
  menuCard: {
    position: "absolute",
    right: Spacing.md,
    width: 170,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xs,
    ...Shadows.floatLg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  menuItemText: { color: Colors.danger, fontWeight: "700", fontSize: 14 },
  waitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  waitBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.warning },
  profileRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  name: { fontSize: 18, fontWeight: "800", color: Colors.text },
  role: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  call: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
  },
  metaText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  metaDot: { color: Colors.textMuted },
  locBox: {
    flexDirection: "row",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  addr: { fontSize: 16, fontWeight: "800", color: Colors.text },
  addrSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  navBtn: { marginBottom: 0 },
  otpHint: { textAlign: "center", color: Colors.textSecondary, fontSize: 14 },
  demoOtp: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorBannerText: { color: Colors.danger, fontWeight: "600", fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sheetTop,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  modalSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  modalHint: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  arrivedPickupBtn: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    borderRadius: Radius.lg,
    ...Shadows.floatSm,
  },
  arrivedDropBtn: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
    borderRadius: Radius.lg,
    ...Shadows.floatSm,
  },
});
