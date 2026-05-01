import { OLA_DEFAULT_MAP_STYLE } from "@/config/olaMaps";
import { buildOlaTripMapHtml } from "@/maps/core/olaTripMapWebDocument";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
function toLngLat(p) {
    if (!p)
        return null;
    return [p.longitude, p.latitude];
}
function routeLayoutKey(routeCoordinates, pickup, drop, showDropMarker) {
    const r = routeCoordinates;
    let rPart = "0";
    if (r.length > 0) {
        const a = r[0];
        const b = r[r.length - 1];
        rPart = `${r.length}:${a.latitude}:${a.longitude}:${b.latitude}:${b.longitude}`;
    }
    const pk = pickup
        ? `${pickup.latitude},${pickup.longitude}`
        : "x";
    const dr = drop ? `${drop.latitude},${drop.longitude}` : "x";
    return `${rPart}|${pk}|${dr}|${showDropMarker ? 1 : 0}`;
}
export const OlaTripMapWebView = memo(function OlaTripMapWebView({ apiKey, mapStyle = OLA_DEFAULT_MAP_STYLE, driver, pickup, drop, showDropMarker, routeCoordinates, mapPadding, followDriver = false, onMapReady, onMapError, }) {
    const webRef = useRef(null);
    const [webLoaded, setWebLoaded] = useState(false);
    const prevLayoutKey = useRef("");
    const html = useMemo(() => buildOlaTripMapHtml(), []);
    const layoutKey = useMemo(() => routeLayoutKey(routeCoordinates, pickup, drop, showDropMarker), [routeCoordinates, pickup, drop, showDropMarker]);
    const syncToWeb = useCallback(() => {
        if (Platform.OS === "web" ||
            !webLoaded ||
            !webRef.current ||
            !apiKey.trim()) {
            return;
        }
        const layoutChanged = prevLayoutKey.current !== layoutKey;
        prevLayoutKey.current = layoutKey;
        const payload = {
            type: "MAP_SYNC",
            apiKey: apiKey.trim(),
            styleName: mapStyle,
            pickup: toLngLat(pickup),
            drop: toLngLat(drop),
            showDrop: showDropMarker,
            route: routeCoordinates.map((c) => [c.longitude, c.latitude]),
            driver: toLngLat(driver),
            padding: mapPadding,
            fitCamera: layoutChanged,
            followDriver,
        };
        const js = `window.__olaDispatch(${JSON.stringify(payload)}); true;`;
        webRef.current.injectJavaScript(js);
    }, [
        apiKey,
        mapStyle,
        webLoaded,
        layoutKey,
        pickup,
        drop,
        showDropMarker,
        routeCoordinates,
        driver,
        mapPadding,
        followDriver,
    ]);
    useEffect(() => {
        syncToWeb();
    }, [syncToWeb, driver?.latitude, driver?.longitude]);
    if (Platform.OS === "web") {
        return null;
    }
    if (!apiKey.trim()) {
        return (<View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Set EXPO_PUBLIC_OLA_MAPS_API_KEY to show the live map.
        </Text>
      </View>);
    }
    return (<WebView ref={webRef} style={StyleSheet.absoluteFillObject} source={{ html, baseUrl: "https://olamaps.driverapp.local" }} originWhitelist={["*"]} javaScriptEnabled domStorageEnabled cacheEnabled setSupportMultipleWindows={false} onLoadEnd={() => setWebLoaded(true)} onMessage={(ev) => {
            try {
                const data = JSON.parse(String(ev.nativeEvent.data));
                if (data.type === "OLA_MAP_READY")
                    onMapReady?.();
                if (data.type === "OLA_MAP_ERROR" && data.message)
                    onMapError?.(data.message);
            }
            catch {
                /* ignore */
            }
        }}/>);
});
const styles = StyleSheet.create({
    fallback: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#e8eef7",
    },
    fallbackText: {
        textAlign: "center",
        fontSize: 14,
        color: "#334155",
        fontWeight: "600",
    },
});
