import AsyncStorage from '@react-native-async-storage/async-storage';
export const VEHICLE_ONBOARDING_CACHE_KEY = '@driver/onboarding_vehicle_cache';
export async function getCachedVehicleOnboarding() {
    try {
        const raw = await AsyncStorage.getItem(VEHICLE_ONBOARDING_CACHE_KEY);
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
export async function setCachedVehicleOnboarding(data) {
    try {
        const payload = { ...data, updatedAt: Date.now() };
        await AsyncStorage.setItem(VEHICLE_ONBOARDING_CACHE_KEY, JSON.stringify(payload));
    }
    catch {
        // ignore
    }
}
export async function clearCachedVehicleOnboarding() {
    try {
        await AsyncStorage.removeItem(VEHICLE_ONBOARDING_CACHE_KEY);
    }
    catch {
        // ignore
    }
}
