# Driver App (Expo/React Native) — Full Project Explanation

## 1) What this app does (high level)

This is a **driver-side** delivery/trip mobile app.

Core responsibilities:
- **Authentication** via phone OTP.
- **Onboarding** (Owner → Vehicle → Driver) including **image uploads to S3**.
- **Permissions** gate (Location / Notifications / Camera).
- **Driver dashboard (Home)** where the driver toggles **online/offline**, receives **live order offers** via **WebSocket**, and can **accept/decline** offers.
- **Active trip workflow** with phase-based UI:
  - head to pickup
  - start trip using customer OTP
  - head to drop
  - unload / end trip (swipe)
  - optional cancel (with meta-driven reason list)
- **Fare & payment**:
  - fetch order fare breakdown
  - collect cash or confirm UPI payment (QR)
- **Rating** after trip completion.

The project is built with **Expo Router** (file-based routing) and keeps real-time state in a **Zustand store**.

---

## 2) Tech stack

### Platform & app framework
- **Expo** (`expo` ~54.x)
- **React Native** (`react-native` 0.81.x)
- **React** (`react` 19.x)
- **Expo Router** (`expo-router` ~6.x) for **file-based navigation**
- **React Navigation Drawer** (`@react-navigation/drawer`) integrated via Expo Router group routes

### State & async
- **Zustand** (`zustand` ^5.x) for:
  - driver online/offline state
  - active trip context
  - pending WebSocket order offers
  - computed home summary and fare details
- **React Query** (`@tanstack/react-query`) with a shared `QueryClientProvider` at app root

### Networking & API layer
- **axios** for REST APIs
- A central axios wrapper with interceptors:
  - sets REST base URL
  - injects `Authorization: Bearer <token>` when needed
  - drives a global loading overlay

### Real-time
- **WebSocket** for `/ws/driver/location`
  - native: Authorization header on handshake
  - web: fallback query token (dev-only)
- Driver periodically pushes location frames while online

### Location & maps
- **Expo Location** (`expo-location`) for:
  - foreground permission requests
  - live location watch for map rendering
  - periodic “ping” location reads for WebSocket frames
- **Maps rendering**:
  - Active trip uses a **WebView** running an HTML map
  - Map implementation inside the WebView:
    - **MapLibre GL** for map rendering
    - **Ola Maps** vector tiles
    - trip routing via **Ola Directions REST**
  - Driver map markers & route line are updated by RN → WebView `injectJavaScript`.

### UI / styling / utilities
- **react-native-reanimated** for animations
- **react-native-gesture-handler** + Expo Router compatible root import
- **expo-image-picker** for onboarding image selection
- **expo-notifications** permission handling (used in the permissions screen)
- **expo-secure-store** for storing the access token on native
- **AsyncStorage** for non-sensitive persisted values (language, trip context, etc.)
- **i18next + react-i18next** for translations
- **zod** is included (used elsewhere in the project, not heavily in the flow above)
- **UPI QR rendering** uses `react-native-qrcode-svg` inside the UPI screen/components

### Dependencies (from `package.json`)
- `expo`, `react-native`, `expo-router`
- `zustand`
- `@tanstack/react-query`
- `axios`
- `expo-location`, `expo-image-picker`, `expo-notifications`, `expo-secure-store`
- `react-native-webview` (map WebView)
- `react-native-reanimated`, `react-native-gesture-handler`
- `i18next`, `react-i18next`, `@expo-google-fonts/noto-sans`

---

## 3) Repository structure (how to navigate the code)

This project uses `app/` for Expo Router entries and `components/screens/` for actual screen implementations.

Key folders:
- `app/` — Expo Router route entry files (thin wrappers)
- `components/screens/` — screen-level implementation folders
- `components/` — reusable UI components (buttons, loaders, map webview wrapper, onboarding header, etc.)
- `lib/` — business logic pieces:
  - `lib/driver-store.js` — central Zustand store
  - `lib/api/*` — REST API calls (authentication, onboarding, driver orders, meta options, etc.)
  - `lib/realtime/*` — WebSocket parsing/connection helpers
  - `lib/location/*` — location helpers for live watch + location ping payloads
  - `lib/maps/*` — route generation + Map types + WebView HTML document glue
  - `lib/hooks/*` — custom hooks:
    - driver WebSocket
    - live location for map
    - navigation back guard during active trip
- `services/` — “service-level” pure functions; currently Ola routing lives here
- `constants/` — theme, map defaults, external URLs, Ola maps constants
- `theme/` — (if used for colors etc; project primarily uses `constants/theme.js`)
- `doc/` — documentation assets (includes Ola map doc)

