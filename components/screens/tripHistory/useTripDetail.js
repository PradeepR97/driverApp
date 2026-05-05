import { getTripDetail } from "@/api/trip-history";
import { useQuery } from "@tanstack/react-query";

export function useTripDetail(orderId) {
    const id = orderId != null ? String(orderId).trim() : "";
    const numericOk = id !== "" && Number.isFinite(Number(id));
    return useQuery({
        queryKey: ["driverTripDetail", id],
        queryFn: () => getTripDetail(id),
        enabled: numericOk,
    });
}
