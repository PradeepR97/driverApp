import AsyncStorage from '@react-native-async-storage/async-storage';
export const OWNER_ONBOARDING_CACHE_KEY = '@driver/onboarding_owner_cache';
export async function getCachedOwnerOnboarding() {
    try {
        const raw = await AsyncStorage.getItem(OWNER_ONBOARDING_CACHE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
export async function setCachedOwnerOnboarding(data) {
    try {
        const payload = { ...data, updatedAt: Date.now() };
        await AsyncStorage.setItem(OWNER_ONBOARDING_CACHE_KEY, JSON.stringify(payload));
    }
    catch {
        // ignore
    }
}
export async function clearCachedOwnerOnboarding() {
    try {
        await AsyncStorage.removeItem(OWNER_ONBOARDING_CACHE_KEY);
    }
    catch {
        // ignore
    }
}