---

## 4) Boot & routing flow (entry points)

### Root layout: `app/_layout.jsx`
At app launch, `RootLayout` does these boot steps before showing navigation:
1. Imports gesture-handler and reanimated prerequisites.
2. Initializes:
   - Fonts (`useFonts` with `NotoSans`)
   - I18n (`ensureI18nInitialized`)
   - Access token hydration (`hydrateAccessToken`)
   - Trip persistence hydration (`hydratePersistedTripFromStorage`)
   - Trip persistence subscription (`initDriverTripPersistenceSubscription`)
   - API base URL hydration (`hydrateApiBaseFromStorage`)
3. Shows a **DevBackendUrlModal** when backend URL prompt is enabled and not confirmed.
4. Mounts navigation stack using Expo Router:
   - `index` → `login`
   - `verifyOtp`
   - `onboarding` stack (owner/vehicle/driver)
   - `verificationPending`
   - `permissions`
   - driver drawer group `(drawer)`:
     - `home`, `settings`, `myEarnings`, `bankDetails`, `appLanguage`
   - active trip/payment/rating screens:
     - `activeTrip`, `orderFare`, `collectPayment`, `cashPayment`, `upiScan`, `paymentReceived`, `rating`, `tripHistory`

### Drawer layout
- `app/(drawer)/_layout.jsx` uses `expo-router/drawer` with `CustomDrawerContent`.
- Drawer screen options are shared from `lib/navigation/DrawerNavigator.jsx`.

---

## 5) End-to-end flow (screens + data lifecycle)

### 5.1 Authentication: Login → OTP verification

#### `app/login.jsx`
1. User enters a 10-digit phone number.
2. App calls `postOtpRequest` (in `lib/api/auth.js`) with:
   - `userType` = driver
   - `countryCode` (default `+91`)
   - `phoneNumber` normalized to digits
3. On success, it navigates to:
   - `/verifyOtp` with URL params (`phone`, `countryCode`, `expiresIn`)

#### `app/verifyOtp.jsx`
1. Renders a multi-digit `OtpInput`.
2. Auto-verifies once all OTP digits are filled (no repeated submits for the same OTP).
3. On verify success:
   - extracts access token from OTP verify response (`extractAccessToken`)
   - stores token (`setAccessToken`)
   - persists logged-in phone (`setStoredPhoneNumber`)
   - syncs UI language with backend:
     - if a stored language code exists, `postUserLanguage(langCode)`
   - fetches backend onboarding routing:
     - `GET /app/state` via `getAppState`
     - routes using `replaceForAppState()`
4. Fallback: if app-state fetch fails, it routes to onboarding owner.

---

### 5.2 Onboarding: Owner → Vehicle → Driver

Onboarding routing group:
- `app/onboarding/_layout.jsx` mounts a stack without headers.

#### Owner step: `app/onboarding/owner.jsx`
- UI collects driver owner details and uploads 3 images:
  - `aadhaar`
  - `pan`
  - `selfie`
- Upload process:
  - pick images using `expo-image-picker`
  - upload directly to S3 using `uploadLocalImageToS3` (`lib/api/upload.js`)
  - on success, call `postOnboardingOwner`
- Caching:
  - prefill from `lib/storage/onboarding-owner-cache.js`
  - after submission, caches owner name to enable fast driver prefill
- Navigation to the next step: `/onboarding/vehicle`

#### Vehicle step: `app/onboarding/vehicle.jsx`
- Loads meta dropdown options from:
  - `getVehicleOnboardingMeta()` → `GET /meta/options`
- Fields:
  - registration number (with regex validation)
  - RC document upload to S3
  - vehicle type + body type (meta dropdown grids)
  - body spec selection (meta option dropdown)
- On success:
  - calls `postOnboardingVehicle`
  - navigates to `/onboarding/driver`
- Also supports optional refresh param to re-fetch backend vehicle details.

#### Driver step: `app/onboarding/driver.jsx`
- Driver fields include:
  - whether the driver is self-driving (`selfDrive`)
  - driver name + phone only when not self-driving (name/phone comes from owner + stored phone otherwise)
  - driver license upload to S3
- On success:
  - calls `postOnboardingDriver`
  - clears onboarding caches
  - navigates to `/verificationPending`

---

### 5.3 Verification pending → Permissions

`app/verificationPending.jsx`
- Shows “verification will take time” UI.
- Includes:
  - contact support button
  - “demo skip” action that routes to `/permissions`

