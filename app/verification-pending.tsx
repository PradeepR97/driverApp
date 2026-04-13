import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function VerificationPendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.hero}>
        <View style={styles.clockCircle}>
          <Ionicons name="time-outline" size={56} color={Colors.primary} />
          <View style={styles.badge}>
            <Ionicons name="checkmark" size={14} color={Colors.white} />
          </View>
        </View>
        <Text style={styles.title}>{t('verification.title')}</Text>
        <Text style={styles.sub}>
          {t('verification.subtitle')}{' '}
          <Text style={styles.subBold}>{t('verification.duration')}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('verification.whats_next')}</Text>
        {[
          t('verification.next_1'),
          t('verification.next_2'),
          t('verification.next_3'),
        ].map((line, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.9 }]}
        onPress={() => Linking.openURL('tel:+18000000000')}
      >
        <Ionicons name="call-outline" size={20} color={Colors.text} />
        <Text style={styles.supportText}>{t('common.contact_support')}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/permissions')}>
        <Text style={styles.demo}>{t('verification.demo_skip')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  hero: { alignItems: 'center' },
  clockCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.floatMd,
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Type.h1, textAlign: 'center' },
  sub: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  subBold: { fontWeight: '800', color: Colors.text },
  card: {
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatMd,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  stepText: { flex: 1, fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    minHeight: 52,
    marginBottom: Spacing.md,
  },
  supportText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  demo: {
    textAlign: 'center',
    color: Colors.link,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
