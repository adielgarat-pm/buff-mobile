/**
 * UStep3_Challenges — "Any other areas to work on?"
 *
 * Step 2 already captured the main challenge.
 * This step offers multi-select of the remaining options (optional).
 */
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { OPTIONS_BY_AGE } from './onboardingData';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep3_Challenges'>;
type Route = RouteProp<RootStackParamList, 'UStep3_Challenges'>;

const STEP = 2; const TOTAL = 6;

export default function UStep3_Challenges() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t }       = useTranslation();

  const [additionalChallenges, setAdditional] = useState<string[]>([]);

  // All options except the main challenge already chosen in Step 2
  const options = OPTIONS_BY_AGE[params.ageGroup].filter(
    o => o.id !== params.mainChallenge
  );

  const toggle = (id: string) => {
    setAdditional(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const onNext = () => {
    navigation.navigate('UStep4_Motivator', {
      ...params,
      additionalChallenges,
    });
  };

  const progress = (STEP + 1) / (TOTAL + 1);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.flowLabel}>{t('onboarding.flowLabel')}</Text>
          <Text style={styles.stepCount}>{STEP + 1} / {TOTAL + 1}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          {t('onboarding.step3.title', { name: params.childName })}
        </Text>
        <Text style={styles.sub}>{t('onboarding.step3.sub')}</Text>

        {options.map((opt) => {
          const selected = additionalChallenges.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.card, selected && styles.cardActive]}
              onPress={() => toggle(opt.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardEmoji}>{opt.emoji}</Text>
              <Text style={[styles.cardLabel, selected && styles.cardLabelActive]}>
                {t(opt.labelKey)}
              </Text>
              <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                {selected && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Sticky footer — always enabled (optional step) ────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>{t('onboarding.step3.nextLabel')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: T.bg },
  topBar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backChevron:     { color: T.accent, fontSize: 28, lineHeight: 32, width: 36 },
  stepInfo:        { flex: 1, alignItems: 'center' },
  flowLabel:       { color: T.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  stepCount:       { color: T.text, fontSize: 13, fontWeight: '600' },
  barTrack:        { height: 3, backgroundColor: T.cardBorder, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  barFill:         { height: '100%', backgroundColor: T.accent, borderRadius: 2 },
  content:         { padding: 24, paddingTop: 24, paddingBottom: 110 },
  heading:         { color: T.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sub:             { color: T.textMuted, fontSize: 15, marginBottom: 20, lineHeight: 22 },
  card:            { backgroundColor: T.card, borderRadius: 14, padding: 15, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.cardBorder },
  cardActive:      { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  cardEmoji:       { fontSize: 20, marginRight: 12, width: 28 },
  cardLabel:       { flex: 1, color: T.text, fontSize: 15, fontWeight: '500' },
  cardLabelActive: { color: T.accent, fontWeight: '600' },
  checkbox:        { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: T.cardBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: T.card },
  checkboxChecked: { backgroundColor: T.accent, borderColor: T.accent },
  checkboxTick:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  footer:          {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: T.bg,
    padding: 20, paddingBottom: 32,
  },
  nextBtn:         { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
