import {
  buildPersistedTripPayload,
  clearPersistedActiveTrip,
  loadPersistedActiveTripRaw,
  parsePersistedActiveTrip,
  savePersistedActiveTrip,
} from '@/lib/storage/driver-session-storage';
import type { NewOrderOffer } from '@/lib/realtime/driver-ws-incoming';
import { getAccessToken } from '@/lib/auth-session';
import type { DriverOrderFareDetails, FareBreakdownItem } from '@/lib/api/driver-orders';
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
  customerPhone?: string;
  dropRole: string;
  dropAddress: string;
  dropDetail: string;
  packageType: string;
  weight: string;
  estimatedFare: number;
  fareBreakdown?: FareBreakdownItem[];
  tripKm: number;
  helperRequired: boolean;
  correctOtp: string;
};

export type TripStatus = 'ASSIGNED' | 'ARRIVED_PICKUP' | 'STARTED' | 'COMPLETED' | 'CANCELLED';

export type DriverSocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type DriverHomeStatus = 'OFFLINE' | 'ONLINE' | 'ON_TRIP' | 'BLOCKED';
export type DriverHomeBlockReason = 'LOW_BALANCE' | 'DOCUMENT_EXPIRED' | 'ADMIN_BLOCKED';
export type DriverHomeRedirectTo = 'WALLET' | 'DOCUMENTS';
export type DriverHomeBlock = {
  reason: DriverHomeBlockReason;
  message: string;
  redirectTo: DriverHomeRedirectTo;
};

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

type DriverState = {
  isOnline: boolean;
  setOnline: (v: boolean) => void;
  activeTrip: MockTrip | null;
  setActiveTrip: (t: MockTrip | null) => void;
  /** Merge fields into the current active trip (no-op if no active trip). */
  patchActiveTrip: (partial: Partial<MockTrip>) => void;
  tripPhase: TripFlowPhase;
  setTripPhase: (p: TripFlowPhase) => void;
  tripStatus: TripStatus;
  setTripStatus: (s: TripStatus) => void;
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
  canGoOnline: boolean;
  homeStatus: DriverHomeStatus;
  homeBlock: DriverHomeBlock | null;
  homeSummaryLoading: boolean;
  setHomeSummaryLoading: (v: boolean) => void;
  applyHomeSummary: (payload: {
    driverStatus: DriverHomeStatus;
    canGoOnline: boolean;
    block: DriverHomeBlock | null;
    todaySummary: {
      earnings: number;
      trips: number;
      hoursOnline: number;
      distanceKm: number;
    };
  }) => void;
  /** Latest fare API payload for order-fare / payment screens (not persisted). */
  orderFareDetail: DriverOrderFareDetails | null;
  setOrderFareDetail: (d: DriverOrderFareDetails | null) => void;
  selectedTripPaymentMethod: 'CASH' | 'UPI' | null;
  setSelectedTripPaymentMethod: (m: 'CASH' | 'UPI' | null) => void;
};

const initialDriverState: Pick<
  DriverState,
  | 'isOnline'
  | 'activeTrip'
  | 'tripPhase'
  | 'tripStatus'
  | 'todayEarnings'
  | 'todayTrips'
  | 'hoursOnline'
  | 'distanceKm'
  | 'canGoOnline'
  | 'homeStatus'
  | 'homeBlock'
  | 'homeSummaryLoading'
  | 'orderFareDetail'
  | 'selectedTripPaymentMethod'
  | 'driverSocketStatus'
  | 'pendingNewOrder'
> = {
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
};

export const useDriverStore = create<DriverState>((set) => ({
  ...initialDriverState,
  setOnline: (v) => set({ isOnline: v }),
  setDriverSocketStatus: (driverSocketStatus) => set({ driverSocketStatus }),
  setPendingNewOrder: (pendingNewOrder) => set({ pendingNewOrder }),
  setHomeSummaryLoading: (homeSummaryLoading) => set({ homeSummaryLoading }),
  applyHomeSummary: (payload) =>
    set({
      homeStatus: payload.driverStatus,
      canGoOnline: payload.canGoOnline,
      homeBlock: payload.block,
      todayEarnings: Number.isFinite(payload.todaySummary.earnings)
        ? payload.todaySummary.earnings
        : 0,
      todayTrips: Number.isFinite(payload.todaySummary.trips) ? payload.todaySummary.trips : 0,
      hoursOnline: `${Number.isFinite(payload.todaySummary.hoursOnline) ? payload.todaySummary.hoursOnline : 0}h`,
      distanceKm: `${Number.isFinite(payload.todaySummary.distanceKm) ? payload.todaySummary.distanceKm : 0} km`,
      isOnline:
        payload.driverStatus === 'ONLINE' || payload.driverStatus === 'ON_TRIP',
    }),
  setOrderFareDetail: (orderFareDetail) => set({ orderFareDetail }),
  setSelectedTripPaymentMethod: (selectedTripPaymentMethod) => set({ selectedTripPaymentMethod }),
  setActiveTrip: (t) => set({ activeTrip: t }),
  patchActiveTrip: (partial) =>
    set((state) => {
      if (!state.activeTrip) {
        return state;
      }
      return { activeTrip: { ...state.activeTrip, ...partial } };
    }),
  setTripPhase: (p) => set({ tripPhase: p }),
  setTripStatus: (tripStatus) => set({ tripStatus }),
  /** Clears active trip only; does not change online status (driver stays online/offline as set). */
  resetTripFlow: () =>
    set({
      activeTrip: null,
      tripPhase: 'to_pickup',
      tripStatus: 'ASSIGNED',
      orderFareDetail: null,
      selectedTripPaymentMethod: null,
    }),
  endTripSession: () =>
    set({
      activeTrip: null,
      tripPhase: 'to_pickup',
      tripStatus: 'ASSIGNED',
      orderFareDetail: null,
      selectedTripPaymentMethod: null,
    }),
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
  let phase = parsed.tripPhase;
  if (phase === 'waiting_pickup') {
    phase = 'start_otp';
  }
  const tripStatus: TripStatus =
    phase === 'start_otp'
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
