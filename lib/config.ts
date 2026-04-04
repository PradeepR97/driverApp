/**
 * Fleet API base (no trailing slash). Override with EXPO_PUBLIC_API_URL in `.env`.
 *
 * Implemented client calls:
 * - POST /auth/otp/request  (public)
 * - POST /auth/otp/verify   (public)
 * - POST /users/language    (authenticated) — body `{ language }` after OTP
 * - GET  /app/state          (authenticated) — onboarding status + next screen (see `route-after-auth`)
 * - POST /onboarding/owner|vehicle|driver
 * - GET  /meta/options     (authenticated) — `?categories=` comma list (max 10). See `lib/api/meta.ts` (`MetaCategory`).
 * - POST /auth/logout      (authenticated) — Bearer only, no body
 * - GET  /health            (public) — full URL: same host as API, path `/api/v1/health`
 * - WebSocket `/ws/driver/location` — same host/port as REST, path **not** under `/api/v1`; JWT in
 *   `Authorization: Bearer` on handshake (native). See `lib/realtime/driver-websocket.ts`.
 * - POST /driver/orders/{id}/accept | /decline — after NEW_ORDER on driver WebSocket
 * - POST /driver/orders/{id}/arrived-pickup | /start-trip/confirm | /arrived-drop | /end-trip — trip cycle
 *
 * Onboarding images: uploaded **directly to S3** from the app (`lib/api/upload.ts`) using
 * `EXPO_PUBLIC_AWS_*` — credentials are **exposed** in the client; use a tightly scoped IAM user.
 *
 * Authenticated routes: set Bearer token after verify (axios client in `lib/api/client.ts`).
 */
export const API_BASE_URL =
  (
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
    'https://api.example.com/api/v1'
  ).trim();

export const AUTH_USER_TYPE = 'DRIVER' as const;
export const DEFAULT_COUNTRY_CODE = '+91';

/** Override if backend path differs. */
export const USERS_LANGUAGE_PATH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_USERS_LANGUAGE_PATH) ||
  '/users/language';

export const APP_STATE_PATH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APP_STATE_PATH?.trim()) ||
  '/app/state';

export const META_OPTIONS_PATH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_META_OPTIONS_PATH?.trim()) ||
  '/meta/options';

export const AUTH_LOGOUT_PATH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AUTH_LOGOUT_PATH?.trim()) ||
  '/auth/logout';

/**
 * Driver WebSocket — same host/port as `EXPO_PUBLIC_API_URL`, but path is at **server root**
 * (not under `/api/v1`). Default: `wss://host/ws/driver/location` with `Authorization: Bearer <jwt>`
 * on the handshake (iOS/Android). **Web** cannot set WS headers; we append `?access_token=` as a
 * dev fallback — confirm with backend if you rely on web.
 *
 * - `EXPO_PUBLIC_WS_URL` — full `ws://` / `wss://` URL (optional). `{{token}}` → encoded token in URL.
 * - `EXPO_PUBLIC_WS_PATH` — when `WS_URL` is unset: path only (default `/ws/driver/location`).
 *   Use `/ws/driver` for presence-only (no LOCATION frames).
 */
const WS_PATH_DEFAULT = '/ws/driver/location';

export type DriverWebSocketConnection = {
  url: string;
  bearerToken: string;
};

/** Strip trailing `/api/vN` from REST base pathname so `/ws/*` is at root. */
function websocketBaseUrlFromApiBase(): string | null {
  try {
    const raw = API_BASE_URL.startsWith('http') ? API_BASE_URL : `https://${API_BASE_URL}`;
    const u = new URL(raw);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    let pathPrefix = u.pathname.replace(/\/$/, '');
    pathPrefix = pathPrefix.replace(/\/api\/v\d+$/i, '');
    const wsPath =
      (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WS_PATH?.trim()) || WS_PATH_DEFAULT;
    const seg = wsPath.startsWith('/') ? wsPath : `/${wsPath}`;
    u.pathname = pathPrefix && pathPrefix !== '/' ? `${pathPrefix}${seg}` : seg;
    u.search = '';
    return u.toString();
  } catch {
    return null;
  }
}