---

### 5.4 Permissions gate

`app/permissions.jsx`
- Checks three permissions:
  - Location (foreground)
  - Camera
  - Notifications
- Uses a screen-level state `statusMap` and handles:
  - `granted`, `denied`, `blocked`, `unavailable`
- “Grant” button:
  - requests each permission if needed
  - if all granted → routes to `/home`
- If permissions are blocked:
  - shows “Open Settings” button

---

### 5.5 Driver dashboard: Home (online/offline + offer accept/decline)

`app/(drawer)/home.jsx`
- Shows a map-like background:
  - `MapGridBackground` (visual only)
- Core state sources:
  - `useDriverStore(...)` for:
    - `isOnline`
    - `pendingNewOrder`
    - summary stats
    - `canGoOnline` and `homeBlock`
  - `useDriverOnlineWebSocket(isOnline)` which:
    - connects to WebSocket while online
    - sends location frames periodically
    - receives server `NEW_ORDER` and sets `pendingNewOrder`

#### Home summary loading
- Calls `getDriverHomeSummary()` (`lib/api/driver-home.js`) to populate:
  - today earnings
  - trip counts
  - hours online
  - distance km

#### Online search + offer modal
- When WebSocket sets `pendingNewOrder` and driver is online:
  - show “New Order!” modal with a 30s countdown
  - the modal shows pickup/drop and estimated fare
- Decline flow:
  - call `postDeclineDriverOrder(orderId)`
  - clear `pendingNewOrder`
  - re-enter searching state
- Accept flow:
  - call `postAcceptDriverOrder(orderId)`
  - set `activeTrip` to a `MockTrip` based on `mockTripFromNewOrder`
  - set `tripPhase = "to_pickup"` and `tripStatus = "ASSIGNED"`
  - navigate to `/activeTrip`

---

### 5.6 Real-time trip map and location

There are two separate location behaviors:
1. **Live location for map rendering** (smooth updates):
   - Hook: `lib/hooks/useDriverLiveLocation.js`
   - Uses `Location.watchPositionAsync` (native only)
2. **Periodic location ping frames for backend** (WebSocket):
   - Hook: `lib/hooks/useDriverOnlineWebSocket.js`
   - Uses `getDriverCoordsForLocationPing()` which prefers last-known position
   - Pushes LOCATION frames on an interval defined in `lib/config.js`

WebSocket parsing:
- `lib/realtime/driver-ws-incoming.js` interprets JSON frames:
  - `NEW_ORDER` → store `pendingNewOrder`
  - `ACK` / `LOCATION_ACK` / `ERROR` → debug + status updates

---

## 6) Active Trip lifecycle (the “big” flow)

Screen: `app/activeTrip.jsx`

### Navigation guard
The screen calls:
- `useOnlineTripNavigationGuard({ enabled: true })`

This prevents accidental back navigation while the trip workflow is active.

### Trip phases
The phases stored in Zustand are:
- `to_pickup`
- `waiting_pickup` (transitional; app converts to `start_otp`)
- `start_otp`
- `to_drop`
- `unloading`
- `done`

The UI advances phases by local `setTripPhase()` and API calls to the backend.

### Route fetching & map updates
Map rendering:
- Uses `OlaTripMapWebView` (WebView) on native platforms.
- On web platform, it uses `MapGridBackground` (no live map).

Route coordinates:
- Computed by `fetchRouteCoordinates` in `lib/maps/buildTripRoute.js`:
  - if `EXPO_PUBLIC_OLA_MAPS_API_KEY` exists:
    - fetch route geometry using `services/olaDirections.js`
    - decode polyline from Ola directions response
    - downsample to a maximum number of points (performance)
  - otherwise:
    - fallback to interpolation straight line segments

Off-route refresh:
- `ActiveTripScreen` periodically decides when to refresh routes using:
  - distance to polyline (`distanceToPolylineMeters`)
  - route refresh cooldown
  - off-route threshold

### Phase actions (API calls happen in `lib/api/driver-orders.js`)

#### `to_pickup` → “Arrived at Pickup”
1. Calls `postArrivedAtPickup(orderId, coords)` with driver coords from:
   - `getDriverCoordsOrNull()` in `lib/location/driver-coords.js`
2. Updates active trip:
   - patches pickup latitude/longitude
   - sets `tripStatus = ARRIVED_PICKUP`
3. Advances UI:
   - `setPhase("start_otp")`

