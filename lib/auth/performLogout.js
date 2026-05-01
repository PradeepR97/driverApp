import { Alert } from 'react-native';
import { clearAccessTokenFromMemory } from '@/lib/auth-session';
import { useDriverStore } from '@/lib/driver-store';
import { applyDeviceLanguageInMemoryOnly } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';
import { logoutUser } from '@/lib/services/authService';
import { clearAllStorage } from '@/lib/utils/storage';
/**
 * Calls logout API (best-effort), then clears React Query, Zustand driver slice,
 * memory token, and all persisted storage. Resets navigation so back cannot return
 * to authenticated screens.
 */
export async function performLogout(options) {
    const { router, onBeforeNavigate, alertOnApiFailure = true, replaceHref = '/' } = options;
    try {
        await logoutUser();
    }
    catch (e) {
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
    }
    catch {
        // Still navigate — user must not remain in a half-authenticated UI
    }
    applyDeviceLanguageInMemoryOnly();
    onBeforeNavigate?.();
    // Avoid router.dismissAll(): it dispatches POP_TO_TOP, which the root stack often
    // cannot handle (dev warning: "POP_TO_TOP was not handled by any navigator").
    router.replace(replaceHref);
}
