import { MapGridBackground } from "@/shared/MapGridBackground";
import { DriverTripMapView } from "@/maps/DriverTripMapView";
import { LocationCard } from "@/shared/trip/LocationCard";
import { AppToast } from "@/shared/ui/AppToast";
import { OtpInput } from "@/shared/ui/OtpInput";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { ReasonList } from "@/shared/ui/ReasonList";
import { SwipeButton } from "@/shared/ui/SwipeButton";
import { AnimDuration } from "@/config/animations";
import { Colors, Spacing } from "@/config/theme";
import { GOOGLE_MAPS_DIRECTIONS_BASE_URL } from "@/config/urls";
import { postArrivedAtDrop, postArrivedAtPickup, postCancelTrip, postConfirmStartTrip, postEndTrip, } from "@/api/driver-orders";
import { useDriverStore } from "@/lib/driver-store";
import { getDriverCoordsOrNull } from "@/services/location/core/driver-coords";
import { useOnlineTripNavigationGuard } from "@/lib/hooks/useOnlineTripNavigationGuard";
import { useDriverLiveLocation } from "@/lib/hooks/useDriverLiveLocation";
import { MetaCategory, getMetaOptions, } from "@/api/meta";
import { fetchRouteCoordinates, isValidLatLng, } from "@/maps/core/buildTripRoute";
import { distanceMeters, distanceToPolylineMeters } from "@/maps/core/geo";
import { popGlobalLoading, pushGlobalLoading, } from "@/lib/stores/app-loading-store";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Platform, Pressable, ScrollView, Text, View, } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./activeTrip.styles";
const START_TRIP_OTP_LENGTH = 4;
const MAP_EDGE_BOTTOM = 24;
const ROUTE_REFRESH_COOLDOWN_MS = 8_000;
const OFF_ROUTE_THRESHOLD_METERS = 85;
const phaseRoutePathMap = {
    to_pickup: "/driverSearchingScreen",
    waiting_pickup: "/driverArrivedatPickupScreen",
    start_otp: "/driverStartTripScreen",
    to_drop: "/driverArrivedatDropScreen",
    unloading: "/driverEndTripScreen",
};
function formatWait(total) {
    const m = Math.floor(total / 60)
        .toString()
        .padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}
