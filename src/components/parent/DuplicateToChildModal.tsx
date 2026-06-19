/**
 * DuplicateToChildModal — "copy this task/reward to another child".
 *
 * Ported from the Lovable web app. Lists the family's OTHER children with
 * checkboxes (+ an "all children" shortcut when there are several), and calls
 * onDuplicate with the chosen child ids. The parent screen owns the actual
 * insert (a task or reward copy per target child) so this stays presentational.
 */
import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';

type ChildLite = { childId: string; displayName: string; avatar?: string };

type Props = {
  visible:        boolean;
  onClose:        () => void;
  children:       ChildLite[];
  currentChildId: string | null;
  itemType:       'task' | 'reward';
  itemTitle:      string;
  onDuplicate:    (targetChildIds: string[]) => Promise<void>;
};

export function DuplicateToChildModal({
  visible, onClose, children, currentChildId, itemType, itemTitle, onDuplicate,
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const others = children.filter(c => c.childId !== currentChildId);

  // Auto-select when there is exactly one other child; clear when reopened.
  useEffect(() => {
    if (!visible) { setSelected([]); return; }
    if (others.length === 1) setSelected([others[0].childId]);
  }, [visible, others.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allSelected = others.length > 0 && selected.length === others.length;
  const toggleAll = () => setSelected(allSelected ? [] : others.map(c => c.childId));

  const handleClose = () => { if (!busy) { onClose(); setSelected([]); } };

  const handleConfirm = async () => {
    if (selected.length === 0 || busy) return;
    setBusy(true);
    try {
      await onDuplicate(selected);
      onClose();
      setSelected([]);
    } finally {
      setBusy(false);
    }
  };

  const heading = itemType === 'task' ? t('duplicate.copyTask') : t('duplicate.copyReward');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.card, { backgroundColor: T.card }]}>
          <Text style={[styles.title, { color: T.text }]}>{heading}</Text>

          {/* What is being copied */}
          <View style={[styles.copying, { backgroundColor: T.bg, borderColor: T.cardBorder }]}>
            <Text style={[styles.copyingLabel, { color: T.textMuted }]}>{t('duplicate.copying')}</Text>
            <Text style={[styles.copyingTitle, { color: T.text }]} numberOfLines={2}>{itemTitle}</Text>
          </View>

          {others.length === 0 ? (
            <Text style={[styles.noOthers, { color: T.textMuted }]}>{t('duplicate.noOtherChildren')}</Text>
          ) : (
            <View style={styles.list}>
              {others.length > 1 && (
                <TouchableOpacity
                  style={[styles.row, { borderColor: allSelected ? T.accent : T.cardBorder }, allSelected && styles.rowOn]}
                  onPress={toggleAll}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: allSelected }}
                >
                  <Text style={[styles.rowName, { color: T.text }]}>{t('duplicate.allChildren')}</Text>
                  {allSelected && <Text style={[styles.check, { color: T.accent }]}>✓</Text>}
                </TouchableOpacity>
              )}
              {others.map(c => {
                const on = selected.includes(c.childId);
                return (
                  <TouchableOpacity
                    key={c.childId}
                    style={[styles.row, { borderColor: on ? T.accent : T.cardBorder }, on && styles.rowOn]}
                    onPress={() => toggle(c.childId)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <Text style={styles.rowEmoji}>{c.avatar ?? '🙂'}</Text>
                    <Text style={[styles.rowName, { color: T.text }]}>{c.displayName}</Text>
                    {on && <Text style={[styles.check, { color: T.accent }]}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: T.accent }, (selected.length === 0 || busy) && { opacity: 0.5 }]}
              onPress={handleConfirm}
              disabled={selected.length === 0 || busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmText}>{t('duplicate.copy', { count: selected.length })}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={busy}>
              <Text style={[styles.cancelText, { color: T.textMuted }]}>{t('duplicate.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card:         { borderRadius: 20, padding: 20 },
  title:        { fontSize: 18, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  copying:      { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, alignItems: 'center' },
  copyingLabel: { fontSize: 12, marginBottom: 2 },
  copyingTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  noOthers:     { fontSize: 14, textAlign: 'center', paddingVertical: 18 },
  list:         { gap: 8, marginBottom: 16 },
  row:          { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowOn:        { backgroundColor: 'rgba(139,92,246,0.08)' },
  rowEmoji:     { fontSize: 18 },
  rowName:      { flex: 1, fontSize: 15, fontWeight: '600' },
  check:        { fontSize: 16, fontWeight: '800' },
  actions:      { gap: 8 },
  confirmBtn:   { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:    { paddingVertical: 10, alignItems: 'center' },
  cancelText:   { fontSize: 14, fontWeight: '600' },
});
