import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
/**
 * Live device location for trip map rendering on native platforms.
 * Requests foreground permission once, returns null when denied/unavailable.
 */
export function useDriverLiveLocation() {
    const [driverCoordinate, setDriverCoordinate] = useState(null);
    useEffect(() => {
        if (Platform.OS === "web")
            return;
        let subscription = null;
        let cancelled = false;
        void (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted" || cancelled) {
                    return;
                }
                const firstPosition = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest,
                });
                if (!cancelled) {
                    setDriverCoordinate({
                        latitude: firstPosition.coords.latitude,
                        longitude: firstPosition.coords.longitude,
                    });
                }
                subscription = await Location.watchPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                    distanceInterval: 3,
                    timeInterval: 1500,
                }, (locationUpdate) => {
                    setDriverCoordinate({
                        latitude: locationUpdate.coords.latitude,
                        longitude: locationUpdate.coords.longitude,
                    });
                });
            }
            catch {
                if (!cancelled) {
                    setDriverCoordinate(null);
                }
            }
        })();
        return () => {
            cancelled = true;
            subscription?.remove();
        };
    }, []);
    return driverCoordinate;
}
