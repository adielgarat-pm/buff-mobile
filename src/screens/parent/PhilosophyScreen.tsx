/**
 * PhilosophyScreen — "The BUFF Philosophy"
 *
 * Layout (top → bottom):
 *  1. Header: back button + title
 *  2. Intro card (subtitle + intro text + share tip)
 *  3. "The 6 Pillars" section — 6 cards (emoji · title · content · 💡 insight)
 *  4. "Core Principles" section — 4 cards (emoji �� title · desc)
 *  5. Closing quote card
 *
 * Styling matches WelcomeScreen design tokens exactly:
 *  BG = #ede8ff, ACCENT = #5b21b6, CARD_BG = #ffffff, CARD_BORDER = #c8bef5
 */
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, I18nManager, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// ── Design tokens (same as WelcomeScreen) ─────────────────────────────────────
const BG           = '#ede8ff';
const ACCENT       = '#5b21b6';
const ACCENT_LIGHT = '#ede0ff';
const TEXT_DARK    = '#26215C';
const TEXT_MUTED   = '#5a4e7a';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#c8bef5';
const INSIGHT_BG   = '#f3f0ff';
const INSIGHT_TEXT = '#6d28d9';

// ── Data ───────────────────────────────────────────────────────────────────────

const PILLARS = [
  { emoji: '⚡', id: 'branding'  },
  { emoji: '🏆', id: 'rewards'   },
  { emoji: '🛡️', id: 'positive'  },
  { emoji: '❤️', id: 'bonus'     },
  { emoji: '📅', id: 'dayTypes'  },
  { emoji: '🔥', id: 'smartGoal' },
] as const;

const PRINCIPLES = [
  { emoji: '⏱️', id: 'p1' },
  { emoji: '🤝', id: 'p2' },
  { emoji: '😴', id: 'p3' },
  { emoji: '🧩', id: 'p4' },
] as const;

// ──────────────────────────────────────────────────────────────────────────────

