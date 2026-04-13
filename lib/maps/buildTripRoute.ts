export type RoutePoint = { latitude: number; longitude: number };

const GOOGLE_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) ||
  '';

function decodeGooglePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

/** Straight-line interpolation when Directions API is unavailable. */
export function interpolateRoute(from: RoutePoint, to: RoutePoint, segments = 28): RoutePoint[] {
  const out: RoutePoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    out.push({
      latitude: from.latitude + (to.latitude - from.latitude) * t,
      longitude: from.longitude + (to.longitude - from.longitude) * t,
    });
  }
  return out;
}

export async function fetchRouteCoordinates(
  origin: RoutePoint,
  destination: RoutePoint,
): Promise<RoutePoint[]> {
  if (!GOOGLE_KEY) {
    return interpolateRoute(origin, destination);
  }

  const o = `${origin.latitude},${origin.longitude}`;
  const d = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    o,
  )}&destination=${encodeURIComponent(d)}&key=${encodeURIComponent(GOOGLE_KEY)}`;

  try {
    const res = await fetch(url);
    const json = (await res.json()) as {
      routes?: { overview_polyline?: { points?: string } }[];
    };
    const points = json.routes?.[0]?.overview_polyline?.points;
    if (points) {
      return decodeGooglePolyline(points);
    }
  } catch {
    // fall through
  }
  return interpolateRoute(origin, destination);
}

export function isValidLatLng(
  lat: number | undefined,
  lng: number | undefined,
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}
