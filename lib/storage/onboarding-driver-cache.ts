import AsyncStorage from '@react-native-async-storage/async-storage';

export type CachedDriverOnboarding = {
  isSelfDriving: boolean;
  name: string | null;
  phoneNumber: string | null;
  driverLicenseUrl: string | null;
  updatedAt: number;
};

export const DRIVER_ONBOARDING_CACHE_KEY = '@driver/onboarding_driver_cache';

export async function setCachedDriverOnboarding(
  data: Omit<CachedDriverOnboarding, 'updatedAt'>,
): Promise<void> {
  try {
    const payload: CachedDriverOnboarding = { ...data, updatedAt: Date.now() };
    await AsyncStorage.setItem(DRIVER_ONBOARDING_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export async function clearCachedDriverOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRIVER_ONBOARDING_CACHE_KEY);
  } catch {
    // ignore
  }
}

