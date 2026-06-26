/**
 * ChildSuggest — shared child-facing UI for the suggest→deal-making flow
 * (pkg/child-suggest). Used by both Gamer and Mint child screens, themed via
 * a `palette` prop so each aesthetic keeps its own look.
 *
 *   - SuggestModal: title (+ optional emoji for rewards) → submit to parent.
 *   - SuggestionStatusList: the child's own OPEN ideas (pending / discussing)
 *     with a warm status line and a remove (withdraw) action.
 *
 * Copy is intentionally simple + inviting and never embeds a "why"
 * (CLAUDE.md feedback-kid-task-copy-simple). There is no "declined" status —
 * an idea is either sent, being talked about, or it became real.
 */
import { useState } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ChildSuggestion, SuggestionKind } from '../../hooks/useChildSuggestions';
import { crossAlert } from '../../platform';

export interface SuggestPalette {
  overlay:    string;
  surface:    string;
  text:       string;
  textMuted:  string;
  accent:     string;
  accentText: string;
  inputBg:    string;
  border:     string;
}

// ─── Submit modal ─────────────────────────────────────────────────────────────

interface SuggestModalProps {
  visible:  boolean;
  kind:     SuggestionKind;
  palette:  SuggestPalette;
  onClose:  () => void;
  onSubmit: (input: { title: string; emoji?: string }) => Promise<{ error: Error | null }>;
}

export function SuggestModal({ visible, kind, palette, onClose, onSubmit }: SuggestModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(''); setEmoji('🎁'); setSaving(false); };
  const close = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const { error } = await onSubmit({ title, emoji });
    setSaving(false);
    if (error) {
      crossAlert('', t('common.errorGeneric', { defaultValue: 'Something went wrong' }));
      return;
    }
    reset();
    onClose();
    crossAlert('', t('childSuggest.modal.sent'));
  };

  const heading = kind === 'task'
    ? t('childSuggest.modal.taskHeading')
    : t('childSuggest.modal.rewardHeading');
  const placeholder = kind === 'task'
    ? t('childSuggest.modal.taskPlaceholder')
    : t('childSuggest.modal.rewardPlaceholder');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: palette.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
          <Text style={[styles.heading, { color: palette.text }]}>{heading}</Text>

          {kind === 'reward' && (
            <>
              <Text style={[styles.label, { color: palette.textMuted }]}>
                {t('childSuggest.modal.emojiLabel')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.inputBg, color: palette.text, borderColor: palette.border }]}
                value={emoji}
                onChangeText={setEmoji}
                maxLength={4}
                placeholder="🎁"
                placeholderTextColor={palette.textMuted}
              />
            </>
          )}

          <TextInput
            style={[styles.input, { backgroundColor: palette.inputBg, color: palette.text, borderColor: palette.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder={placeholder}
            placeholderTextColor={palette.textMuted}
            maxLength={60}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: palette.accent }, (!title.trim() || saving) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!title.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color={palette.accentText} />
              : <Text style={[styles.submitText, { color: palette.accentText }]}>{t('childSuggest.modal.submit')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={close}>
            <Text style={[styles.cancelText, { color: palette.textMuted }]}>{t('childSuggest.modal.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Open-ideas status list ───────────────────────────────────────────────────

interface SuggestionStatusListProps {
  suggestions: ChildSuggestion[];
  kind:        SuggestionKind;
  palette:     SuggestPalette;
  onWithdraw:  (id: string) => void;
}

export function SuggestionStatusList({ suggestions, kind, palette, onWithdraw }: SuggestionStatusListProps) {
  const { t } = useTranslation();
  const open = suggestions.filter(
    s => s.kind === kind && (s.status === 'pending' || s.status === 'discussing'),
  );
  if (open.length === 0) return null;

  return (
    <View style={styles.listWrap}>
      <Text style={[styles.listLabel, { color: palette.textMuted }]}>{t('childSuggest.myIdeas')}</Text>
      {open.map(s => (
        <View key={s.id} style={[styles.ideaRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ideaTitle, { color: palette.text }]} numberOfLines={1}>
              {s.emoji ? `${s.emoji} ` : ''}{s.title}
            </Text>
            <Text style={[styles.ideaStatus, { color: palette.textMuted }]}>
              {s.status === 'discussing'
                ? t('childSuggest.status.discussing')
                : t('childSuggest.status.pending')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onWithdraw(s.id)} hitSlop={8}>
            <Text style={[styles.withdraw, { color: palette.textMuted }]}>{t('childSuggest.withdraw')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  heading:    { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  label:      { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input:      { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  submitBtn:  { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 15, fontWeight: '800' },
  cancelBtn:  { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 14, fontWeight: '600' },

  listWrap:   { marginTop: 16 },
  listLabel:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  ideaRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, gap: 10 },
  ideaTitle:  { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  ideaStatus: { fontSize: 12 },
  withdraw:   { fontSize: 12, fontWeight: '700' },
});
