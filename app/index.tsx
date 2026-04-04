import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { setStoredLanguageCode } from '@/lib/language-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** `apiCode` is sent in `POST /users/language` after sign-in. */
const LANGUAGES = [
  { code: 'GB', en: 'English', native: 'English', apiCode: 'EN' },
  { code: 'IN', en: 'Hindi', native: 'हिंदी', apiCode: 'HI' },
  { code: 'IN', en: 'Tamil', native: 'தமிழ்', apiCode: 'TA' },
  { code: 'IN', en: 'Telugu', native: 'తెలుగు', apiCode: 'TE' },
  { code: 'IN', en: 'Kannada', native: 'ಕನ್ನಡ', apiCode: 'KN' },
  { code: 'IN', en: 'Marathi', native: 'मराठी', apiCode: 'MR' },
] as const;

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(0);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroScale]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.xl }]}>
      <Animated.View
        style={[
          styles.hero,
          { opacity: heroOpacity, transform: [{ scale: heroScale }] },
        ]}
      >
        <View style={styles.globeWrap}>
          <Ionicons name="globe-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>Partner Onboarding</Text>
        <Text style={styles.subtitle}>Select your preferred language</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {LANGUAGES.map((lang, index) => {
          const active = selected === index;
          return (
            <Pressable
              key={`${lang.code}-${lang.en}`}
              onPress={() => setSelected(index)}
              style={({ pressed }) => [
                styles.card,
                active && styles.cardActive,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.cardCode}>{lang.code}</Text>
              <Text style={styles.cardEn}>{lang.en}</Text>
              <Text style={styles.cardNative}>{lang.native}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.region}>IN India • Change Region</Text>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton
          title="Continue"
          onPress={() => {
            const lang = LANGUAGES[selected];
            void setStoredLanguageCode(lang.apiCode);
            router.push('/login');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  hero: { alignItems: 'center', marginBottom: Spacing.lg },
  globeWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.floatSm,
  },
  title: {
    ...Type.h1,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  card: {
    width: '47%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.96 },
  cardCode: { fontSize: 12, fontWeight: '700', color: Colors.text },
  cardEn: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 4 },
  cardNative: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  region: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  footer: {},
});
