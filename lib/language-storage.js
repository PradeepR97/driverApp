import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@driver/app_language';
/** API `language` field (e.g. EN, HI, TA). */
export async function getStoredLanguageCode() {
    try {
        return await AsyncStorage.getItem(KEY);
    }
    catch {
        return null;
    }
}
export async function setStoredLanguageCode(code) {
    try {
        await AsyncStorage.setItem(KEY, code);
    }
    catch {
        /* ignore */
    }
}
