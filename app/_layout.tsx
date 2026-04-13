/* eslint-disable import/no-duplicates -- RNGH docs: side-effect import then root view from same entry */
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
/* eslint-enable import/no-duplicates */
import "react-native-get-random-values";

import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { KeyboardDismissView } from "@/components/keyboard/KeyboardDismissView";
import { AppLoader } from "@/components/ui/AppLoader";
import { Colors } from "@/constants/theme";
import { hydrateAccessToken } from "@/lib/auth-session";
import {
    hydratePersistedTripFromStorage,
    initDriverTripPersistenceSubscription,
} from "@/lib/driver-store";
import { ensureI18nInitialized } from "@/lib/i18n";
import { queryClient } from "@/lib/query-client";
import { clearOnboardingCaches } from "@/lib/storage/onboarding-cache";
import {
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    NotoSans_800ExtraBold,
    useFonts,
} from "@expo-google-fonts/noto-sans";

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

function DevCacheBootstrap() {
  useEffect(() => {
    if (__DEV__) {
      void clearOnboardingCaches({ includeDriver: true });
    }
  }, []);
  return null;
}

function I18nBootstrap({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    void (async () => {
      await ensureI18nInitialized();
      onReady();
    })();
  }, [onReady]);
  return null;
}

/**
 * Root window / nav bar styling.
 * With `android.edgeToEdgeEnabled` (see app.json), `setBackgroundColorAsync` is not supported and logs a warning.
 */
function SystemUiBootstrap() {
  useEffect(() => {
    void (async () => {
      if (Platform.OS === "ios") {
        try {
          await SystemUI.setBackgroundColorAsync(Colors.background);
        } catch {
          /* noop */
        }
        return;
      }
      try {
        await NavigationBar.setButtonStyleAsync("dark");
      } catch {
        /* noop */
      }
    })();
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
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    NotoSans_800ExtraBold,
  });
  const ready = i18nReady && fontsLoaded;

  if (!ready) {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap />
          <DevCacheBootstrap />
          <SystemUiBootstrap />
          <I18nBootstrap onReady={() => setI18nReady(true)} />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        <DevCacheBootstrap />
        <SystemUiBootstrap />
        <I18nBootstrap onReady={() => setI18nReady(true)} />
        <ThemeProvider value={navTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardDismissView>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  contentStyle: { backgroundColor: Colors.background },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="verify-otp" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="verification-pending" />
                <Stack.Screen name="permissions" />
                <Stack.Screen
                  name="(drawer)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="active-trip" />
                <Stack.Screen name="collect-payment" />
                <Stack.Screen name="cash-payment" />
                <Stack.Screen name="upi-scan" />
                <Stack.Screen
                  name="payment-received"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="rating" />
                <Stack.Screen name="trip-history" />
              </Stack>
            </KeyboardDismissView>
            <AppLoader />
          </GestureHandlerRootView>
          <StatusBar style="dark" backgroundColor={Colors.background} />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
