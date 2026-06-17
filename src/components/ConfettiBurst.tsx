/**
 * ConfettiBurst — a celebratory completion overlay.
 *
 * Plays once on the rising edge of `play` (e.g. a task completion), then calls
 * onDone. Pure React Native Animated + Views (no lottie / svg / sound) so it
 * works identically on native and web with zero native dependencies.
 *
 * v2 (kid-delight): a center "party-popper" burst — pieces explode outward from
 * a point in the upper-middle, arc out, then fall with gravity + spin + fade,
 * plus one soft flash ring for punch. Bigger + denser + livelier than the old
 * gentle top-down rain, but still bounded (~1.4s, no loop, fades to calm) so it
 * stays joyful — not a slot-machine — per BUFF's pillars (calm, non-gambling).
 */
import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, useWindowDimensions, Easing, Platform } from 'react-native';

// BUFF palette — mint, indigo, teal, coral, amber, blue.
const COLORS = ['#A8E63E', '#8B5CF6', '#6EE7B7', '#FCA5A5', '#FBBF24', '#60A5FA'];
const COUNT = 60;
const DURATION = 1400;
const useNative = Platform.OS !== 'web'; // RN-web has no native driver

interface Props {
  play: boolean;
  onDone?: () => void;
}

export function ConfettiBurst({ play, onDone }: Props) {
  const { width, height } = useWindowDimensions();

  // Burst origin: upper-middle of the screen (roughly where the tapped card /
  // action sits), so the explosion reads as coming "from the task".
  const originX = width / 2;
  const originY = height * 0.4;

  const flash = useRef(new Animated.Value(0)).current;

  // Stable per-mount random parameters for each piece. Each gets a launch angle
  // + distance (the outward burst) and a gravity fall applied afterwards.
  const pieces = useRef(
    Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist  = 70 + Math.random() * 190;          // burst radius
      const big   = Math.random() > 0.7;
      return {
        color:   COLORS[i % COLORS.length],
        size:    big ? 11 + Math.random() * 7 : 6 + Math.random() * 5,
        round:   Math.random() > 0.55,                  // circle vs square mix
        burstX:  Math.cos(angle) * dist,
        burstY:  Math.sin(angle) * dist * 0.8 - 40,     // slight upward bias
        drift:   (Math.random() - 0.5) * 80,
        fall:    height * 0.5 + Math.random() * height * 0.2,
        rotateTo: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        delay:   Math.random() * 110,
        anim:    new Animated.Value(0),
      };
    }),
  ).current;

  useEffect(() => {
    if (!play) return;

    flash.setValue(0);
    const flashAnim = Animated.timing(flash, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: useNative,
    });

    const pieceAnims = pieces.map((p) => {
      p.anim.setValue(0);
      return Animated.timing(p.anim, {
        toValue: 1,
        duration: DURATION,
        delay: p.delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      });
    });

    const group = Animated.parallel([flashAnim, ...pieceAnims]);
    group.start(({ finished }) => { if (finished && onDone) onDone(); });
    return () => group.stop();
  }, [play]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!play) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Soft central flash ring — quick punch, then gone. */}
      <Animated.View
        style={{
          position: 'absolute',
          left: originX - 40,
          top: originY - 40,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FFFFFF',
          opacity: flash.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.55, 0] }),
          transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.3, 3.2] }) }],
        }}
      />

      {pieces.map((p, i) => {
        const translateX = p.anim.interpolate({
          inputRange:  [0, 0.35, 1],
          outputRange: [0, p.burstX, p.burstX + p.drift],
        });
        const translateY = p.anim.interpolate({
          inputRange:  [0, 0.35, 1],
          outputRange: [0, p.burstY, p.burstY + p.fall],
        });
        const scale = p.anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.2, 1, 1] });
        const rotate = p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotateTo}deg`] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.06, 0.7, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: originX,
              top: originY,
              width: p.size,
              height: p.round ? p.size : p.size * 0.6,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}