#### `start_otp` → “Confirm start trip”
1. Driver enters 4-digit customer OTP (`OtpInput`)
2. Swipe button triggers `postConfirmStartTrip(orderId, { lat, lon, otp })`
3. On success:
   - patches pickup coords
   - sets `tripStatus = STARTED`
   - phase advances to `to_drop`

#### `to_drop` → “Arrived at Drop”
1. Calls `postArrivedAtDrop(orderId, coords)`
2. Patches drop coords
3. Phase advances to `unloading`

#### `unloading` → “End trip”
1. Swipe button triggers:
   - `postEndTrip(orderId, coords)`
2. Sets status `COMPLETED`
3. Routes to `/orderFare`

### Cancel trip (optional)
From the top-right menu, a cancel sheet is opened.
Flow:
1. validate that cancellation is allowed for current phase (`to_pickup` or `start_otp`)
2. fetch cancellation reasons via meta API:
   - `getMetaOptions([MetaCategory.CANCELLATION_REASON_ORDER])`
3. call `postCancelTrip(orderId, reasonCode)`
4. update store:
   - `tripStatus = CANCELLED`
   - restore home UI by:
     - `resetTripFlow()`
     - `router.replace("/home")`

---

## 7) Fare, payment, and rating

### 7.1 Fare: `app/orderFare.jsx`
1. Loads fare details via `getDriverOrderFare(orderId)`
2. API endpoint:
   - `GET /driver/orders/{orderId}/fare` (in `lib/api/driver-orders.js`)
3. Stores:
   - `orderFareDetail`
   - patches active trip with:
     - `estimatedFare`
     - `fareBreakdown`
4. UI selects enabled payment options (only CASH and UPI are surfaced):
   - routes to `/cashPayment` or `/upiScan`

### 7.2 Payment: Cash vs UPI

#### Cash: `app/cashPayment.jsx`
- Displays fare summary + breakdown (from store orderFareDetail or trip fallback)
- User confirms cash was collected
- Calls:
  - `postConfirmTripPayment(orderId, "CASH")`
- Routes to `/paymentReceived`

#### UPI: `app/upiScan.jsx`
- Finds UPI payment method enabled and uses `meta.qrCode` from `orderFareDetail`
- Displays QR using `components/payment/UpiQrDisplay`
- Calls:
  - `postConfirmTripPayment(orderId, "UPI")`
- Routes to `/paymentReceived`
- There is a “simulate success” button (primarily for dev/testing flow).

### 7.3 Payment confirmation screen
`app/paymentReceived.jsx`
- Plays a checkmark animation
- After ~2s:
  - routes to `/rating`

### 7.4 Rating: `app/rating.jsx`
Flow:
1. Loads rating reasons (meta options) when needed:
   - `getMetaOptions([MetaCategory.RATING_REASON])`
2. UI:
   - choose 1–5 stars
   - if stars <= 3:
     - show reason list (multi-select)
3. Submit:
   - `postDriverOrderRating(orderId, { rating, reasonCodes?, feedback? })`
4. After submit (or skip):
   - call `endTripSession()` (clears the trip from store)
   - route to `/home`

---

## 8) Mapping & route geometry implementation details

### WebView map wrapper: `components/maps/OlaTripMapWebView.jsx`
Responsibilities:
- Renders a `react-native-webview` HTML document containing MapLibre + Ola tiles.
- Accepts props:
  - `driver`, `pickup`, `drop`
  - `routeCoordinates` (lat/lng points)
  - `showDropMarker`
  - `mapPadding`
- Creates a “layout key” to determine when to re-fit camera.
- Keeps driver marker motion smooth by:
  - injecting `MAP_SYNC` payload with driver/pickup/drop/route data

### HTML map document: `lib/maps/olaTripMapWebDocument.js`
This file generates a full HTML string which:
- Instantiates a MapLibre map
- Defines markers:
  - driver marker (truck emoji-like div)
  - pickup pin marker
  - drop pin marker
- Defines a `window.__olaDispatch(payload)` handler:
  - updates markers positions
  - draws a route line on a GeoJSON source
  - animates driver marker transitions smoothly using requestAnimationFrame

### Route geometry service: `services/olaDirections.js`
It:
- Calls Ola routing REST endpoint (`/routing/v1/directions`)
- Decodes the returned polyline/geometry into `RoutePoint[]`
- Throws when no geometry is returned, and the caller falls back to interpolation.

---

## 9) Central state management (Zustand)

Main store:
- `lib/driver-store.js`

Important pieces:
- `isOnline`: driver online/offline
- `pendingNewOrder`: offer received via WebSocket
- `activeTrip`: a `MockTrip` object containing:
  - coordinates and addresses
  - estimated fare and breakdown
  - OTP for start trip (demo/mock field)
