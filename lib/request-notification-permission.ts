import Constants from 'expo-constants';

/**
 * Expo Go cannot use expo-notifications push APIs (SDK 53+); importing the package runs
 * native registration side effects and throws on Android. Skip loading it in Store Client.
 */
export async function requestNotificationPermissionIfAvailable(): Promise<void> {
  if (Constants.executionEnvironment === 'storeClient') {
    return;
  }
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.requestPermissionsAsync();
  } catch {
    // Native module missing or request failed — non-fatal for onboarding
  }
}
