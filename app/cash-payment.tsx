import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { postConfirmTripPayment } from '@/lib/api/driver-orders';
import { useDriverStore } from '@/lib/driver-store';
import { popGlobalLoading, pushGlobalLoading } from '@/lib/stores/app-loading-store';
import { useShakeAnimation } from '@/lib/hooks/useShakeAnimation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CashPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = useDriverStore((s) => s.activeTrip);
  const orderFare = useDriverStore((s) => s.orderFareDetail);
  const setSelectedTripPaymentMethod = useDriverStore((s) => s.setSelectedTripPaymentMethod);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { style: shakeStyle, shake } = useShakeAnimation({ durationMs: 420, amplitude: 10 });

  const fareAmount = orderFare?.totalPayableAmount ?? trip?.estimatedFare ?? 0;
  const fareLabel = fareAmount.toLocaleString('en-IN');

  const confirmReceived = async () => {
    if (!trip?.orderId) {
      setError('Trip not found. Please go back and retry.');
      shake();
      return;
    }
    setBusy(true);
    setError(null);
    pushGlobalLoading();
    try {
      await postConfirmTripPayment(trip.orderId, 'CASH');
      setSelectedTripPaymentMethod('CASH');
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
        <Text style={styles.header}>Cash Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <Animated.View style={[styles.card, shakeStyle]}>
        <View style={styles.iconWrap}>
          <Ionicons name="cash-outline" size={32} color={Colors.primaryDark} />
        </View>
        <Text style={styles.amountLabel}>Collect This Amount</Text>
        <Text style={styles.amount}>₹{fareLabel}</Text>
        <Text style={styles.sub}>
          Collect payment in cash from the customer and confirm below.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton
          title="Confirm Payment Received"
          onPress={() => setConfirmOpen(true)}
          loading={busy}
          disabled={busy}
        />
      </View>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            if (!busy) setConfirmOpen(false);
          }}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Confirm Cash Received</Text>
            <Text style={styles.modalSub}>
              Have you received <Text style={{ fontWeight: '800' }}>₹{fareLabel}</Text> from the customer?
            </Text>
            <View style={styles.modalActions}>
              <PrimaryButton
                title="No, Go Back"
                variant="outline"
                onPress={() => setConfirmOpen(false)}
                disabled={busy}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Yes, Received"
                onPress={() => void confirmReceived()}
                loading={busy}
                disabled={busy}
                style={styles.confirmBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  amountLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  amount: { fontSize: 40, fontWeight: '800', color: Colors.primary, marginTop: Spacing.sm },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.sheetTop,
  },
  modalTitle: { ...Type.h2 },
  modalSub: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  confirmBtn: { flex: 1 },
});
