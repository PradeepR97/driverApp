/** Maps backend OrderStatus-style strings to short UI labels. */
const STATUS_LABELS = {
    ASSIGNED: "Assigned",
    ARRIVED_PICKUP: "At pickup",
    IN_PROGRESS: "On trip",
    ARRIVED_AT_DROP: "At drop-off",
    PAYMENT_PENDING: "Payment due",
    PAYMENT_COMPLETED: "Completed",
};

export function formatTripStatus(status) {
    if (!status || typeof status !== "string")
        return "—";
    return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function formatTripInstant(iso) {
    if (!iso || typeof iso !== "string")
        return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export function formatInr(amount) {
    if (amount == null || !Number.isFinite(amount))
        return "—";
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatPaymentMethod(method) {
    if (!method || typeof method !== "string")
        return "—";
    const u = method.toUpperCase();
    if (u === "CASH")
        return "Cash";
    if (u === "UPI" || u === "ONLINE")
        return "Online";
    return method.replace(/_/g, " ");
}

export function formatDistanceKm(km) {
    if (km == null || !Number.isFinite(km))
        return "—";
    if (km < 10)
        return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}
