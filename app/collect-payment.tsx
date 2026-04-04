import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { useDriverStore } from '@/lib/driver-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CollectPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = useDriverStore((s) => s.activeTrip);
  const fare = trip?.estimatedFare ?? 350;
  const km = trip?.tripKm ?? 8.5;

  const [method, setMethod] = useState<'upi' | 'cash' | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [confirmCash, setConfirmCash] = useState(false);

  const base = 100;
  const distance = 200;
  const waiting = 50;
  const tolls = 0;

  const selectCash = () => {
    setMethod('cash');
  };

  const selectUpi = () => {
    setMethod('upi');
    // Demo: treat UPI as immediate proceed to rating
    router.replace('/rating');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Collect Payment</Text>
      <View style={styles.hairline} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.totalLabel}>Total Payable Amount</Text>
        <Text style={styles.totalAmt}>₹{fare}</Text>

        <Pressable style={styles.card} onPress={() => setBreakdownOpen((o) => !o)}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Fare Breakdown</Text>
            <Ionicons name={breakdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
          </View>
          {breakdownOpen ? (
            <View style={styles.rows}>
              <Row label="Base Fare" value={`₹${base}`} />
              <Row label={`Distance (${km} km)`} value={`₹${distance}`} />
              <Row label="Waiting Charges" value={`₹${waiting}`} />
              <Row label="Tolls" value={`₹${tolls}`} />
            </View>
          ) : null}
        </Pressable>

        {!method ? (
          <>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <Pressable style={styles.payCard} onPress={selectUpi}>
              <View style={styles.payIcon}>
                <Ionicons name="phone-portrait-outline" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>Online Payment (UPI)</Text>
                <Text style={styles.paySub}>Show QR code to customer</Text>
              </View>
            </Pressable>
            <Pressable style={styles.payCard} onPress={selectCash}>
              <View style={styles.payIcon}>
                <Ionicons name="cash-outline" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>Cash Payment</Text>
                <Text style={styles.paySub}>Collect cash from customer</Text>
              </View>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.cashHero}>
              <View style={styles.payIcon}>
                <Ionicons name="cash-outline" size={28} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.cashTitle}>Collect ₹{fare} in Cash</Text>
            <Text style={styles.cashSub}>
              Please collect the payment from the customer by cash and confirm below
            </Text>
            <PrimaryButton title="Cash Collected in Hand" onPress={() => setConfirmCash(true)} />
            <Pressable onPress={() => setMethod(null)}>
              <Text style={styles.changeLink}>Change payment method</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={confirmCash} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
            <Text style={styles.modalTitle}>Confirm Cash Payment</Text>
            <Text style={styles.modalBody}>
              Have you received <Text style={{ fontWeight: '800' }}>₹{fare}</Text> in cash from the customer?
            </Text>
            <View style={styles.modalActions}>
              <PrimaryButton
                title="No, Go Back"
                variant="outline"
                onPress={() => setConfirmCash(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Yes, Received"
                onPress={() => {
                  setConfirmCash(false);
                  router.replace('/rating');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    textAlign: 'center',
    ...Type.h2,
    paddingVertical: Spacing.md,
  },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  totalLabel: { textAlign: 'center', fontSize: 14, color: Colors.textSecondary },
  totalAmt: {
    textAlign: 'center',
    fontSize: 40,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  rows: { marginTop: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, color: Colors.textSecondary },
  rowValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  payIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  paySub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cashHero: { alignItems: 'center', marginBottom: Spacing.md },
  cashTitle: { textAlign: 'center', fontSize: 18, fontWeight: '800', color: Colors.text },
  cashSub: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  changeLink: {
    textAlign: 'center',
    marginTop: Spacing.md,
    color: Colors.link,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    ...Shadows.sheetTop,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalBody: { marginTop: Spacing.md, fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
});
