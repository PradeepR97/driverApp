import { FareItemRow } from '@/components/payment/FareItemRow';
import { FareSummaryCard } from '@/components/payment/FareSummaryCard';
import { PaymentButton } from '@/components/payment/PaymentButton';
import { FormErrorText } from '@/components/ui/FormErrorText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import type { DriverOrderFareDetails } from '@/lib/api/driver-orders';
import { getDriverOrderFare } from '@/lib/api/driver-orders';
import { useDriverStore } from '@/lib/driver-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrderFareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = useDriverStore((s) => s.activeTrip);
  const setOrderFareDetail = useDriverStore((s) => s.setOrderFareDetail);
  const patchActiveTrip = useDriverStore((s) => s.patchActiveTrip);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fare, setFare] = useState<DriverOrderFareDetails | null>(null);

  const orderId = trip?.orderId;

  const loadFare = useCallback(async () => {
    if (orderId == null) {
      setError('Missing order. Return to home and try again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getDriverOrderFare(orderId);
      setFare(data);
      setOrderFareDetail(data);
      patchActiveTrip({
        estimatedFare: data.totalPayableAmount,
        fareBreakdown: data.fareBreakdown,
      });
    } catch (e) {
      setFare(null);
      setOrderFareDetail(null);
      setError(e instanceof Error ? e.message : 'Could not load fare.');
    } finally {
      setLoading(false);
    }
  }, [orderId, patchActiveTrip, setOrderFareDetail]);

  /**
   * Fetch when the order id is known. Do not depend on `trip` — `loadFare` calls
   * `patchActiveTrip`, which replaces `activeTrip` with a new object reference and would
   * retrigger a `trip`-based effect forever.
   */
  useEffect(() => {
    const current = useDriverStore.getState().activeTrip;
    if (!current) {
      router.replace('/home');
      return;
    }
    void loadFare();
  }, [orderId, loadFare, router]);

  const enabledMethods = useMemo(() => {
    if (!fare) return [];
    return fare.paymentMethods.filter(
      (m) => m.enabled && (m.code === 'CASH' || m.code === 'UPI'),
    );
  }, [fare]);

  const showCash = enabledMethods.some((m) => m.code === 'CASH');
  const showUpi = enabledMethods.some((m) => m.code === 'UPI');

  const breakdownRows = useMemo(() => {
    if (!fare) return [];
    if (fare.fareBreakdown.length > 0) {
      return fare.fareBreakdown;
    }
    return [
      {
        key: 'total',
        label: 'Total',
        amount: fare.totalPayableAmount,
        isHighlighted: true,
      },
    ];
  }, [fare]);

  if (!trip) {
    return null;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Trip Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading fare…</Text>
        </View>
      ) : fare ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.orderLine}>
            Order <Text style={styles.orderNum}>{fare.orderNumber}</Text>
          </Text>
          {fare.status ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{fare.status}</Text>
            </View>
          ) : null}

          <FareSummaryCard subtitle={`Total payable ₹${fare.totalPayableAmount.toLocaleString('en-IN')}`}>
            {breakdownRows.map((row) => (
              <FareItemRow
                key={row.key}
                label={row.label}
                amount={row.amount}
                isHighlighted={row.isHighlighted}
              />
            ))}
          </FareSummaryCard>

          <Text style={styles.sectionLabel}>Payment</Text>
          <View style={styles.payStack}>
            {showCash ? (
              <PaymentButton
                title="Cash Payment"
                variant="cash"
                onPress={() => router.push('/cash-payment')}
              />
            ) : null}
            {showUpi ? (
              <PaymentButton
                title="UPI Payment"
                variant="upi"
                onPress={() => router.push('/upi-scan')}
              />
            ) : null}
            {!showCash && !showUpi ? (
              <Text style={styles.noMethods}>
                No Cash or UPI payment options are enabled for this order.
              </Text>
            ) : null}
          </View>

          <FormErrorText error={error} />
        </ScrollView>
      ) : (
        <View style={styles.errorBlock}>
          <FormErrorText error={error} />
          <PrimaryButton title="Retry" onPress={() => void loadFare()} style={styles.retryBtn} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: { ...Type.h2 },
  orderLine: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  orderNum: { color: Colors.text, fontWeight: '800' },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  statusText: { fontSize: 12, fontWeight: '800', color: Colors.primaryDark },
  scroll: { gap: Spacing.lg },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  payStack: { gap: Spacing.md },
  noMethods: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontWeight: '600' },
  errorBlock: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  retryBtn: { alignSelf: 'stretch' },
});
