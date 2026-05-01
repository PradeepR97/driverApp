import { create } from 'zustand';
export const useAppLoadingStore = create((set) => ({
    requestDepth: 0,
    pushRequest: () => set((s) => ({ requestDepth: s.requestDepth + 1 })),
    popRequest: () => set((s) => ({ requestDepth: Math.max(0, s.requestDepth - 1) })),
}));
export function pushGlobalLoading() {
    useAppLoadingStore.getState().pushRequest();
}
export function popGlobalLoading() {
    useAppLoadingStore.getState().popRequest();
}
