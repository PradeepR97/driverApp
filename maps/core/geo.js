const EARTH_RADIUS_M = 6371000;
export function distanceMeters(a, b) {
    const φ1 = (a.latitude * Math.PI) / 180;
    const φ2 = (b.latitude * Math.PI) / 180;
    const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
    const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;
    const sinΔφ = Math.sin(Δφ / 2);
    const sinΔλ = Math.sin(Δλ / 2);
    const h = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function routeCenterLngLat(points) {
    if (points.length === 0)
        return null;
    let lat = 0;
    let lng = 0;
    for (const p of points) {
        lat += p.latitude;
        lng += p.longitude;
    }
    const n = points.length;
    return [lng / n, lat / n];
}
function pointToSegmentDistanceMeters(point, a, b) {
    const meanLatRad = ((a.latitude + b.latitude + point.latitude) / 3) * (Math.PI / 180);
    const scaleX = 111320 * Math.cos(meanLatRad);
    const scaleY = 111320;
    const ax = a.longitude * scaleX;
    const ay = a.latitude * scaleY;
    const bx = b.longitude * scaleX;
    const by = b.latitude * scaleY;
    const px = point.longitude * scaleX;
    const py = point.latitude * scaleY;
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 <= 1e-6) {
        return Math.hypot(px - ax, py - ay);
    }
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const cx = ax + t * abx;
    const cy = ay + t * aby;
    return Math.hypot(px - cx, py - cy);
}
/** Minimum cross-track distance from point to route polyline. */
export function distanceToPolylineMeters(point, route) {
    if (route.length === 0)
        return Number.POSITIVE_INFINITY;
    if (route.length === 1)
        return distanceMeters(point, route[0]);
    let minDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < route.length - 1; index += 1) {
        const segmentDistance = pointToSegmentDistanceMeters(point, route[index], route[index + 1]);
        if (segmentDistance < minDistance) {
            minDistance = segmentDistance;
        }
    }
    return minDistance;
}
