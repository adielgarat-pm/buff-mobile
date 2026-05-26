/**
 * EditChildScreen — parent edits an existing child's name, avatar, birthday, age group.
 *
 * Reached from ManageChildrenScreen by tapping a child row.
 * Persists straight to profiles (display_name, avatar, birth_date, pro_settings.age_group).
 */
import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, Platform, Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../integrations/supabase/client';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav   = StackNavigationProp<RootStackParamList, 'EditChild'>;
type Route = RouteProp<RootStackParamList, 'EditChild'>;

const AVATAR_OPTIONS = [
  '🧒', '👦', '👧', '🧑', '👶', '🦸',
  '🦄', '🐶', '🐱', '🐰', '🦊', '🐼',
  '⭐', '🌟', '⚡', '🚀', '🎨', '🌈',
];

const AGE_GROUPS = ['6-8', '9-11', '12-14', '15-18'] as const;

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EditChildScreen() {
  const navigation       = useNavigation<Nav>();
  const { params }       = useRoute<Route>();
  const { t, i18n }      = useTranslation();
  const { isRTL, rowDirection, textAlign } = useRTLStyles();

  const [loading,  setLoading]   = useState(true);
  const [loadErr,  setLoadErr]   = useState<string | null>(null);

  // Editable state
  const [name,     setName]      = useState('');
  const [avatar,   setAvatar]    = useState('🚀');
  const [birth,    setBirth]     = useState<Date | null>(null);
  const [ageGroup, setAgeGroup]  = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [saving,   setSaving]    = useState(false);
  const [saveErr,  setSaveErr]   = useState<string | null>(null);

  // ── Load existing child profile ─────────────────────────────────────────
  // `t` intentionally omitted from deps — its identity changes on every render
  // (per react-i18next), and a locale change should not retrigger a profile
  // refetch. The error string is resolved at the moment failure happens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar, birth_date, pro_settings')
        .eq('id', params.childId)
        .single();

      if (cancelled) return;

      if (error || !data) {
        console.warn('[EditChild] load error:', error?.message);
        setLoadErr(t('editChild.loadError'));
        setLoading(false);
        return;
      }

      const row = data as {
        display_name: string | null;
        avatar: string | null;
        birth_date: string | null;
        pro_settings: { age_group?: string } | null;
      };

      setName(row.display_name ?? '');
      setAvatar(row.avatar ?? '🚀');
      setBirth(row.birth_date ? new Date(row.birth_date) : null);
      setAgeGroup(row.pro_settings?.age_group ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [params.childId]);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selected) setBirth(selected);
    if (event.type === 'dismissed') setShowDatePicker(false);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('editChild.nameRequired'));
      return;
    }

    setSaving(true);
    setSaveErr(null);

    // Read the current pro_settings first so we don't clobber other fields
    // (gender, onboarding_data, etc.).
    const { data: existing, error: readErr } = await supabase
      .from('profiles')
      .select('pro_settings')
      .eq('id', params.childId)
      .single();

    if (readErr) {
      console.warn('[EditChild] pre-save read error:', readErr.message);
      setSaveErr(t('editChild.saveError'));
      setSaving(false);
      return;
    }

    const prevSettings = ((existing as { pro_settings: Record<string, unknown> | null } | null)
      ?.pro_settings) ?? {};

    const nextSettings = { ...prevSettings, age_group: ageGroup ?? null };

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        display_name: trimmed,
        avatar,
        birth_date:   birth ? toISODate(birth) : null,
        pro_settings: nextSettings,
      } as never)
      .eq('id', params.childId);

    if (updateErr) {
      console.warn('[EditChild] save error:', updateErr.message);
      setSaveErr(t('editChild.saveError'));
      setSaving(false);
      return;
    }

    setSaving(false);
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color={T.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (loadErr) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <Text style={styles.errorText}>{loadErr}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{t('editChild.cancel')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={styles.backChevron}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('editChild.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Name ─────────────────────────────────────────────────────── */}
        <Text style={[styles.label, { textAlign }]}>{t('editChild.nameLabel')}</Text>
        <TextInput
          style={[styles.input, { textAlign }]}
          value={name}
          onChangeText={setName}
          placeholder={t('editChild.namePlaceholder')}
          placeholderTextColor={T.textMuted}
          autoCapitalize="words"
          returnKeyType="done"
          testID="edit-child-name-input"
        />

        {/* ── Icon picker ──────────────────────────────────────────────── */}
        <Text style={[styles.label, { textAlign, marginTop: 24 }]}>{t('editChild.iconLabel')}</Text>
        <View style={styles.iconGrid}>
          {AVATAR_OPTIONS.map((emoji) => {
            const active = emoji === avatar;
            return (
              <TouchableOpacity
                key={emoji}
                style={[styles.iconBtn, active && styles.iconBtnActive]}
                onPress={() => setAvatar(emoji)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`edit-child-avatar-${emoji}`}
              >
                <Text style={styles.iconEmoji}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Birthday ─────────────────────────────────────────────────── */}
        <Text style={[styles.label, { textAlign, marginTop: 24 }]}>{t('editChild.birthdayLabel')}</Text>

        {Platform.OS === 'ios' && showDatePicker && (
          <DateTimePicker
            mode="date"
            display="spinner"
            value={birth ?? new Date(2014, 0, 1)}
            maximumDate={new Date()}
            onChange={onDateChange}
            style={styles.iosSpinner}
          />
        )}

        {(Platform.OS !== 'ios' || !showDatePicker) && (
          <TouchableOpacity
            style={[styles.dateBtn, !!birth && styles.dateBtnFilled]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dateBtnText, !!birth && styles.dateBtnTextFilled, { textAlign }]}>
              {birth ? formatDate(birth, i18n.language) : t('editChild.birthdayPlaceholder')}
            </Text>
            <Text style={styles.dateBtnIcon}>📅</Text>
          </TouchableOpacity>
        )}

        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            mode="date"
            display="default"
            value={birth ?? new Date(2014, 0, 1)}
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        {/* ── Age group ────────────────────────────────────────────────── */}
        <Text style={[styles.label, { textAlign, marginTop: 24 }]}>{t('editChild.ageGroupLabel')}</Text>
        <View style={[styles.pillRow, { flexDirection: rowDirection }]}>
          {AGE_GROUPS.map((ag) => {
            const active = ageGroup === ag;
            return (
              <TouchableOpacity
                key={ag}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setAgeGroup(active ? null : ag)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{ag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {saveErr && (
          <Text style={[styles.errorText, { marginTop: 16 }]}>{saveErr}</Text>
        )}

        {/* ── Save / Cancel ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.85}
          testID="edit-child-save"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{t('editChild.save')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={saving}
          testID="edit-child-cancel"
        >
          <Text style={styles.cancelText}>{t('editChild.cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: T.bg },
  centered:     { alignItems: 'center', justifyContent: 'center' },

  header:       { alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backChevron:  { color: T.accent, fontSize: 28, lineHeight: 32 },
  title:        { flex: 1, color: T.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },

  content:      { padding: 20, paddingTop: 12, paddingBottom: 40 },

  label:        { color: T.text, fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },

  input:        {
    backgroundColor: '#F9FAFB',
    color:           T.text,
    borderRadius:    12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth:     1,
    borderColor:     T.cardBorder,
    fontSize:        16,
  },

  iconGrid:     {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            10,
    padding:        12,
    backgroundColor: T.card,
    borderRadius:   14,
    borderWidth:    1,
    borderColor:    T.cardBorder,
  },
  iconBtn:      {
    width:          48,
    height:         48,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    2,
    borderColor:    'transparent',
    backgroundColor: '#F3F4F6',
  },
  iconBtnActive: { borderColor: T.accent, backgroundColor: '#EDE9FE' },
  iconEmoji:    { fontSize: 26 },

  dateBtn:      {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius:   12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth:    1,
    borderColor:    T.cardBorder,
  },
  dateBtnFilled: { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  dateBtnText:  { flex: 1, color: T.textMuted, fontSize: 15 },
  dateBtnTextFilled: { color: T.text, fontWeight: '500' },
  dateBtnIcon:  { fontSize: 18 },
  iosSpinner:   { width: '100%' },

  pillRow:      { flexWrap: 'wrap', gap: 10 },
  pill:         {
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:      20,
    borderWidth:       1.5,
    borderColor:       T.cardBorder,
    backgroundColor:   T.card,
  },
  pillActive:   { backgroundColor: T.accent, borderColor: T.accent },
  pillText:     { color: T.textMuted, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: '#fff' },

  errorText:    { color: '#DC2626', fontSize: 13, textAlign: 'center' },

  saveBtn:      {
    backgroundColor: T.accent,
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
    marginTop:       28,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  cancelBtn:    { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelText:   { color: T.textMuted, fontSize: 14 },
});
