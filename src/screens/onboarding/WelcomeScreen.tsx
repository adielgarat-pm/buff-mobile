/**
 * WelcomeScreen — first screen of the onboarding stack.
 *
 * Layout (top → bottom):
 *  1. BUFF logo (SVG lettermark) + "BUFF" wordmark
 *  2. Headline (welcome.headline)
 *  3. Three value cards with emoji icon, title, description
 *  4. CTA button (welcome.cta)
 *  5. Timer hint text below button (welcome.timer)
 *
 * RTL: text alignment follows I18nManager.isRTL.
 * Logo SVG wrapped in direction:"ltr" so the B lettermark is never mirrored.
 *
 * Logo: assets/BUFF_LOGO.png (80×80, resizeMode "contain").
 */
import { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ScrollView, StyleSheet, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { PASTEL_MODE } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';
import { useRTLStyles } from '../../contexts/LanguageContext';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

// ── Design tokens (Pastel — onboarding home base) ────────────────────────────────
const BG          = PASTEL_MODE.canvas;     // #F4F0FA
const ACCENT      = PASTEL_MODE.accent;     // #7C3AED
const TEXT_DARK   = PASTEL_MODE.text;       // #1a1636
const TEXT_MUTED  = PASTEL_MODE.textMuted;  // #6B5B8A
const CARD_BG     = PASTEL_MODE.card;       // #FFFFFF
const CARD_BORDER = PASTEL_MODE.cardBorder; // #E2DAF2

// ── Value card data ────────────────────────────────────────────────────────────
const CARDS = [
  { emoji: '🎮', titleKey: 'welcome.card1.title', descKey: 'welcome.card1.desc' },
  { emoji: '🤝', titleKey: 'welcome.card2.title', descKey: 'welcome.card2.desc' },
  { emoji: '🧠', titleKey: 'welcome.card3.title', descKey: 'welcome.card3.desc' },
] as const;

// ──────────────────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const navigation   = useNavigation<Nav>();
  const { t }        = useTranslation();
  const { textAlign, rowDirection } = useRTLStyles();

  const hasNavigated = useRef(false);
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  // ── Fade-in on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ── Navigate once (guard against double-fire) ────────────────────────────────
  const goToOnboarding = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.navigate('UStep1');
  }, [navigation]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <Animated.View style={[styles.animWrap, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── 1. Logo ──────────────────────────────────────────────────────
              direction:"ltr" wrapper prevents RTL OS pass from mirroring
              the logo image.
          ─────────────────────────────────────────────────────────────────── */}
          <View style={styles.logoLTRWrap as object}>
            <Image
              source={require('../../../assets/BUFF_LOGO_LAVENDER.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoWordmark}>BUFF</Text>
          </View>

          {/* ── 2. Headline ──────────────────────────────────────────────── */}
          <Text style={[styles.headline, { textAlign: 'center' }]}>
            {t('welcome.headline')}
          </Text>

          {/* ── 3. Value cards ───────────────────────────────────────────── */}
          <View style={styles.cardsWrap}>
            {CARDS.map((card) => (
              <View key={card.titleKey} style={[styles.card, { flexDirection: rowDirection }]}>
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { textAlign }]}>
                    {t(card.titleKey)}
                  </Text>
                  <Text style={[styles.cardDesc, { textAlign }]}>
                    {t(card.descKey)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── 4. CTA button ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.cta}
            onPress={goToOnboarding}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{t('welcome.cta')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: BG,
  },
  animWrap: {
    flex: 1,
  },
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 28,
    paddingVertical:   32,
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoLTRWrap: {
    alignItems:   'center',
    marginBottom: 28,
    // Native-only: prevents RTL mirroring. RN Web rejects `direction` and warns.
    ...(Platform.OS === 'web' ? null : { direction: 'ltr' as const }),
  },
  logoImage: {
    width:  80,
    height: 80,
  },
  logoWordmark: {
    color:         ACCENT,
    fontSize:      26,
    fontWeight:    '900',
    letterSpacing: 8,
    marginTop:     10,
  },

  // ── Headline ──────────────────────────────────────────────────────────────
  headline: {
    color:        TEXT_DARK,
    fontSize:     26,
    fontWeight:   '900',
    lineHeight:   34,
    marginBottom: 28,
    paddingHorizontal: 4,
  },

  // ── Value cards ───────────────────────────────────────────────────────────
  cardsWrap: {
    width:        '100%',
    marginBottom: 32,
    gap:          12,
  },
  card: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    backgroundColor: CARD_BG,
    borderRadius:   10,
    borderWidth:    1.5,
    borderColor:    CARD_BORDER,
    paddingVertical:   14,
    paddingHorizontal: 16,
    gap:            12,
  },
  cardEmoji: {
    fontSize:  28,
    lineHeight: 34,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color:        TEXT_DARK,
    fontSize:     15,
    fontWeight:   '700',
    marginBottom: 3,
  },
  cardDesc: {
    color:      TEXT_MUTED,
    fontSize:   13,
    lineHeight: 19,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  cta: {
    width:           '100%',
    backgroundColor: ACCENT,
    borderRadius:    16,
    paddingVertical: 18,
    alignItems:      'center',
  },
  ctaText: {
    color:      '#fff',
    fontSize:   17,
    fontWeight: '900',
  },
});
