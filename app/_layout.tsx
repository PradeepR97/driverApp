import 'react-native-gesture-handler';
import 'react-native-get-random-values';

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { hydrateAccessToken } from '@/lib/auth-session';
import { hydratePersistedTripFromStorage, initDriverTripPersistenceSubscription } from '@/lib/driver-store';
import { queryClient } from '@/lib/query-client';

function AuthBootstrap() {
  useEffect(() => {
    void (async () => {
      await hydrateAccessToken();
      await hydratePersistedTripFromStorage();
      initDriverTripPersistenceSubscription();
    })();
  }, []);
  return null;
}

/** Root window background (Android edge-to-edge / gesture nav). */
function SystemUiBootstrap() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Colors.background);
  }, []);
  return null;
}

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.background,
    primary: Colors.primary,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        <SystemUiBootstrap />
        <ThemeProvider value={navTheme}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="verification-pending" />
            <Stack.Screen name="permissions" />
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            <Stack.Screen name="active-trip" />
            <Stack.Screen name="collect-payment" />
            <Stack.Screen name="rating" />
            <Stack.Screen name="trip-history" />
          </Stack>
          <StatusBar style="dark" backgroundColor={Colors.background} />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
