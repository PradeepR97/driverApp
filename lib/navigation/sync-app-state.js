import { getAppState } from "@/api/app";
import { useDriverStore } from "@/lib/driver-store";
import { replaceForAppState } from "@/lib/navigation/route-after-auth";
let lastAppStateSignature = null;
let lastAppStateRoutedAt = 0;
const APP_STATE_ROUTE_DEDUPE_MS = 1200;

function parseKilometers(distanceValue) {
    if (typeof distanceValue === "number" && Number.isFinite(distanceValue)) {
        return distanceValue;
    }
    if (typeof distanceValue !== "string") {
        return null;
    }
    const numeric = Number(distanceValue.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
}

function parseFareAmount(fareValue) {
    if (typeof fareValue === "number" && Number.isFinite(fareValue)) {
        return fareValue;
    }
    if (typeof fareValue !== "string") {
        return null;
    }
    const numeric = Number(fareValue.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
}

function phaseFromNavigationScreen(screen) {
    switch (screen) {
        case "DriverSearchingScreen":
        case "DriverAssignedScreen":
            return "to_pickup";
        case "DriverArrivedatPickupScreen":
            return "waiting_pickup";
        case "DriverStartTripScreen":
            return "start_otp";
        case "DriverArrivedatDropScreen":
            return "to_drop";
        case "DriverEndTripScreen":
            return "unloading";
        default:
            return null;
    }
}

function tripStatusFromOrderStatus(orderStatus) {
    switch (orderStatus) {
        case "ARRIVED_PICKUP":
            return "ARRIVED_PICKUP";
        case "IN_PROGRESS":
        case "ARRIVED_AT_DROP":
        case "PAYMENT_PENDING":
            return "STARTED";
        case "PAYMENT_COMPLETED":
            return "COMPLETED";
        case "CANCELLED":
            return "CANCELLED";
        default:
            return "ASSIGNED";
    }
}

function mapActiveTrip(raw) {
    if (!raw || typeof raw !== "object") {
        return null;
    }
    const mapped = {
        orderId: raw.orderId ?? null,
        pickupLatitude: raw.pickupLat ?? null,
        pickupLongitude: raw.pickupLon ?? null,
        dropLatitude: raw.dropLat ?? null,
        dropLongitude: raw.dropLon ?? null,
        pickupContact: raw.customerName ?? "Customer",
        pickupRole: "Pickup contact",
        pickupAddress: raw.pickupAddress ?? "",
        pickupDetail: "",
        dropContact: raw.customerName ?? "Customer",
        dropRole: "Drop-off contact",
        dropAddress: raw.dropAddress ?? "",
        dropDetail: "",
        packageType: "Order",
        weight: "—",
        estimatedFare: parseFareAmount(raw.orderFare) ?? 0,
        tripKm: parseKilometers(raw.orderDistance) ?? 0,
        helperRequired: false,
        correctOtp: "0000",
        customerPhone: raw.customerPhoneNumber ?? "",
    };
    return mapped;
}

export async function syncAndRouteFromAppState(router) {
    const state = await getAppState();
    const store = useDriverStore.getState();
    store.setAppStateContext({
        rejection: state.rejection ?? null,
        block: state.block ?? null,
        preferredLanguage: state.preferredLanguage ?? null,
    });
    store.setOnline(state.driverStatus === "ONLINE" || state.driverStatus === "ON_TRIP");
    if (state.driverStatus === "ON_TRIP" && state.activeTrip) {
        const trip = mapActiveTrip(state.activeTrip);
        if (trip) {
            store.setActiveTrip(trip);
            const phase = phaseFromNavigationScreen(state.activeTrip.navigationScreen);
            if (phase) {
                store.setTripPhase(phase);
            }
            store.setTripStatus(tripStatusFromOrderStatus(state.activeTrip.orderStatus));
        }
    }
    const signature = JSON.stringify({
        appScreen: state.appScreen ?? null,
        nextScreen: state.nextScreen ?? null,
        onboardingStatus: state.onboardingStatus ?? null,
        driverStatus: state.driverStatus ?? null,
        navigationScreen: state.activeTrip?.navigationScreen ?? null,
        orderStatus: state.activeTrip?.orderStatus ?? null,
    });
    const now = Date.now();
    const shouldSkipRoute = signature === lastAppStateSignature &&
        now - lastAppStateRoutedAt < APP_STATE_ROUTE_DEDUPE_MS;
    if (!shouldSkipRoute) {
        replaceForAppState(router, state);
        lastAppStateSignature = signature;
        lastAppStateRoutedAt = now;
    }
    return state;
}
