import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import LanguagePicker from '../../../components/LanguagePicker';
import BirthdayField from '../../../components/BirthdayField';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import OnboardingShell from '../_OnboardingShell';
import { PARENT_THEME as T } from '../../../theme';
import type { AgeGroup, Gender } from './onboardingData';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../integrations/supabase/client';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep1'>;
type Route = RouteProp<RootStackParamList, 'UStep1'>;

const AGE_GROUPS: AgeGroup[] = ['6-8', '9-11', '12-14', '15-18'];
const GENDERS: { value: Gender; labelKey: string }[] = [
  { value: 'boy',   labelKey: 'onboarding.gender.boy'   },
  { value: 'girl',  labelKey: 'onboarding.gender.girl'  },
  { value: 'other', labelKey: 'onboarding.gender.other' },
];

/** ISO date string "YYYY-MM-DD" stored in params */
function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function UStep1_ChildProfile() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();

  // Empty-state re-entry: attach the flow to an existing child instead of
  // creating a new profile. prefillName seeds the name field; existingChildId
  // threads through to UStep5 which then skips the profile insert.
  const existingChildId = params?.existingChildId;

  // Determine if we need to collect the parent's name
  // (missing or looks like an email address / placeholder)
  const existingName = profile?.display_name ?? '';
  const nameIsEmail  = existingName.includes('@');
  const needsParentName = !existingName || nameIsEmail;

  const [parentName,      setParentName]     = useState(needsParentName ? '' : existingName);
  const [childName,       setChildName]      = useState(params?.prefillName ?? '');
  const [ageGroup,        setAgeGroup]       = useState<AgeGroup | null>(null);
  const [gender,          setGender]         = useState<Gender | null>(null);
  const [birthDate,       setBirthDate]      = useState<Date | null>(null);

  const canProceed =
    !!childName.trim() &&
    !!ageGroup &&
    (!needsParentName || !!parentName.trim());

  const onNext = async () => {
    if (!ageGroup) return;

    // Save parent display_name to Supabase if we collected it
    if (needsParentName && parentName.trim() && user) {
      const trimmed = parentName.trim();
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed } as never)
        .eq('user_id', user.id);

      if (error) {
        console.warn('[UStep1] Failed to save parent name:', error.message);
      } else {
        console.log('[UStep1] Parent display_name saved:', trimmed);
        // Refresh so greeting on dashboard uses the new name
        await refreshProfile(user.id);
      }
    }

    navigation.navigate('UStep2_Goal', {
      childName: childName.trim(),
      ageGroup,
      gender:    gender    ?? undefined,
      birthDate: birthDate ? toISODate(birthDate) : undefined,
      existingChildId,
    });
  };

  return (
    <OnboardingShell
      step={0} total={6} flowLabel={t('onboarding.flowLabel')}
      onNext={onNext}
      canProceed={canProceed}
      headerRight={<LanguagePicker />}
    >
      <Text style={styles.heading}>{t('onboarding.step1.title')}</Text>
      <Text style={styles.sub}>{t('onboarding.step1.sub')}</Text>

      {/* Parent name — only shown when display_name is missing or looks like an email */}
      {needsParentName && (
        <>
          <Text style={styles.label}>{t('onboarding.step1.parentNameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('onboarding.step1.parentNamePlaceholder')}
            placeholderTextColor={T.textMuted}
            value={parentName}
            onChangeText={setParentName}
            keyboardType="default"
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="next"
          />
        </>
      )}

      {/* Child name */}
      <Text style={styles.label}>{t('onboarding.step1.nameLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('onboarding.step1.namePlaceholder')}
        placeholderTextColor={T.textMuted}
        value={childName}
        onChangeText={setChildName}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
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

      {/* Birthday (optional) — native picker on iOS/Android, <input type="date"> on web */}
      <Text style={styles.label}>{t('onboarding.step1.birthdayLabel')}</Text>
      <BirthdayField
        value={birthDate}
        onChange={setBirthDate}
        placeholder={t('onboarding.step1.birthdayPlaceholder')}
        locale={i18n.language}
      />

    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  heading: { color: T.text, fontSize: 24, fontWeight: '700', marginBottom: 6 },
  sub: { color: T.textMuted, fontSize: 15, marginBottom: 28, lineHeight: 22 },
  label: { color: T.text, fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  input: { backgroundColor: '#F9FAFB', color: T.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 6, borderWidth: 1, borderColor: T.cardBorder, fontSize: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  pill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: T.cardBorder, backgroundColor: T.card },
  pillActive: { backgroundColor: T.accent, borderColor: T.accent },
  pillText: { color: T.textMuted, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: '#fff' },
});
