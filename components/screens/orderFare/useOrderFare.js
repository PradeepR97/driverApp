import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { getDriverOrderFare } from "@/api/driver-orders";
import { useDriverStore } from "@/lib/driver-store";
import { useOnlineTripNavigationGuard } from "@/lib/hooks/useOnlineTripNavigationGuard";
export function useOrderFare() {
    const router = useRouter();
    const trip = useDriverStore((s) => s.activeTrip);
    const setOrderFareDetail = useDriverStore((s) => s.setOrderFareDetail);
    const patchActiveTrip = useDriverStore((s) => s.patchActiveTrip);
    useOnlineTripNavigationGuard({ enabled: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fare, setFare] = useState(null);
    const orderId = trip?.orderId;
    const loadFare = useCallback(async () => {
        if (orderId == null) {
            setError("Missing order. Return to home and try again.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getDriverOrderFare(orderId);
            setFare(data);
            setOrderFareDetail(data);
            patchActiveTrip({
                estimatedFare: data.totalPayableAmount,
                fareBreakdown: data.fareBreakdown,
            });
        }
        catch (e) {
            setFare(null);
            setOrderFareDetail(null);
            setError(e instanceof Error ? e.message : "Could not load fare.");
        }
        finally {
            setLoading(false);
        }
    }, [orderId, patchActiveTrip, setOrderFareDetail]);
    /**
     * Fetch when the order id is known. Do not depend on `trip` — `loadFare` calls
     * `patchActiveTrip`, which replaces `activeTrip` with a new object reference and would
     * retrigger a `trip`-based effect forever.
     */
    useEffect(() => {
        const current = useDriverStore.getState().activeTrip;
        if (!current) {
            router.replace("/home/homeDashboardScreen");
            return;
        }
        void loadFare();
    }, [orderId, loadFare, router]);
    const enabledMethods = useMemo(() => {
        if (!fare)
            return [];
        return fare.paymentMethods.filter((m) => m.enabled && (m.code === "CASH" || m.code === "UPI"));
    }, [fare]);
    const showCash = enabledMethods.some((m) => m.code === "CASH");
    const showUpi = enabledMethods.some((m) => m.code === "UPI");
    const breakdownRows = useMemo(() => {
        if (!fare)
            return [];
        if (fare.fareBreakdown.length > 0) {
            return fare.fareBreakdown;
        }
        return [
            {
                key: "total",
                label: "Total",
                amount: fare.totalPayableAmount,
                isHighlighted: true,
            },
        ];
    }, [fare]);
    return {
        trip,
        loading,
        error,
        fare,
        showCash,
        showUpi,
        breakdownRows,
        loadFare,
    };
}
