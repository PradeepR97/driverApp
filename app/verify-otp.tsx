import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import {
    formatPhoneForDisplay,
    normalizePhoneDigits,
    postOtpRequest,
    postOtpVerify,
} from '@/lib/api/auth';
import { getAppState, postUserLanguage } from '@/lib/api/app';
import { extractAccessToken } from '@/lib/api/token';
import { setAccessToken } from '@/lib/auth-session';
import { setStoredPhoneNumber } from '@/lib/storage/driver-session-storage';
import { getStoredLanguageCode } from '@/lib/language-storage';
import { replaceForAppState } from '@/lib/navigation/route-after-auth';
import { AUTH_USER_TYPE, DEFAULT_COUNTRY_CODE, OTP_DIGIT_COUNT } from '@/lib/config';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatCountdown(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    phone?: string;
    countryCode?: string;
    expiresIn?: string;
  }>();

  const phone10 = typeof params.phone === 'string' ? normalizePhoneDigits(params.phone) : '';
  const countryCode =
    typeof params.countryCode === 'string' ? params.countryCode : DEFAULT_COUNTRY_CODE;

  const [values, setValues] = useState(() => Array.from({ length: OTP_DIGIT_COUNT }, () => ''));
  const [cooldown, setCooldown] = useState(() => {
    const n = Number(params.expiresIn);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 600) : 60;
  });
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [focusedOtp, setFocusedOtp] = useState<number | null>(0);
  const inputs = useRef<Array<TextInput | null>>([]);
  const verifyAttempted = useRef<string | null>(null);
  const otpShakeX = useRef(new Animated.Value(0)).current;

  const runOtpShake = () => {
    otpShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(otpShakeX, { toValue: 10, duration: 42, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(otpShakeX, { toValue: -10, duration: 42, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(otpShakeX, { toValue: 8, duration: 42, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(otpShakeX, { toValue: -8, duration: 42, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(otpShakeX, { toValue: 0, duration: 42, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (phone10.length !== 10) {
      router.replace('/login');
    }
  }, [phone10, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown > 0]);

  const verifyAndContinue = useCallback(
    async (code: string) => {
      if (phone10.length !== 10) return;
      setBusy(true);
      try {
        const data = await postOtpVerify({
          user_type: AUTH_USER_TYPE,
          countryCode,
          phoneNumber: phone10,
          otp: code,
        });
        const token = extractAccessToken(data);
        if (!token) {
          verifyAttempted.current = null;
          setValues(Array.from({ length: OTP_DIGIT_COUNT }, () => ''));
          inputs.current[0]?.focus();
          runOtpShake();
          Alert.alert(
            'Sign-in incomplete',
            'No session token was returned. Check the API response shape or try again.',
          );
          return;
        }
        await setAccessToken(token);
        await setStoredPhoneNumber(phone10);

        const langCode = await getStoredLanguageCode();
        if (langCode) {
          try {
            await postUserLanguage(langCode);
          } catch (err) {
            if (__DEV__) {
              console.warn('[api] language sync failed (continuing to app state):', err);
            }
          }
        }

        try {
          const state = await getAppState();
          replaceForAppState(router, state);
        } catch {
          router.replace('/onboarding/owner');
        }
      } catch (e) {
        verifyAttempted.current = null;
        setValues(Array.from({ length: OTP_DIGIT_COUNT }, () => ''));
        inputs.current[0]?.focus();
        runOtpShake();
        Alert.alert('Verification failed', e instanceof Error ? e.message : 'Please try again.');
      } finally {
        setBusy(false);
      }
    },
    [countryCode, phone10, router],
  );

  const setDigit = (index: number, char: string) => {
    if (busy) return;
    const c = char.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[index] = c;
    setValues(next);
    if (c && index < OTP_DIGIT_COUNT - 1) {
      inputs.current[index + 1]?.focus();
    }
    const joined = next.join('');
    if (joined.length === OTP_DIGIT_COUNT && verifyAttempted.current !== joined) {
      verifyAttempted.current = joined;
      void verifyAndContinue(joined);
    }
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onResend = async () => {
    if (phone10.length !== 10 || cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await postOtpRequest({
        user_type: AUTH_USER_TYPE,
        countryCode,
        phoneNumber: phone10,
      });
      const next = typeof res.expires_in === 'number' ? res.expires_in : 60;
      setCooldown(Math.min(next, 600));
      verifyAttempted.current = null;
      Alert.alert('OTP sent', res.message ?? 'Check your SMS for a new code.');
    } catch (e) {
      Alert.alert('Could not resend', e instanceof Error ? e.message : 'Try again later.');
    } finally {
      setResending(false);
    }
  };

  const displayPhone = formatPhoneForDisplay(countryCode, phone10);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.back}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color={Colors.text} />
      </Pressable>
      <View style={styles.hairline} />

      <View style={styles.body}>
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark-outline" size={36} color={Colors.primaryDark} />
        </View>
        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.sub}>Enter the {OTP_DIGIT_COUNT}-digit code sent to</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phone}>{displayPhone}</Text>
          <Pressable onPress={() => router.back()} disabled={busy}>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>

        <Animated.View style={{ transform: [{ translateX: otpShakeX }] }}>
          <View style={styles.otpRow}>
            {values.map((v, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                style={[
                  styles.otpBox,
                  v ? styles.otpBoxFilled : null,
                  focusedOtp === i ? styles.otpBoxFocus : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={v}
                editable={!busy}
                onChangeText={(t) => setDigit(i, t)}
                onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
                onFocus={() => setFocusedOtp(i)}
              />
            ))}
          </View>
        </Animated.View>

        {busy ? (
          <Text style={styles.status}>Verifying…</Text>
        ) : cooldown > 0 ? (
          <Text style={styles.resend}>
            Resend code in <Text style={styles.timer}>{formatCountdown(cooldown)}</Text>
          </Text>
        ) : (
          <PrimaryButton
            title={resending ? 'Sending…' : 'Resend code'}
            variant="outline"
            loading={resending}
            disabled={resending}
            onPress={() => void onResend()}
            style={styles.resendBtn}
          />
        )}
      </View>
    </View>
  );
}

const OTP_BOX = OTP_DIGIT_COUNT > 4 ? 44 : 52;
const OTP_ROW_GAP = OTP_DIGIT_COUNT > 4 ? Spacing.sm : Spacing.md;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  back: { marginLeft: Spacing.md, marginBottom: Spacing.sm },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  body: { paddingHorizontal: Spacing.xl, alignItems: 'center', marginTop: Spacing.xl },
  shieldWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.floatSm,
  },
  title: { ...Type.h1 },
  sub: { marginTop: Spacing.md, fontSize: 15, color: Colors.textSecondary },
  phoneRow: { flexDirection: 'row', marginTop: Spacing.xs, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  phone: { fontSize: 16, fontWeight: '700', color: Colors.text },
  change: { fontSize: 16, fontWeight: '700', color: Colors.link, marginLeft: 4 },
  otpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: OTP_ROW_GAP,
    marginTop: Spacing.xl,
  },
  otpBox: {
    width: OTP_BOX,
    height: OTP_BOX,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: OTP_DIGIT_COUNT > 6 ? 18 : 22,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.surfaceElevated,
  },
  otpBoxFilled: { borderColor: Colors.primary },
  otpBoxFocus: {
    borderColor: Colors.link,
    ...Shadows.floatSm,
    shadowOpacity: 0.12,
  },
  resend: { marginTop: Spacing.xl, fontSize: 14, color: Colors.textSecondary },
  timer: { fontWeight: '800', color: Colors.text },
  status: { marginTop: Spacing.xl, fontSize: 14, color: Colors.textSecondary },
  resendBtn: { marginTop: Spacing.lg, alignSelf: 'stretch', width: '100%', maxWidth: 280 },
});
