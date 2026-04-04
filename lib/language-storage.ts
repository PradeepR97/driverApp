import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@driver/app_language';

/** API `language` field (e.g. EN, HI, TA). */
export async function getStoredLanguageCode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function setStoredLanguageCode(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, code);
  } catch {
    /* ignore */
  }
}
