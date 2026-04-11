import { useState } from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import OnboardingShell from '../_OnboardingShell';
import { PARENT_THEME as T } from '../../../theme';
import { MISSION_PICKS } from './onboardingData';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep5_Mission'>;
type Route = RouteProp<RootStackParamList, 'UStep5_Mission'>;

export default function UStep5_Mission() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t }       = useTranslation();

  const [firstMission, setFirstMission] = useState('');

  const quickPicks = MISSION_PICKS[params.mainChallenge] ?? [];

  return (
    <OnboardingShell
      step={4} total={6} flowLabel={t('onboarding.flowLabel')}
      onNext={() => navigation.navigate('UStep6_Reward', { ...params, firstMission })}
      canProceed={!!firstMission.trim()}
      nextLabel={t('onboarding.step5.nextLabel')}
    >
      <Text style={styles.heading}>
        {t('onboarding.step5.title', { name: params.childName })}
      </Text>
      <Text style={styles.sub}>{t('onboarding.step5.sub')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('onboarding.step5.placeholder')}
        placeholderTextColor={T.textMuted}
        value={firstMission}
        onChangeText={setFirstMission}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {quickPicks.length > 0 && (
        <>
          <Text style={styles.picksLabel}>{t('onboarding.step5.quickPicks')}</Text>
          {quickPicks.map((s) => (
            <Text key={s} style={styles.pick} onPress={() => setFirstMission(s)}>
              › {s}
            </Text>
          ))}
        </>
      )}

      <Text style={styles.tip}>
        💡 <Text style={{ color: T.accent, fontWeight: '600' }}>
          {t('onboarding.step5.tipTitle')}
        </Text>
        {' '}{t('onboarding.step5.tipBody', { name: params.childName })}
      </Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  heading:    { color: T.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sub:        { color: T.textMuted, fontSize: 15, marginBottom: 20, lineHeight: 22 },
  input:      { backgroundColor: '#F9FAFB', color: T.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, borderWidth: 1, borderColor: T.cardBorder, minHeight: 90, textAlignVertical: 'top', fontSize: 15 },
  picksLabel: { color: T.textMuted, fontSize: 13, marginBottom: 8 },
  pick:       { color: T.accent, fontSize: 14, paddingVertical: 7 },
  tip:        { color: T.textMuted, fontSize: 13, lineHeight: 20, marginTop: 16, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: T.cardBorder },
});