export function buildDriverWebSocketConnection(accessToken: string): DriverWebSocketConnection | null {
  const bearerToken = accessToken.trim();
  if (!bearerToken) return null;

  const explicit =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_WS_URL?.trim() ?? '' : '';
  if (explicit) {
    const url = explicit.includes('{{token}}')
      ? explicit.split('{{token}}').join(encodeURIComponent(bearerToken))
      : explicit;
    return { url, bearerToken };
  }

  const url = websocketBaseUrlFromApiBase();
  if (!url) return null;
  return { url, bearerToken };
}

/** First message after socket open; template may include `{{token}}`. */
export function formatWsConnectMessage(accessToken: string | null): string | null {
  if (!accessToken?.trim()) return null;
  const template =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_WS_CONNECT_MESSAGE?.trim() : '';
  if (!template) return null;
  return template.replace(/\{\{token\}\}/g, accessToken);
}

/** How often to push LOCATION to `/ws/driver/location` while online (ms). Default 30s per backend note. */
export const DRIVER_LOCATION_PUSH_INTERVAL_MS = (() => {
  const raw =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_DRIVER_LOCATION_INTERVAL_MS : undefined;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1_000 && n <= 120_000) {
    return Math.floor(n);
  }
  return 30_000;
})();

export type DirectS3Config = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Key prefix, e.g. `driver-uploads` */
  objectKeyPrefix: string;
  /** If set (e.g. CloudFront), used to build the URL returned to your API */
  publicBaseOverride: string | null;
  /** Set `public-read` only if bucket allows ACLs */
  objectAcl: 'public-read' | undefined;
};

/**
 * Direct S3 upload from the app. Requires `.env` values; throws if any are missing.
 */
export function getDirectS3ClientConfig(): DirectS3Config {
  const region =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AWS_REGION?.trim()) || 'ap-south-1';
  const accessKeyId =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AWS_ACCESS_KEY_ID?.trim()) || '';
  const secretAccessKey =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY?.trim()) || '';
  const bucket =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_S3_BUCKET_NAME?.trim()) || '';
  const objectKeyPrefix =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_S3_UPLOAD_PREFIX?.trim()) ||
    'driver';
    
  const publicBaseOverride =
    (typeof process !== 'undefined' &&
      process.env?.EXPO_PUBLIC_S3_PUBLIC_BASE_URL?.replace(/\/$/, '').trim()) ||
    null;
  const aclRaw =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_S3_OBJECT_ACL?.trim()) || '';
  const objectAcl = aclRaw === 'public-read' ? ('public-read' as const) : undefined;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'S3 upload: set EXPO_PUBLIC_AWS_REGION, EXPO_PUBLIC_AWS_ACCESS_KEY_ID, EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY, EXPO_PUBLIC_S3_BUCKET_NAME in .env',
    );
  }

  return {
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
    objectKeyPrefix,
    publicBaseOverride,
    objectAcl,
  };
}

/** Public URL string stored in your backend after upload. */
export function publicUrlForS3Key(cfg: DirectS3Config, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  if (cfg.publicBaseOverride) {
    return `${cfg.publicBaseOverride}/${encodedKey}`;
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${encodedKey}`;
}

export const ONBOARDING_OWNER_PATH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ONBOARDING_OWNER_PATH) ||
  '/onboarding/owner';

export const ONBOARDING_VEHICLE_PATH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ONBOARDING_VEHICLE_PATH) ||
  '/onboarding/vehicle';

export const ONBOARDING_DRIVER_PATH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ONBOARDING_DRIVER_PATH) ||
  '/onboarding/driver';

/**
 * OTP length for the verify screen (match backend / `Verify Otp.pdf`).
 * Override with `EXPO_PUBLIC_OTP_DIGITS` (4–8).
 */
export const OTP_DIGIT_COUNT = (() => {
  const raw = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_OTP_DIGITS : undefined;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 4 && n <= 8) return Math.floor(n);
  return 4;
})();
