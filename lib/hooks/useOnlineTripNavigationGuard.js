import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { BackHandler } from "react-native";
/**
 * Blocks system/navigation back while online-trip lifecycle is active.
 * Keeps navigation forward-only for guarded screens.
 */
export function useOnlineTripNavigationGuard({ enabled }) {
    const navigation = useNavigation();
    useFocusEffect(useCallback(() => {
        if (!enabled)
            return;
        const onBack = () => true;
        const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
        return () => sub.remove();
    }, [enabled]));
    useFocusEffect(useCallback(() => {
        if (!enabled)
            return;
        const off = navigation.addListener("beforeRemove", (event) => {
            // Let forward/replace/reset continue; block only back-style removals.
            const actionType = event.data.action?.type ?? "";
            // Do not block POP_TO_TOP — it is used by stack resets (e.g. logout flows)
            // and blocking it can surface "POP_TO_TOP was not handled" on the root navigator.
            const isBackLike = actionType === "GO_BACK" || actionType === "POP";
            if (isBackLike) {
                event.preventDefault();
            }
        });
        return off;
    }, [enabled, navigation]));
}
