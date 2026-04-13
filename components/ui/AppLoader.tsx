import { AnimDuration } from '@/constants/animations';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { useAppLoadingStore } from '@/lib/stores/app-loading-store';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  View,
} from 'react-native';

const SHOW_DELAY_MS = 300;

/** Full-screen overlay loader driven by axios interceptors and/or `pushGlobalLoading` / `popGlobalLoading`. */
export function AppLoader() {
  const requestDepth = useAppLoadingStore((s) => s.requestDepth);
  const [visible, setVisible] = useState(false);
  const pulse = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (requestDepth <= 0) {
      setVisible(false);
      return;
    }

    const showTimer = setTimeout(() => {
      if (useAppLoadingStore.getState().requestDepth > 0) {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);

    return () => clearTimeout(showTimer);
  }, [requestDepth]);

  useEffect(() => {
    if (!visible) {
      pulse.setValue(0.92);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: AnimDuration.cardScaleMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.92,
          duration: AnimDuration.cardScaleMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop} pointerEvents="auto">
        <Animated.View style={[styles.card, { transform: [{ scale: pulse }] }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.loaderScrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 28,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatLg,
  },
});
