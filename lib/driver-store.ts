import {
  buildPersistedTripPayload,
  clearPersistedActiveTrip,
  loadPersistedActiveTripRaw,
  parsePersistedActiveTrip,
  savePersistedActiveTrip,
} from '@/lib/storage/driver-session-storage';
import type { NewOrderOffer } from '@/lib/realtime/driver-ws-incoming';
import { getAccessToken } from '@/lib/auth-session';
import { create } from 'zustand';

export type TripFlowPhase =
  | 'to_pickup'
  | 'waiting_pickup'
  | 'start_otp'
  | 'to_drop'
  | 'unloading'
  | 'done';

export type MockTrip = {
  /** Set when trip comes from WebSocket NEW_ORDER / driver APIs */
  orderId?: number;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLatitude?: number;
  dropLongitude?: number;
  pickupContact: string;
  pickupRole: string;
  pickupAddress: string;
  pickupDetail: string;
  dropContact: string;
  dropRole: string;
  dropAddress: string;
  dropDetail: string;
  packageType: string;
  weight: string;
  estimatedFare: number;
  tripKm: number;
  helperRequired: boolean;
  correctOtp: string;
};

export type DriverSocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export const defaultMockTrip: MockTrip = {
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

export function mockTripFromNewOrder(o: NewOrderOffer): MockTrip {
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

type DriverState = {
  isOnline: boolean;
  setOnline: (v: boolean) => void;
  activeTrip: MockTrip | null;
  setActiveTrip: (t: MockTrip | null) => void;
  /** Merge fields into the current active trip (no-op if no active trip). */
  patchActiveTrip: (partial: Partial<MockTrip>) => void;
  tripPhase: TripFlowPhase;
  setTripPhase: (p: TripFlowPhase) => void;
  resetTripFlow: () => void;
  /** After payment + rating — clears trip only */
  endTripSession: () => void;
  /** Full reset after logout (mock dashboard stats included). */
  logoutReset: () => void;
  driverSocketStatus: DriverSocketStatus;
  setDriverSocketStatus: (s: DriverSocketStatus) => void;
  /** Incoming offer from WebSocket NEW_ORDER while on home / searching */
  pendingNewOrder: NewOrderOffer | null;
  setPendingNewOrder: (o: NewOrderOffer | null) => void;
  todayEarnings: number;
  todayTrips: number;
  hoursOnline: string;
  distanceKm: string;
};

const initialDriverState: Pick<
  DriverState,
  | 'isOnline'
  | 'activeTrip'
  | 'tripPhase'
  | 'todayEarnings'
  | 'todayTrips'
  | 'hoursOnline'
  | 'distanceKm'
  | 'driverSocketStatus'
  | 'pendingNewOrder'
> = {
  isOnline: false,
  activeTrip: null,
  tripPhase: 'to_pickup',
  todayEarnings: 1850,
  todayTrips: 7,
  hoursOnline: '6.5h',
  distanceKm: '45.2 km',
  driverSocketStatus: 'disconnected',
  pendingNewOrder: null,
};

export const useDriverStore = create<DriverState>((set) => ({
  ...initialDriverState,
  setOnline: (v) => set({ isOnline: v }),
  setDriverSocketStatus: (driverSocketStatus) => set({ driverSocketStatus }),
  setPendingNewOrder: (pendingNewOrder) => set({ pendingNewOrder }),
  setActiveTrip: (t) => set({ activeTrip: t }),
  patchActiveTrip: (partial) =>
    set((state) => {
      if (!state.activeTrip) {
        return state;
      }
      return { activeTrip: { ...state.activeTrip, ...partial } };
    }),
  setTripPhase: (p) => set({ tripPhase: p }),
  resetTripFlow: () =>
    set({ activeTrip: null, tripPhase: 'to_pickup', isOnline: false }),
  endTripSession: () => set({ activeTrip: null, tripPhase: 'to_pickup' }),
  logoutReset: () => set({ ...initialDriverState }),
}));

let tripPersistenceSubscribed = false;

function syncPersistedTripToDisk(state: DriverState): void {
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
export function initDriverTripPersistenceSubscription(): void {
  if (tripPersistenceSubscribed) {
    return;
  }
  tripPersistenceSubscribed = true;
  useDriverStore.subscribe((state) => {
    syncPersistedTripToDisk(state);
  });
}

/** Restore active trip from AsyncStorage when a session token exists. */
export async function hydratePersistedTripFromStorage(): Promise<void> {
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
  const trip: MockTrip = {
    ...parsed.trip,
    pickupLatitude: parsed.pickupLatitude ?? parsed.trip.pickupLatitude,
    pickupLongitude: parsed.pickupLongitude ?? parsed.trip.pickupLongitude,
    dropLatitude: parsed.dropLatitude ?? parsed.trip.dropLatitude,
    dropLongitude: parsed.dropLongitude ?? parsed.trip.dropLongitude,
  };
  useDriverStore.setState({
    activeTrip: trip,
    tripPhase: parsed.tripPhase,
  });
}
