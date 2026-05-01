import { api, getApiErrorMessage } from '@/api/client';
import { isApiFailure } from '@/api/types';
function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
export async function getDriverHomeSummary() {
    try {
        const { data } = await api.get('/driver/home/summary');
        if (isApiFailure(data)) {
            throw new Error(data.message ?? 'Could not load home summary');
        }
        const payload = data.data;
        const today = (payload.todaySummary ?? {});
        const rawBlock = payload.block;
        const block = rawBlock && typeof rawBlock === 'object'
            ? {
                reason: String(rawBlock.reason ?? 'LOW_BALANCE'),
                message: String(rawBlock.message ?? ''),
                redirectTo: String(rawBlock.redirectTo ?? 'WALLET'),
            }
            : null;
        const driverStatus = String(payload.driverStatus ?? 'OFFLINE');
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
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
