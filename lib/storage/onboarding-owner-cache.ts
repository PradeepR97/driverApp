import AsyncStorage from '@react-native-async-storage/async-storage';

export type CachedOwnerOnboarding = {
  name?: string | null;
  ownerSelfieDocumentId?: string | null;
  ownerAdharDocumentId?: string | null;
  ownerPanDocumentId?: string | null;
  updatedAt: number;
};

export const OWNER_ONBOARDING_CACHE_KEY = '@driver/onboarding_owner_cache';

export async function getCachedOwnerOnboarding(): Promise<CachedOwnerOnboarding | null> {
  try {
    const raw = await AsyncStorage.getItem(OWNER_ONBOARDING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedOwnerOnboarding;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedOwnerOnboarding(
  data: Omit<CachedOwnerOnboarding, 'updatedAt'>,
): Promise<void> {
  try {
    const payload: CachedOwnerOnboarding = { ...data, updatedAt: Date.now() };
    await AsyncStorage.setItem(OWNER_ONBOARDING_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export async function clearCachedOwnerOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OWNER_ONBOARDING_CACHE_KEY);
  } catch {
    // ignore
  }
}

