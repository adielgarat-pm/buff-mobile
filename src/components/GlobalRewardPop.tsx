/**
 * GlobalRewardPop — single app-root "+N ⚡" reward float.
 *
 * Subscribes to the celebration event bus (src/lib/confetti). On a real task
 * completion that earned BUFFs, it pops a "+N ⚡" label near the upper-middle
 * (co-located with the confetti burst), overshoots in, floats up, and fades —
 * the direct reward feedback that nudges "let's do another one". Pure RN
 * Animated + Views (no native deps). Mounted once in App.tsx so it overlays
 * whatever child screen is active, both Mint and Gamer.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, useWindowDimensions, Easing, Platform } from 'react-native';
import { subscribeConfetti } from '../lib/confetti';
import { useChildTheme } from '../contexts/ThemeContext';

const useNative = Platform.OS !== 'web';

function RewardPop({ credits, color, top, onDone }: { credits: number; color: string; top: number; onDone: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const a = Animated.timing(anim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    });
    a.start(({ finished }) => { if (finished) onDone(); });
    return () => a.stop();
  }, [anim, onDone]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -78] });
  const scale = anim.interpolate({ inputRange: [0, 0.18, 0.4, 1], outputRange: [0.4, 1.15, 1, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.65, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { top, opacity, transform: [{ translateY }, { scale }] }]}
    >
      <Text style={[styles.text, { color }]}>{`+${credits} ⚡`}</Text>
    </Animated.View>
  );
}

export function GlobalRewardPop() {
  const { height } = useWindowDimensions();
  const T = useChildTheme();
  const [evt, setEvt] = useState<{ key: number; credits: number } | null>(null);
  const keyRef = useRef(0);

  useEffect(() => subscribeConfetti((credits) => {
    if (!credits || credits <= 0) return; // nothing to celebrate if no BUFFs earned
    keyRef.current += 1;
    setEvt({ key: keyRef.current, credits });
  }), []);

  if (!evt) return null;
  return (
    <RewardPop
      key={evt.key}
      credits={evt.credits}
      color={T.buff}
      top={height * 0.32}
      onDone={() => setEvt(null)}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    fontSize: 38,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
