/**
 * CaptureScreen — paste/upload → parse → confirm → save.
 *
 * Two steps: input (paste text or pick an image) and review (confirm card).
 * The parser is a STUB today (no Gemini, no backend, no new deps); confirmed
 * items persist locally via useParentCapture. Gated by FEATURE_PARENT_CAPTURE.
 * See docs/sessions/parent-capture/.
 *
 * NOTE: all copy is DRAFT (Hebrew-first) pending Adi's review (CLAUDE.md).
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';

import { useAuth } from '../../contexts/AuthContext';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { CaptureInput, FamilyChild, ParentItem } from '../../types/parentCapture';
import { useFamilyChildren, useParentCapture } from '../../hooks/useParentCapture';
import { useCaptureConsent } from '../../hooks/useCaptureConsent';
import { parseCapture } from '../../lib/parentCapture/parseCapture';
import { parsedToParentItem } from '../../lib/parentCapture/captureMapping';
import { CapturedItemRow, type ReviewEntry } from '../../components/parent/CapturedItemRow';
import { CaptureConsentGate } from '../../components/parent/CaptureConsentGate';

type Nav = StackNavigationProp<RootStackParamList>;

export default function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { familyId } = useAuth();
  const { children } = useFamilyChildren();
  const { addItems, transferToChild } = useParentCapture();
  const { consented, grant } = useCaptureConsent();

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; mimeType: string | null } | null>(
    null,
  );
  const [parsing, setParsing] = useState(false);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const canRead = text.trim().length > 0 || !!file;

  async function pickFile() {
    // Any file: PDF, Word, Excel, image, etc.
    const res = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? null });
    }
  }

  async function onRead() {
    if (!canRead || !familyId) return;
    setParsing(true);
    try {
      const input: CaptureInput = file
        ? { kind: 'file', fileUri: file.uri, fileName: file.name, mimeType: file.mimeType ?? undefined }
        : { kind: 'text', text };
      const parsed = await parseCapture(input, familyId);
      const next: ReviewEntry[] = parsed.map((p) => {
        const match = p.childName
          ? children.find((c) => c.displayName === p.childName) ?? null
          : null;
        return {
          parsed: p,
          owner: p.owner,
          childId: match?.id ?? null,
          // noise (no_match) starts discarded — surfaced collapsed, not lost
          discarded: p.relevance === 'no_match',
        };
      });
      setEntries(next);
      setStep('review');
    } catch (e) {
      console.error('[CaptureScreen] parse error:', e);
    } finally {
      setParsing(false);
    }
  }

  function updateEntry(idx: number, changes: Partial<Omit<ReviewEntry, 'parsed'>>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...changes } : e)));
  }

  async function onConfirm() {
    if (!familyId) return;
    setSaving(true);
    try {
      const kept = entries.filter((e) => !e.discarded);
      const items: ParentItem[] = [];
      for (const e of kept) {
        const child: FamilyChild | null =
          e.owner === 'child' ? children.find((c) => c.id === e.childId) ?? null : null;
        const item = parsedToParentItem(e.parsed, familyId, e.owner, child);
        // Transfer child-owned actionable items into the child's task loop.
        const transferable = e.parsed.type === 'task' || e.parsed.type === 'event';
        if (e.owner === 'child' && child && transferable) {
          const taskId = await transferToChild(e.parsed, child.id);
          if (taskId) {
            item.status = 'transferred';
            item.childTaskId = taskId;
          }
        }
        items.push(item);
      }
      await addItems(items);
      navigation.navigate('ParentThisWeek');
    } finally {
      setSaving(false);
    }
  }

  const active = entries.map((e, i) => ({ e, i })).filter(({ e }) => !e.discarded);
  const filtered = entries.map((e, i) => ({ e, i })).filter(({ e }) => e.discarded);

  // Show consent gate until the parent has acknowledged the privacy disclosure.
  if (!consented) {
    return (
      <CaptureConsentGate
        loading={consented === null}
        onContinue={grant}
        onClose={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: T.text }]}>
          {step === 'input' ? t('capture.title') : t('capture.confirmTitle')}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, { backgroundColor: '#F1F1F4' }]}
          accessibilityLabel={t('capture.close')}
        >
          <Text style={[styles.closeX, { color: T.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={[styles.container, { backgroundColor: T.bg }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'input' ? (
          <Text style={[styles.sub, { color: T.textMuted }]}>{t('capture.subtitle')}</Text>
        ) : (
          <Text style={[styles.sub, { color: T.textMuted }]}>
            {t('capture.found', { count: entries.filter((e) => !e.discarded).length })}
          </Text>
        )}

      {step === 'input' ? (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: T.card, borderColor: T.cardBorder, color: T.text }]}
            placeholder={t('capture.placeholder')}
            placeholderTextColor={T.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            textAlign="right"
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: T.cardBorder }]}
              onPress={pickFile}
            >
              <Text style={[styles.secondaryText, { color: T.accent }]} numberOfLines={1}>
                {file ? t('capture.fileChosen', { name: file.name }) : t('capture.pickFile')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.fileHint, { color: T.textMuted }]}>{t('capture.fileHint')}</Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: canRead ? T.accent : T.cardBorder }]}
            onPress={onRead}
            disabled={!canRead || parsing}
          >
            {parsing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{t('capture.readIt')}</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {active.map(({ e, i }) => (
            <CapturedItemRow
              key={e.parsed.id}
              entry={e}
              children={children}
              onChange={(c) => updateEntry(i, c)}
            />
          ))}

          {filtered.length > 0 ? (
            <>
              <Text style={[styles.filteredLabel, { color: T.textMuted }]}>
                {t('capture.filtered', { count: filtered.length })}
              </Text>
              {filtered.map(({ e, i }) => (
                <CapturedItemRow
                  key={e.parsed.id}
                  entry={e}
                  children={children}
                  onChange={(c) => updateEntry(i, c)}
                />
              ))}
            </>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: T.accent }]}
            onPress={onConfirm}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {t('capture.confirm', { count: active.length })}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.startOver} onPress={() => setStep('input')}>
            <Text style={[styles.link, { color: T.textMuted }]}>{t('capture.startOver')}</Text>
          </TouchableOpacity>
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 15, fontWeight: '700' },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, marginBottom: 18 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  actionsRow: { flexDirection: 'row', marginTop: 12 },
  secondaryBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  secondaryText: { fontSize: 14, fontWeight: '600' },
  fileHint: { fontSize: 12, marginTop: 8 },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  filteredLabel: { fontSize: 13, fontWeight: '600', marginTop: 6, marginBottom: 8 },
  startOver: { alignItems: 'center', marginTop: 14 },
  link: { fontSize: 13, fontWeight: '600' },
});
