/**
 * UStep4_Motivator — multi-select motivators (max 2), then Continue.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { useRTLStyles } from '../../../contexts/LanguageContext';
import { MOTIVATORS } from './onboardingData';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep4_Motivator'>;
type Route = RouteProp<RootStackParamList, 'UStep4_Motivator'>;

const STEP = 3; const TOTAL = 6;
const MAX_PICKS = 2;

export default function UStep4_Motivator() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t }       = useTranslation();
  const { isRTL }   = useRTLStyles();

  const [selected, setSelected] = useState<string[]>([]);

  const progress = (STEP + 1) / (TOTAL + 1);

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_PICKS) return prev; // cap at 2
      return [...prev, id];
    });
  };

  const canProceed = selected.length >= 1;

  const onContinue = () => {
    if (!canProceed) return;
    navigation.navigate('ULoadingScreen', { ...params, motivators: selected });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* Top bar */}
      <View style={[styles.topBar, isRTL && styles.rowReverse]}>
        <TouchableOpacity
          testID="onb-back"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backChevron}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.flowLabel}>{t('onboarding.flowLabel')}</Text>
          <Text style={styles.stepCount}>{STEP + 1} / {TOTAL + 1}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, isRTL && styles.textRight]}>
          {t('onboarding.step4.title', { name: params.childName })}
        </Text>
        <Text style={[styles.sub, isRTL && styles.textRight]}>{t('onboarding.step4.sub')}</Text>

        {/* Pick hint */}
        <Text style={[styles.pickHint, isRTL && styles.textRight]}>
          {selected.length === 0
            ? t('onboarding.step4.pickHint', 'Pick up to 2')
            : selected.length === MAX_PICKS
              ? t('onboarding.step4.pickMax', 'Max 2 selected')
              : t('onboarding.step4.pickOne', '1 selected — pick one more or continue')}
        </Text>

        {MOTIVATORS.map((mot) => {
          const isSelected = selected.includes(mot.id);
          const isDisabled = !isSelected && selected.length >= MAX_PICKS;
          return (
            <TouchableOpacity
              key={mot.id}
              testID={`onb4-motivator-${mot.id}`}
              style={[
                styles.card,
                isRTL && styles.rowReverse,
                isSelected && styles.cardSelected,
                isDisabled && styles.cardDisabled,
              ]}
              onPress={() => toggle(mot.id)}
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled: isDisabled }}
              accessibilityLabel={t(mot.labelKey)}
            >
              <Text style={styles.cardEmoji}>{mot.emoji}</Text>
              <Text style={[styles.cardLabel, isRTL && styles.textRight, isSelected && styles.cardLabelSelected]}>
                {t(mot.labelKey)}
              </Text>
              {isSelected ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <View style={{ width: 20 }} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          testID="onb4-continue"
          style={[styles.ctaBtn, !canProceed && styles.ctaBtnDisabled]}
          onPress={onContinue}
          activeOpacity={0.85}
          disabled={!canProceed}
        >
          <Text style={styles.ctaText}>{t('onboarding.step4.cta', 'Continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: T.bg },
  topBar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backChevron:       { color: T.accent, fontSize: 28, lineHeight: 32, width: 36 },
  stepInfo:          { flex: 1, alignItems: 'center' },
  flowLabel:         { color: T.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  stepCount:         { color: T.text, fontSize: 13, fontWeight: '600' },
  barTrack:          { height: 3, backgroundColor: T.cardBorder, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  barFill:           { height: '100%', backgroundColor: T.accent, borderRadius: 2 },
  content:           { padding: 24, paddingTop: 28, paddingBottom: 40 },
  heading:           { color: T.text, fontSize: 24, fontWeight: '700', marginBottom: 6 },
  sub:               { color: T.textMuted, fontSize: 15, marginBottom: 12, lineHeight: 22 },
  pickHint:          { color: T.accent, fontSize: 13, fontWeight: '600', marginBottom: 16 },
  card:              { backgroundColor: T.card, borderRadius: 14, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.cardBorder },
  cardSelected:      { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  cardDisabled:      { opacity: 0.4 },
  cardEmoji:         { fontSize: 26, marginRight: 14, width: 34 },
  cardLabel:         { flex: 1, color: T.text, fontSize: 16, fontWeight: '600' },
  cardLabelSelected: { color: T.accent },
  checkmark:         { color: T.accent, fontSize: 18, fontWeight: '700' },
  footer:            { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.bg, padding: 20, paddingBottom: 32 },
  ctaBtn:            { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaBtnDisabled:    { opacity: 0.4 },
  ctaText:           { color: '#fff', fontSize: 16, fontWeight: '700' },
  rowReverse:        { flexDirection: 'row-reverse' },
  textRight:         { textAlign: 'right' },
});
