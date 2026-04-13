/** Server → client frames on `/ws/driver/location` (WebSocket module). */

export type NewOrderOffer = {
  orderId: number;
  pickup: string;
  drop: string;
  distanceKm: number;
  estimatedFare: number;
  helperRequired: boolean;
  customerName?: string;
  customerPhone?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLatitude?: number;
  dropLongitude?: number;
};

function readOptionalCoord(p: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = p[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) {
        return n;
      }
    }
  }
  return undefined;
}

export type ParsedDriverWsMessage =
  | { kind: 'ACK'; message?: string }
  | { kind: 'LOCATION_ACK' }
  | { kind: 'NEW_ORDER'; offer: NewOrderOffer }
  | { kind: 'ERROR'; message?: string }
  | { kind: 'unknown' };

export function parseDriverWsMessage(data: unknown): ParsedDriverWsMessage {
  if (!data || typeof data !== 'object') {
    return { kind: 'unknown' };
  }
  const o = data as Record<string, unknown>;
  const type = o.type;

  if (type === 'ACK') {
    const p = o.payload as Record<string, unknown> | undefined;
    const message = typeof p?.message === 'string' ? p.message : undefined;
    if (message === 'LOCATION_RECEIVED') {
      return { kind: 'LOCATION_ACK' };
    }
    return { kind: 'ACK', message };
  }

  if (type === 'NEW_ORDER') {
    const p = o.payload as Record<string, unknown> | undefined;
    if (!p) {
      return { kind: 'unknown' };
    }
    const rawId = p.orderId;
    const orderId = typeof rawId === 'number' ? rawId : Number(rawId);
    if (!Number.isFinite(orderId)) {
      return { kind: 'unknown' };
    }
    const offer: NewOrderOffer = {
      orderId,
      pickup: String(p.pickup ?? ''),
      drop: String(p.drop ?? ''),
      distanceKm: Number(p.distanceKm ?? 0),
      estimatedFare: Number(p.estimatedFare ?? 0),
      helperRequired: Boolean(p.helperRequired),
      customerName: typeof p.customerName === 'string' ? p.customerName : undefined,
      customerPhone:
        typeof p.customerPhone === 'string'
          ? p.customerPhone
          : typeof p.phoneNumber === 'string'
            ? p.phoneNumber
            : undefined,
      pickupLatitude: readOptionalCoord(p, 'pickupLatitude', 'pickup_lat', 'pickupLat'),
      pickupLongitude: readOptionalCoord(p, 'pickupLongitude', 'pickup_lng', 'pickup_lon', 'pickupLng'),
      dropLatitude: readOptionalCoord(p, 'dropLatitude', 'drop_lat', 'dropLat'),
      dropLongitude: readOptionalCoord(p, 'dropLongitude', 'drop_lng', 'drop_lon', 'dropLng'),
    };
    return { kind: 'NEW_ORDER', offer };
  }

  if (type === 'ERROR') {
    const p = o.payload as Record<string, unknown> | undefined;
    const message = typeof p?.message === 'string' ? p.message : undefined;
    return { kind: 'ERROR', message };
  }

  return { kind: 'unknown' };
}
