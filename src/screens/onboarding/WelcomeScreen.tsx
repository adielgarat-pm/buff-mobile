/**
 * WelcomeScreen — first screen of the onboarding stack.
 *
 * Shown to authenticated parents who have not yet completed onboarding.
 * Creates anticipation and signals that the plan is personalised before
 * the user fills in any details.
 *
 * Behaviour:
 *  - 5-second auto-advance countdown, shown BELOW the CTA button
 *  - Tapping CTA skips countdown and navigates immediately
 *  - Does NOT touch onboarding_complete — that is UStep8_Complete's job
 *
 * RTL:
 *  - Text alignment follows I18nManager.isRTL
 *  - Logo <Svg> wrapped in a direction:"ltr" View so the B lettermark
 *    is never mirrored by the OS RTL layout pass
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, I18nManager, StyleSheet, Animated,
} from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = '#5b21b6';
const TEXT_CLR  = '#f5f0ff';
const TIMER_CLR = '#6c5ce7';
const COUNTDOWN = 5;

// ─────────────────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t }      = useTranslation();
  const isRTL      = I18nManager.isRTL;

  const [count, setCount]   = useState(COUNTDOWN);
  const hasNavigated        = useRef(false);
  const fadeAnim            = useRef(new Animated.Value(0)).current;

  // ── Fade-in on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ── Navigate once (guard against double-fire) ───────────────────────────────
  const goToOnboarding = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.navigate('UStep1');
  }, [navigation]);

  // ── Countdown — tick once per second, navigate when it reaches 0 ───────────
  useEffect(() => {
    if (count <= 0) {
      goToOnboarding();
      return;
    }
    const id = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, goToOnboarding]);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const align = isRTL ? 'right' : 'left';

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

        {/* ── Logo ─────────────────────────────────────────────────────────
            Wrap in a direction:"ltr" View so the RTL layout pass never
            mirrors the B lettermark.
        ──────────────────────────────────────────────────────────────────── */}
        <View style={styles.logoLTRWrap}>
          <Svg width={80} height={80} viewBox="0 0 80 80">
            {/* Frosted-glass backing square */}
            <Rect
              x={0} y={0} width={80} height={80} rx={20}
              fill="rgba(255,255,255,0.15)"
            />
            {/* B lettermark — textAnchor="middle" keeps it centred */}
            <SvgText
              x="40" y="58"
              textAnchor="middle"
              fontSize={52}
              fontWeight="900"
              fill={TEXT_CLR}
            >
              B
            </SvgText>
          </Svg>

          <Text style={styles.logoWordmark}>BUFF</Text>
        </View>

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <Text style={[styles.heading, { textAlign: 'center' }]}>
          {t('welcome.title')}
        </Text>

        {/* ── Subtitle ─────────────────────────────────────────────────── */}
        <Text style={[styles.sub, { textAlign: 'center' }]}>
          {t('welcome.sub')}
        </Text>

        {/* ── CTA button ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.cta}
          onPress={goToOnboarding}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{t('welcome.letsGo')}</Text>
        </TouchableOpacity>

        {/* ── Timer — sits BELOW the button, never inside it ───────────── */}
        <Text style={styles.timer}>
          {t('welcome.timer', { count })}
        </Text>

      </Animated.View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: BG,
  },
  inner: {
    flex:              1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 32,
  },

  // Logo block — forced LTR so B is never mirrored
  logoLTRWrap: {
    alignItems: 'center',
    marginBottom: 36,
    // direction is a valid RN style and prevents RTL mirroring of children
    direction: 'ltr',
  } as object, // cast: 'direction' is valid but not in all TS defs

  logoWordmark: {
    color:       TEXT_CLR,
    fontSize:    26,
    fontWeight:  '900',
    letterSpacing: 8,
    marginTop:   12,
  },

  heading: {
    color:        TEXT_CLR,
    fontSize:     30,
    fontWeight:   '900',
    marginBottom: 12,
    lineHeight:   38,
  },

  sub: {
    color:        'rgba(245,240,255,0.75)',
    fontSize:     16,
    lineHeight:   24,
    marginBottom: 52,
  },

  cta: {
    width:           '100%',
    backgroundColor: TEXT_CLR,
    borderRadius:    16,
    paddingVertical: 18,
    alignItems:      'center',
    marginBottom:    14,
  },
  ctaText: {
    color:      BG,
    fontSize:   17,
    fontWeight: '900',
  },

  // Timer text — small, muted, below button
  timer: {
    color:     TIMER_CLR,
    fontSize:  11,
    textAlign: 'center',
  },
});
