/* eslint-disable import/no-duplicates -- RNGH docs: side-effect import then root view from same entry */
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
/* eslint-enable import/no-duplicates */
import "react-native-get-random-values";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardDismissView } from "@/shared/keyboard/KeyboardDismissView";
import { DevBackendUrlModal } from "@/shared/dev/DevBackendUrlModal";
import { AppLoader } from "@/shared/ui/AppLoader";
import { AppToast } from "@/shared/ui/AppToast";
import { Colors } from "@/config/theme";
import { hydrateApiBaseFromStorage, shouldShowBackendUrlSetupModal, } from "@/config/apiBaseUrl";
import { getAccessToken, hydrateAccessToken } from "@/lib/auth-session";
import { hydratePersistedTripFromStorage, initDriverTripPersistenceSubscription, } from "@/lib/driver-store";
import { ensureI18nInitialized } from "@/lib/i18n";
import { syncAndRouteFromAppState } from "@/lib/navigation/sync-app-state";
import { queryClient } from "@/lib/query-client";
import { useAppToastStore } from "@/lib/stores/app-toast-store";
import { clearOnboardingCaches } from "@/lib/storage/onboarding-cache";
import { NotoSans_400Regular, NotoSans_600SemiBold, NotoSans_700Bold, NotoSans_800ExtraBold, useFonts, } from "@expo-google-fonts/noto-sans";
function AuthBootstrap() {
    const router = useRouter();
    useEffect(() => {
        void (async () => {
            await hydrateAccessToken();
            await hydratePersistedTripFromStorage();
            initDriverTripPersistenceSubscription();
            if (getAccessToken()) {
                await syncAndRouteFromAppState(router).catch(() => { });
            }
        })();
    }, [router]);
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
function I18nBootstrap({ onReady }) {
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
                }
                catch {
                    /* noop */
                }
                return;
            }
            try {
                await NavigationBar.setButtonStyleAsync("dark");
            }
            catch {
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
    const [apiBaseHydrated, setApiBaseHydrated] = useState(false);
    const [devBackendUrlConfirmed, setDevBackendUrlConfirmed] = useState(!shouldShowBackendUrlSetupModal);
    const toastVisible = useAppToastStore((s) => s.visible);
    const toastMessage = useAppToastStore((s) => s.message);
    const toastVariant = useAppToastStore((s) => s.variant);
    const dismissToast = useAppToastStore((s) => s.dismissToast);
    useEffect(() => {
        void hydrateApiBaseFromStorage().then(() => setApiBaseHydrated(true));
    }, []);
    const fontsAndI18nReady = i18nReady && fontsLoaded;
    if (!fontsAndI18nReady || !apiBaseHydrated) {
        return (<SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap />
          <DevCacheBootstrap />
          <SystemUiBootstrap />
          <I18nBootstrap onReady={() => setI18nReady(true)}/>
        </QueryClientProvider>
      </SafeAreaProvider>);
    }
    if (shouldShowBackendUrlSetupModal && !devBackendUrlConfirmed) {
        return (<SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap />
          <DevCacheBootstrap />
          <SystemUiBootstrap />
          <I18nBootstrap onReady={() => setI18nReady(true)}/>
          <DevBackendUrlModal visible onConfirmed={() => setDevBackendUrlConfirmed(true)}/>
        </QueryClientProvider>
      </SafeAreaProvider>);
    }
    return (<SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        <DevCacheBootstrap />
        <SystemUiBootstrap />
        <I18nBootstrap onReady={() => setI18nReady(true)}/>
        <ThemeProvider value={navTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardDismissView>
              <Stack screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: Colors.background },
        }}>
                <Stack.Screen name="index"/>
                <Stack.Screen name="languageScreen"/>
                <Stack.Screen name="requestOtpScreen"/>
                <Stack.Screen name="verifyOtpScreen"/>
                <Stack.Screen name="onboarding"/>
                <Stack.Screen name="verificationInProgressScreen"/>
                <Stack.Screen name="permissionScreen"/>
                <Stack.Screen name="home" options={{ headerShown: false }}/>
                <Stack.Screen name="driverSearchingScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="driverArrivedatPickupScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="driverStartTripScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="driverArrivedatDropScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="driverEndTripScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="paymentScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="cashPaymentScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="upiPaymentScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="paymentReceivedScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="ratingScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="orderFareScreen" options={{ gestureEnabled: false }}/>
                <Stack.Screen name="tripHistoryScreen"/>
              </Stack>
            </KeyboardDismissView>
            <AppToast visible={toastVisible} message={toastMessage} variant={toastVariant} onDismiss={dismissToast}/>
            <AppLoader />
          </GestureHandlerRootView>
          <StatusBar style="dark" backgroundColor={Colors.background}/>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>);
}
