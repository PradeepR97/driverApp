import { useShakeAnimation } from '@/lib/hooks/useShakeAnimation';
import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  /** Increase this value to trigger shake (prevents stacking in hook). */
  trigger?: number;
  durationMs?: number;
  amplitude?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function ShakeWrapper({
  trigger = 0,
  durationMs,
  amplitude,
  style,
  children,
}: Props) {
  const shake = useShakeAnimation({ durationMs, amplitude });
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger > prevTrigger.current) {
      shake.shake();
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  return <Animated.View style={[shake.style, style]}>{children}</Animated.View>;
}
