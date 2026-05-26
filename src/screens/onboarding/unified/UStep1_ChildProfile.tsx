import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import LanguagePicker from '../../../components/LanguagePicker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import OnboardingShell from '../_OnboardingShell';
import { PARENT_THEME as T } from '../../../theme';
import type { AgeGroup, Gender } from './onboardingData';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../integrations/supabase/client';

type Nav = StackNavigationProp<RootStackParamList, 'UStep1'>;

const AGE_GROUPS: AgeGroup[] = ['6-8', '9-11', '12-14', '15-18'];
const GENDERS: { value: Gender; labelKey: string }[] = [
  { value: 'boy',   labelKey: 'onboarding.gender.boy'   },
  { value: 'girl',  labelKey: 'onboarding.gender.girl'  },
  { value: 'other', labelKey: 'onboarding.gender.other' },
];

/** Format a Date for display. Locale follows the app language (en → "19 Oct 1998", he → "19 באוק׳ 1998"). */
function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** ISO date string "YYYY-MM-DD" stored in params */
function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function UStep1_ChildProfile() {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();

  // Determine if we need to collect the parent's name
  // (missing or looks like an email address / placeholder)
  const existingName = profile?.display_name ?? '';
  const nameIsEmail  = existingName.includes('@');
  const needsParentName = !existingName || nameIsEmail;

  const [parentName,      setParentName]     = useState(needsParentName ? '' : existingName);
  const [childName,       setChildName]      = useState('');
  const [ageGroup,        setAgeGroup]       = useState<AgeGroup | null>(null);
  const [gender,          setGender]         = useState<Gender | null>(null);
  const [birthDate,       setBirthDate]      = useState<Date | null>(null);
  const [showDatePicker,  setShowDatePicker] = useState(false);

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
    });
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    // On Android the picker closes itself; on iOS it stays open until dismissed
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selected) setBirthDate(selected);
    if (event.type === 'dismissed') setShowDatePicker(false);
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

      {/* Birthday — native date picker */}
      <Text style={styles.label}>{t('onboarding.step1.birthdayLabel')}</Text>

      {/* iOS inline picker — always visible once toggled */}
      {Platform.OS === 'ios' && showDatePicker && (
        <DateTimePicker
          mode="date"
          display="spinner"
          value={birthDate ?? new Date(2010, 0, 1)}
          maximumDate={new Date()}
          onChange={onDateChange}
          style={styles.iosSpinner}
        />
      )}

      {/* Android: show/hide via button press */}
      {(Platform.OS !== 'ios' || !showDatePicker) && (
        <TouchableOpacity
          style={[styles.dateBtn, !!birthDate && styles.dateBtnFilled]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dateBtnText, !!birthDate && styles.dateBtnTextFilled]}>
            {birthDate ? formatDate(birthDate, i18n.language) : t('onboarding.step1.birthdayPlaceholder')}
          </Text>
          <Text style={styles.dateBtnIcon}>📅</Text>
        </TouchableOpacity>
      )}

      {/* Android: picker appears as modal overlay when showDatePicker=true */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={birthDate ?? new Date(2010, 0, 1)}
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}

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
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: T.cardBorder, marginBottom: 4 },
  dateBtnFilled: { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  dateBtnText: { flex: 1, color: T.textMuted, fontSize: 15 },
  dateBtnTextFilled: { color: T.text, fontWeight: '500' },
  dateBtnIcon: { fontSize: 18 },
  iosSpinner: { width: '100%', marginBottom: 4 },
  optionalHint: { color: T.textMuted, fontSize: 12, marginBottom: 20, marginTop: 4 },
});
