import { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { getOnboardingOwner } from "@/api/onboarding";
import { performLogout } from "@/lib/auth/performLogout";
import { useDriverStore } from "@/lib/driver-store";
import { getAccessToken } from "@/lib/auth-session";
import { syncAndRouteFromAppState } from "@/lib/navigation/sync-app-state";
import { setCachedOwnerOnboarding } from "@/lib/storage/onboarding-owner-cache";
export function useVerificationPending(options = {}) {
    const { onBeforeLogoutNavigate } = options;
    const router = useRouter();
    const { t } = useTranslation();
    const rejection = useDriverStore((s) => s.appStateRejection);
    const steps = useMemo(() => [t("verification.next_1"), t("verification.next_2"), t("verification.next_3")], [t]);
    useEffect(() => {
        const sub = AppState.addEventListener("change", (next) => {
            if (next === "active" && getAccessToken()) {
                void syncAndRouteFromAppState(router).catch(() => { });
            }
        });
        return () => sub.remove();
    }, [router]);
    const contactSupport = () => {
        Linking.openURL("tel:+18000000000");
    };
    const goToOwnerDetails = async () => {
        try {
            const data = await getOnboardingOwner();
            await setCachedOwnerOnboarding({
                name: data.name ?? null,
                ownerSelfieDocumentId: data.ownerSelfieDocumentId ?? null,
                ownerAdharDocumentId: data.ownerAdharDocumentId ?? null,
                ownerPanDocumentId: data.ownerPanDocumentId ?? null,
                ownerSelfieDocumentUrl: data.ownerSelfieDocumentUrl ?? null,
                ownerAdharDocumentUrl: data.ownerAdharDocumentUrl ?? null,
                ownerPanDocumentUrl: data.ownerPanDocumentUrl ?? null,
            });
        }
        catch (e) {
            if (__DEV__) {
                console.warn("[verification-pending] owner prefill fetch failed:", e);
            }
        }
        router.replace("/onboarding/onboardingOwnerScreen");
    };
    const demoSkip = () => {
        router.replace("/permissionScreen");
    };
    const logoutInFlight = useRef(false);
    const logoutNow = useCallback(async () => {
        if (logoutInFlight.current)
            return;
        logoutInFlight.current = true;
        try {
            await performLogout({
                router,
                onBeforeNavigate: onBeforeLogoutNavigate,
                alertOnApiFailure: true,
            });
        }
        finally {
            logoutInFlight.current = false;
        }
    }, [router, onBeforeLogoutNavigate]);
    return { t, steps, rejection, contactSupport, goToOwnerDetails, demoSkip, logoutNow };
}
