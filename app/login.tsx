import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Shadows, Spacing, Type } from '@/constants/theme';
import { normalizePhoneDigits, postOtpRequest } from '@/lib/api/auth';
import { AUTH_USER_TYPE, DEFAULT_COUNTRY_CODE } from '@/lib/config';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const digits = normalizePhoneDigits(phone);
    if (digits.length !== 10) {
      Alert.alert('Invalid number', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await postOtpRequest({
        user_type: AUTH_USER_TYPE,
        countryCode: DEFAULT_COUNTRY_CODE,
        phoneNumber: digits,
      });
      const expiresIn = typeof res.expires_in === 'number' ? res.expires_in : 300;
      router.push({
        pathname: '/verify-otp',
        params: {
          phone: digits,
          countryCode: DEFAULT_COUNTRY_CODE,
          expiresIn: String(Math.min(expiresIn, 600)),
        },
      });
    } catch (e) {
      Alert.alert('Could not send OTP', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={styles.back}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color={Colors.text} />
      </Pressable>
      <View style={styles.hairline} />

      <View style={styles.hero}>
        <View style={styles.phoneWrap}>
          <Ionicons name="phone-portrait-outline" size={32} color={Colors.primaryDark} />
        </View>
        <Text style={styles.title}>Welcome, Partner!</Text>
        <Text style={styles.subtitle}>Enter your mobile number to get started</Text>
      </View>

      <Text style={styles.label}>Mobile Number</Text>
      <View style={styles.phoneRow}>
        <View style={styles.cc}>
          <Text style={styles.ccText}>IN +91</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="99999 88888"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
          maxLength={12}
          value={phone}
          onChangeText={setPhone}
          editable={!loading}
        />
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title="Login" loading={loading} onPress={() => void onLogin()} />
        <Text style={styles.legal}>
          By clicking Login, you agree to our{' '}
          <Text style={styles.link}>Terms and Conditions</Text>,{' '}
          <Text style={styles.link}>Privacy Policy</Text> and{' '}
          <Text style={styles.link}>TDS Declaration</Text>
        </Text>
        <Text style={styles.help}>
          Need help? <Text style={styles.link}>Contact Support</Text>
        </Text>
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
  back: { alignSelf: 'flex-start', marginBottom: Spacing.sm },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  hero: { alignItems: 'center', marginTop: Spacing.sm },
  phoneWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.floatSm,
  },
  title: { ...Type.h1, textAlign: 'center' },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  label: {
    marginTop: Spacing.xl,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  cc: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    minHeight: 52,
    backgroundColor: Colors.surface,
  },
  ccText: { fontWeight: '600', color: Colors.text },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 17,
    color: Colors.text,
    minHeight: 52,
    backgroundColor: Colors.surfaceElevated,
  },
  bottom: { gap: Spacing.md },
  legal: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: { color: Colors.link, textDecorationLine: 'underline', fontWeight: '600' },
  help: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
