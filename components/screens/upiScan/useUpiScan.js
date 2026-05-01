import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { postConfirmTripPayment } from "@/api/driver-orders";
import { useDriverStore } from "@/lib/driver-store";
import { useOnlineTripNavigationGuard } from "@/lib/hooks/useOnlineTripNavigationGuard";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
import { popGlobalLoading, pushGlobalLoading } from "@/lib/stores/app-loading-store";
export function useUpiScan() {
    const router = useRouter();
    const trip = useDriverStore((s) => s.activeTrip);
    const orderFare = useDriverStore((s) => s.orderFareDetail);
    const setSelectedTripPaymentMethod = useDriverStore((s) => s.setSelectedTripPaymentMethod);
    useOnlineTripNavigationGuard({ enabled: true });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const { style: shakeStyle, shake } = useShakeAnimation({
        durationMs: 420,
        amplitude: 10,
    });
    const { fareLabel, upiQr } = useMemo(() => {
        const fareAmount = orderFare?.totalPayableAmount ?? trip?.estimatedFare ?? 0;
        const fareLabel = fareAmount.toLocaleString("en-IN");
        const upiQr = orderFare?.paymentMethods
            .find((m) => m.code === "UPI" && m.enabled)
            ?.meta?.qrCode?.trim() ?? "";
        return { fareLabel, upiQr };
    }, [orderFare, trip]);
    const simulateSuccess = async () => {
        if (!trip?.orderId) {
            setError("Trip not found. Please go back and retry.");
            shake();
            return;
        }
        setBusy(true);
        setError(null);
        pushGlobalLoading();
        try {
            await postConfirmTripPayment(trip.orderId, "UPI");
            setSelectedTripPaymentMethod("UPI");
            router.replace("/paymentReceivedScreen");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Could not confirm payment.");
            shake();
        }
        finally {
            popGlobalLoading();
            setBusy(false);
        }
    };
    return {
        busy,
        error,
        shakeStyle,
        fareLabel,
        upiQr,
        simulateSuccess,
    };
}
