import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
const STORAGE_KEY = "@driver_app/fleet_api_base_url";
/**
 * Pre-launch “paste backend URL” UI. Set to `false` for a production/store cut
 * so the modal never runs (API base still uses `EXPO_PUBLIC_API_URL` + optional
 * persisted value from `hydrateApiBaseFromStorage`). To remove the feature
 * completely, set this `false` and delete `components/dev/DevBackendUrlModal.tsx`
 * plus its branch in `app/_layout.tsx`.
 */
export const INCLUDE_BACKEND_URL_SETUP_UI = true;
function isApiUrlPromptEnabledFromConfig() {
  const extraPrompt = Constants.expoConfig?.extra?.showApiUrlPrompt;
  if (typeof extraPrompt === "boolean") {
    return extraPrompt;
  }
  return (
    typeof process !== "undefined" &&
    process.env &&
    process.env.EXPO_PUBLIC_SHOW_API_URL_PROMPT === "true"
  );
}
/** True when the URL modal should block navigation before the first screen. */
export const shouldShowBackendUrlSetupModal =
  INCLUDE_BACKEND_URL_SETUP_UI &&
  ((typeof __DEV__ !== "undefined" && __DEV__) ||
    isApiUrlPromptEnabledFromConfig());
/** Env or bundled default — used until storage hydrate / user override. */
// export function getEnvDefaultApiBaseUrl() {
//     return ((typeof process !== "undefined" && process.env && process.env.EXPO_PUBLIC_API_URL) ||
//         "https://fleet.app.weload.in/api/v1").trim();
// }

export function getEnvDefaultApiBaseUrl() {
  return (
    (typeof process !== "undefined" &&
      process.env &&
      process.env.EXPO_PUBLIC_API_URL) ||
    "https://2bc8-157-51-19-26.ngrok-free.app/api/v1"
  ).trim();
}
let cachedBaseUrl = getEnvDefaultApiBaseUrl();
/**
 * REST base including `/api/v1` (no trailing slash).
 * Paste `https://host`, `https://host/`, or full `https://host/api/v1`.
 */
export function normalizeFleetApiBaseUrl(raw) {
  let t = raw.trim();
  if (!t) {
    throw new Error("URL is required");
  }
  if (!/^https?:\/\//i.test(t)) {
    t = `https://${t}`;
  }
  const u = new URL(t);
  u.hash = "";
  if (!u.hostname) {
    throw new Error("Invalid URL");
  }
  let path = u.pathname.replace(/\/$/, "") || "";
  if (!/\/api\/v\d+$/i.test(path)) {
    const prefix = path && path !== "/" ? path : "";
    u.pathname = `${prefix}/api/v1`.replace(/\/{2,}/g, "/");
    if (!u.pathname.startsWith("/")) {
      u.pathname = `/${u.pathname}`;
    }
  }
  return u.toString().replace(/\/$/, "");
}
export function getApiBaseUrl() {
  return cachedBaseUrl;
}
export async function loadPersistedApiBaseUrl() {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  const t = v?.trim();
  return t ? t : null;
}
/** Load saved base URL, or keep env default. Safe to call once at startup. */
export async function hydrateApiBaseFromStorage() {
  const stored = await loadPersistedApiBaseUrl();
  if (!stored) {
    cachedBaseUrl = getEnvDefaultApiBaseUrl();
    return;
  }
  try {
    cachedBaseUrl = normalizeFleetApiBaseUrl(stored);
  } catch {
    cachedBaseUrl = getEnvDefaultApiBaseUrl();
  }
}
export async function persistApiBaseUrl(raw) {
  const normalized = normalizeFleetApiBaseUrl(raw);
  await AsyncStorage.setItem(STORAGE_KEY, normalized);
  cachedBaseUrl = normalized;
}
