import { useDriverStore } from '@/lib/driver-store';
import { useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { View } from 'react-native';

/** Redirects to trip summary; cash/UPI use `/cash-payment` and `/upi-scan`. */
export default function CollectPaymentScreen() {
  const router = useRouter();
  const trip = useDriverStore((s) => s.activeTrip);

  useLayoutEffect(() => {
    if (!trip) {
      router.replace('/home');
      return;
    }
    router.replace('/order-fare');
  }, [trip, router]);

  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
}
