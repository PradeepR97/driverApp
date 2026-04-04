import type { AppStateData } from '@/lib/api/app';
import type { Href } from 'expo-router';

/**
 * Maps App State API (`GET /app/state`) to Expo routes.
 * Adjust if your `App state api.pdf` uses different `nextScreen` values.
 */
export function replaceForAppState(router: { replace: (href: Href) => void }, state: AppStateData): void {
  const status = state.onboardingStatus;
  const next = state.nextScreen;

  // Prefer `nextScreen` when the API sends an explicit destination.
  switch (next) {
    case 'verification_in_progress':
    case 'verification_pending':
    case 'under_review':
      router.replace('/verification-pending');
      return;
    case 'owner_details':
      router.replace('/onboarding/owner');
      return;
    case 'vehicle_details':
      router.replace('/onboarding/vehicle');
      return;
    case 'driver_details':
      router.replace('/onboarding/driver');
      return;
    case 'login':
      router.replace('/home');
      return;
    default:
      break;
  }

  if (status === 'UNDER_REVIEW') {
    router.replace('/verification-pending');
    return;
  }
  if (status === 'REJECTED') {
    router.replace('/verification-pending');
    return;
  }
  if (status === 'APPROVED') {
    router.replace('/permissions');
    return;
  }

  if (status === 'IN_PROGRESS' || status == null || status === '') {
    router.replace('/onboarding/owner');
    return;
  }

  router.replace('/onboarding/owner');
}
