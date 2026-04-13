import { api, getApiErrorMessage } from '@/lib/api/client';
import type { ApiEnvelope } from '@/lib/api/types';
import { isApiFailure } from '@/lib/api/types';
import type {
  DriverHomeBlock,
  DriverHomeStatus,
} from '@/lib/driver-store';

export type DriverHomeSummaryResponse = {
  driverStatus: DriverHomeStatus;
  canGoOnline: boolean;
  block: DriverHomeBlock | null;
  todaySummary: {
    earnings: number;
    trips: number;
    hoursOnline: number;
    distanceKm: number;
  };
};

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getDriverHomeSummary(): Promise<DriverHomeSummaryResponse> {
  try {
    const { data } = await api.get<ApiEnvelope<unknown>>('/driver/home/summary');
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not load home summary');
    }
    const payload = data.data as Record<string, unknown>;
    const today = (payload.todaySummary ?? {}) as Record<string, unknown>;
    const rawBlock = payload.block;
    const block =
      rawBlock && typeof rawBlock === 'object'
        ? {
            reason: String((rawBlock as Record<string, unknown>).reason ?? 'LOW_BALANCE') as DriverHomeBlock['reason'],
            message: String((rawBlock as Record<string, unknown>).message ?? ''),
            redirectTo: String((rawBlock as Record<string, unknown>).redirectTo ?? 'WALLET') as DriverHomeBlock['redirectTo'],
          }
        : null;
    const driverStatus = String(payload.driverStatus ?? 'OFFLINE') as DriverHomeStatus;
    return {
      driverStatus,
      canGoOnline: Boolean(payload.canGoOnline),
      block,
      todaySummary: {
        earnings: toNumber(today.earnings),
        trips: toNumber(today.trips),
        hoursOnline: toNumber(today.hoursOnline),
        distanceKm: toNumber(today.distanceKm),
      },
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