function toPoint(lat, lng) {
    if (!isValidLatLng(lat, lng))
        return null;
    return { latitude: lat, longitude: lng };
}
export default function ActiveTripScreen({ expectedPhase = null }) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const lastDriverRouteAnchor = useRef(null);
    const lastRouteRefreshAtMs = useRef(0);
    const routeCoordsRef = useRef([]);
    const bottomSafeInset = Math.max(insets.bottom, Platform.OS === "android" ? Spacing.lg : 0);
    const trip = useDriverStore((s) => s.activeTrip);
    const phase = useDriverStore((s) => s.tripPhase);
    const setPhase = useDriverStore((s) => s.setTripPhase);
    const setTripStatus = useDriverStore((s) => s.setTripStatus);
    const setOnline = useDriverStore((s) => s.setOnline);
    const resetTripFlow = useDriverStore((s) => s.resetTripFlow);
    const patchActiveTrip = useDriverStore((s) => s.patchActiveTrip);
    useOnlineTripNavigationGuard({ enabled: true });
    const [waitSec, setWaitSec] = useState(0);
    const [otp, setOtp] = useState(() => Array.from({ length: START_TRIP_OTP_LENGTH }, () => ""));
    const [apiBusy, setApiBusy] = useState(false);
    const driverCoord = useDriverLiveLocation();
    const [routeCoords, setRouteCoords] = useState([]);
    const [tripError, setTripError] = useState(null);
    const [otpError, setOtpError] = useState(false);
    const [otpShake, setOtpShake] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
    const [cancelReasons, setCancelReasons] = useState([]);
    const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
    const [selectedCancelReason, setSelectedCancelReason] = useState(null);
    const [cancelErrorToast, setCancelErrorToast] = useState(null);
    useEffect(() => {
        routeCoordsRef.current = routeCoords;
    }, [routeCoords]);
    useEffect(() => {
        if (trip?.orderId == null || !Number.isFinite(trip.orderId))
            return;
        setRouteCoords([]);
    }, [trip?.orderId]);
    useEffect(() => {
        lastDriverRouteAnchor.current = null;
        lastRouteRefreshAtMs.current = 0;
    }, [phase, trip?.orderId]);
    useEffect(() => {
        if (phase !== "start_otp" && phase !== "unloading")
            return;
        const id = setInterval(() => setWaitSec((w) => w + 1), 1000);
        return () => clearInterval(id);
    }, [phase]);
    useEffect(() => {
        if (!trip) {
            router.replace("/home/homeDashboardScreen");
        }
    }, [trip, router]);
    useEffect(() => {
        if (!trip) {
            return;
        }
        const expectedPath = phaseRoutePathMap[phase];
        if (!expectedPath) {
            return;
        }
        if (pathname !== expectedPath) {
            router.replace(expectedPath);
        }
    }, [phase, pathname, router, trip]);
    useEffect(() => {
        if (!trip)
            return;
        let cancelled = false;
        const pickup = toPoint(trip.pickupLatitude, trip.pickupLongitude);
        const drop = toPoint(trip.dropLatitude, trip.dropLongitude);
        const clearRoute = () => {
            if (cancelled)
                return;
            if (routeCoordsRef.current.length > 0) {
                setRouteCoords([]);
            }
        };
        void (async () => {
            const resolveCurrentPoint = async () => {
                if (driverCoord)
                    return driverCoord;
                const c = await getDriverCoordsOrNull();
                if (!c)
                    return null;
                return { latitude: c.lat, longitude: c.lon };
            };
            const currentPoint = await resolveCurrentPoint();
            const now = Date.now();
            const markRefresh = () => {
                lastRouteRefreshAtMs.current = Date.now();
            };
            const currentRoute = routeCoordsRef.current;
            const routeDistance = currentPoint && currentRoute.length > 1
                ? distanceToPolylineMeters(currentPoint, currentRoute)
                : Number.POSITIVE_INFINITY;
            const movedAnchor = Boolean(lastDriverRouteAnchor.current &&
                currentPoint &&
                distanceMeters(lastDriverRouteAnchor.current, currentPoint) > 220);
            const shouldRefresh = currentRoute.length <= 1 || routeDistance > OFF_ROUTE_THRESHOLD_METERS || movedAnchor;
            const cooldownElapsed = lastRouteRefreshAtMs.current === 0 ||
                (now - lastRouteRefreshAtMs.current >= ROUTE_REFRESH_COOLDOWN_MS);
            const offRoute = routeDistance > OFF_ROUTE_THRESHOLD_METERS;
            const canRefresh = cooldownElapsed || currentRoute.length <= 1 || offRoute || movedAnchor;
            if (phase === "waiting_pickup" || phase === "start_otp") {
                return;
            }
            if (phase === "to_pickup") {
                if (!pickup || !currentPoint || !canRefresh || !shouldRefresh)
                    return;
                markRefresh();
                lastDriverRouteAnchor.current = currentPoint;
                const pts = await fetchRouteCoordinates(currentPoint, pickup);
                if (!cancelled)
                    setRouteCoords(pts);
                return;
            }
            if (phase === "to_drop" || phase === "unloading") {
                if (!drop || !currentPoint || !canRefresh || !shouldRefresh)
                    return;
                markRefresh();
                lastDriverRouteAnchor.current = currentPoint;
                const pts = await fetchRouteCoordinates(currentPoint, drop);
                if (!cancelled)
                    setRouteCoords(pts);
                return;
            }
            clearRoute();
        })();
        return () => {
            cancelled = true;
        };
    }, [trip, phase, driverCoord]);
    useEffect(() => {
        if (!cancelSheetOpen)
            return;
        let cancelled = false;
        void (async () => {
            setCancelReasonsLoading(true);
            try {
                const opts = await getMetaOptions([MetaCategory.CANCELLATION_REASON_ORDER]);
                if (cancelled)
                    return;
                const reasons = opts.CANCELLATION_REASON_ORDER ?? [];
                setCancelReasons(reasons);
                if (!selectedCancelReason && reasons[0]) {
                    setSelectedCancelReason(reasons[0].code);
                }
            }
            catch (e) {
                if (!cancelled) {
                    setTripError(e instanceof Error ? e.message : "Could not load cancellation reasons.");
                }
            }
            finally {
                if (!cancelled)
                    setCancelReasonsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [cancelSheetOpen, selectedCancelReason]);
    if (expectedPhase && phase !== expectedPhase) {
        return null;
    }
    if (!trip) {
        return null;
    }
    const openMaps = (address) => {
        const q = encodeURIComponent(address);
        Linking.openURL(`${GOOGLE_MAPS_DIRECTIONS_BASE_URL}${q}`);
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
            setTripError("Trip can only be cancelled while ASSIGNED or ARRIVED_PICKUP.");
            return;
        }
        setCancelSheetOpen(true);
    };
    const onCancelTrip = async () => {
        const orderId = requireOrderId();
        if (orderId == null)
            return;
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
            router.replace("/home/homeDashboardScreen");
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : "Could not cancel trip.";
            setTripError(msg);
            setCancelErrorToast(msg);
        }
        finally {
            popGlobalLoading();
            setApiBusy(false);
            setCancelSheetOpen(false);
            setMenuOpen(false);
        }
    };
    const statusStrip = () => {
        switch (phase) {
            case "to_pickup":
                return { text: "Head to pickup location", variant: "neutral" };
            case "waiting_pickup":
                return {
                    text: "Arrived at pickup location",
                    variant: "neutral",
                };
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
    const advance = (next) => {
        setTripError(null);
        setPhase(next);
    };
    const requireOrderId = () => {
        if (trip.orderId == null) {
            setTripError("This trip has no order ID. Return home and accept an order from the offer screen.");
            return null;
        }
        return trip.orderId;
    };
    const requireCoords = async () => {
        const c = await getDriverCoordsOrNull();
        if (!c) {
            setTripError("Turn on location and grant permission to continue.");
            return null;
        }
        return { latitude: c.lat, longitude: c.lon };
    };
    const onArrivedAtPickup = async () => {
        const orderId = requireOrderId();
        if (orderId == null)
            return;
        setApiBusy(true);
        setTripError(null);
        try {
            const coords = await requireCoords();
            if (!coords)
                return;
            await postArrivedAtPickup(orderId, coords);
            patchActiveTrip({
                pickupLatitude: coords.latitude,
                pickupLongitude: coords.longitude,
            });
            setTripStatus("ARRIVED_PICKUP");
            advance("waiting_pickup");
        }
        catch (e) {
            setTripError(e instanceof Error ? e.message : "Try again.");
        }
        finally {
            setApiBusy(false);
        }
    };
    const onConfirmStartTrip = async () => {
        const orderId = requireOrderId();
        if (orderId == null)
            return;
        const code = otp.join("");
        if (code.length !== START_TRIP_OTP_LENGTH)
            return;
        setApiBusy(true);
        setTripError(null);
        setOtpError(false);
        pushGlobalLoading();
        try {
            const coords = await requireCoords();
            if (!coords)
                return;
            await postConfirmStartTrip(orderId, { ...coords, otp: code });
            patchActiveTrip({
                pickupLatitude: coords.latitude,
                pickupLongitude: coords.longitude,
            });
            setOtp(Array.from({ length: START_TRIP_OTP_LENGTH }, () => ""));
            setTripStatus("STARTED");
            advance("to_drop");
        }
        catch (e) {
            setOtpError(true);
            setOtpShake((n) => n + 1);
            setTripError(e instanceof Error ? e.message : "Check OTP and try again.");
        }
        finally {
            popGlobalLoading();
            setApiBusy(false);
        }
    };
    const onArrivedAtDrop = async () => {
        const orderId = requireOrderId();
        if (orderId == null)
            return;
        setApiBusy(true);
        setTripError(null);
        try {
            const coords = await requireCoords();
            if (!coords)
                return;
            await postArrivedAtDrop(orderId, coords);
            patchActiveTrip({
                dropLatitude: coords.latitude,
                dropLongitude: coords.longitude,
            });
            advance("unloading");
        }
        catch (e) {
            setTripError(e instanceof Error ? e.message : "Try again.");
        }
        finally {
            setApiBusy(false);
        }
    };
    const onEndTrip = async () => {
        const orderId = requireOrderId();
        if (orderId == null)
            return;
        setApiBusy(true);
        setTripError(null);
        pushGlobalLoading();
        try {
            const coords = await requireCoords();
            if (!coords)
                return;
            await postEndTrip(orderId, coords);
            setTripStatus("COMPLETED");
            router.replace("/orderFareScreen");
        }
        catch (e) {
            setTripError(e instanceof Error ? e.message : "Try again.");
        }
        finally {
            popGlobalLoading();
            setApiBusy(false);
        }
    };
    const pickupLL = toPoint(trip.pickupLatitude, trip.pickupLongitude);
    const dropLL = toPoint(trip.dropLatitude, trip.dropLongitude);
    const hidePickupDropOnOtp = phase === "start_otp";
    const pickupMapPoint = hidePickupDropOnOtp ? null : pickupLL;
    const dropMapPoint = hidePickupDropOnOtp ? null : dropLL;
    const showDropOnMap = !hidePickupDropOnOtp && Boolean(dropMapPoint);
    const detailBottomPadding = bottomSafeInset +
        Spacing.xl +
        (phase === "start_otp" ? Spacing.xl : 0);
    return (<View style={styles.screen}>
      <View style={styles.mapSection}>
        <View style={styles.mapFill}>
          {Platform.OS === "web" ? (<MapGridBackground />) : (<DriverTripMapView resetToken={trip.orderId} driver={driverCoord} pickup={pickupMapPoint} drop={dropMapPoint} showDropMarker={showDropOnMap} routeCoordinates={routeCoords} followDriver mapPadding={{
                top: insets.top + Spacing.md,
                right: Spacing.md,
                bottom: MAP_EDGE_BOTTOM,
                left: Spacing.md,
            }}/>)}
        </View>

        <View style={styles.mapChrome} pointerEvents="box-none">
          <Pressable style={[styles.sos, { top: insets.top + Spacing.sm }]} onPress={() => setTripError("Safety options will be added here.")}>
            <Ionicons name="shield" size={20} color={Colors.white}/>
          </Pressable>

          <Pressable style={[styles.more, { top: insets.top + Spacing.sm }]} onPress={() => setMenuOpen((v) => !v)}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text}/>
          </Pressable>
          {menuOpen ? (<View style={[styles.menuCard, { top: insets.top + Spacing.sm + 50 }]}>
              <Pressable style={styles.menuItem} onPress={() => {
                setMenuOpen(false);
                openCancelSheet();
            }}>
                <Ionicons name="close-circle-outline" size={18} color={Colors.danger}/>
                <Text style={styles.menuItemText}>Cancel Trip</Text>
              </Pressable>
            </View>) : null}
        </View>
      </View>

      <ScrollView style={styles.detailScroll} contentContainerStyle={[
            styles.detailContent,
            { paddingBottom: detailBottomPadding },
        ]} scrollIndicatorInsets={{ bottom: bottomSafeInset }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {strip ? (<View style={[
                styles.statusPill,
                strip.variant === "primary" ? styles.statusPillPrimary : null,
            ]}>
            <Text style={[
                styles.statusPillText,
                strip.variant === "primary"
                    ? styles.statusPillTextInverse
                    : null,
            ]}>
              {strip.text}
            </Text>
            {strip.showWait ? (<View style={[
                    styles.waitBadge,
                    strip.variant === "primary"
                        ? styles.waitBadgeOnPrimary
                        : null,
                ]}>
                <Ionicons name="time-outline" size={14} color={Colors.warning}/>
                <Text style={styles.waitBadgeText}>
                  Waiting {formatWait(waitSec)}
                </Text>
              </View>) : null}
          </View>) : null}

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={Colors.textMuted}/>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.name}>{contactName}</Text>
            <Text style={styles.role}>{contactRole}</Text>
          </View>
          <Pressable style={styles.call} onPress={callCustomer}>
            <Ionicons name="call" size={22} color={Colors.white}/>
          </Pressable>
        </View>

        {phase !== "start_otp" ? (<LocationCard pickup={trip.pickupAddress} drop={trip.dropAddress} distanceKm={trip.tripKm} fare={trip.estimatedFare} customerName={trip.pickupContact} onCall={trip.customerPhone ? callCustomer : undefined}/>) : null}

        {tripError ? (<View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{tripError}</Text>
          </View>) : null}

        {phase === "to_pickup" ? (<>
            <PrimaryButton title="Navigate with Google Maps" variant="outline" onPress={() => openMaps(address)} style={styles.navBtn}/>
            <PrimaryButton title="Arrived at Pickup" onPress={() => void onArrivedAtPickup()} loading={apiBusy} disabled={apiBusy}/>
          </>) : null}

        {phase === "waiting_pickup" ? (<>
            <PrimaryButton title="Proceed to Start Trip OTP" onPress={() => advance("start_otp")} disabled={apiBusy}/>
          </>) : null}

        {phase === "start_otp" ? (<>
            <View style={styles.otpPanel}>
              <Text style={styles.otpTitle}>Start trip with customer OTP</Text>
              <Text style={styles.otpHint}>Ask customer for 4-digit OTP</Text>
              <OtpInput length={START_TRIP_OTP_LENGTH} value={otp} onChange={(next) => {
                setOtp(next);
                if (otpError)
                    setOtpError(false);
                setTripError(null);
            }} disabled={apiBusy} hasError={otpError} shakeTrigger={otpShake} shakeDurationMs={AnimDuration.shakeCriticalMs}/>
              <Text style={styles.demoOtp}>
                Enter the OTP the customer received after you arrived.
              </Text>
            </View>
            <View style={styles.bottomActionPad}>
              <SwipeButton key="swipe-start-trip" label="Swipe to start trip" variant="primary" resetKey={phase} onComplete={() => void onConfirmStartTrip()} disabled={!otpFilled || apiBusy}/>
            </View>
          </>) : null}

        {phase === "to_drop" ? (<PrimaryButton title="Arrived at Drop" onPress={() => void onArrivedAtDrop()} loading={apiBusy} disabled={apiBusy}/>) : null}

        {phase === "unloading" ? (<SwipeButton key="swipe-end-trip" label="Swipe to end trip" variant="success" resetKey={phase} onComplete={() => void onEndTrip()} disabled={apiBusy}/>) : null}
      </ScrollView>
      <Modal visible={cancelSheetOpen} transparent animationType="fade">
        <Pressable style={[styles.modalBackdrop, { paddingBottom: bottomSafeInset }]} onPress={() => {
            if (!apiBusy)
                setCancelSheetOpen(false);
        }}>
          <Pressable style={styles.modalCard} onPress={() => { }}>
            <Text style={styles.modalTitle}>Cancel Trip?</Text>
            <Text style={styles.modalSub}>
              This trip will be marked as cancelled and you will return to
              dashboard.
            </Text>
            {cancelReasonsLoading ? (<Text style={styles.modalHint}>Loading reasons...</Text>) : cancelReasons.length ? (<ReasonList options={cancelReasons} selectedCodes={selectedCancelReason ? [selectedCancelReason] : []} onToggle={(code) => setSelectedCancelReason(code)}/>) : (<Text style={styles.modalHint}>No reasons available. You can still continue.</Text>)}
            <View style={styles.modalActions}>
              <PrimaryButton title="Keep Trip" variant="outline" onPress={() => setCancelSheetOpen(false)} disabled={apiBusy} style={styles.flex1}/>
              <PrimaryButton title="Confirm Cancel" onPress={() => void onCancelTrip()} loading={apiBusy} disabled={apiBusy} style={styles.dangerButton}/>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <AppToast visible={!!cancelErrorToast} message={cancelErrorToast ?? ""} variant="error" onDismiss={() => setCancelErrorToast(null)}/>
    </View>);
}
