import { getTripHistory } from "@/api/trip-history";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

/**
 * `filter` matches backend query param: today | thisWeek | thisMonth
 */
export function useTripHistory() {
    const [filter, setFilter] = useState("today");
    const query = useQuery({
        queryKey: ["driverTripHistory", filter],
        queryFn: () => getTripHistory(filter, 0, 50),
    });
    const trips = useMemo(() => query.data?.content ?? [], [query.data?.content]);
    return {
        filter,
        setFilter,
        trips,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        errorMessage: query.error instanceof Error ? query.error.message : null,
        refetch: query.refetch,
    };
}
