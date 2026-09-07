/**
 * ChildBagPrepScreen — the ציוד tab.
 *
 * A thin shell around the ONE child packing surface, `PackingCard`, which
 * merges school-timetable gear with activities (clubs) for today and tomorrow.
 * Until tomorrow-pack-inconsistency (2026-09) this screen kept its own
 * timetable-only copy of that logic, so a clubs-only tomorrow read as
 * "מחר יום חופש" here while the HQ card listed the clubs — see
 * docs/sessions/tomorrow-pack-inconsistency/SPEC.md §2.
 *
 * The child came to this tab to pack, so tomorrow opens expanded here
 * (`defaultTomorrowExpanded`); on the HQ dashboards the same card keeps
 * tomorrow folded under a signpost row. Check-off state is shared: the card
 * re-reads it on every focus.
 *
 * Body-double voice only — no counter, no "mark all", no completion verdict
 * (BUFF_VALUES Pillar 1 & 2).
 */

import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useChildTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import PackingCard from '../../components/PackingCard';

export default function ChildBagPrepScreen() {
  const { t }       = useTranslation();
  const T           = useChildTheme();
  const { profile } = useAuth();
  const { previewChildId } = useMode();

  const childId = previewChildId ?? profile?.id ?? null;

  return (
    <View style={[styles.container, { backgroundColor: T.background }]}>
      <Text style={[styles.title, { color: T.foreground }]}>{t('bagPrep.title')}</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PackingCard childId={childId} defaultTomorrowExpanded />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  title:     { fontSize: 22, fontWeight: '800', paddingHorizontal: 16, marginBottom: 8 },
  scroll:    { paddingHorizontal: 16, paddingBottom: 24 },
});
