/** Ola Maps Platform REST + vector tiles (MapLibre). */
export const OLA_MAPS_API_BASE = "https://api.olamaps.io";
export const OLA_DIRECTIONS_PATH = "/routing/v1/directions";
/** Vector style id for WebView MapLibre (see Ola dashboard / ola-map-sdk). */
export const OLA_DEFAULT_MAP_STYLE = "default-light-standard";
export function olaVectorStyleUrl(styleName) {
    return `${OLA_MAPS_API_BASE}/tiles/vector/v1/styles/${styleName}/style.json`;
}
