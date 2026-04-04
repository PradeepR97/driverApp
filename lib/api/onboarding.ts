import {
  ONBOARDING_DRIVER_PATH,
  ONBOARDING_OWNER_PATH,
  ONBOARDING_VEHICLE_PATH,
} from '@/lib/config';

import { api, getApiErrorMessage } from './client';
import type { ApiEnvelope } from './types';
import { isApiFailure } from './types';

/**
 * Field names align with common fleet onboarding APIs; change to match `Onboarding backend api.pdf`.
 * `ownerAdharUrl` spelling matches several Indian backend specs.
 */
/** Backend expects `name` for owner full name (not `ownerName`). */
export type PostOwnerBody = {
  name: string;
  ownerAdharUrl: string;
  ownerPanUrl: string;
  ownerSelfieUrl: string;
};

/** Backend expects `registrationNumber` and `rcUrl` (not vehicleNumber / rcImageUrl). */
export type PostVehicleBody = {
  registrationNumber: string;
  rcUrl: string;
  city: string;
  /** API codes e.g. TRUCK, MINI_TRUCK */
  vehicleType: string;
  /** API codes e.g. OPEN, CLOSED, SEMI_OPEN */
  bodyType: string;
  /** API codes e.g. EIGHT_FT_1_5_TON */
  bodySpec: string;
};

export type PostDriverBody = {
  isSelfDriving: boolean;
  driverName: string;
  driverPhone: string;
  driverLicenseUrl: string;
};

async function postEnvelope(path: string, body: unknown): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(path, body);
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Request failed');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function postOnboardingOwner(body: PostOwnerBody): Promise<void> {
  await postEnvelope(ONBOARDING_OWNER_PATH, body);
}

export async function postOnboardingVehicle(body: PostVehicleBody): Promise<void> {
  await postEnvelope(ONBOARDING_VEHICLE_PATH, body);
}

export async function postOnboardingDriver(body: PostDriverBody): Promise<void> {
  await postEnvelope(ONBOARDING_DRIVER_PATH, body);
}
