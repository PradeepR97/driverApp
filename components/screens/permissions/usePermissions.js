import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { getNotificationPermissionStateIfAvailable, requestNotificationPermissionStateIfAvailable, } from "@/services/permissions/notificationPermissionService";
import { syncAndRouteFromAppState } from "@/lib/navigation/sync-app-state";
const PERMISSION_ORDER = ["location", "notifications", "camera"];
const INITIAL_PERMISSION_STATE = {
    location: "denied",
    notifications: "denied",
    camera: "denied",
};
function mapState(status, canAskAgain) {
    if (status === "granted")
        return "granted";
    if (status === "denied")
        return canAskAgain === false ? "blocked" : "denied";
    return "denied";
}
export function usePermissions() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [statusMap, setStatusMap] = useState(INITIAL_PERMISSION_STATE);
    const { t } = useTranslation();
    const logStatus = (context, next) => {
        console.info("[permissions]", context, next);
    };
    const refreshStatuses = useCallback(async () => {
        try {
            const [loc, cam, notifications] = await Promise.all([
                Location.getForegroundPermissionsAsync(),
                ImagePicker.getCameraPermissionsAsync(),
                getNotificationPermissionStateIfAvailable(),
            ]);
            const next = {
                location: mapState(loc.status, loc.canAskAgain),
                camera: mapState(cam.status, cam.canAskAgain),
                notifications,
            };
            setStatusMap(next);
            logStatus("refresh", next);
        }
        catch (error) {
            console.warn("[permissions] refresh failed", error);
        }
    }, []);
    useEffect(() => {
        void refreshStatuses();
    }, [refreshStatuses]);
    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                void refreshStatuses();
            }
        });
        return () => sub.remove();
    }, [refreshStatuses]);
    const grant = useCallback(async () => {
        if (loading)
            return;
        setLoading(true);
        try {
            const next = { ...statusMap };
            if (next.location !== "granted" && next.location !== "blocked") {
                const loc = await Location.requestForegroundPermissionsAsync();
                next.location = mapState(loc.status, loc.canAskAgain);
            }
            if (next.notifications !== "granted" && next.notifications !== "blocked") {
                next.notifications = await requestNotificationPermissionStateIfAvailable();
            }
            if (next.camera !== "granted" && next.camera !== "blocked") {
                const cam = await ImagePicker.requestCameraPermissionsAsync();
                next.camera = mapState(cam.status, cam.canAskAgain);
            }
            setStatusMap(next);
            logStatus("request", next);
            const allGranted = PERMISSION_ORDER.every((key) => next[key] === "granted");
            if (allGranted) {
                await syncAndRouteFromAppState(router).catch(() => {
                    router.replace("/home/homeDashboardScreen");
                });
            }
        }
        catch (error) {
            console.warn("[permissions] request flow failed", error);
            await refreshStatuses();
        }
        finally {
            setLoading(false);
        }
    }, [loading, refreshStatuses, router, statusMap]);
    const openAppSettings = useCallback(async () => {
        try {
            await Linking.openSettings();
        }
        catch (error) {
            console.warn("[permissions] open settings failed", error);
        }
    }, []);
    const hasBlocked = useMemo(() => PERMISSION_ORDER.some((key) => statusMap[key] === "blocked"), [statusMap]);
    const allGranted = useMemo(() => PERMISSION_ORDER.every((key) => statusMap[key] === "granted"), [statusMap]);
    const platformNote = Platform.OS === "ios"
        ? "iOS permissions are managed per-app in Settings."
        : "Android permission behavior may vary by OS version.";
    const onContinue = () => {
        void syncAndRouteFromAppState(router).catch(() => {
            router.replace("/home/homeDashboardScreen");
        });
    };
    return {
        t,
        loading,
        statusMap,
        hasBlocked,
        allGranted,
        grant,
        openAppSettings,
        platformNote,
        onContinue,
    };
}
