import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AUTH_SECURE_STORE_KEY } from '@/lib/auth-session';

/**
 * Wipes app AsyncStorage (language, web token, onboarding flags, etc.) and removes
 * the native secure token. Call after clearing in-memory session if needed.
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch {
    // ignore
  }
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(AUTH_SECURE_STORE_KEY);
    } catch {
      // ignore — key may already be absent
    }
  }
}
