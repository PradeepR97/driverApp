import { FormErrorText } from '@/components/ui/FormErrorText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { RatingComponent } from '@/components/ui/RatingComponent';
import { ReasonList } from '@/components/ui/ReasonList';
import { AnimDuration } from '@/constants/animations';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { postDriverOrderRating } from '@/lib/api/driver-orders';
import { MetaCategory, type MetaOptionItem, getMetaOptions } from '@/lib/api/meta';
import { useDriverStore } from '@/lib/driver-store';
import { useShakeAnimation } from '@/lib/hooks/useShakeAnimation';
import { popGlobalLoading, pushGlobalLoading } from '@/lib/stores/app-loading-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  TextInput,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RatingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trip = useDriverStore((s) => s.activeTrip);

  useEffect(() => {
    if (!trip) {
      router.replace('/home');
    }
  }, [trip, router]);
  const endTripSession = useDriverStore((s) => s.endTripSession);
  const name = trip?.pickupContact ?? 'Customer';
  const { t } = useTranslation();

  const [stars, setStars] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [ratingReasons, setRatingReasons] = useState<MetaOptionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starsError, setStarsError] = useState(false);
  const { style: shakeStyle, shake } = useShakeAnimation({ durationMs: 360, amplitude: 10 });
  const [complete, setComplete] = useState(false);
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!complete) {
      checkScale.setValue(0);
      return;
    }
    Animated.spring(checkScale, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [complete, checkScale]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setReasonsLoading(true);
      try {
        const opts = await getMetaOptions([MetaCategory.RATING_REASON]);
        if (!cancelled) {
          setRatingReasons(opts.RATING_REASON ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load rating reasons.');
        }
      } finally {
        if (!cancelled) setReasonsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (code: string) => {
    setSelected((s) => (s.includes(code) ? s.filter((x) => x !== code) : [...s, code]));
  };

  const submit = async () => {
    if (stars < 1) {
      setStarsError(true);
      setError('Please select a rating.');
      shake();
      return;
    }
    if (!trip?.orderId) {
      setError('Trip is missing order ID. Return home and retry.');
      return;
    }
    setBusy(true);
    setError(null);
    pushGlobalLoading();
    try {
      await postDriverOrderRating(trip.orderId, {
        rating: stars,
        reasonCodes: stars <= 3 && selected.length ? selected : undefined,
        feedback: comment.trim() || undefined,
      });
      setComplete(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit rating.');
    } finally {
      popGlobalLoading();
      setBusy(false);
    }
  };

  const onToastDismiss = () => {
    endTripSession();
    router.replace('/home');
  };

  const onSkip = () => {
    if (busy || complete) return;
    endTripSession();
    router.replace('/home');
  };

  if (!trip) {
    return null;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.primaryDark} />
        </View>
        <Text style={styles.title}>{t('rating.title')}</Text>
        <Text style={styles.sub}>{t('rating.subtitle', { name })}</Text>

        <Animated.View style={[shakeStyle, styles.starsWrap, starsError ? styles.starsWrapError : null]}>
          <RatingComponent
            value={stars}
            onChange={(value) => {
              setStars(value);
              setStarsError(false);
              setError(null);
            }}
            disabled={complete || busy}
          />
        </Animated.View>

        {stars > 0 && stars <= 3 ? (
          <>
            <Text style={styles.tagLabel}>Select Reason</Text>
            {reasonsLoading ? (
              <Text style={styles.loadText}>Loading reasons...</Text>
            ) : (
              <ReasonList
                options={ratingReasons}
                selectedCodes={selected}
                onToggle={toggle}
                multi
              />
            )}
          </>
        ) : null}
        <TextInput
          value={comment}
          onChangeText={(text) => {
            setComment(text);
            if (error) setError(null);
          }}
          placeholder="Optional comment"
          placeholderTextColor={Colors.textMuted}
          style={styles.commentInput}
          editable={!complete && !busy}
          multiline
          numberOfLines={3}
        />
        <FormErrorText error={error} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton
          title={t('rating.submit')}
          onPress={() => void submit()}
          disabled={complete || busy}
          loading={busy}
        />
        <PrimaryButton
          title="Skip"
          variant="outline"
          onPress={onSkip}
          disabled={complete || busy}
          style={styles.skipBtn}
        />
      </View>

      {complete ? (
        <View style={styles.celebrateOverlay} pointerEvents="none">
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons name="checkmark-circle" size={96} color={Colors.primary} />
          </Animated.View>
        </View>
      ) : null}

      <SuccessToast
        visible={complete}
        message="Trip Completed Successfully"
        durationMs={AnimDuration.tripCompleteToastMs}
        onDismiss={onToastDismiss}
      />
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
  starsWrap: {
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  starsWrapError: { borderColor: 'transparent' },
  stars: { flexDirection: 'row', gap: Spacing.sm },
  tagLabel: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xl,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  loadText: { color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.sm },
  commentInput: {
    marginTop: Spacing.lg,
    width: '100%',
    minHeight: 88,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    textAlignVertical: 'top',
    backgroundColor: Colors.surfaceElevated,
  },
  footer: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  skipBtn: { marginTop: Spacing.xs },
  celebrateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.celebrateScrim,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
});
