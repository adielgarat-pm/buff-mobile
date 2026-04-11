import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import OnboardingShell from '../_OnboardingShell';
import { PARENT_THEME as T } from '../../../theme';
import type { AgeGroup, Gender } from './onboardingData';

type Nav = StackNavigationProp<RootStackParamList, 'UStep1'>;

const AGE_GROUPS: AgeGroup[] = ['6-8', '9-11', '12-14', '15-18'];
const GENDERS: { value: Gender; labelKey: string }[] = [
  { value: 'boy',   labelKey: 'onboarding.gender.boy'   },
  { value: 'girl',  labelKey: 'onboarding.gender.girl'  },
  { value: 'other', labelKey: 'onboarding.gender.other' },
];

export default function UStep1_ChildProfile() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [childName, setChildName] = useState('');
  const [ageGroup,  setAgeGroup]  = useState<AgeGroup | null>(null);
  const [gender,    setGender]    = useState<Gender | null>(null);
  const [birthDate, setBirthDate] = useState('');

  const canProceed = !!childName.trim() && !!ageGroup;

  const onNext = () => {
    if (!ageGroup) return;
    navigation.navigate('UStep2_Goal', {
      childName: childName.trim(),
      ageGroup,
      gender:    gender    ?? undefined,
      birthDate: birthDate || undefined,
    });
  };

  return (
    <OnboardingShell
      step={0} total={6} flowLabel={t('onboarding.flowLabel')}
      onNext={onNext}
      canProceed={canProceed}
    >
      <Text style={styles.heading}>{t('onboarding.step1.title')}</Text>
      <Text style={styles.sub}>{t('onboarding.step1.sub')}</Text>

      {/* Child name */}
      <Text style={styles.label}>{t('onboarding.step1.nameLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('onboarding.step1.namePlaceholder')}
        placeholderTextColor={T.textMuted}
        value={childName}
        onChangeText={setChildName}
        autoCapitalize="words"
        returnKeyType="next"
      />

      {/* Age group */}
      <Text style={styles.label}>{t('onboarding.step1.ageLabel')}</Text>
      <View style={styles.pillRow}>
        {AGE_GROUPS.map((ag) => (
          <TouchableOpacity
            key={ag}
            style={[styles.pill, ageGroup === ag && styles.pillActive]}
            onPress={() => setAgeGroup(ag)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, ageGroup === ag && styles.pillTextActive]}>{ag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gender (optional) */}
      <Text style={styles.label}>{t('onboarding.step1.genderLabel')}</Text>
      <View style={styles.pillRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.pill, gender === g.value && styles.pillActive]}
            onPress={() => setGender(gender === g.value ? null : g.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, gender === g.value && styles.pillTextActive]}>
              {t(g.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Birthday (optional) */}
      <Text style={styles.label}>{t('onboarding.step1.birthdayLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/YYYY"
        placeholderTextColor={T.textMuted}
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numeric"
      />
      <Text style={styles.optionalHint}>{t('onboarding.step1.birthdayHint')}</Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  heading:      { color: T.text, fontSize: 24, fontWeight: '700', marginBottom: 6 },
  sub:          { color: T.textMuted, fontSize: 15, marginBottom: 28, lineHeight: 22 },
  label:        { color: T.text, fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  input:        { backgroundColor: '#F9FAFB', color: T.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 6, borderWidth: 1, borderColor: T.cardBorder, fontSize: 16 },
  pillRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  pill:         { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: T.cardBorder, backgroundColor: T.card },
  pillActive:   { backgroundColor: T.accent, borderColor: T.accent },
  pillText:     { color: T.textMuted, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: '#fff' },
  optionalHint: { color: T.textMuted, fontSize: 12, marginBottom: 20, marginTop: 2 },
});
