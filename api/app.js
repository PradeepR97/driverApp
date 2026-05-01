import { APP_STATE_PATH, USERS_LANGUAGE_PATH } from '@/config/appConfig';
import { api, expectHttp200, getApiErrorMessage } from './client';
import { isApiFailure } from './types';
/**
 * Sync app language with backend (requires Bearer token).
 * Body shape: `{ language: "EN" }` — align with your API contract if different.
 */
export async function postUserLanguage(language) {
    try {
        const res = await api.post(USERS_LANGUAGE_PATH, { language });
        expectHttp200(res);
        const { data } = res;
        if (isApiFailure(data)) {
            throw new Error(data.message ?? 'Language update failed');
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * Backend may return `{ data: { success, data: { nextScreen, ... } } }` (nested envelope).
 * Walk `.data` until we hit an object that looks like the app-state payload.
 */
function unwrapAppStatePayload(root) {
    let current = root;
    for (let i = 0; i < 6; i++) {
        if (!current || typeof current !== 'object') {
            return current;
        }
        const o = current;
        const looksLikeState = 'nextScreen' in o ||
            'next_screen' in o ||
            'onboardingStatus' in o ||
            'onboarding_status' in o ||
            'driverStatus' in o ||
            'driver_status' in o;
        if (looksLikeState) {
            return current;
        }
        const inner = o.data;
        if (inner != null && typeof inner === 'object') {
            current = inner;
            continue;
        }
        return current;
    }
    return current;
}
function normalizeAppStatePayload(raw) {
    const unwrapped = unwrapAppStatePayload(raw);
    if (!unwrapped || typeof unwrapped !== 'object') {
        return {};
    }
    const o = unwrapped;
    const onboardingStatus = (o.onboardingStatus ?? o.onboarding_status);
    const nextScreen = (o.nextScreen ?? o.next_screen);
    const appScreen = (o.appScreen ?? o.app_screen);
    const driverStatus = (o.driverStatus ?? o.driver_status);
    const preferredLanguage = (o.preferredLanguage ?? o.preferred_language);
    const isNewUser = o.isNewUser ?? o.is_new_user ?? false;
    const rejection = o.rejection ?? null;
    const block = o.block ?? null;
    const activeTrip = o.activeTrip ?? o.active_trip ?? null;
    return {
        isNewUser: Boolean(isNewUser),
        onboardingStatus,
        nextScreen,
        appScreen,
        driverStatus,
        preferredLanguage,
        rejection: rejection && typeof rejection === 'object' ? rejection : null,
        block: block && typeof block === 'object' ? block : null,
        activeTrip: activeTrip && typeof activeTrip === 'object' ? activeTrip : null,
    };
}
/**
 * `GET /app/state` — after OTP + language sync, use with `replaceForAppState`.
 */
export async function getAppState() {
    try {
        const res = await api.get(APP_STATE_PATH);
        expectHttp200(res);
        const { data } = res;
        if (isApiFailure(data)) {
            throw new Error(data.message ?? 'Could not load app state');
        }
        return normalizeAppStatePayload(data.data);
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
