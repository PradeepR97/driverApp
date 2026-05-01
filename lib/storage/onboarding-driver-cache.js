import AsyncStorage from '@react-native-async-storage/async-storage';
export const DRIVER_ONBOARDING_CACHE_KEY = '@driver/onboarding_driver_cache';
export async function setCachedDriverOnboarding(data) {
    try {
        const payload = { ...data, updatedAt: Date.now() };
        await AsyncStorage.setItem(DRIVER_ONBOARDING_CACHE_KEY, JSON.stringify(payload));
    }
    catch {
        // ignore
    }
}
export async function clearCachedDriverOnboarding() {
    try {
        await AsyncStorage.removeItem(DRIVER_ONBOARDING_CACHE_KEY);
    }
    catch {
        // ignore
    }
}
