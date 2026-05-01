import Constants from 'expo-constants';

let notificationHandlerSet = false;
const ORDER_ALERT_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
async function ensureNotificationHandler(Notifications) {
    if (notificationHandlerSet) {
        return;
    }
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: false,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
        }),
    });
    notificationHandlerSet = true;
}
/**
 * Plays a short default notification sound when a NEW_ORDER message arrives.
 * Falls back to haptic feedback when notifications are unavailable/denied.
 */
export async function playNewOrderAlertSound() {
    // Expo Go (storeClient) cannot use expo-notifications push-related internals on SDK 53+.
    // Use in-app sound playback instead.
    if (Constants.executionEnvironment === 'storeClient') {
        try {
            const { Audio } = await import('expo-av');
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });
            const sound = new Audio.Sound();
            try {
                await sound.loadAsync({ uri: ORDER_ALERT_SOUND_URL }, { shouldPlay: true, volume: 1.0 });
            }
            finally {
                setTimeout(() => {
                    void sound.unloadAsync().catch(() => { });
                }, 2500);
            }
            return;
        }
        catch {
            // Fall through to haptic fallback.
        }
    }
    try {
        const Notifications = await import('expo-notifications');
        await ensureNotificationHandler(Notifications);
        const permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) {
            throw new Error('notifications permission not granted');
        }
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'New order',
                body: 'You have received a new order.',
                sound: 'default',
            },
            trigger: null,
        });
        return;
    }
    catch {
        // Keep a tactile signal even if notification sound cannot play.
    }
    try {
        const Haptics = await import('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    catch {
        // No-op fallback.
    }
}
