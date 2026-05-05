import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";
const ORDER_ALERT_DURATION_MS = 30_000;
/** Bundled dragon-studio-alert track (loops for full 30s window). */
const NEW_ORDER_ALERT_MP3 = require("../../assets/sounds/new-order-alert.mp3");
/** @type {{ sound: object; endTimer: ReturnType<typeof setTimeout>; stopVibe: () => void } | null} */
let activeOrderAlert = null;
function clearActiveOrderAlert() {
    const s = activeOrderAlert;
    if (!s)
        return;
    activeOrderAlert = null;
    clearTimeout(s.endTimer);
    try {
        s.stopVibe();
    }
    catch {
        /* no-op */
    }
    void s.sound.stopAsync().then(() => s.sound.unloadAsync()).catch(() => { });
}
/**
 * Stop looping sound + vibration (e.g. user accepted / declined / went offline).
 */
export function stopNewOrderAlertPlayback() {
    clearActiveOrderAlert();
}
function startOrderAlertVibration(durationMs) {
    if (Platform.OS === "web") {
        return () => { };
    }
    Vibration.cancel();
    let intervalId = null;
    const timeoutId = setTimeout(() => {
        if (intervalId)
            clearInterval(intervalId);
        Vibration.cancel();
    }, durationMs);
    try {
        if (Platform.OS === "android") {
            Vibration.vibrate([0, 500, 220, 500], 1);
        }
        else {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
            intervalId = setInterval(() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
                void Vibration.vibrate(260);
            }, 580);
        }
    }
    catch {
        /* ignore vibration setup failures */
    }
    return () => {
        clearTimeout(timeoutId);
        if (intervalId)
            clearInterval(intervalId);
        Vibration.cancel();
    };
}
/**
 * Loop the new-order MP3 for 30s plus continuous vibration pattern.
 */
export async function playNewOrderAlertSound() {
    clearActiveOrderAlert();
    const stopVibe = startOrderAlertVibration(ORDER_ALERT_DURATION_MS);
    try {
        const { Audio } = await import("expo-av");
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(NEW_ORDER_ALERT_MP3, {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
        });
        const endTimer = setTimeout(() => {
            clearActiveOrderAlert();
        }, ORDER_ALERT_DURATION_MS);
        activeOrderAlert = { sound, endTimer, stopVibe: stopVibe };
    }
    catch {
        stopVibe();
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        catch {
            /* no-op */
        }
    }
}
