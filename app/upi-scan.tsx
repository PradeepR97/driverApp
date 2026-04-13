import { UpiQrDisplay } from '@/components/payment/UpiQrDisplay';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { postConfirmTripPayment } from '@/lib/api/driver-orders';
import { useDriverStore } from '@/lib/driver-store';
import { popGlobalLoading, pushGlobalLoading } from '@/lib/stores/app-loading-store';
import { useShakeAnimation } from '@/lib/hooks/useShakeAnimation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpiScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = useDriverStore((s) => s.activeTrip);
  const orderFare = useDriverStore((s) => s.orderFareDetail);
  const setSelectedTripPaymentMethod = useDriverStore((s) => s.setSelectedTripPaymentMethod);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { style: shakeStyle, shake } = useShakeAnimation({ durationMs: 420, amplitude: 10 });

  const fareAmount = orderFare?.totalPayableAmount ?? trip?.estimatedFare ?? 0;
  const fareLabel = fareAmount.toLocaleString('en-IN');
  const upiQr =
    orderFare?.paymentMethods
      .find((m) => m.code === 'UPI' && m.enabled)
      ?.meta?.qrCode?.trim() ?? '';

  const simulateSuccess = async () => {
    if (!trip?.orderId) {
      setError('Trip not found. Please go back and retry.');
      shake();
      return;
    }
    setBusy(true);
    setError(null);
    pushGlobalLoading();
    try {
      await postConfirmTripPayment(trip.orderId, 'UPI');
      setSelectedTripPaymentMethod('UPI');
      router.replace('/payment-received');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm payment.');
      shake();
    } finally {
      popGlobalLoading();
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.header}>UPI Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <Animated.View style={[styles.card, shakeStyle]}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amount}>₹{fareLabel}</Text>
        {upiQr ? null : <Text style={styles.devTag}>Demo placeholder QR</Text>}
        <View style={styles.qrBox}>
          <UpiQrDisplay payload={upiQr} />
        </View>
        <Text style={styles.sub}>
          Ask customer to scan this QR. Use simulate button for development flow.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton
          title="Simulate Payment Success"
          onPress={() => void simulateSuccess()}
          loading={busy}
          disabled={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  header: { ...Type.h2 },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.floatSm,
  },
  amountLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  amount: { fontSize: 38, fontWeight: '800', color: Colors.primary, marginTop: Spacing.sm },
  devTag: {
    marginTop: Spacing.sm,
    color: Colors.warning,
    fontWeight: '700',
    fontSize: 12,
  },
  qrBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  sub: {
    marginTop: Spacing.md,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    marginTop: Spacing.sm,
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: { marginTop: 'auto' },
});
