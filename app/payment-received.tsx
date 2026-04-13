import { Colors, Spacing, Type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const RECEIVED_ANIMATION_MS = 2000;

export default function PaymentReceivedScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]);
    anim.start();

    const id = setTimeout(() => {
      router.replace('/rating');
    }, RECEIVED_ANIMATION_MS);

    return () => {
      clearTimeout(id);
      anim.stop();
    };
  }, [opacity, router, scale]);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <Ionicons name="checkmark-circle" size={108} color="#16A34A" />
        <Text style={styles.title}>Payment Received</Text>
        <Text style={styles.sub}>Redirecting to rating...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  center: { alignItems: 'center' },
  title: {
    ...Type.h1,
    marginTop: Spacing.md,
  },
  sub: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
