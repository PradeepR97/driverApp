import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  message: string;
  variant?: 'success' | 'error';
  durationMs?: number;
  onDismiss?: () => void;
};

export function AppToast({
  visible,
  message,
  variant = 'success',
  durationMs = 3000,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
      Animated.delay(durationMs),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 10, duration: 220, useNativeDriver: true }),
      ]),
    ]);
    anim.start(({ finished }) => {
      if (finished) onDismiss?.();
    });
    return () => anim.stop();
  }, [durationMs, onDismiss, opacity, translateY, visible]);

  if (!visible) return null;
  const isError = variant === 'error';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + Spacing.md,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.icon, isError ? styles.iconError : null]}>
          <Ionicons name={isError ? 'alert-circle' : 'checkmark'} size={18} color={Colors.white} />
        </View>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    zIndex: 200,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.floatLg,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  iconError: { backgroundColor: Colors.danger },
  text: { color: Colors.text, fontWeight: '700', fontSize: 13, flexShrink: 1 },
});
