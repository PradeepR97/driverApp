import { AUTH_USER_TYPE } from '@/lib/config';

import { api, getApiErrorMessage } from './client';
import type { ApiEnvelope } from './types';
import { isApiFailure } from './types';

export type OtpRequestPayload = {
  user_type: typeof AUTH_USER_TYPE;
  countryCode: string;
  phoneNumber: string;
};

export type OtpRequestResponse = {
  expires_in?: number;
  message?: string;
};

export async function postOtpRequest(payload: OtpRequestPayload): Promise<OtpRequestResponse> {
  try {
    const { data } = await api.post<ApiEnvelope<OtpRequestResponse>>('/auth/otp/request', payload, {
      skipAuth: true,
    });
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not send OTP');
    }
    return data.data ?? {};
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function postOtpVerify(
  payload: OtpRequestPayload & { otp: string },
): Promise<unknown> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>('/auth/otp/verify', payload, {
      skipAuth: true,
    });
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Invalid OTP');
    }
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** Normalize input to exactly 10 digits (Indian mobile). */
export function normalizePhoneDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function formatPhoneForDisplay(countryCode: string, phone10: string): string {
  const a = phone10.slice(0, 5);
  const b = phone10.slice(5);
  return `${countryCode} ${a} ${b}`.trim();
}
