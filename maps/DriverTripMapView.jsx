import { DEFAULT_MAP_FALLBACK_REGION } from "@/config/mapDefaults";
import { Colors, Spacing } from "@/config/theme";
import { downsampleRoute } from "@/maps/core/buildTripRoute";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, } from "react-native-maps";
/**
 * Google map tiles: Android when key is set.
 * iOS: Google in dev / store builds when key is set (`appOwnership !== 'expo'`), or force in Expo Go with `EXPO_PUBLIC_IOS_USE_GOOGLE_MAPS=true` (requires a dev client with Google Maps).
 */
function googleMapsProvider() {
    const cfg = Constants.expoConfig;
    const androidKey = cfg?.android?.config?.googleMaps?.apiKey;
    const iosKey = cfg?.ios?.config?.googleMapsApiKey;
    if (Platform.OS === "android" && androidKey)
        return PROVIDER_GOOGLE;
    if (Platform.OS === "ios" && iosKey) {
        const forceGoogle = process.env.EXPO_PUBLIC_IOS_USE_GOOGLE_MAPS === "true";
        const notExpoGo = Constants.appOwnership !== "expo";
        if (forceGoogle || notExpoGo)
            return PROVIDER_GOOGLE;
    }
    return undefined;
}
function regionFromPoint(latitude, longitude, delta = 0.04) {
    return {
        latitude,
        longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
    };
}
function coordsForFit(driver, pickup, drop, showDropMarker, routeCoordinates) {
    const out = [];
    if (driver?.latitude != null &&
        driver?.longitude != null &&
        Number.isFinite(driver.latitude) &&
        Number.isFinite(driver.longitude)) {
        out.push({
            latitude: driver.latitude,
            longitude: driver.longitude,
        });
    }
    if (pickup?.latitude != null &&
        pickup?.longitude != null &&
        Number.isFinite(pickup.latitude) &&
        Number.isFinite(pickup.longitude)) {
        out.push({
            latitude: pickup.latitude,
            longitude: pickup.longitude,
        });
    }
    if (showDropMarker &&
        drop?.latitude != null &&
        drop?.longitude != null &&
        Number.isFinite(drop.latitude) &&
        Number.isFinite(drop.longitude)) {
        out.push({
            latitude: drop.latitude,
            longitude: drop.longitude,
        });
    }
    if (routeCoordinates?.length) {
        out.push(...downsampleRoute(routeCoordinates, 72));
    }
    return out;
}
function sanitizeRouteCoordinates(points) {
    if (!Array.isArray(points))
        return [];
    return points.filter((p) => p &&
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        Math.abs(p.latitude) <= 90 &&
        Math.abs(p.longitude) <= 180);
}
function routeFingerprint(routeCoordinates) {
    const r = sanitizeRouteCoordinates(routeCoordinates ?? []);
    if (r.length === 0)
        return "0";
    const a = r[0];
    const b = r[r.length - 1];
    return `${r.length}|${a.latitude}|${a.longitude}|${b.latitude}|${b.longitude}`;
}
const FOLLOW_DRIVER_MIN_MS = 1_600;
export const DriverTripMapView = memo(function DriverTripMapView({ driver, pickup, drop, showDropMarker, routeCoordinates, mapPadding, resetToken, followDriver = false, onMapReady, }) {
    const mapRef = useRef(null);
    const lastRegionRef = useRef(regionFromPoint(DEFAULT_MAP_FALLBACK_REGION.latitude, DEFAULT_MAP_FALLBACK_REGION.longitude, DEFAULT_MAP_FALLBACK_REGION.latitudeDelta));
    const driverFirstFixDoneRef = useRef(false);
    const lastFollowDriverAtRef = useRef(0);
    const provider = useMemo(() => googleMapsProvider(), []);
    const route = useMemo(() => sanitizeRouteCoordinates(routeCoordinates ?? []), [routeCoordinates]);
    const padding = mapPadding ?? {
        top: Spacing.md,
        right: Spacing.md,
        bottom: Spacing.md,
        left: Spacing.md,
    };
    const routeKey = useMemo(() => routeFingerprint(route), [route]);
    const initialRegion = useMemo(() => regionFromPoint(DEFAULT_MAP_FALLBACK_REGION.latitude, DEFAULT_MAP_FALLBACK_REGION.longitude, DEFAULT_MAP_FALLBACK_REGION.latitudeDelta), []);
    const fitMap = useCallback(() => {
        const map = mapRef.current;
        if (!map)
            return;
        const coords = coordsForFit(driver, pickup, drop, showDropMarker, route);
        const edge = {
            top: padding.top + 12,
            right: padding.right + 56,
            bottom: padding.bottom + 88,
            left: padding.left + 12,
        };
        if (coords.length >= 2) {
            map.fitToCoordinates(coords, { edgePadding: edge, animated: true });
            return;
        }
        if (driver?.latitude != null && driver?.longitude != null) {
            const reg = regionFromPoint(driver.latitude, driver.longitude, 0.028);
            lastRegionRef.current = reg;
            map.animateToRegion(reg, 450);
            return;
        }
        if (pickup?.latitude != null && pickup?.longitude != null) {
            const reg = regionFromPoint(pickup.latitude, pickup.longitude, 0.06);
            lastRegionRef.current = reg;
            map.animateToRegion(reg, 450);
        }
    }, [driver, pickup, drop, showDropMarker, route, padding]);
    useEffect(() => {
        driverFirstFixDoneRef.current = false;
    }, [resetToken]);
    useEffect(() => {
        const id = requestAnimationFrame(() => fitMap());
        return () => cancelAnimationFrame(id);
    }, [routeKey, fitMap]);
    useEffect(() => {
        const has = driver?.latitude != null &&
            driver?.longitude != null &&
            Number.isFinite(driver.latitude) &&
            Number.isFinite(driver.longitude);
        if (!has || driverFirstFixDoneRef.current)
            return;
        driverFirstFixDoneRef.current = true;
        const id = requestAnimationFrame(() => fitMap());
        return () => cancelAnimationFrame(id);
    }, [driver, fitMap]);
    const handleMapReady = useCallback(() => {
        requestAnimationFrame(() => fitMap());
        onMapReady?.();
    }, [fitMap, onMapReady]);
    useEffect(() => {
        if (!followDriver)
            return;
        const map = mapRef.current;
        if (!map || route.length < 2)
            return;
        if (driver?.latitude == null ||
            driver?.longitude == null ||
            !Number.isFinite(driver.latitude) ||
            !Number.isFinite(driver.longitude)) {
            return;
        }
        const now = Date.now();
        if (now - lastFollowDriverAtRef.current < FOLLOW_DRIVER_MIN_MS)
            return;
        lastFollowDriverAtRef.current = now;
        const reg = regionFromPoint(driver.latitude, driver.longitude, 0.014);
        lastRegionRef.current = reg;
        map.animateToRegion(reg, 380);
    }, [followDriver, driver?.latitude, driver?.longitude, route.length]);
    const zoomByDelta = useCallback(async (sign) => {
        const map = mapRef.current;
        if (!map)
            return;
        try {
            if (typeof map.getCamera === "function") {
                const cam = await map.getCamera();
                if (cam && typeof cam.zoom === "number") {
                    const z = Math.min(20, Math.max(3, cam.zoom + sign));
                    map.animateCamera({ ...cam, zoom: z }, { duration: 220 });
                    return;
                }
            }
        }
        catch {
            /* use region fallback */
        }
        const r = lastRegionRef.current;
        const factor = sign > 0 ? 0.62 : 1.45;
        map.animateToRegion({
            latitude: r.latitude,
            longitude: r.longitude,
            latitudeDelta: Math.max(0.0015, r.latitudeDelta * factor),
            longitudeDelta: Math.max(0.0015, r.longitudeDelta * factor),
        }, 220);
    }, []);
    const onRegionChangeComplete = useCallback((region) => {
        lastRegionRef.current = region;
    }, []);
    return (<View style={styles.wrap}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFillObject} provider={provider} mapType="standard" initialRegion={initialRegion} mapPadding={{
            top: padding.top,
            right: padding.right,
            bottom: padding.bottom,
            left: padding.left,
        }} rotateEnabled={false} pitchEnabled={false} toolbarEnabled={false} showsCompass={false} showsMyLocationButton={false} showsUserLocation={false} loadingEnabled onMapReady={handleMapReady} onRegionChangeComplete={onRegionChangeComplete}>
        {pickup?.latitude != null && pickup?.longitude != null ? (<Marker coordinate={pickup} title="Pickup" pinColor="green"/>) : null}
        {showDropMarker &&
            drop?.latitude != null &&
            drop?.longitude != null ? (<Marker coordinate={drop} title="Drop" pinColor="red"/>) : null}
        {driver?.latitude != null && driver?.longitude != null ? (<Marker coordinate={driver} title="You" pinColor="purple"/>) : null}
        {route.length >= 2 ? (<Polyline key={routeKey} coordinates={route} strokeColor="#1D4ED8" strokeWidth={7} lineCap="round" lineJoin="round" zIndex={100} tappable={false}/>) : null}
      </MapView>

      <View style={[styles.controls, { bottom: padding.bottom + Spacing.sm, right: padding.right + Spacing.sm }]} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" style={styles.ctrlBtn} onPress={() => void zoomByDelta(1)}>
          <Ionicons name="add" size={22} color={Colors.text}/>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" style={styles.ctrlBtn} onPress={() => void zoomByDelta(-1)}>
          <Ionicons name="remove" size={22} color={Colors.text}/>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Center map on your location" style={styles.ctrlBtn} onPress={() => fitMap()}>
          <Ionicons name="navigate" size={20} color={Colors.primary}/>
        </Pressable>
      </View>
    </View>);
});
const styles = StyleSheet.create({
    wrap: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    controls: {
        position: "absolute",
        gap: Spacing.sm,
        alignItems: "center",
    },
    ctrlBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
});
