import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'today' | 'week' | 'month';

const TRIPS = [
  {
    id: '1',
    date: 'Jan 15, 2024 • 10:30 AM',
    pickup: 'Anna Nagar, Chennai',
    drop: 'T. Nagar, Chennai',
    payment: 'online' as const,
    fare: 350,
  },
  {
    id: '2',
    date: 'Jan 15, 2024 • 2:15 PM',
    pickup: 'Velachery',
    drop: 'Guindy',
    payment: 'cash' as const,
    fare: 280,
  },
  {
    id: '3',
    date: 'Jan 14, 2024 • 9:00 AM',
    pickup: 'Adyar',
    drop: 'Mylapore',
    payment: 'online' as const,
    fare: 150,
  },
];

export default function TripHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('today');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={styles.hairline} />

      <View style={styles.tabs}>
        {(
          [
            { key: 'today' as const, label: 'Today' },
            { key: 'week' as const, label: 'This Week' },
            { key: 'month' as const, label: 'This Month' },
          ] as const
        ).map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator>
        {TRIPS.map((trip, index) => (
          <Animated.View
            key={trip.id}
            entering={FadeInDown.delay(64 * index).duration(300)}
          >
            <Pressable style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.dateText}>{trip.date}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
            <View style={styles.route}>
              <View style={styles.timeline}>
                <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                <View style={styles.vline} />
                <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.place}>{trip.pickup}</Text>
                <Text style={[styles.place, { marginTop: Spacing.lg }]}>{trip.drop}</Text>
              </View>
            </View>
            <View style={styles.hairlineCard} />
            <View style={styles.cardBottom}>
              <View
                style={[
                  styles.payPill,
                  trip.payment === 'online' ? styles.payOnline : styles.payCash,
                ]}
              >
                <Text style={[styles.payText, trip.payment === 'cash' && styles.payTextCash]}>
                  {trip.payment === 'online' ? 'Online' : 'Cash'}
                </Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fare}>₹{trip.fare}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            </View>
          </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Type.h2 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  statusPill: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  route: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  timeline: { alignItems: 'center', width: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  vline: { width: 2, flex: 1, minHeight: 28, backgroundColor: Colors.border, marginVertical: 4 },
  place: { fontSize: 15, fontWeight: '700', color: Colors.text },
  hairlineCard: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  payOnline: { backgroundColor: Colors.primarySoft },
  payCash: { backgroundColor: '#FFEDD5' },
  payText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  payTextCash: { color: '#C2410C' },
  fareRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fare: { fontSize: 18, fontWeight: '800', color: Colors.text },
});
