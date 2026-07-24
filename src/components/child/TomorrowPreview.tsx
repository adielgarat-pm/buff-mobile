/**
 * TomorrowPreview — read-only "מחר · יום ה'" strip for dated tasks.
 *
 * Shows one-time (due-dated) tasks landing TOMORROW so the child can prep
 * (bag, swimsuit) without flooding today's list. Recurring tasks are excluded
 * on purpose — they would repeat here every single day. Renders nothing when
 * tomorrow has no dated tasks. (Adi's capture-fixes-2 spec, 2026-07-24.)
 */

import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Task } from '../../types/task';
import { toDateKey } from '../../lib/taskScheduling';

interface Props {
  tasks: Task[];
  colors: { card: string; border: string; text: string; muted: string };
}

export function TomorrowPreview({ tasks, colors }: Props) {
  const { t } = useTranslation();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);
  const dated = tasks.filter((x) => x.dueDate === tomorrowKey && !x.completed);
  if (dated.length === 0) return null;
  const dayName = t(`weekday.${tomorrow.getDay()}`);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.header, { color: colors.text }]}>
        {t('childTasks.tomorrow', { day: dayName })}
      </Text>
      {dated.map((x) => (
        <Text key={x.id} style={[styles.item, { color: colors.muted }]} numberOfLines={1}>
          •  {x.title}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  header: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  item: { fontSize: 13, marginTop: 4 },
});
