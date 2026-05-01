import { buildPersistedTripPayload, clearPersistedActiveTrip, loadPersistedActiveTripRaw, parsePersistedActiveTrip, savePersistedActiveTrip, } from '@/lib/storage/driver-session-storage';
import { getAccessToken } from '@/lib/auth-session';
import { create } from 'zustand';
export const defaultMockTrip = {
    pickupContact: 'Priya Sharma',
    pickupRole: 'Pickup contact',
    pickupAddress: 'Anna Nagar, Chennai',
    pickupDetail: 'Near Anna Arch',
    dropContact: 'Amit Verma',
    dropRole: 'Drop-off contact',
    dropAddress: 'T. Nagar, Chennai',
    dropDetail: 'Near Pondy Bazaar',
    packageType: 'Documents',
    weight: '2 kg',
    estimatedFare: 350,
    tripKm: 8.5,
    helperRequired: true,
    correctOtp: '1234',
};
export function mockTripFromNewOrder(o) {
    return {
        orderId: o.orderId,
        pickupLatitude: o.pickupLatitude,
        pickupLongitude: o.pickupLongitude,
        dropLatitude: o.dropLatitude,
        dropLongitude: o.dropLongitude,
        pickupContact: o.customerName ?? 'Customer',
        pickupRole: 'Pickup contact',
        pickupAddress: o.pickup,
        pickupDetail: '',
        dropContact: o.customerName ?? 'Customer',
        customerPhone: o.customerPhone,
        dropRole: 'Drop-off contact',
        dropAddress: o.drop,
        dropDetail: '',
        packageType: 'Order',
        weight: '—',
        estimatedFare: o.estimatedFare,
        tripKm: o.distanceKm,
        helperRequired: o.helperRequired,
        correctOtp: '0000',
    };
}
const initialDriverState = {
    isOnline: false,
    activeTrip: null,
    tripPhase: 'to_pickup',
    tripStatus: 'ASSIGNED',
    todayEarnings: 1850,
    todayTrips: 7,
    hoursOnline: '6.5h',
    distanceKm: '45.2 km',
    canGoOnline: true,
    homeStatus: 'OFFLINE',
    homeBlock: null,
    homeSummaryLoading: false,
    orderFareDetail: null,
    selectedTripPaymentMethod: null,
    driverSocketStatus: 'disconnected',
    pendingNewOrder: null,
    appStateRejection: null,
    appStateBlock: null,
    preferredLanguage: null,
};
export const useDriverStore = create((set) => ({
    ...initialDriverState,
    setOnline: (v) => set({ isOnline: v }),
    setDriverSocketStatus: (driverSocketStatus) => set({ driverSocketStatus }),
    setPendingNewOrder: (pendingNewOrder) => set({ pendingNewOrder }),
    setAppStateContext: ({ rejection = null, block = null, preferredLanguage = null }) => set({
        appStateRejection: rejection,
        appStateBlock: block,
        preferredLanguage,
    }),
    setHomeSummaryLoading: (homeSummaryLoading) => set({ homeSummaryLoading }),
    applyHomeSummary: (payload) => set({
        homeStatus: payload.driverStatus,
        canGoOnline: payload.canGoOnline,
        homeBlock: payload.block,
        todayEarnings: Number.isFinite(payload.todaySummary.earnings)
            ? payload.todaySummary.earnings
            : 0,
        todayTrips: Number.isFinite(payload.todaySummary.trips) ? payload.todaySummary.trips : 0,
        hoursOnline: `${Number.isFinite(payload.todaySummary.hoursOnline) ? payload.todaySummary.hoursOnline : 0}h`,
        distanceKm: `${Number.isFinite(payload.todaySummary.distanceKm) ? payload.todaySummary.distanceKm : 0} km`,
        isOnline: payload.driverStatus === 'ONLINE' || payload.driverStatus === 'ON_TRIP',
    }),
    setOrderFareDetail: (orderFareDetail) => set({ orderFareDetail }),
    setSelectedTripPaymentMethod: (selectedTripPaymentMethod) => set({ selectedTripPaymentMethod }),
    setActiveTrip: (t) => set({ activeTrip: t }),
    patchActiveTrip: (partial) => set((state) => {
        if (!state.activeTrip) {
            return state;
        }
        return { activeTrip: { ...state.activeTrip, ...partial } };
    }),
    setTripPhase: (p) => set({ tripPhase: p }),
    setTripStatus: (tripStatus) => set({ tripStatus }),
    /** Clears active trip only; does not change online status (driver stays online/offline as set). */
    resetTripFlow: () => set({
        activeTrip: null,
        tripPhase: 'to_pickup',
        tripStatus: 'ASSIGNED',
        orderFareDetail: null,
        selectedTripPaymentMethod: null,
    }),
    endTripSession: () => set({
        activeTrip: null,
        tripPhase: 'to_pickup',
        tripStatus: 'ASSIGNED',
        orderFareDetail: null,
        selectedTripPaymentMethod: null,
    }),
    logoutReset: () => set({ ...initialDriverState }),
}));
let tripPersistenceSubscribed = false;
function syncPersistedTripToDisk(state) {
    const { activeTrip, tripPhase } = state;
    if (!activeTrip?.orderId) {
        void clearPersistedActiveTrip();
        return;
    }
    const payload = buildPersistedTripPayload(activeTrip, tripPhase);
    if (payload) {
        void savePersistedActiveTrip(payload);
    }
}
/** Call once after `hydratePersistedTripFromStorage` so initial null state does not wipe disk. */
export function initDriverTripPersistenceSubscription() {
    if (tripPersistenceSubscribed) {
        return;
    }
    tripPersistenceSubscribed = true;
    useDriverStore.subscribe((state) => {
        syncPersistedTripToDisk(state);
    });
}
/** Restore active trip from AsyncStorage when a session token exists. */
export async function hydratePersistedTripFromStorage() {
    if (!getAccessToken()) {
        await clearPersistedActiveTrip();
        return;
    }
    const raw = await loadPersistedActiveTripRaw();
    const parsed = parsePersistedActiveTrip(raw);
    if (!parsed) {
        await clearPersistedActiveTrip();
        return;
    }
    const trip = {
        ...parsed.trip,
        pickupLatitude: parsed.pickupLatitude ?? parsed.trip.pickupLatitude,
        pickupLongitude: parsed.pickupLongitude ?? parsed.trip.pickupLongitude,
        dropLatitude: parsed.dropLatitude ?? parsed.trip.dropLatitude,
        dropLongitude: parsed.dropLongitude ?? parsed.trip.dropLongitude,
    };
    let phase = parsed.tripPhase;
    if (phase === 'waiting_pickup') {
        phase = 'start_otp';
    }
    const tripStatus = phase === 'start_otp'
        ? 'ARRIVED_PICKUP'
        : phase === 'to_drop' || phase === 'unloading' || phase === 'done'
            ? 'STARTED'
            : 'ASSIGNED';
    useDriverStore.setState({
        activeTrip: trip,
        tripPhase: phase,
        tripStatus,
    });
}
