import { AnimDuration } from '@/config/animations';
import { Colors, Radius, Shadows, Spacing } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, } from 'react-native-reanimated';
const KNOB = 48;
const PADDING = 6;
const THRESHOLD = 0.82;
const variantStyles = {
    primary: {
        track: { backgroundColor: Colors.primarySoft },
        fill: { backgroundColor: Colors.swipeFillPrimary },
        knob: { backgroundColor: Colors.primaryDark },
        text: { color: Colors.primaryDark },
        icon: Colors.white,
    },
    danger: {
        track: { backgroundColor: Colors.swipeTrackDanger },
        fill: { backgroundColor: Colors.swipeFillDanger },
        knob: { backgroundColor: Colors.danger },
        text: { color: Colors.danger },
        icon: Colors.white,
    },
    offline: {
        track: { backgroundColor: Colors.dangerSoft },
        fill: { backgroundColor: Colors.swipeFillDanger },
        knob: { backgroundColor: Colors.danger },
        text: { color: Colors.danger },
        icon: Colors.white,
    },
    indigo: {
        track: { backgroundColor: Colors.swipeIndigoTrack },
        fill: { backgroundColor: Colors.swipeIndigoFill },
        knob: { backgroundColor: Colors.swipeIndigoKnob },
        text: { color: Colors.swipeIndigoText },
        icon: Colors.white,
    },
    success: {
        track: { backgroundColor: Colors.swipeSuccessTrack },
        fill: { backgroundColor: Colors.swipeSuccessFill },
        knob: { backgroundColor: Colors.accentCash },
        text: { color: Colors.swipeSuccessText },
        icon: Colors.white,
    },
};
export function SwipeButton({ label, onComplete, disabled, variant = 'primary', testID, trackOutlined, resetKey, }) {
    const [trackW, setTrackW] = useState(0);
    const maxX = Math.max(0, trackW - KNOB - PADDING * 2);
    const translateX = useSharedValue(0);
    const trackOpacity = useSharedValue(1);
    const [locked, setLocked] = useState(false);
    const vs = variantStyles[variant];
    const onLayout = useCallback((e) => {
        setTrackW(e.nativeEvent.layout.width);
    }, []);
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);
    useEffect(() => {
        translateX.value = 0;
        trackOpacity.value = 1;
        setLocked(false);
    }, [disabled, resetKey, label, variant, translateX, trackOpacity]);
    const finish = useCallback(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        trackOpacity.value = withTiming(0.78, { duration: AnimDuration.pressScaleMs * 2 });
        setLocked(true);
        onCompleteRef.current();
    }, [trackOpacity]);
    const pan = useMemo(() => Gesture.Pan()
        .enabled(!disabled && maxX > 0 && !locked)
        .onUpdate((e) => {
        const x = Math.max(0, Math.min(maxX, e.translationX));
        translateX.value = x;
    })
        .onEnd(() => {
        const progress = maxX > 0 ? translateX.value / maxX : 0;
        if (progress >= THRESHOLD) {
            translateX.value = withSpring(maxX, { damping: 18, stiffness: 220 });
            runOnJS(finish)();
        }
        else {
            translateX.value = withSpring(0, { damping: 20, stiffness: 280 });
        }
    }), [disabled, maxX, locked, translateX, finish]);
    const knobStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));
    const fillStyle = useAnimatedStyle(() => ({
        width: PADDING + translateX.value + KNOB * 0.5,
    }));
    const trackAnimStyle = useAnimatedStyle(() => ({
        opacity: trackOpacity.value,
    }));
    return (<Animated.View style={[
            styles.track,
            vs.track,
            trackOutlined && styles.trackOutlined,
            disabled && styles.disabled,
            trackAnimStyle,
        ]} onLayout={onLayout} testID={testID} accessibilityRole="adjustable">
      <Animated.View style={[styles.fill, vs.fill, fillStyle]}/>
      <Text style={[styles.label, vs.text]} numberOfLines={1}>
        {label}
      </Text>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, vs.knob, knobStyle]}>
          <Ionicons name="chevron-forward" size={22} color={vs.icon}/>
        </Animated.View>
      </GestureDetector>
    </Animated.View>);
}
const styles = StyleSheet.create({
    track: {
        alignSelf: 'stretch',
        width: '100%',
        minHeight: 56,
        borderRadius: Radius.xl,
        padding: PADDING,
        justifyContent: 'center',
        overflow: 'hidden',
        ...Shadows.floatSm,
    },
    fill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: Radius.xl,
    },
    label: {
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '800',
        paddingHorizontal: KNOB + Spacing.lg,
    },
    knob: {
        position: 'absolute',
        left: PADDING,
        top: PADDING,
        width: KNOB,
        height: KNOB,
        borderRadius: KNOB / 2,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.floatSm,
    },
    trackOutlined: {
        borderWidth: 2,
        borderColor: Colors.primaryDark,
    },
    disabled: { opacity: 0.5 },
});
