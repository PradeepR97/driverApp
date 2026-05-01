import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
export const AUTH_SECURE_STORE_KEY = 'driver_access_token';
export const AUTH_WEB_ASYNC_KEY = '@driver/access_token';
const SECURE_KEY = AUTH_SECURE_STORE_KEY;
const WEB_KEY = AUTH_WEB_ASYNC_KEY;
let memoryToken = null;
export function getAccessToken() {
    return memoryToken;
}
export async function hydrateAccessToken() {
    try {
        if (Platform.OS === 'web') {
            memoryToken = await AsyncStorage.getItem(WEB_KEY);
        }
        else {
            memoryToken = await SecureStore.getItemAsync(SECURE_KEY);
        }
    }
    catch {
        memoryToken = null;
    }
}
export async function setAccessToken(token) {
    memoryToken = token;
    try {
        if (Platform.OS === 'web') {
            if (token)
                await AsyncStorage.setItem(WEB_KEY, token);
            else
                await AsyncStorage.removeItem(WEB_KEY);
        }
        else if (token) {
            await SecureStore.setItemAsync(SECURE_KEY, token);
        }
        else {
            await SecureStore.deleteItemAsync(SECURE_KEY);
        }
    }
    catch {
        // Storage failure — token stays in memory for this session only
    }
}
export async function clearSession() {
    await setAccessToken(null);
}
/** Sync-only: stop sending Bearer immediately (e.g. before bulk storage clear). */
export function clearAccessTokenFromMemory() {
    memoryToken = null;
}
