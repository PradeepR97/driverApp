import AsyncStorage from '@react-native-async-storage/async-storage';
const ACTIVE_TRIP_KEY = '@driver/active_trip_context';
const PHONE_KEY = '@driver/logged_in_phone';
function normalizeFiniteNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}
function normalizeOrderId(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}
const TRIP_PHASES = [
    'to_pickup',
    'waiting_pickup',
    'start_otp',
    'to_drop',
    'unloading',
    'done',
];
function normalizeTripPhase(value) {
    if (typeof value === 'string' && TRIP_PHASES.includes(value)) {
        return value;
    }
    return 'to_pickup';
}
export function parsePersistedActiveTrip(raw) {
    if (raw == null || raw === '') {
        return null;
    }
    try {
        const o = JSON.parse(raw);
        const orderId = normalizeOrderId(o.orderId);
        if (orderId == null) {
            return null;
        }
        const tripUnknown = o.trip;
        if (!tripUnknown || typeof tripUnknown !== 'object') {
            return null;
        }
        const tripObj = tripUnknown;
        const tripOrderId = normalizeOrderId(tripObj.orderId);
        if (tripOrderId !== orderId) {
            return null;
        }
        const trip = tripObj;
        return {
            orderId,
            pickupLatitude: normalizeFiniteNumber(o.pickupLatitude),
            pickupLongitude: normalizeFiniteNumber(o.pickupLongitude),
            dropLatitude: normalizeFiniteNumber(o.dropLatitude),
            dropLongitude: normalizeFiniteNumber(o.dropLongitude),
            tripPhase: normalizeTripPhase(o.tripPhase),
            trip,
        };
    }
    catch {
        return null;
    }
}
export async function savePersistedActiveTrip(payload) {
    try {
        await AsyncStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(payload));
    }
    catch {
        // non-fatal
    }
}
export async function clearPersistedActiveTrip() {
    try {
        await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
    }
    catch {
        // non-fatal
    }
}
export async function loadPersistedActiveTripRaw() {
    try {
        return await AsyncStorage.getItem(ACTIVE_TRIP_KEY);
    }
    catch {
        return null;
    }
}
export async function setStoredPhoneNumber(digits) {
    const trimmed = digits.replace(/\D/g, '');
    if (trimmed.length === 0) {
        return;
    }
    try {
        await AsyncStorage.setItem(PHONE_KEY, trimmed);
    }
    catch {
        // non-fatal
    }
}
export async function getStoredPhoneNumber() {
    try {
        const v = await AsyncStorage.getItem(PHONE_KEY);
        if (v == null || v === '') {
            return null;
        }
        const digits = v.replace(/\D/g, '');
        return digits.length > 0 ? digits : null;
    }
    catch {
        return null;
    }
}
export async function clearStoredPhoneNumber() {
    try {
        await AsyncStorage.removeItem(PHONE_KEY);
    }
    catch {
        // non-fatal
    }
}
export function buildPersistedTripPayload(trip, tripPhase) {
    const orderId = trip.orderId;
    if (orderId == null || !Number.isFinite(orderId)) {
        return null;
    }
    return {
        orderId,
        pickupLatitude: trip.pickupLatitude ?? null,
        pickupLongitude: trip.pickupLongitude ?? null,
        dropLatitude: trip.dropLatitude ?? null,
        dropLongitude: trip.dropLongitude ?? null,
        tripPhase,
        trip,
    };
}
