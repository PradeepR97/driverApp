import { fetchOlaDirectionsCoordinates, getOlaMapsApiKey, } from "@/maps/olaDirectionsService";
/** Cap vertices sent to WebView / parsers for performance. */
export function downsampleRoute(points, maxPoints) {
    if (points.length <= maxPoints)
        return points;
    const step = (points.length - 1) / (maxPoints - 1);
    const out = [];
    for (let i = 0; i < maxPoints; i++) {
        const idx = Math.round(i * step);
        out.push(points[Math.min(idx, points.length - 1)]);
    }
    return out;
}
/** Straight-line interpolation when routing is unavailable. */
export function interpolateRoute(from, to, segments = 28) {
    const out = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        out.push({
            latitude: from.latitude + (to.latitude - from.latitude) * t,
            longitude: from.longitude + (to.longitude - from.longitude) * t,
        });
    }
    return out;
}
export async function fetchRouteCoordinates(origin, destination) {
    const key = getOlaMapsApiKey();
    if (!key) {
        return interpolateRoute(origin, destination);
    }
    try {
        const pts = await fetchOlaDirectionsCoordinates(origin, destination, key);
        return downsampleRoute(pts, 512);
    }
    catch {
        return interpolateRoute(origin, destination);
    }
}
export function isValidLatLng(lat, lng) {
    return (typeof lat === "number" &&
        typeof lng === "number" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180);
}
