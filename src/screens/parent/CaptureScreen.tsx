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

import { useCallback, useEffect, useRef, useState } from 'react';
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
import * as Sentry from '@sentry/react-native';

import { useAuth } from '../../contexts/AuthContext';
import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { CaptureInput, FamilyChild, ParentItem } from '../../types/parentCapture';
import { useFamilyChildren, useParentCapture } from '../../hooks/useParentCapture';
import { useCaptureConsent } from '../../hooks/useCaptureConsent';
import { CaptureParseError, parseCapture } from '../../lib/parentCapture/parseCapture';
import { parsedToParentItem, stripChildNamePrefix } from '../../lib/parentCapture/captureMapping';
import {
  summarizeConfirm,
  isPayoffDeferred,
  formatDueDate,
  type CaptureReceipt,
} from '../../lib/parentCapture/captureReceipt';
import {
  baselineFromEntries,
  logCaptureConfirm,
  summarizeReview,
  type ReviewBaseline,
} from '../../lib/parentCapture/captureMetrics';
import { logOnboardingEvent } from '../../lib/onboardingFunnel';
import { CapturedItemRow, type ReviewEntry } from '../../components/parent/CapturedItemRow';
import { CaptureConsentGate } from '../../components/parent/CaptureConsentGate';

type Nav = StackNavigationProp<RootStackParamList>;

