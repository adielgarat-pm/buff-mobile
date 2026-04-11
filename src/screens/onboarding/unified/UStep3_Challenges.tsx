import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import OnboardingShell from '../_OnboardingShell';
import { PARENT_THEME as T } from '../../../theme';
import { OPTIONS_BY_AGE } from './onboardingData';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep3_Challenges'>;
type Route = RouteProp<RootStackParamList, 'UStep3_Challenges'>;

export default function UStep3_Challenges() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t }       = useTranslation();

  const [mainChallenge,        setMain]       = useState<string | null>(null);
  const [additionalChallenges, setAdditional] = useState<string[]>([]);

  const allOptions = OPTIONS_BY_AGE[params.ageGroup];
  // Section B hides whatever is selected in Section A
  const sectionBOptions = allOptions.filter(o => o.id !== mainChallenge);

  const toggleAdditional = (id: string) => {
    setAdditional(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // If main challenge changes, remove it from additional if present
  const selectMain = (id: string) => {
    setMain(id);
    setAdditional(prev => prev.filter(x => x !== id));
  };

  const canProceed = !!mainChallenge;

  const onNext = () => {
    if (!mainChallenge) return;
    navigation.navigate('UStep4_Motivator', {
      ...params,
      mainChallenge,
      additionalChallenges,
    });
  };

  return (
    <OnboardingShell
      step={2} total={6} flowLabel={t('onboarding.flowLabel')}
      onNext={onNext}
      canProceed={canProceed}
    >
      <Text style={styles.heading}>
        {t('onboarding.step3.title', { name: params.childName })}
      </Text>

      {/* Section A — single select */}
      <Text style={styles.sectionLabel}>{t('onboarding.step3.sectionA')}</Text>
      {allOptions.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.card, mainChallenge === opt.id && styles.cardActive]}
          onPress={() => selectMain(opt.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardEmoji}>{opt.emoji}</Text>
          <Text style={[styles.cardLabel, mainChallenge === opt.id && styles.cardLabelActive]}>
            {t(opt.labelKey)}
          </Text>
          {mainChallenge === opt.id && (
            <Text style={{ color: T.accent, fontSize: 18 }}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Section B — multi-select, only shown once main is picked */}
      {mainChallenge && sectionBOptions.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
            {t('onboarding.step3.sectionB')}
          </Text>
          {sectionBOptions.map((opt) => {
            const selected = additionalChallenges.includes(opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.card, selected && styles.cardActive]}
                onPress={() => toggleAdditional(opt.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardEmoji}>{opt.emoji}</Text>
                <Text style={[styles.cardLabel, selected && styles.cardLabelActive]}>
                  {t(opt.labelKey)}
                </Text>
                {selected && <Text style={{ color: T.accent, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  heading:        { color: T.text, fontSize: 24, fontWeight: '700', marginBottom: 20 },
  sectionLabel:   { color: T.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  card:           { backgroundColor: T.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.cardBorder },
  cardActive:     { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  cardEmoji:      { fontSize: 22, marginRight: 14, width: 30 },
  cardLabel:      { flex: 1, color: T.text, fontSize: 15, fontWeight: '500' },
  cardLabelActive: { color: T.accent, fontWeight: '600' },
});
