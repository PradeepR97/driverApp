import { APP_STATE_PATH, USERS_LANGUAGE_PATH } from '@/lib/config';

import { api, getApiErrorMessage } from './client';
import type { ApiEnvelope } from './types';
import { isApiFailure } from './types';

/**
 * Sync app language with backend (requires Bearer token).
 * Body shape: `{ language: "EN" }` — align with your API contract if different.
 */
export async function postUserLanguage(language: string): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(USERS_LANGUAGE_PATH, { language });
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Language update failed');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export type OnboardingStatus =
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | string
  | undefined;

export type NextScreenHint =
  | 'owner_details'
  | 'vehicle_details'
  | 'driver_details'
  | 'verification_in_progress'
  | 'login'
  | string
  | undefined;

export type AppStateData = {
  onboardingStatus?: OnboardingStatus;
  nextScreen?: NextScreenHint;
};

/**
 * Backend may return `{ data: { success, data: { nextScreen, ... } } }` (nested envelope).
 * Walk `.data` until we hit an object that looks like the app-state payload.
 */
function unwrapAppStatePayload(root: unknown): unknown {
  let current: unknown = root;
  for (let i = 0; i < 6; i++) {
    if (!current || typeof current !== 'object') {
      return current;
    }
    const o = current as Record<string, unknown>;
    const looksLikeState =
      'nextScreen' in o ||
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

function normalizeAppStatePayload(raw: unknown): AppStateData {
  const unwrapped = unwrapAppStatePayload(raw);
  if (!unwrapped || typeof unwrapped !== 'object') {
    return {};
  }
  const o = unwrapped as Record<string, unknown>;
  const onboardingStatus = (o.onboardingStatus ?? o.onboarding_status) as OnboardingStatus;
  const nextScreen = (o.nextScreen ?? o.next_screen) as NextScreenHint;
  return { onboardingStatus, nextScreen };
}

/**
 * `GET /app/state` — after OTP + language sync, use with `replaceForAppState`.
 */
export async function getAppState(): Promise<AppStateData> {
  try {
    const { data } = await api.get<ApiEnvelope<unknown>>(APP_STATE_PATH);
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not load app state');
    }
    return normalizeAppStatePayload(data.data);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
