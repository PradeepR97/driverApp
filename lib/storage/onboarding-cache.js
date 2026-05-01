import AsyncStorage from '@react-native-async-storage/async-storage';
import { DRIVER_ONBOARDING_CACHE_KEY } from '@/lib/storage/onboarding-driver-cache';
import { OWNER_ONBOARDING_CACHE_KEY } from '@/lib/storage/onboarding-owner-cache';
import { VEHICLE_ONBOARDING_CACHE_KEY } from '@/lib/storage/onboarding-vehicle-cache';
/**
 * Clears onboarding draft caches (safe to call anytime).
 * Intentionally does NOT clear auth/session storage.
 */
export async function clearOnboardingCaches(opts) {
    const includeDriver = opts?.includeDriver ?? false;
    const keys = includeDriver
        ? [OWNER_ONBOARDING_CACHE_KEY, VEHICLE_ONBOARDING_CACHE_KEY, DRIVER_ONBOARDING_CACHE_KEY]
        : [OWNER_ONBOARDING_CACHE_KEY, VEHICLE_ONBOARDING_CACHE_KEY];
    try {
        await AsyncStorage.multiRemove(keys);
    }
    catch {
        // ignore
    }
}
