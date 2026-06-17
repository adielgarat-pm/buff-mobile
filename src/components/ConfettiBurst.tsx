/**
 * ConfettiBurst — a light, dependency-free celebration overlay.
 *
 * Plays once on the rising edge of `play` (e.g. a task completion), then calls
 * onDone. Pure React Native Animated + Views (no lottie / svg) so it works
 * identically on native and web. Kept gentle + brief per BUFF's pillars
 * (calm, non-gambling): a short fall, soft fade, no looping, no sound.
 */
import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, useWindowDimensions, Easing, Platform } from 'react-native';

// BUFF palette — mint, indigo, teal, coral, amber, blue.
const COLORS = ['#A8E63E', '#8B5CF6', '#6EE7B7', '#FCA5A5', '#FBBF24', '#60A5FA'];
const COUNT = 18;
const DURATION = 1100;
const useNative = Platform.OS !== 'web'; // RN-web has no native driver

interface Props {
  play: boolean;
  onDone?: () => void;
}

export function ConfettiBurst({ play, onDone }: Props) {
  const { width, height } = useWindowDimensions();

  // Stable per-mount random parameters for each piece.
  const pieces = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      left: Math.random() * width,
      color: COLORS[i % COLORS.length],
      w: 6 + Math.random() * 6,
      delay: Math.random() * 140,
      drift: (Math.random() - 0.5) * 90,
      rotateTo: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
      anim: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    if (!play) return;
    const anims = pieces.map((p) => {
      p.anim.setValue(0);
      return Animated.timing(p.anim, {
        toValue: 1,
        duration: DURATION,
        delay: p.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: useNative,
      });
    });
    const group = Animated.parallel(anims);
    group.start(({ finished }) => { if (finished && onDone) onDone(); });
    return () => group.stop();
  }, [play]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!play) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-24, height * 0.7] });
        const translateX = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const rotate = p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotateTo}deg`] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.left,
              top: 0,
              width: p.w,
              height: p.w * 0.6,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
