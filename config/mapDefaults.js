/**
 * Fallback map region when device and order coordinates are unavailable.
 */
export const DEFAULT_MAP_FALLBACK_REGION = {
    latitude: 13.0827,
    longitude: 80.2707,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
};
/** When closer than this to pickup while en route, map switches to pickup→drop leg (Ola directions). */
export const PICKUP_PROXIMITY_ROUTE_SWITCH_METERS = 55;
