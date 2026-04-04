import { api, getApiErrorMessage } from '@/lib/api/client';
import type { ApiEnvelope } from '@/lib/api/types';
import { isApiFailure } from '@/lib/api/types';

/** Body for geofence-validated trip steps (Trip Cycle / driver orders). */
export type DriverOrderLatLng = {
  latitude: number;
  longitude: number;
};

/**
 * POST /driver/orders/{orderId}/accept — after NEW_ORDER WebSocket offer.
 */
export async function postAcceptDriverOrder(orderId: number): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(`/driver/orders/${orderId}/accept`);
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not accept order');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * POST /driver/orders/{orderId}/decline — 204 No Content on success.
 */
export async function postDeclineDriverOrder(orderId: number): Promise<void> {
  try {
    const res = await api.post<ApiEnvelope<unknown>>(`/driver/orders/${orderId}/decline`);
    if (res.status === 204) return;
    const { data } = res;
    if (data && typeof data === 'object' && isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not decline order');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * POST /driver/orders/{orderId}/arrived-pickup — driver within pickup geofence; generates start OTP.
 */
export async function postArrivedAtPickup(orderId: number, body: DriverOrderLatLng): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(
      `/driver/orders/${orderId}/arrived-pickup`,
      body,
    );
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not mark arrival at pickup');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export type ConfirmStartTripBody = DriverOrderLatLng & { otp: string };

/**
 * POST /driver/orders/{orderId}/start-trip/confirm — OTP from customer + pickup geofence.
 */
export async function postConfirmStartTrip(orderId: number, body: ConfirmStartTripBody): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(
      `/driver/orders/${orderId}/start-trip/confirm`,
      body,
    );
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not start trip');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * POST /driver/orders/{orderId}/arrived-drop — driver within drop geofence.
 */
export async function postArrivedAtDrop(orderId: number, body: DriverOrderLatLng): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(`/driver/orders/${orderId}/arrived-drop`, body);
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not mark arrival at drop');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * POST /driver/orders/{orderId}/end-trip — order must be ARRIVED_AT_DROP; driver near drop.
 */
export async function postEndTrip(orderId: number, body: DriverOrderLatLng): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(`/driver/orders/${orderId}/end-trip`, body);
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not end trip');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
