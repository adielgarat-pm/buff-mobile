/**
 * OffRoutineCard — per-child "Off-Routine Day" control (parent-facing).
 *
 * A third day-state alongside Pause: turns the child's full weekday plan into a
 * light, age-appropriate default set (seeded once via ensureOffRoutineTasks),
 * while the app stays active. Writes `profiles.off_routine_until` for THIS child
 * (RLS already allows parent→own-device-child update — migration 022 / #189).
 *
 * MVP durations: Off / Today / 3 days. Phase 2: weekend auto-detect, custom,
 * parent task customization.
 */
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isOffRoutineActive } from '../utils/offRoutineUtils';
import { ensureOffRoutineTasks } from '../lib/offRoutineSeed';
import { PARENT_THEME as T } from '../theme';

type Props = {
  childId:   string;
  ageGroup:  string | null;
  /** Child's language — off-routine task titles are seeded in this language. */
  childLang: 'he' | 'en';
};

const STR = {
  he: { title: 'יום מחוץ לשגרה', hint: 'תוכנית קלה ליום חופשי — בלי משימות בית-ספר. לחיצה אחת, וחוזרים לשגרה.',
        off: 'כבוי', today: 'היום', days3: '3 ימים', activeUntil: 'פעיל עד', err: 'משהו השתבש, נסו שוב' },
  en: { title: 'Off-routine day', hint: 'A lighter plan for a free day — no school tasks. One tap back to routine.',
        off: 'Off', today: 'Today', days3: '3 days', activeUntil: 'Active until', err: 'Something went wrong, try again' },
};

export default function OffRoutineCard({ childId, ageGroup, childLang }: Props) {
  const { familyId } = useAuth();
  const { language } = useLanguage();
  const s = STR[language === 'he' ? 'he' : 'en'];

  const [until,  setUntil]  = useState<string | null>(null);
  const [busy,   setBusy]   = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('off_routine_until')
        .eq('id', childId)
        .single();
      if (!cancelled) {
        setUntil((data as { off_routine_until?: string | null } | null)?.off_routine_until ?? null);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [childId]);

  const active = isOffRoutineActive(until);

  const apply = async (mode: 'off' | 'today' | 'days3') => {
    if (busy || !familyId) return;
    setBusy(true);
    try {
      let nextUntil: string | null = null;
      if (mode !== 'off') {
        // Seed the off-routine tasks once (idempotent) before enabling.
        const seed = await ensureOffRoutineTasks({ childId, familyId, ageGroup, lang: childLang });
        if (seed.error) { Alert.alert('', s.err); setBusy(false); return; }
        if (mode === 'today') {
          const d = new Date(); d.setHours(23, 59, 59, 999); nextUntil = d.toISOString();
        } else {
          nextUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        }
      }
      const { error } = await supabase
        .from('profiles')
        .update({ off_routine_until: nextUntil } as never)
        .eq('id', childId);
      if (error) { Alert.alert('', s.err); setBusy(false); return; }
      setUntil(nextUntil);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={T.accent} />
      </View>
    );
  }

  const options: { key: 'off' | 'today' | 'days3'; label: string }[] = [
    { key: 'off',   label: s.off },
    { key: 'today', label: s.today },
    { key: 'days3', label: s.days3 },
  ];
  // When active we can't store which preset was picked, so infer: same calendar
  // day → "today", otherwise → "3 days".
  const isToday = active && until ? new Date(until).toDateString() === new Date().toDateString() : false;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{s.title}</Text>
      <Text style={styles.hint}>{s.hint}</Text>
      <View style={styles.row}>
        {options.map(opt => {
          const highlight = opt.key === 'off' ? !active : active && opt.key === (isToday ? 'today' : 'days3');
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.pill, highlight && styles.pillActive]}
              onPress={() => apply(opt.key)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected: highlight }}
              testID={`off-routine-${opt.key}`}
            >
              <Text style={[styles.pillText, highlight && styles.pillTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {active && until && (
        <Text style={styles.activeNote}>
          {s.activeUntil} {new Date(until).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: T.card, borderColor: T.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 16 },
  title:      { color: T.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  hint:       { color: T.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  row:        { flexDirection: 'row', gap: 8 },
  pill:       { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: T.cardBorder, alignItems: 'center' },
  pillActive: { backgroundColor: T.accent, borderColor: T.accent },
  pillText:   { color: T.text, fontSize: 14, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  activeNote: { color: T.accent, fontSize: 12, fontWeight: '700', marginTop: 10 },
});
