import { OLA_DIRECTIONS_PATH, OLA_MAPS_API_BASE, } from "@/config/olaMaps";
import { decodeGooglePolyline } from "@/maps/core/polylineDecode";
function newRequestId() {
    return `rn-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function extractEncodedPolylineFromRoute(first) {
    const overviewPoly = first.overview_polyline;
    if (overviewPoly?.points && typeof overviewPoly.points === "string") {
        return overviewPoly.points;
    }
    if (typeof first.geometry === "string" && first.geometry.length > 0) {
        return first.geometry;
    }
    if (typeof first.overview === "string" && first.overview.length > 0) {
        return first.overview;
    }
    return null;
}
function extractPointsFromLegSteps(first) {
    const legs = first.legs;
    if (!Array.isArray(legs))
        return [];
    const out = [];
    for (const leg of legs) {
        if (!leg || typeof leg !== "object")
            continue;
        const steps = leg.steps;
        if (!Array.isArray(steps))
            continue;
        for (const step of steps) {
            if (!step || typeof step !== "object")
                continue;
            const g = step.geometry;
            if (typeof g === "string" && g.length) {
                try {
                    out.push(...decodeGooglePolyline(g));
                }
                catch {
                    /* skip bad segment */
                }
            }
        }
    }
    return out;
}
export function parseOlaDirectionsToCoordinates(data) {
    if (!data || typeof data !== "object")
        return [];
    const root = data;
    const routes = root.routes;
    if (!Array.isArray(routes) || routes.length === 0)
        return [];
    const first = routes[0];
    const encoded = extractEncodedPolylineFromRoute(first);
    if (encoded) {
        try {
            return decodeGooglePolyline(encoded);
        }
        catch {
            /* fall through */
        }
    }
    return extractPointsFromLegSteps(first);
}
export async function fetchOlaDirectionsCoordinates(origin, destination, apiKey) {
    const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        api_key: apiKey,
        overview: "full",
        steps: "true",
        language: "en",
    });
    const url = `${OLA_MAPS_API_BASE}${OLA_DIRECTIONS_PATH}?${params.toString()}`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "X-Request-Id": newRequestId(),
        },
    });
    if (!res.ok) {
        throw new Error(`Ola directions HTTP ${res.status}`);
    }
    const json = (await res.json());
    const coords = parseOlaDirectionsToCoordinates(json);
    if (coords.length === 0) {
        throw new Error("Ola directions: no route geometry in response");
    }
    return coords;
}
export function getOlaMapsApiKey() {
    return ((typeof process !== "undefined" &&
        process.env?.EXPO_PUBLIC_OLA_MAPS_API_KEY?.trim()) ||
        "");
}
