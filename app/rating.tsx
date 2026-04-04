import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { useDriverStore } from '@/lib/driver-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAGS = [
  'Made me wait long',
  'Rude behavior',
  'Wrong Location/Address',
  'Refused to pay / Payment issue',
  'Demanded extra work',
];

export default function RatingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = useDriverStore((s) => s.activeTrip);
  const endTripSession = useDriverStore((s) => s.endTripSession);
  const name = trip?.pickupContact ?? 'Priya Sharma';

  const [stars, setStars] = useState(3);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (t: string) => {
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  };

  const submit = () => {
    endTripSession();
    router.replace('/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#6D28D9" />
        </View>
        <Text style={styles.title}>Rate your experience</Text>
        <Text style={styles.sub}>How was your delivery with {name}?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(48 * (i - 1)).duration(280)}
            >
              <Pressable onPress={() => setStars(i)} hitSlop={8}>
                <Ionicons
                  name={i <= stars ? 'star' : 'star-outline'}
                  size={36}
                  color={i <= stars ? Colors.star : Colors.border}
                />
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Text style={styles.tagLabel}>What went wrong?</Text>
        <View style={styles.tags}>
          {TAGS.map((t) => {
            const on = selected.includes(t);
            return (
              <Pressable key={t} onPress={() => toggle(t)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title="Submit Rating" onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, alignItems: 'center', paddingBottom: Spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.floatSm,
  },
  title: { ...Type.h1, textAlign: 'center' },
  sub: {
    marginTop: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stars: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  tagLabel: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xl,
    fontSize: 14,
    color: '#64748B',
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  chipText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  chipTextOn: { color: Colors.primaryDark },
  footer: { paddingHorizontal: Spacing.lg },
});
