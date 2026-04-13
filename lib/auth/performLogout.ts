import type { Router } from 'expo-router';
import { Alert } from 'react-native';

import { clearAccessTokenFromMemory } from '@/lib/auth-session';
import { useDriverStore } from '@/lib/driver-store';
import { applyDeviceLanguageInMemoryOnly } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';
import { logoutUser } from '@/lib/services/authService';
import { clearAllStorage } from '@/lib/utils/storage';

export type PerformLogoutOptions = {
  router: Router;
  onBeforeNavigate?: () => void;
  /** When the server call fails, still clears locally; optionally inform the user. */
  alertOnApiFailure?: boolean;
};

/**
 * Calls logout API (best-effort), then clears React Query, Zustand driver slice,
 * memory token, and all persisted storage. Resets navigation so back cannot return
 * to authenticated screens.
 */
export async function performLogout(options: PerformLogoutOptions): Promise<void> {
  const { router, onBeforeNavigate, alertOnApiFailure = true } = options;

  try {
    await logoutUser();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Logout request failed';
    if (alertOnApiFailure) {
      Alert.alert('Sign out', `${msg} You will be signed out on this device.`);
    }
  }

  queryClient.clear();
  useDriverStore.getState().logoutReset();
  clearAccessTokenFromMemory();

  try {
    await clearAllStorage();
  } catch {
    // Still navigate — user must not remain in a half-authenticated UI
  }

  applyDeviceLanguageInMemoryOnly();

  onBeforeNavigate?.();
  router.dismissAll();
  router.replace('/');
}
