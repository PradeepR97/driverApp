import { create } from "zustand";

const MIN_REPEAT_GAP_MS = 1400;

export const useAppToastStore = create((set, get) => ({
    visible: false,
    message: "",
    variant: "error",
    lastKey: "",
    lastShownAt: 0,
    showToast: ({ message, variant = "error" }) => {
        const text = typeof message === "string" ? message.trim() : "";
        if (!text) {
            return;
        }
        const now = Date.now();
        const key = `${variant}:${text}`;
        const shouldSuppress = get().lastKey === key && now - get().lastShownAt < MIN_REPEAT_GAP_MS;
        if (shouldSuppress) {
            return;
        }
        set({
            visible: true,
            message: text,
            variant,
            lastKey: key,
            lastShownAt: now,
        });
    },
    dismissToast: () => {
        set({ visible: false });
    },
}));
