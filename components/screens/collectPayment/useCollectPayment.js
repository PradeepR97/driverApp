import { useLayoutEffect } from "react";
import { useRouter } from "expo-router";
import { useDriverStore } from "@/lib/driver-store";
export function useCollectPayment() {
    const router = useRouter();
    const trip = useDriverStore((s) => s.activeTrip);
    useLayoutEffect(() => {
        if (!trip) {
            router.replace("/home/homeDashboardScreen");
            return;
        }
        router.replace("/orderFareScreen");
    }, [trip, router]);
}
