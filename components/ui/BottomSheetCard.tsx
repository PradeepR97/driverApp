import { AnimDuration } from '@/constants/animations';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  bottomInset: number;
  style?: ViewStyle;
};

/**
 * Rounded floating card anchored to the bottom (trip details, forms). Keeps a high z-index so it
 * stays above map and other layers on Android.
 */
export function BottomSheetCard({ children, bottomInset, style }: Props) {
  const translateY = useSharedValue(96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: AnimDuration.bottomSheetMs,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: AnimDuration.bottomSheetMs * 0.85,
      easing: Easing.out(Easing.quad),
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sheet,
        Shadows.floatLg,
        { paddingBottom: bottomInset + Spacing.md, zIndex: 40, elevation: 28 },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.handle} />
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: 0,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    ...Platform.select({
      ios: { shadowOpacity: 0.14 },
      default: {},
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  content: { gap: Spacing.md, paddingBottom: Spacing.sm },
});
