/** Normalize {@code order_stops}-shaped objects from WS / REST (pickup + drops). */
const DEFAULT_CONTACT = "Customer";

function cleanStr(v) {
    if (v == null)
        return null;
    const s = String(v).trim();
    return s.length > 0 ? s : null;
}

function readCoord(v) {
    if (typeof v === "number" && Number.isFinite(v)) {
        return v;
    }
    if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

/** @param {unknown} stopsUnknown */
export function normalizeRouteStops(stopsUnknown) {
    if (!Array.isArray(stopsUnknown))
        return [];
    return stopsUnknown
        .filter((s) => s && typeof s === "object")
        .map((s) => {
        const seq = typeof s.sequenceNumber === "number"
            ? s.sequenceNumber
            : Number(s.sequenceNumber);
        return {
            sequenceNumber: Number.isFinite(seq) ? seq : 0,
            stopType: typeof s.stopType === "string" ? s.stopType : "",
            address: typeof s.address === "string" ? s.address : "",
            latitude: readCoord(s.latitude),
            longitude: readCoord(s.longitude),
            contactName: cleanStr(s.contactName),
            contactPhone: cleanStr(s.contactPhone),
        };
    })
        .filter((s) => s.sequenceNumber > 0)
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

/** Earliest pickup by sequence — contact for pickup phases. */
export function pickupStopContacts(stops) {
    const p = stops.find((s) => s.stopType === "PICKUP");
    return {
        name: p?.contactName ?? DEFAULT_CONTACT,
        phone: p?.contactPhone ?? "",
        addressLine: p?.address ?? "",
    };
}

/** Last drop by sequence — matches backend “heading to drop” when only one marker is shown. */
export function lastDropStopContacts(stops) {
    let last = null;
    for (const s of stops) {
        if (s.stopType === "DROP")
            last = s;
    }
    return {
        name: last?.contactName ?? DEFAULT_CONTACT,
        phone: last?.contactPhone ?? "",
        addressLine: last?.address ?? "",
    };
}
