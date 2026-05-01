import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MetaCategory, getMetaOptions } from "@/api/meta";
import { postRateCustomer } from "@/api/driver-orders";
import { useDriverStore } from "@/lib/driver-store";
import { useOnlineTripNavigationGuard } from "@/lib/hooks/useOnlineTripNavigationGuard";
import { useShakeAnimation } from "@/lib/hooks/useShakeAnimation";
import { popGlobalLoading, pushGlobalLoading } from "@/lib/stores/app-loading-store";
const NEGATIVE_RATING_TAG_CODES = new Set([
    "ARRIVED_LATE",
    "RUDE_BEHAVIOUR",
    "GOODS_DAMAGED",
    "WRONG_ROUTE_TAKEN",
    "POOR_COMMUNICATION",
    "OVERCHARGED",
    "UNSAFE_DRIVING",
]);
export function useRating() {
    const router = useRouter();
    const trip = useDriverStore((s) => s.activeTrip);
    const endTripSession = useDriverStore((s) => s.endTripSession);
    useOnlineTripNavigationGuard({ enabled: true });
    const { t } = useTranslation();
    const name = trip?.pickupContact ?? "Customer";
    const [stars, setStars] = useState(0);
    const [selected, setSelected] = useState([]);
    const [comment, setComment] = useState("");
    const [busy, setBusy] = useState(false);
    const [reasonsLoading, setReasonsLoading] = useState(false);
    const [ratingReasons, setRatingReasons] = useState([]);
    const [error, setError] = useState(null);
    const [starsError, setStarsError] = useState(false);
    const { style: shakeStyle, shake } = useShakeAnimation({
        durationMs: 360,
        amplitude: 10,
    });
    const [complete, setComplete] = useState(false);
    const [successToast, setSuccessToast] = useState(false);
    const checkScale = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!trip) {
            router.replace("/home/homeDashboardScreen");
        }
    }, [trip, router]);
    useEffect(() => {
        if (!complete) {
            checkScale.setValue(0);
            return;
        }
        Animated.spring(checkScale, {
            toValue: 1,
            friction: 6,
            tension: 120,
            useNativeDriver: true,
        }).start();
    }, [complete, checkScale]);
    useEffect(() => {
        let cancelled = false;
        void (async () => {
            setReasonsLoading(true);
            try {
                const opts = await getMetaOptions([MetaCategory.DRIVER_RATING_TAG]);
                if (!cancelled) {
                    setRatingReasons(opts.DRIVER_RATING_TAG ?? []);
                }
            }
            catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Could not load rating reasons.");
                }
            }
            finally {
                if (!cancelled)
                    setReasonsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    const filteredRatingReasons = useMemo(() => {
        if (stars <= 0) {
            return [];
        }
        if (stars < 3) {
            return ratingReasons.filter((item) => NEGATIVE_RATING_TAG_CODES.has(item.code));
        }
        return ratingReasons.filter((item) => !NEGATIVE_RATING_TAG_CODES.has(item.code));
    }, [ratingReasons, stars]);
    useEffect(() => {
        setSelected((prev) => prev.filter((code) => filteredRatingReasons.some((item) => item.code === code)));
    }, [filteredRatingReasons]);
    const toggle = useCallback((code) => {
        setSelected((s) => s.includes(code) ? s.filter((x) => x !== code) : [...s, code]);
    }, []);
    const submit = useCallback(async () => {
        if (stars < 1) {
            setStarsError(true);
            setError("Please select a rating.");
            shake();
            return;
        }
        if (!trip?.orderId) {
            setError("Trip is missing order ID. Return home and retry.");
            return;
        }
        setBusy(true);
        setError(null);
        pushGlobalLoading();
        try {
            const trimmedComment = comment.trim();
            await postRateCustomer(trip.orderId, {
                rating: stars,
                tags: selected.length ? selected : undefined,
                comment: trimmedComment.length ? trimmedComment : undefined,
            });
            setComplete(true);
            setSuccessToast(true);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Could not submit rating.");
        }
        finally {
            popGlobalLoading();
            setBusy(false);
        }
    }, [comment, selected, shake, stars, trip?.orderId]);
    const onToastDismiss = useCallback(() => {
        endTripSession();
        router.replace("/home/homeDashboardScreen");
    }, [endTripSession, router]);
    const onSkip = useCallback(() => {
        if (busy || complete)
            return;
        endTripSession();
        router.replace("/home/homeDashboardScreen");
    }, [busy, complete, endTripSession, router]);
    const shouldShowReasons = useMemo(() => stars > 0, [stars]);
    const reasonHeading = useMemo(() => stars > 0 && stars < 3 ? "What went wrong?" : "What went well?", [stars]);
    return {
        trip,
        t,
        name,
        stars,
        setStars,
        selected,
        toggle,
        comment,
        setComment,
        busy,
        reasonsLoading,
        ratingReasons: filteredRatingReasons,
        reasonHeading,
        error,
        setError,
        starsError,
        setStarsError,
        shakeStyle,
        complete,
        successToast,
        setSuccessToast,
        checkScale,
        shouldShowReasons,
        submit,
        onToastDismiss,
        onSkip,
    };
}
