import AsyncStorage from '@react-native-async-storage/async-storage';

export type CachedVehicleOnboarding = {
  registrationNumber?: string | null;
  city?: string | null;
  vehicleType?: string | null;
  bodyType?: string | null;
  bodySpec?: string | null;
  rcDocumentId?: string | null;
  updatedAt: number;
};

export const VEHICLE_ONBOARDING_CACHE_KEY = '@driver/onboarding_vehicle_cache';

export async function getCachedVehicleOnboarding(): Promise<CachedVehicleOnboarding | null> {
  try {
    const raw = await AsyncStorage.getItem(VEHICLE_ONBOARDING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedVehicleOnboarding;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedVehicleOnboarding(
  data: Omit<CachedVehicleOnboarding, 'updatedAt'>,
): Promise<void> {
  try {
    const payload: CachedVehicleOnboarding = { ...data, updatedAt: Date.now() };
    await AsyncStorage.setItem(VEHICLE_ONBOARDING_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export async function clearCachedVehicleOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(VEHICLE_ONBOARDING_CACHE_KEY);
  } catch {
    // ignore
  }
}