export default function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language?.startsWith('he') ?? false;
  const { familyId } = useAuth();
  const { children } = useFamilyChildren();
  const { addItems, transferToChild } = useParentCapture();
  const { consented, grant } = useCaptureConsent();

  const [step, setStep] = useState<'input' | 'review' | 'done'>('input');
  // The receipt the parent sees after confirming — see captureReceipt.ts for why
  // landing straight on a list was the problem (red team F6).
  const [receipt, setReceipt] = useState<CaptureReceipt | null>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; mimeType: string | null } | null>(
    null,
  );
  // Upfront "who is this about?" — optional; becomes the default assignment
  // for every item the AI didn't explicitly match (Adi, 2026-07-24).
  const [hintChildId, setHintChildId] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<'premium_required' | 'rate_limited' | 'timeout' | 'generic' | null>(null);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [saving, setSaving] = useState(false);
  // Usability metric: the run row to attach the confirm summary to, plus what
  // the AI proposed before the parent touched anything (migration 047).
  const [runId, setRunId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Record<string, ReviewBaseline>>({});

  const canRead = text.trim().length > 0 || !!file;

  // Open→run drop-off: a parent who lands here and never taps "read it" is
  // invisible in capture_runs. Logged once per screen visit.
  const loggedOpen = useRef(false);
  useEffect(() => {
    if (loggedOpen.current || !familyId || consented !== true) return;
    loggedOpen.current = true;
    logOnboardingEvent({ familyId, eventType: 'capture_opened', source: 'parent_capture' });
  }, [familyId, consented]);

  const onGrantConsent = useCallback(async () => {
    await grant();
    logOnboardingEvent({
      familyId,
      eventType: 'capture_consent_granted',
      source: 'parent_capture',
    });
  }, [familyId, grant]);

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
    setParseError(null);
    try {
      const input: CaptureInput = file
        ? { kind: 'file', fileUri: file.uri, fileName: file.name, mimeType: file.mimeType ?? undefined }
        : { kind: 'text', text };
      const hintChild = children.find((c) => c.id === hintChildId) ?? null;
      const { items: parsed, runId: newRunId } = await parseCapture(
        input,
        familyId,
        i18n.language,
        hintChild?.displayName ?? null,
      );
      setRunId(newRunId);
      const familyNames = children.map((c) => c.displayName);
      const next: ReviewEntry[] = parsed.map((raw) => {
        // Kid titles are plain actions — strip any "<name>:" prefix the model
        // slipped in (belt to the server-side prompt rule).
        const p = {
          ...raw,
          title: stripChildNamePrefix(raw.title, [...familyNames, raw.childName ?? '']),
        };
        const match = p.childName
          ? children.find((c) => c.displayName === p.childName) ?? null
          : null;
        return {
          parsed: p,
          owner: p.owner,
          // AI's explicit match wins; otherwise fall back to the parent's pick.
          childId: match?.id ?? hintChild?.id ?? null,
          // noise (no_match) starts discarded — surfaced collapsed, not lost
          discarded: p.relevance === 'no_match',
        };
      });
      setEntries(next);
      // Snapshot BEFORE the parent edits, so "edited" means "the AI got the
      // assignment wrong", not "the parent touched the card".
      setBaseline(baselineFromEntries(next));
      setStep('review');
    } catch (e) {
      console.error('[CaptureScreen] parse error:', e);
      // PII-safe: error + input shape only — never file content or file name.
      // Client-side failures here otherwise die silently (Lesson 2026-07-22).
      Sentry.captureException(e, {
        tags: { feature: 'parent_capture', input_kind: file ? 'file' : 'text' },
        extra: { mimeType: file?.mimeType ?? null },
      });
      setParseError(e instanceof CaptureParseError ? e.code : 'generic');
    } finally {
      setParsing(false);
    }
  }

  function updateEntry(idx: number, changes: Partial<Omit<ReviewEntry, 'parsed'>>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...changes } : e)));
  }

  /** Bulk "assign everything to…" — one tap instead of 15 (Adi, 2026-07-24). */
  function assignAll(childId: string | null) {
    setEntries((prev) =>
      prev.map((e) =>
        e.discarded
          ? e
          : childId
            ? { ...e, owner: 'child' as const, childId }
            : { ...e, owner: 'parent' as const, childId: null },
      ),
    );
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
        item.captureRunId = runId;
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
      // Trust Rate / Edit Rate — how much of the AI's output survived review.
      await logCaptureConfirm(runId, summarizeReview(entries, baseline));
      // Show what was just built instead of dropping the parent on a list. The
      // items are dated up to two weeks out and the child's screen shows each one
      // only on its day, so without this the parent's work has no visible effect
      // at all (red team F6 — the likeliest cause of a 0% repeat rate).
      setReceipt(summarizeConfirm(items));
      setStep('done');
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
        onContinue={onGrantConsent}
        onClose={() => navigation.goBack()}
      />
    );
  }

  // ── Receipt — the parent's proof that confirming did something ──────────────
  if (step === 'done' && receipt) {
    const todayISO = new Date().toISOString().slice(0, 10);
    // Fall back to the live roster when the item carried no child name, so a row
    // never renders with an empty label.
    const nameFor = (line: { childId: string; childName: string }) =>
      line.childName || children.find((c) => c.id === line.childId)?.displayName || '';
    return (
      <View style={[styles.root, { backgroundColor: T.bg }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: T.text }]}>{t('capture.receiptTitle')}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.closeBtn, { backgroundColor: '#F1F1F4' }]}
            accessibilityLabel={t('capture.close')}
          >
            <Text style={[styles.closeX, { color: T.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={[styles.container, { backgroundColor: T.bg }]} contentContainerStyle={styles.content}>
          {receipt.perChild.map((line) => (
            <Text key={line.childId} style={[styles.receiptLine, { color: T.text }]}>
              ✅ {t('capture.receiptForChild', { count: line.count, n: line.count, name: nameFor(line) })}
            </Text>
          ))}
          {receipt.parentCount > 0 && (
            <Text style={[styles.receiptLine, { color: T.text }]}>
              ✅ {t('capture.receiptParent', { count: receipt.parentCount, n: receipt.parentCount })}
            </Text>
          )}
          {receipt.firstDue && (
            <Text style={[styles.receiptFirst, { color: T.text }]}>
              📅 {t('capture.receiptFirst', {
                title: receipt.firstDue.title,
                date:  formatDueDate(receipt.firstDue.date, i18n.language),
              })}
            </Text>
          )}
          {/* The line that pre-empts "I checked my kid's screen and nothing changed". */}
          {isPayoffDeferred(receipt, todayISO) && (
            <Text style={[styles.receiptNote, { color: T.textMuted }]}>{t('capture.receiptDeferred')}</Text>
          )}
          <TouchableOpacity
            style={[styles.receiptCta, { backgroundColor: T.accent }]}
            onPress={() => navigation.navigate('ParentThisWeek')}
          >
            <Text style={styles.receiptCtaText}>{t('capture.receiptCta')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: T.text }]}>
          {step === 'input' ? t('capture.title') : t('capture.confirmTitle')}
        </Text>
        <View style={styles.headerActions}>
          {/* The dashboard card now opens this screen directly instead of the
              "This Week" hub, so the hub needs a door here — otherwise a parent
              who captured last week has no way back to her list. */}
          {step === 'input' && (
            <TouchableOpacity onPress={() => navigation.navigate('ParentThisWeek')}>
              <Text style={[styles.thisWeekLink, { color: T.accent }]}>
                {t('capture.thisWeekLink')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.closeBtn, { backgroundColor: '#F1F1F4' }]}
            accessibilityLabel={t('capture.close')}
          >
            <Text style={[styles.closeX, { color: T.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={[styles.container, { backgroundColor: T.bg }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'input' ? (
          <>
            <Text style={[styles.sub, { color: T.textMuted }]}>{t('capture.subtitle')}</Text>
            <Text style={[styles.betaNote, { color: T.textMuted }]}>{t('capture.betaNote')}</Text>
          </>
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
            textAlign={isHebrew ? 'right' : 'left'}
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

          {children.length > 0 && (
            <>
              <Text style={[styles.whoseLabel, { color: T.text }]}>{t('capture.whose')}</Text>
              <View style={styles.chipsRow}>
                {children.map((c) => {
                  const active = hintChildId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        { borderColor: active ? T.accent : T.cardBorder, backgroundColor: active ? T.accent : T.card },
                      ]}
                      onPress={() => setHintChildId(active ? null : c.id)}
                    >
                      <Text style={[styles.chipText, { color: active ? '#fff' : T.text }]}>{c.displayName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.fileHint, { color: T.textMuted }]}>{t('capture.whoseHint')}</Text>
            </>
          )}

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
          {parsing && (
            // A real parse takes up to ~1.5 min (Gemini) — say so, or the wait
            // reads as "stuck" and parents abandon the screen (2026-07-28).
            <Text style={[styles.workingHint, { color: T.textMuted }]}>
              {t('capture.workingHint')}
            </Text>
          )}
          {parseError && (
            <Text style={[styles.fileHint, { color: T.textMuted }]}>
              {t(
                parseError === 'premium_required'
                  ? 'capture.errorPremium'
                  : parseError === 'rate_limited'
                    ? 'capture.errorLimit'
                    : parseError === 'timeout'
                      ? 'capture.errorTimeout'
                      : 'capture.errorGeneric',
              )}
            </Text>
          )}
        </>
      ) : (
        <>
          {children.length > 0 && active.length > 1 && (
            <View style={styles.assignAllRow}>
              <Text style={[styles.assignAllLabel, { color: T.textMuted }]}>{t('capture.assignAll')}</Text>
              <View style={styles.chipsRow}>
                {children.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, { borderColor: T.cardBorder, backgroundColor: T.card }]}
                    onPress={() => assignAll(c.id)}
                  >
                    <Text style={[styles.chipText, { color: T.text }]}>{c.displayName}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.chip, { borderColor: T.cardBorder, backgroundColor: T.card }]}
                  onPress={() => assignAll(null)}
                >
                  <Text style={[styles.chipText, { color: T.text }]}>{t('capture.owner.me')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thisWeekLink: { fontSize: 14, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 15, fontWeight: '700' },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, marginBottom: 18 },
  betaNote: { fontSize: 12, marginTop: -12, marginBottom: 18, fontStyle: 'italic' },
  // Receipt (red team F6) — the confirm payoff, deliberately calm and short.
  receiptLine:    { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  receiptFirst:   { fontSize: 15, marginTop: 8, marginBottom: 4 },
  receiptNote:    { fontSize: 13, lineHeight: 19, marginTop: 8 },
  receiptCta:     { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  receiptCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  workingHint: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  whoseLabel: { fontSize: 14, fontWeight: '700', marginTop: 18 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 16, paddingVertical: 7, paddingHorizontal: 14 },
  chipText: { fontSize: 13, fontWeight: '600' },
  assignAllRow: { marginBottom: 14 },
  assignAllLabel: { fontSize: 13, fontWeight: '600' },
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
