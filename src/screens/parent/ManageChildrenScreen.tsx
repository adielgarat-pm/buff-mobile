/**
 * ManageChildrenScreen — parent-only list of children with edit + add affordances.
 *
 * Reached from Settings → "Manage children".
 * Each row taps into EditChildScreen. "+ Add another child" reuses the
 * existing UStep1 onboarding flow (which already creates the child profile,
 * tasks and rewards via UStep5_Preview).
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'ManageChildren'>;

interface ChildRow {
  id:          string;
  displayName: string;
  avatar:      string;
  birthDate:   string | null;
  ageGroup:    string | null;
}

/** Years between today and an ISO 'YYYY-MM-DD'. Returns null on invalid input. */
function computeAge(birth: string | null): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function ManageChildrenScreen() {
  const navigation       = useNavigation<Nav>();
  const { t }            = useTranslation();
  const { familyId }     = useAuth();
  const { isRTL, rowDirection, textAlign } = useRTLStyles();

  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetchChildren = useCallback(async () => {
    if (!familyId) {
      setChildren([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar, birth_date, pro_settings, created_at')
      .eq('family_id', familyId)
      .eq('role', 'child')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[ManageChildren] fetch error:', error.message);
      setChildren([]);
      setLoading(false);
      return;
    }

    const rows: ChildRow[] = (data ?? []).map((c: {
      id: string;
      display_name: string | null;
      avatar: string | null;
      birth_date: string | null;
      pro_settings: { age_group?: string } | null;
    }) => ({
      id:          c.id,
      displayName: c.display_name ?? '—',
      avatar:      c.avatar       ?? '🚀',
      birthDate:   c.birth_date   ?? null,
      ageGroup:    c.pro_settings?.age_group ?? null,
    }));

    setChildren(rows);
    setLoading(false);
  }, [familyId]);

  // Re-fetch when this screen regains focus (e.g. returning from EditChild
  // after a save). Cheaper and more reliable than a realtime subscription
  // for a screen the parent only visits briefly.
  useFocusEffect(useCallback(() => { fetchChildren(); }, [fetchChildren]));
  useEffect(() => { fetchChildren(); }, [fetchChildren]);

  const goBack = () => navigation.goBack();
  const openEdit = (childId: string) => navigation.navigate('EditChild', { childId });
  const addChild = () => navigation.navigate('UStep1');

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('manageChildren.back')}
          testID="manage-children-back"
        >
          <Text style={[styles.backChevron]}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { textAlign: 'center' }]}>{t('manageChildren.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { textAlign }]}>{t('manageChildren.subtitle')}</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={T.accent} size="large" />
          </View>
        ) : children.length === 0 ? (
          <Text style={[styles.empty, { textAlign }]}>{t('manageChildren.empty')}</Text>
        ) : (
          <View style={styles.list}>
            {children.map((c) => {
              const age = computeAge(c.birthDate);
              const meta =
                age !== null
                  ? t('manageChildren.ageLabel', { age })
                  : c.ageGroup
                  ? t('manageChildren.ageGroupLabel', { group: c.ageGroup })
                  : null;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.row, { flexDirection: rowDirection }]}
                  onPress={() => openEdit(c.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('editChild.title')} — ${c.displayName}`}
                  testID={`child-row-${c.id}`}
                >
                  <Text style={styles.avatar}>{c.avatar}</Text>
                  <View style={styles.rowBody}>
                    <Text style={[styles.name, { textAlign }]} numberOfLines={1}>{c.displayName}</Text>
                    {meta && <Text style={[styles.meta, { textAlign }]}>{meta}</Text>}
                  </View>
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={20}
                    color={T.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={addChild}
          activeOpacity={0.85}
          testID="manage-children-add-another"
        >
          <Text style={styles.addBtnText}>{t('manageChildren.addAnother')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: T.bg },
  header:       { alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backChevron:  { color: T.accent, fontSize: 28, lineHeight: 32 },
  title:        { flex: 1, color: T.text, fontSize: 18, fontWeight: '700' },

  content:      { padding: 20, paddingTop: 12, paddingBottom: 40 },
  subtitle:     { color: T.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 20 },

  loadingWrap:  { paddingVertical: 32, alignItems: 'center' },
  empty:        { color: T.textMuted, fontSize: 14, paddingVertical: 24 },

  list:         { gap: 10, marginBottom: 20 },
  row:          {
    alignItems:      'center',
    backgroundColor: T.card,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     T.cardBorder,
    padding:         14,
    gap:             14,
  },
  avatar:       { fontSize: 34, width: 44, textAlign: 'center' },
  rowBody:      { flex: 1 },
  name:         { color: T.text, fontSize: 16, fontWeight: '600' },
  meta:         { color: T.textMuted, fontSize: 13, marginTop: 2 },

  addBtn:       {
    backgroundColor: T.accent,
    borderRadius:    14,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       8,
  },
  addBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
