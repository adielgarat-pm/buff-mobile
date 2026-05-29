/**
 * PendingSuggestions — parent-side deal-making surface (pkg/child-suggest).
 *
 * Lists a child's open ideas (pending + discussing) for one `kind` and offers
 * the two non-judgmental moves from BUFF_PRD §227 ("deal-making"):
 *   - "Yes, let's do it"     → onApprove (parent screen creates the real
 *                              task/reward, then marks the suggestion approved)
 *   - "Let's talk about it"  → onLetsTalk (status 'discussing'; NOT a decline)
 *
 * There is deliberately no reject/decline action (BUFF_VALUES Pillar 2). A
 * "discussing" idea stays open and can still be approved after the parent and
 * child talk it over.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';
import type { ChildSuggestion, SuggestionKind } from '../../hooks/useChildSuggestions';

interface Props {
  suggestions: ChildSuggestion[];
  kind:        SuggestionKind;
  childName:   string;
  onApprove:   (s: ChildSuggestion) => void;
  onLetsTalk:  (s: ChildSuggestion) => void;
}

export function PendingSuggestions({ suggestions, kind, childName, onApprove, onLetsTalk }: Props) {
  const { t } = useTranslation();
  const items = suggestions.filter(
    s => s.kind === kind && (s.status === 'pending' || s.status === 'discussing'),
  );
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: T.text }]}>
        {t('childSuggest.parent.sectionTitle', { name: childName })}
      </Text>

      {items.map(s => {
        const discussing = s.status === 'discussing';
        return (
          <View key={s.id} style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
            <View style={styles.topRow}>
              <Text style={[styles.title, { color: T.text }]} numberOfLines={2}>
                {s.emoji ? `${s.emoji} ` : ''}{s.title}
              </Text>
              {discussing && (
                <Text style={[styles.tag, { color: T.textMuted }]}>
                  {t('childSuggest.parent.discussingTag')}
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.approveBtn, { backgroundColor: T.accent }]}
                onPress={() => onApprove(s)}
                activeOpacity={0.85}
              >
                <Text style={styles.approveText}>{t('childSuggest.parent.approve')}</Text>
              </TouchableOpacity>

              {!discussing && (
                <TouchableOpacity
                  style={[styles.talkBtn, { borderColor: T.cardBorder }]}
                  onPress={() => onLetsTalk(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.talkText, { color: T.text }]}>{t('childSuggest.parent.letsTalk')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:         { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card:         { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  title:        { flex: 1, fontSize: 15, fontWeight: '600' },
  tag:          { fontSize: 12, fontWeight: '600' },
  actions:      { flexDirection: 'row', gap: 8 },
  approveBtn:   { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  talkBtn:      { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  talkText:     { fontSize: 13, fontWeight: '600' },
});
