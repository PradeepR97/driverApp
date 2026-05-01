/**
 * Maps App State API (`GET /app/state`) to Expo routes.
 * Adjust if your `App state api.pdf` uses different `nextScreen` values.
 */
const APP_SCREEN_ROUTE_MAP = {
    homeDashboardScreen: '/home/homeDashboardScreen',
    HomeDashboardScreen: '/home/homeDashboardScreen',
    SearchingScreen: '/home/homeDashboardScreen',
    OfferScreen: '/home/homeDashboardScreen',
    PendingScreen: '/home/homeDashboardScreen',
    DriverSearchingScreen: '/driverSearchingScreen',
    DriverAssignedScreen: '/driverSearchingScreen',
    DriverArrivedatPickupScreen: '/driverArrivedatPickupScreen',
    DriverStartTripScreen: '/driverStartTripScreen',
    DriverArrivedatDropScreen: '/driverArrivedatDropScreen',
    DriverEndTripScreen: '/driverEndTripScreen',
    PaymentScreen: '/paymentScreen',
    PaymentReceivedScreen: '/paymentReceivedScreen',
    RatingScreen: '/ratingScreen',
    verificationInProgressScreen: '/verificationInProgressScreen',
    onBoardingOwnerScreen: '/onboarding/onboardingOwnerScreen',
    onBoardingVehicleScreen: '/onboarding/onboardingVehicleScreen',
    onBoardingDriverScreen: '/onboarding/onboardingDriverScreen',
};
function routeForAppScreen(screenKey) {
    if (!screenKey || typeof screenKey !== 'string')
        return null;
    return APP_SCREEN_ROUTE_MAP[screenKey] ?? null;
}
export function replaceForAppState(router, state) {
    const status = state.onboardingStatus;
    const appScreen = state.appScreen;
    const next = state.nextScreen;
    const tripScreen = state.activeTrip?.navigationScreen;
    const driverStatus = state.driverStatus;
    const isNewUser = state.isNewUser;
    if (driverStatus === 'ON_TRIP') {
        const route = routeForAppScreen(tripScreen) ?? routeForAppScreen(appScreen);
        router.replace(route ?? '/home/homeDashboardScreen');
        return;
    }
    if (isNewUser) {
        router.replace('/onboarding/onboardingOwnerScreen');
        return;
    }
    const appRoute = routeForAppScreen(appScreen);
    if (appRoute) {
        router.replace(appRoute);
        return;
    }
    // Prefer `nextScreen` when the API sends an explicit destination.
    switch (next) {
        case 'verification_in_progress':
        case 'verification_pending':
        case 'under_review':
            router.replace('/verificationInProgressScreen');
            return;
        case 'owner_details':
            router.replace('/onboarding/onboardingOwnerScreen');
            return;
        case 'vehicle_details':
            router.replace('/onboarding/onboardingVehicleScreen');
            return;
        case 'driver_details':
            router.replace('/onboarding/onboardingDriverScreen');
            return;
        case 'login':
            router.replace('/home/homeDashboardScreen');
            return;
        default:
            break;
    }
    if (driverStatus === 'OFFLINE' || driverStatus === 'BLOCKED') {
        router.replace('/home/homeDashboardScreen');
        return;
    }
    if (driverStatus === 'ONLINE') {
        router.replace('/home/homeDashboardScreen');
        return;
    }
    if (status === 'UNDER_REVIEW') {
        router.replace('/verificationInProgressScreen');
        return;
    }
    if (status === 'REJECTED') {
        router.replace('/verificationInProgressScreen');
        return;
    }
    if (status === 'IN_PROGRESS' || status == null || status === '') {
        router.replace('/onboarding/onboardingOwnerScreen');
        return;
    }
    router.replace('/onboarding/onboardingOwnerScreen');
}