- `tripPhase` / `tripStatus`:
  - drives ActiveTripScreen UI
- `orderFareDetail` and `selectedTripPaymentMethod`

Trip persistence:
- `hydratePersistedTripFromStorage()`
  - loads active trip context from AsyncStorage if a token exists
- `initDriverTripPersistenceSubscription()`
  - subscribes to store changes and writes persisted trip state to disk

---

## 10) API infrastructure & error handling

### axios client: `lib/api/client.js`
Interceptors:
- Request:
  - sets base URL using `getApiBaseUrl()`
  - attaches bearer token unless `skipAuth` is set on the request config
  - optionally logs requests if API debug is enabled
- Response:
  - optional response logging

Global error messaging:
- `getApiErrorMessage(err)` converts errors into human-friendly text:
  - timeouts, session expired (401), permission denied (403), etc.

### Global loader overlay
- `lib/stores/app-loading-store.js` tracks in-flight axios requests.
- `lib/api/global-loader-interceptor.js` increments/decrements the loader depth.
- `components/ui/AppLoader.jsx` displays a full-screen loader after a short delay (to avoid flicker).

---

## 11) Environment variables (safe documentation)

Your `.env.example` currently includes:
- REST API URL
- Ola Maps API key
- Optional debug flags
- Direct S3 upload credentials

This MD file **will not embed any secret values** (only variable names).

Key variables to document (names only):
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SHOW_API_URL_PROMPT` (dev-only feature)
- `EXPO_PUBLIC_OLA_MAPS_API_KEY`
- `EXPO_PUBLIC_API_DEBUG`
- `EXPO_PUBLIC_USERS_LANGUAGE_PATH` (optional override)
- `EXPO_PUBLIC_APP_STATE_PATH` (optional override)
- `EXPO_PUBLIC_META_OPTIONS_PATH` (optional override)
- `EXPO_PUBLIC_AUTH_LOGOUT_PATH` (optional override)
- `EXPO_PUBLIC_WS_URL` / `EXPO_PUBLIC_WS_PATH` (optional WebSocket configuration)
- `EXPO_PUBLIC_DRIVER_LOCATION_INTERVAL_MS` (optional, default 30000ms)
- S3 upload:
  - `EXPO_PUBLIC_AWS_REGION`
  - `EXPO_PUBLIC_AWS_ACCESS_KEY_ID`
  - `EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY`
  - `EXPO_PUBLIC_S3_BUCKET_NAME`
  - `EXPO_PUBLIC_S3_UPLOAD_PREFIX`

Security note:
- This app performs **direct-to-S3 uploads from the client**. That design requires embedding credentials in the client bundle.
- The `.env.example` in this repo contains example credential values; treat them as compromised and rotate/remove any real production keys.

---

## 12) Key files to reference (for quick navigation)

Routing / boot:
- `app/_layout.jsx`
- `app/(drawer)/_layout.jsx`

Auth:
- `app/login.jsx`
- `app/verifyOtp.jsx`
- `lib/api/auth.js`

Onboarding:
- `app/onboarding/owner.jsx`
- `app/onboarding/vehicle.jsx`
- `app/onboarding/driver.jsx`
- `lib/api/onboarding.js`
- `lib/api/upload.js`

Permissions:
- `app/permissions.jsx`

Realtime & state:
- `lib/driver-store.js`
- `lib/hooks/useDriverOnlineWebSocket.js`
- `lib/realtime/driver-websocket.js`
- `lib/realtime/driver-ws-incoming.js`

Trip:
- `app/activeTrip.jsx`
- `lib/hooks/useDriverLiveLocation.js`
- `lib/api/driver-orders.js`
- `lib/location/driver-coords.js`
- `lib/maps/buildTripRoute.js`
- `components/maps/OlaTripMapWebView.jsx`
- `lib/maps/olaTripMapWebDocument.js`

Fare/payment/rating:
- `app/orderFare.jsx`
- `app/cashPayment.jsx`
- `app/upiScan.jsx`
- `app/paymentReceived.jsx`
- `app/rating.jsx`

---

## 13) Existing map documentation

There is an Ola/Map implementation doc here:
- `doc/ola-maps.md`

If you’re explaining the map system to someone else, start with that doc and then connect it to:
- `components/maps/OlaTripMapWebView.jsx`
- `lib/maps/olaTripMapWebDocument.js`
- `lib/maps/buildTripRoute.js`

