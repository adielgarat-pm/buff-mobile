/**
 * NextTaskCard — the junior-band "one task at a time" affordance on HQ.
 *
 * Shared by BOTH child dashboards (Mint/Pastel + Gamer) so a young child (6–11)
 * gets the IDENTICAL behavior whichever skin they picked — only the palette
 * differs. Lives in a shared component, not per-screen, per IN-2026-07-06-01
 * (theme divergence must not be re-implemented inside each screen).
 *
 * Why one task, not a list: the reported bug (Lia, ~9) was that the Gamer HQ
 * dumped the full task list on a young child. The PRD's junior spec is
 * "one task at a time, clear and unambiguous" (BUFF_PRD.md:211) — a single
 * next-up card gives one clear action + instant feedback with zero overwhelm.
 * The full list still lives on the Quests tab (the "see all" link).
 *
 * States:
 *   - a next task exists      → label + tappable task row + "see all" link
 *   - all today's tasks done  → positive "all done" line + "see all" link
 *   - no tasks today          → gentle "no tasks today" line (no failure framing)
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Task } from '../../types/task';

export interface NextTaskPalette {
  cardBg: string;
  cardBorder: string;   // solid accent border for the active card
  glow: string;         // soft outer glow (accent at low opacity)
  checkBorder: string;  // empty check circle stroke
  title: string;        // task title text
  credits: string;      // credits badge
  label: string;        // "your next mission" label
  link: string;         // "see all" link
  done: string;         // all-done / empty line
}

interface Props {
  nextTask: Task | null;
  hasTasksToday: boolean;
  onComplete: (id: string) => void;
  onSeeAll: () => void;
  palette: NextTaskPalette;
}

export default function NextTaskCard({
  nextTask, hasTasksToday, onComplete, onSeeAll, palette,
}: Props) {
  const { t } = useTranslation();

  // No incomplete task: celebrate a full day, or gently note a rest day.
  if (!nextTask) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.doneLine, { color: palette.done }]}>
          {hasTasksToday ? t('nextTask.allDone') : t('nextTask.none')}
        </Text>
        {hasTasksToday && (
          <TouchableOpacity onPress={onSeeAll} testID="hq-next-see-all"
            accessibilityRole="button" accessibilityLabel={t('nextTask.seeAll')}>
            <Text style={[styles.link, { color: palette.link }]}>{t('nextTask.seeAll')} ←</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: palette.label }]}>🎯 {t('nextTask.label')}</Text>

      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder, shadowColor: palette.glow },
        ]}
        onPress={() => onComplete(nextTask.id)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false }}
        accessibilityLabel={nextTask.title}
        testID="hq-next-task"
      >
        <View style={[styles.check, { borderColor: palette.checkBorder }]} />
        <Text style={[styles.title, { color: palette.title }]} numberOfLines={2}>
          {nextTask.title}
        </Text>
        <Text style={[styles.credits, { color: palette.credits }]}>
          {t('gamerTasks.taskCredits', { credits: nextTask.credits })}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSeeAll} testID="hq-next-see-all"
        accessibilityRole="button" accessibilityLabel={t('nextTask.seeAll')}>
        <Text style={[styles.link, { color: palette.link }]}>{t('nextTask.seeAll')} ←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { marginBottom: 14 },
  label:    { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Soft accent glow so the single card reads as the primary action.
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  check:    { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
  title:    { flex: 1, fontSize: 15, fontWeight: '600' },
  credits:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  link:     { marginTop: 12, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  doneLine: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
});
