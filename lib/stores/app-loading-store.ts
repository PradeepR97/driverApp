import { create } from 'zustand';

/** Tracks in-flight axios requests for the global `AppLoader` overlay and manual tasks. */
type AppLoadingState = {
  requestDepth: number;
  /** Increment when starting a tracked request or async task. */
  pushRequest: () => void;
  /** Decrement when finished (paired with push). */
  popRequest: () => void;
};

export const useAppLoadingStore = create<AppLoadingState>((set) => ({
  requestDepth: 0,
  pushRequest: () => set((s) => ({ requestDepth: s.requestDepth + 1 })),
  popRequest: () => set((s) => ({ requestDepth: Math.max(0, s.requestDepth - 1) })),
}));

export function pushGlobalLoading(): void {
  useAppLoadingStore.getState().pushRequest();
}

export function popGlobalLoading(): void {
  useAppLoadingStore.getState().popRequest();
}
