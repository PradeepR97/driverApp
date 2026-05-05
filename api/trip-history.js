import { api, getApiErrorMessage } from "@/api/client";
import { isApiFailure } from "@/api/types";

function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

/**
 * Normalizes list row from GET /driver/trips `content` item.
 */
function normalizeTripListItem(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const id = raw.id != null ? Number(raw.id) : NaN;
    if (!Number.isFinite(id))
        return null;
    return {
        id,
        orderNumber: raw.orderNumber != null ? String(raw.orderNumber) : "",
        completedAt: raw.completedAt != null ? String(raw.completedAt) : null,
        pickupAddress: raw.pickupAddress != null ? String(raw.pickupAddress) : "",
        dropAddress: raw.dropAddress != null ? String(raw.dropAddress) : "",
        status: raw.status != null ? String(raw.status) : "",
        totalAmount: toNumber(raw.totalAmount),
    };
}

/**
 * GET /driver/trips — filter: today | thisWeek | thisMonth
 */
export async function getTripHistory(filter, page = 0, size = 20) {
    try {
        const { data } = await api.get("/driver/trips", {
            params: { filter, page, size },
        });
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not load trip history");
        }
        const payload = data.data;
        const rawList = Array.isArray(payload?.content) ? payload.content : [];
        const content = rawList.map(normalizeTripListItem).filter(Boolean);
        return {
            content,
            totalElements: Number(payload?.totalElements ?? content.length),
            totalPages: Number(payload?.totalPages ?? 0),
            number: Number(payload?.number ?? page),
            size: Number(payload?.size ?? size),
            first: Boolean(payload?.first ?? true),
            last: Boolean(payload?.last ?? true),
        };
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}

/**
 * Normalizes GET /driver/trips/{orderId} body.
 */
function normalizeTripDetail(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const id = raw.id != null ? Number(raw.id) : NaN;
    if (!Number.isFinite(id))
        return null;
    return {
        id,
        orderNumber: raw.orderNumber != null ? String(raw.orderNumber) : "",
        completedAt: raw.completedAt != null ? String(raw.completedAt) : null,
        pickupAddress: raw.pickupAddress != null ? String(raw.pickupAddress) : "",
        dropAddress: raw.dropAddress != null ? String(raw.dropAddress) : "",
        status: raw.status != null ? String(raw.status) : "",
        totalAmount: toNumber(raw.totalAmount),
        paymentMethod: raw.paymentMethod != null ? String(raw.paymentMethod) : null,
        distanceKm: toNumber(raw.distanceKm),
    };
}

/**
 * GET /driver/trips/{orderId}
 */
export async function getTripDetail(orderId) {
    try {
        const id = Number(orderId);
        if (!Number.isFinite(id)) {
            throw new Error("Invalid order");
        }
        const { data } = await api.get(`/driver/trips/${id}`);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not load trip details");
        }
        const detail = normalizeTripDetail(data.data);
        if (!detail) {
            throw new Error("Invalid trip response");
        }
        return detail;
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
