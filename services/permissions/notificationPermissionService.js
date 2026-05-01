import Constants from 'expo-constants';
function toState(status, canAskAgain) {
    if (status === 'granted')
        return 'granted';
    if (status === 'denied')
        return canAskAgain === false ? 'blocked' : 'denied';
    return 'denied';
}
/**
 * Expo Go cannot use expo-notifications push APIs (SDK 53+); importing the package runs
 * native registration side effects and throws on Android. Skip loading it in Store Client.
 */
export async function requestNotificationPermissionIfAvailable() {
    if (Constants.executionEnvironment === 'storeClient') {
        return;
    }
    try {
        const Notifications = await import('expo-notifications');
        await Notifications.requestPermissionsAsync();
    }
    catch {
        // Native module missing or request failed — non-fatal for onboarding
    }
}
export async function getNotificationPermissionStateIfAvailable() {
    if (Constants.executionEnvironment === 'storeClient') {
        return 'unavailable';
    }
    try {
        const Notifications = await import('expo-notifications');
        const current = await Notifications.getPermissionsAsync();
        return toState(current.status, current.canAskAgain);
    }
    catch {
        return 'unavailable';
    }
}
export async function requestNotificationPermissionStateIfAvailable() {
    if (Constants.executionEnvironment === 'storeClient') {
        return 'unavailable';
    }
    try {
        const Notifications = await import('expo-notifications');
        const result = await Notifications.requestPermissionsAsync();
        return toState(result.status, result.canAskAgain);
    }
    catch {
        return 'denied';
    }
}