export default function PhilosophyScreen() {
  const navigation = useNavigation();
  const { t }      = useTranslation();
  const isRTL      = I18nManager.isRTL;
  const textAlign  = isRTL ? ('right' as const) : ('left' as const);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={24}
            color={ACCENT}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('philosophy.title')}</Text>
        {/* spacer to balance the back button */}
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Intro card ──────────────────────────────────────────────── */}
        <View style={styles.introCard}>
          <Text style={[styles.fromParents, { textAlign: 'center' }]}>
            {t('philosophy.fromParents')}
          </Text>
          <Text style={[styles.introText, { textAlign }]}>
            {t('philosophy.intro')}
          </Text>
          <View style={styles.tipBanner}>
            <Text style={[styles.tipText, { textAlign }]}>
              {t('philosophy.tip')}
            </Text>
          </View>
        </View>

        {/* ── Section: 6 Pillars ──────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { textAlign }]}>
          {t('philosophy.pillarsTitle')}
        </Text>

        {PILLARS.map((pillar, index) => (
          <View key={pillar.id} style={styles.pillarCard}>
            {/* Card counter */}
            <Text style={styles.counter}>{index + 1}/{PILLARS.length}</Text>

            {/* Top row: emoji + title */}
            <View style={[styles.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.cardEmoji}>{pillar.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { textAlign }]}>
                  {t(`philosophy.${pillar.id}.title`)}
                </Text>
                <Text style={[styles.cardSubtitle, { textAlign }]}>
                  {t(`philosophy.${pillar.id}.subtitle`)}
                </Text>
              </View>
            </View>

            {/* Content */}
            <Text style={[styles.cardContent, { textAlign }]}>
              {t(`philosophy.${pillar.id}.content`)}
            </Text>

            {/* Insight pill */}
            <View style={styles.insightPill}>
              <Text style={[styles.insightLabel, { textAlign }]}>
                💡 {t('philosophy.buffInsight')}
              </Text>
              <Text style={[styles.insightText, { textAlign }]}>
                {t(`philosophy.${pillar.id}.insight`)}
              </Text>
            </View>
          </View>
        ))}

        {/* ── Section: Core Principles ────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { textAlign, marginTop: 8 }]}>
          {t('philosophy.principlesTitle')}
        </Text>

        {PRINCIPLES.map((p) => (
          <View key={p.id} style={styles.principleCard}>
            <View style={[styles.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.principleEmoji}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { textAlign }]}>
                  {t(`philosophy.${p.id}.title`)}
                </Text>
                <Text style={[styles.cardDesc, { textAlign }]}>
                  {t(`philosophy.${p.id}.desc`)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* ── Closing quote ───────────────────────────────────────────── */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>{t('philosophy.quote')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: BG,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 12,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
    backgroundColor:   BG,
  },
  backBtn: {
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: {
    color:      TEXT_DARK,
    fontSize:   17,
    fontWeight: '700',
    flex:       1,
    textAlign:  'center',
  },

  // ── ScrollView ────────────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     48,
  },

  // ── Intro card ────────────────────────────────────────────────────────────
  introCard: {
    backgroundColor: CARD_BG,
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     CARD_BORDER,
    padding:         18,
    marginBottom:    24,
  },
  fromParents: {
    color:         ACCENT,
    fontSize:      12,
    fontWeight:    '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  10,
  },
  introText: {
    color:      TEXT_MUTED,
    fontSize:   14,
    lineHeight: 21,
    marginBottom: 14,
  },
  tipBanner: {
    backgroundColor: ACCENT_LIGHT,
    borderRadius:    10,
    padding:         12,
  },
  tipText: {
    color:      TEXT_MUTED,
    fontSize:   12,
    lineHeight: 18,
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    color:         TEXT_DARK,
    fontSize:      13,
    fontWeight:    '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom:  12,
  },

  // ── Pillar card ───────────────────────────────────────────────────────────
  pillarCard: {
    backgroundColor: CARD_BG,
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     CARD_BORDER,
    padding:         16,
    marginBottom:    12,
  },
  counter: {
    position:   'absolute',
    top:        12,
    right:      14,
    fontSize:   10,
    color:      '#b0a8d0',
    fontWeight: '600',
  },
  cardRow: {
    alignItems:   'flex-start',
    gap:          12,
    marginBottom: 10,
    paddingRight: 28, // room for counter
  },
  cardEmoji: {
    fontSize:  28,
    lineHeight: 34,
  },
  cardTitle: {
    color:        TEXT_DARK,
    fontSize:     15,
    fontWeight:   '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    color:    TEXT_MUTED,
    fontSize: 12,
  },
  cardContent: {
    color:      TEXT_MUTED,
    fontSize:   14,
    lineHeight: 21,
    marginBottom: 12,
  },
  insightPill: {
    backgroundColor: INSIGHT_BG,
    borderRadius:    10,
    padding:         12,
  },
  insightLabel: {
    color:        INSIGHT_TEXT,
    fontSize:     11,
    fontWeight:   '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  4,
  },
  insightText: {
    color:      INSIGHT_TEXT,
    fontSize:   13,
    lineHeight: 19,
    fontWeight: '500',
  },

  // ── Principle card ────────────────────────────────────────────────────────
  principleCard: {
    backgroundColor: CARD_BG,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     CARD_BORDER,
    padding:         14,
    marginBottom:    10,
  },
  principleEmoji: {
    fontSize:   22,
    lineHeight: 28,
  },
  cardDesc: {
    color:      TEXT_MUTED,
    fontSize:   13,
    lineHeight: 19,
    marginTop:  4,
  },

  // ── Quote card ────────────────────────────────────────────────────────────
  quoteCard: {
    backgroundColor: ACCENT,
    borderRadius:    16,
    padding:         24,
    marginTop:       8,
    alignItems:      'center',
  },
  quoteText: {
    color:      '#f5f0ff',
    fontSize:   18,
    fontWeight: '800',
    textAlign:  'center',
    lineHeight: 26,
  },
});
