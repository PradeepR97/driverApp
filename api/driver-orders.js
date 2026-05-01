import { api, getApiErrorMessage } from "@/api/client";
import { isApiFailure } from "@/api/types";
import { isAxiosError } from "axios";
/**
 * POST /driver/orders/{orderId}/accept — after NEW_ORDER WebSocket offer.
 */
export async function postAcceptDriverOrder(orderId) {
    try {
        const { data } = await api.post(`/driver/orders/${orderId}/accept`);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not accept order");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/decline — 204 No Content on success.
 */
export async function postDeclineDriverOrder(orderId) {
    try {
        const res = await api.post(`/driver/orders/${orderId}/decline`);
        if (res.status === 204)
            return;
        const { data } = res;
        if (data && typeof data === "object" && isApiFailure(data)) {
            throw new Error(data.message ?? "Could not decline order");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/arrived-pickup — driver within pickup geofence; generates start OTP.
 */
export async function postArrivedAtPickup(orderId, body) {
    try {
        const { data } = await api.post(`/driver/orders/${orderId}/arrived-pickup`, body);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not mark arrival at pickup");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/start-trip/confirm — OTP from customer + pickup geofence.
 */
export async function postConfirmStartTrip(orderId, body) {
    try {
        const { data } = await api.post(`/driver/orders/${orderId}/start-trip/confirm`, body);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not start trip");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/arrived-drop — driver within drop geofence.
 */
export async function postArrivedAtDrop(orderId, body) {
    try {
        const res = await api.post(`/driver/orders/${orderId}/arrived-drop`, body);
        if (res.status === 204 || !res.data) {
            return;
        }
        const data = res.data;
        if (typeof data === "object" &&
            "success" in data &&
            isApiFailure(data)) {
            throw new Error(data.message ??
                "Could not mark arrival at drop");
        }
    }
    catch (e) {
        const status = e?.response?.status;
        if (status === 404) {
            try {
                const fallbackRes = await api.post(`/driver/orders/${orderId}/arrived-at-drop`, body);
                if (fallbackRes.status === 204 || !fallbackRes.data) {
                    return;
                }
                const data = fallbackRes.data;
                if (typeof data === "object" &&
                    "success" in data &&
                    isApiFailure(data)) {
                    throw new Error(data.message ??
                        "Could not mark arrival at drop");
                }
                return;
            }
            catch (fallbackErr) {
                throw new Error(getApiErrorMessage(fallbackErr));
            }
        }
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/end-trip — order must be ARRIVED_AT_DROP; driver near drop.
 */
export async function postEndTrip(orderId, body) {
    try {
        const { data } = await api.post(`/driver/orders/${orderId}/end-trip`, body);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not end trip");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/cancel
 */
export async function postCancelTrip(orderId, reasonCode) {
    try {
        const body = reasonCode ? { reasonCode } : undefined;
        const { data } = await api.post(`/driver/orders/${orderId}/cancel`, body);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not cancel trip");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
function toAmount(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}
function normalizeFareBreakdown(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((item, idx) => {
        if (!item || typeof item !== "object")
            return null;
        const rec = item;
        const labelRaw = rec.label ??
            rec.name ??
            rec.title ??
            rec.component ??
            `Item ${idx + 1}`;
        const label = String(labelRaw);
        const amount = toAmount(rec.amount ?? rec.value ?? rec.fare ?? rec.charge);
        const isHighlighted = Boolean(rec.isHighlighted ?? rec.highlighted ?? rec.is_highlighted);
        return {
            key: String(rec.key ?? rec.id ?? label.toLowerCase().replace(/\s+/g, "-") ?? idx),
            label,
            amount,
            isHighlighted,
        };
    })
        .filter((x) => x != null);
}
function normalizePaymentMethods(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((item) => {
        if (!item || typeof item !== "object")
            return null;
        const rec = item;
        const codeRaw = rec.code ?? rec.type ?? rec.method ?? rec.id ?? rec.paymentMethod;
        const code = String(codeRaw ?? "")
            .trim()
            .toUpperCase();
        if (!code)
            return null;
        const enabled = Boolean(rec.enabled ?? rec.isEnabled ?? rec.active ?? true);
        let qrCode;
        const metaRaw = rec.meta;
        if (metaRaw && typeof metaRaw === "object") {
            const m = metaRaw;
            if (typeof m.qrCode === "string")
                qrCode = m.qrCode;
            else if (typeof m.qrcode === "string")
                qrCode = m.qrcode;
            else if (typeof m.qr_code === "string")
                qrCode = m.qr_code;
        }
        return {
            code,
            enabled,
            meta: qrCode ? { qrCode } : undefined,
        };
    })
        .filter((x) => x != null);
}
function formatOrderNumber(raw, fallbackOrderId) {
    if (typeof raw === "string" && raw.trim() !== "") {
        const s = raw.trim();
        if (/^ord[-\s]?/i.test(s))
            return s.replace(/\s+/g, "-").toUpperCase();
        return `ORD-${s.replace(/^#/, "")}`;
    }
    if (typeof raw === "number" && Number.isFinite(raw)) {
        return `ORD-${raw}`;
    }
    if (fallbackOrderId != null && Number.isFinite(fallbackOrderId)) {
        return `ORD-${fallbackOrderId}`;
    }
    return "Order";
}
/**
 * GET /driver/orders/{orderId}/far (backend currently exposes `far` path).
 * Parses orderNumber, totalPayableAmount, status, fareBreakdown[], paymentMethods[].
 */
export async function getDriverOrderFare(orderId) {
    try {
        const res = await api.get(`/driver/orders/${orderId}/fare`, {
            skipGlobalLoader: true,
        });
        const payload = res.data;
        if (payload &&
            typeof payload === "object" &&
            isApiFailure(payload)) {
            throw new Error(payload.message ?? "Could not fetch fare");
        }
        const root = payload &&
            typeof payload === "object" &&
            "data" in payload
            ? (payload.data ?? payload)
            : (payload ?? {});
        const fareBreakdown = normalizeFareBreakdown(root.fareBreakdown ?? root.breakdown ?? []);
        const totalPayableAmount = toAmount(root.totalPayableAmount ??
            root.totalAmount ??
            root.totalFare ??
            root.amount ??
            root.total ??
            root.finalAmount);
        const paymentMethods = normalizePaymentMethods(root.paymentMethods ?? root.payment_methods ?? []);
        const orderNumber = formatOrderNumber(root.orderNumber ?? root.order_number ?? root.orderNo ?? root.order_id, orderId);
        const status = String(root.status ?? root.orderStatus ?? "");
        return {
            orderNumber,
            totalPayableAmount,
            status,
            fareBreakdown,
            paymentMethods,
        };
    }
    catch (e) {
        if (isAxiosError(e)) {
            const s = e.response?.status;
            if (s === 404) {
                throw new Error("Order not found");
            }
            if (s != null && s >= 500) {
                throw new Error("Service unavailable. Try again");
            }
        }
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/payment/confirm
 */
export async function postConfirmTripPayment(orderId, paymentMethod) {
    try {
        const { data } = await api.post(`/driver/orders/${orderId}/payment/confirm`, { paymentMethod });
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not confirm payment");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/rate-customer
 */
export async function postRateCustomer(orderId, body) {
    try {
        const { data } = await api.post(`/driver/orders/${orderId}/rate-customer`, body);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not submit rating");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/**
 * POST /driver/orders/{orderId}/rating
 */
export async function postDriverOrderRating(orderId, body) {
    try {
        const { data } = await api.post(`/driver/orders/${orderId}/rating`, body);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not submit rating");
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
