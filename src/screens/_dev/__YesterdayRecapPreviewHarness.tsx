/**
 * __YesterdayRecapPreviewHarness — dev-only preview component for the
 * Yesterday Recap section (pkg/yesterday-recap, 2026-05-23).
 *
 * NOT shipped. Used for visual verification of TESTS.md Phase 2 scenarios
 * A–D in isolation (the real dashboard is auth-gated).
 *
 * To render it, temporarily swap `<RootNavigator />` for
 * `<__YesterdayRecapPreviewHarness />` inside AppContent in App.tsx.
 * Run `npm run web`, screenshot, revert App.tsx.
 *
 * Mirrors the docs/sessions/yesterday-recap/SCREENSHOTS.md evidence
 * and follows the pattern of __VibeCheckPreviewHarness.tsx.
 */
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import YesterdayRecapCard from '../../components/YesterdayRecapCard';
import { PARENT_THEME as T } from '../../theme';
import type { ChildYesterdayRecap } from '../../utils/yesterdayRecapUtils';

const RECAP_PARTIAL: ChildYesterdayRecap = {
  childId: 'a',
  totalScheduled: 7,
  totalCompleted: 5,
  tasks: [
    { taskId: '1', title: 'צחצוח שיניים בוקר', time: '07:00', category: 'self-care',     icon: null, completed: true  },
    { taskId: '2', title: 'ארוחת בוקר',          time: '07:15', category: 'self-care',     icon: null, completed: true  },
    { taskId: '3', title: 'להתלבש',              time: '07:30', category: 'self-care',     icon: null, completed: false },
    { taskId: '4', title: 'שיעורי בית',          time: '14:00', category: 'learning',      icon: null, completed: true  },
    { taskId: '5', title: 'מקלחת',               time: '18:00', category: 'self-care',     icon: null, completed: true  },
    { taskId: '6', title: 'סידור התיק',          time: '20:30', category: 'organization',  icon: null, completed: false },
    { taskId: '7', title: 'צחצוח שיניים ערב',    time: '20:45', category: 'self-care',     icon: null, completed: true  },
  ],
};

const RECAP_ALL_COMPLETE: ChildYesterdayRecap = {
  childId: 'b',
  totalScheduled: 4,
  totalCompleted: 4,
  tasks: [
    { taskId: '1', title: 'ארוחת בוקר',     time: '07:15', category: 'self-care',    icon: null, completed: true },
    { taskId: '2', title: 'שיעורי בית',     time: '14:00', category: 'learning',     icon: null, completed: true },
    { taskId: '3', title: 'מקלחת',          time: '18:00', category: 'self-care',    icon: null, completed: true },
    { taskId: '4', title: 'סידור החדר',     time: '20:30', category: 'organization', icon: null, completed: true },
  ],
};

const RECAP_ZERO_MARKED: ChildYesterdayRecap = {
  childId: 'c',
  totalScheduled: 5,
  totalCompleted: 0,
  tasks: [
    { taskId: '1', title: 'צחצוח שיניים בוקר', time: '07:00', category: 'self-care',    icon: null, completed: false },
    { taskId: '2', title: 'ארוחת בוקר',         time: '07:15', category: 'self-care',    icon: null, completed: false },
    { taskId: '3', title: 'שיעורי בית',         time: '14:00', category: 'learning',     icon: null, completed: false },
    { taskId: '4', title: 'מקלחת',              time: '18:00', category: 'self-care',    icon: null, completed: false },
    { taskId: '5', title: 'סידור התיק',         time: '20:30', category: 'organization', icon: null, completed: false },
  ],
};

export default function __YesterdayRecapPreviewHarness() {
  const { t } = useTranslation();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: T.bg }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.heading, { color: T.text }]}>Yesterday Recap — preview harness</Text>
      <Text style={[styles.sub,     { color: T.textMuted }]}>
        pkg/yesterday-recap — visual verification of TESTS.md Phase 2 scenarios
      </Text>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: T.textMuted }]}>
          {t('dashboard.yesterday')} · 23.5
        </Text>
      </View>

      <Text style={[styles.scenarioLabel, { color: T.textMuted }]}>
        A. Partial completion (matan, 5/7)
      </Text>
      <YesterdayRecapCard childName="מתן"  childAvatar="🚀" recap={RECAP_PARTIAL} />

      <Text style={[styles.scenarioLabel, { color: T.textMuted }]}>
        B. All complete — celebration variant
      </Text>
      <YesterdayRecapCard childName="נועם" childAvatar="🌟" recap={RECAP_ALL_COMPLETE} />

      <Text style={[styles.scenarioLabel, { color: T.textMuted }]}>
        C. Zero marked — softened "אתמול לא היה סימון" (not "0/N")
      </Text>
      <YesterdayRecapCard childName="עמית" childAvatar="🐯" recap={RECAP_ZERO_MARKED} />

      <Text style={[styles.scenarioLabel, { color: T.textMuted }]}>
        D. Multi-child — two cards in section
      </Text>
      <YesterdayRecapCard childName="מתן"  childAvatar="🚀" recap={RECAP_PARTIAL} />
      <YesterdayRecapCard childName="נועם" childAvatar="🌟" recap={RECAP_ALL_COMPLETE} />

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  content:        { padding: 20, paddingTop: 52 },

  heading:        { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub:            { fontSize: 13, marginBottom: 24 },

  sectionRow:     { marginBottom: 12 },
  sectionTitle:   { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  scenarioLabel:  { fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 6, fontStyle: 'italic' },
});
