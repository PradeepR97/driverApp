import * as Location from 'expo-location';
let cachedForegroundGranted = null;
async function ensureForegroundPermission() {
    if (cachedForegroundGranted === true)
        return true;
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
    }
    cachedForegroundGranted = status === 'granted';
    return cachedForegroundGranted;
}
/**
 * Current device position (foreground). Requests permission if needed.
 * Use for trip geofence APIs (arrived pickup / start / drop / end).
 */
export async function getDriverCoordsOrNull() {
    try {
        const ok = await ensureForegroundPermission();
        if (!ok)
            return null;
        const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude, accuracy } = pos.coords;
        return {
            lat: latitude,
            lon: longitude,
            accuracyM: accuracy ?? null,
        };
    }
    catch {
        return null;
    }
}
/**
 * Faster path for periodic WebSocket LOCATION frames: use last known fix when fresh (Expo
 * `getLastKnownPositionAsync`), then fall back to a low-accuracy current read. Pair with a
 * single-flight guard in the caller so intervals do not overlap.
 */
export async function getDriverCoordsForLocationPing() {
    try {
        const ok = await ensureForegroundPermission();
        if (!ok)
            return null;
        const last = await Location.getLastKnownPositionAsync({
            maxAge: 60_000,
            requiredAccuracy: 500,
        });
        if (last) {
            const { latitude, longitude, accuracy } = last.coords;
            return {
                lat: latitude,
                lon: longitude,
                accuracyM: accuracy ?? null,
            };
        }
        const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
        });
        const { latitude, longitude, accuracy } = pos.coords;
        return {
            lat: latitude,
            lon: longitude,
            accuracyM: accuracy ?? null,
        };
    }
    catch {
        return null;
    }
}
/**
 * Client → server LOCATION frame on `/ws/driver/location` (WebSocket module spec).
 * `timestamp` ISO-8601 UTC; optional on wire but included for clarity.
 */
export function formatDriverLocationWebSocketMessage(coords) {
    return JSON.stringify({
        type: 'LOCATION',
        payload: {
            latitude: coords.lat,
            longitude: coords.lon,
        },
        timestamp: new Date().toISOString(),
    });
}
