/**
 * TimetableScreen — Parent side
 *
 * Manages the full schedule lifecycle in one screen:
 *   view  → choose (Excel / Photo / Manual)
 *        → processing (OCR spinner)
 *        → review  (edit + confirm)
 *        → save via useTimetable
 *
 * Excel parsing:  local, via xlsx + expo-document-picker + expo-file-system
 * Image OCR:      expo-image-picker + expo-image-manipulator → parse-schedule Edge Fn
 * Manual:         inline day-tab editor
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Platform, Modal, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import { crossAlert } from '../../platform';

import { PARENT_THEME as T } from '../../theme';
import { ParentNotificationBell } from '../../components/parent/ParentNotificationBell';
import TimeField from '../../components/TimeField';
import { supabase } from '../../integrations/supabase/client';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useTimetable } from '../../hooks/useTimetable';
import {
  WEEK_DAYS, WEEK_DAYS_WITH_FRIDAY,
  WEEK_DAY_LABELS, WEEK_DAY_LABELS_EN,
  type WeekDay, type Timetable, type PeriodInfo,
} from '../../types/timetable';
import {
  parseExcelBase64, processApiResponse, periodsToTimetable,
  generateBuffStandardTime, type ParsedPeriod,
} from '../../utils/timetableParser';
import { copyTimetableDay, dayHasLessons, type CopyDayMode } from '../../utils/timetableCopy';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'view' | 'choose' | 'processing' | 'review' | 'manual' | 'paste';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TimetableScreen() {
  const { t, i18n } = useTranslation();
  const isHebrew    = i18n.language === 'he';
  const dayLabels   = isHebrew ? WEEK_DAY_LABELS : WEEK_DAY_LABELS_EN;

  // Fixed footers must clear the system nav / gesture area — edge-to-edge
  // Android draws content behind it, so without this the save button lands in
  // the untappable zone (real-user report, Noa 2026-07-06: tapping "save"
  // opened the system menu instead). ≥20pt clearance per the safe-zone rule.
  const insets    = useSafeAreaInsets();
  const footerPad = { paddingBottom: Math.max(insets.bottom + 12, 20) };
  // Headers must clear the status bar the same way: this screen hard-coded
  // paddingTop 16 on Android, which put "Update Schedule" + the bell UNDER the
  // status bar on edge-to-edge devices — reproduced on the emulator
  // (2026-07-06): every header tap was swallowed by the system bar.
  const headerPad = { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 56 : 16) };

  const { children, loading: childrenLoading } = useChildrenDashboard();
  const [selectedChildId, setSelectedChildId]  = useState<string | null>(null);

  // Auto-select first child once list loads
  const resolvedChildId = selectedChildId ?? children[0]?.childId ?? null;

  const { timetable, loading: timetableLoading, saving, saveTimetable } =
    useTimetable(resolvedChildId);

  // ── Screen mode ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('view');

  // ── View: selected day tab ─────────────────────────────────────────────────
  const [viewDay, setViewDay] = useState<WeekDay>('sunday');

  // Open the view on today's day (or the first day that has periods) instead of
  // always defaulting to Sunday — a US Mon-Fri kid has an empty Sunday → blank page.
  // Guarded per-child so a manual tab tap is never overridden by this effect.
  const autoDayRef = useRef<string | null>(null);
  useEffect(() => {
    if (timetableLoading || !resolvedChildId) return;
    if (autoDayRef.current === resolvedChildId) return;
    const active = WEEK_DAYS_WITH_FRIDAY.filter(d => (timetable[d] ?? []).length > 0);
    if (active.length === 0) return;
    const today  = WEEK_DAYS_WITH_FRIDAY[new Date().getDay()]; // undefined on Saturday
    const target = today && active.includes(today) ? today : active[0];
    setViewDay(target);
    autoDayRef.current = resolvedChildId;
  }, [timetable, timetableLoading, resolvedChildId]);

  // ── Processing ─────────────────────────────────────────────────────────────
  const [processingMsg, setProcessingMsg]     = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // ── Review ─────────────────────────────────────────────────────────────────
  const [parsedPeriods,    setParsedPeriods]    = useState<ParsedPeriod[]>([]);
  const [hasAutoTime,      setHasAutoTime]      = useState(false);
  const [hasReviewErrors,  setHasReviewErrors]  = useState(false);
  const [reviewDay,        setReviewDay]        = useState<WeekDay>('sunday');
  const [dayPickerForId,   setDayPickerForId]   = useState<string | null>(null);

  // ── Manual ─────────────────────────────────────────────────────────────────
  const [manualTimetable, setManualTimetable] = useState<Timetable>({});
  const [manualDay,       setManualDay]       = useState<WeekDay>('sunday');
  // Copy-day (pkg/timetable-copy-day): duplicate the current day's lessons
  // (incl. equipment) into other days in ≤3 taps.
  const [copyDayOpen,     setCopyDayOpen]     = useState(false);
  const [copyTargets,     setCopyTargets]     = useState<WeekDay[]>([]);

  // ── Paste ──────────────────────────────────────────────────────────────────
  const [pasteText,    setPasteText]    = useState('');
  const [pastePending, setPastePending] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const openReview = useCallback((
    periods: ParsedPeriod[], hasAuto: boolean, hasErrors: boolean,
  ) => {
    setParsedPeriods(periods);
    setHasAutoTime(hasAuto);
    setHasReviewErrors(hasErrors);
    const firstDayWithPeriods = WEEK_DAYS_WITH_FRIDAY.find(
      d => periods.some(p => p.day === d),
    ) ?? 'sunday';
    setReviewDay(firstDayWithPeriods);
    setMode('review');
  }, []);

  const openManual = useCallback(() => {
    // Seed manual editor from existing timetable (or empty)
    const days = WEEK_DAYS_WITH_FRIDAY;
    const seeded: Timetable = {};
    days.forEach(day => {
      seeded[day] = (timetable[day] ?? []).length > 0
        ? [...(timetable[day] ?? [])]
        : [];
    });
    setManualTimetable(seeded);
    setManualDay('sunday');
    setMode('manual');
  }, [timetable]);

  // ─── Excel import ────────────────────────────────────────────────────────────

  const handleExcel = useCallback(async () => {
    try {
      // Dynamic import — avoids crashing when native module isn't in the dev client build
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          '*/*', // fallback for some Android devices
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      setProcessingMsg(t('timetable.processing'));
      setMode('processing');

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64' as const,
      });

      const { periods, hasAuto, hasErrors, isPivot } = parseExcelBase64(base64);

      if (periods.length === 0) {
        crossAlert(t('timetable.parseError'), t('timetable.noLessonsFound'));
        setMode('choose');
        return;
      }

      if (isPivot) {
        crossAlert('', t('timetable.pivotDetected'));
      }

      openReview(periods, hasAuto, hasErrors);
    } catch (err: unknown) {
      console.error('[TimetableScreen] Excel error:', err);
      // The parser throws i18n keys (e.g. 'timetable.emptyFile') — translate them here.
      const msg = err instanceof Error
        ? (err.message.startsWith('timetable.') ? t(err.message) : err.message)
        : t('timetable.parseError');
      crossAlert(t('timetable.parseError'), msg);
      setMode('choose');
    }
  }, [t, openReview]);

  // ─── Image / OCR ─────────────────────────────────────────────────────────────

  const handleImage = useCallback(async () => {
    try {
      // Dynamic imports — avoids crashing when native modules aren't in the dev client build
      const [ImagePicker, ImageManipulator] = await Promise.all([
        import('expo-image-picker'),
        import('expo-image-manipulator'),
      ]);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        crossAlert('', t('timetable.photoPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      setProcessingMsg(t('timetable.processingOcr'));
      setMode('processing');

      const controller = new AbortController();
      abortRef.current = controller;

      // Resize to max 1200px to reduce upload size
      const maxDim = 1200;
      const scale  = Math.min(1, maxDim / Math.max(asset.width ?? maxDim, asset.height ?? maxDim));
      const resized = await ImageManipulator.manipulateAsync(
        asset.uri,
        scale < 1 ? [{ resize: { width: Math.round((asset.width ?? maxDim) * scale) } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      const base64 = await FileSystem.readAsStringAsync(resized.uri, {
        encoding: 'base64' as const,
      });

      const { data, error } = await supabase.functions.invoke('parse-schedule', {
        body: { imageBase64: base64, fileType: 'image' },
      });

      abortRef.current = null;

      if (error) throw new Error(error.message);
      if (!data?.tasks?.length) {
        crossAlert('', t('timetable.noLessonsFound'));
        setMode('choose');
        return;
      }

      const { periods, hasAuto, hasErrors } = processApiResponse(data.tasks);
      openReview(periods, hasAuto, hasErrors);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('[TimetableScreen] OCR error:', err);
      crossAlert(t('timetable.parseError'), (err instanceof Error ? err.message : ''));
      setMode('choose');
    }
  }, [t, openReview]);

  const cancelProcessing = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMode('choose');
  }, []);

  // ─── Paste mode ──────────────────────────────────────────────────────────────

  const handleProcessPaste = useCallback(async () => {
    const text = pasteText.trim();
    if (!text) return;
    setPastePending(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-schedule', {
        body: { extractedText: text, fileType: 'text' },
      });
      if (error) throw new Error(error.message);
      if (!data?.tasks?.length) {
        crossAlert('', t('timetable.noLessonsFound'));
        return;
      }
      const { periods, hasAuto, hasErrors } = processApiResponse(data.tasks);
      // Clear the paste buffer once we've consumed it
      setPasteText('');
      openReview(periods, hasAuto, hasErrors);
    } catch (err: unknown) {
      console.error('[TimetableScreen] paste error:', err);
      crossAlert(t('timetable.parseError'), err instanceof Error ? err.message : '');
    } finally {
      setPastePending(false);
    }
  }, [pasteText, t, openReview]);

  // ─── Review mutations ─────────────────────────────────────────────────────────

  const updatePeriod = useCallback((id: string, updates: Partial<ParsedPeriod>) => {
    setParsedPeriods(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        if (updates.subject !== undefined && updates.subject.trim()) updated.missingSubject = false;
        if (updates.day     !== undefined)                            updated.missingDay    = false;
        return updated;
      });
      setHasReviewErrors(next.some(p => p.selected && (p.missingSubject || p.missingDay)));
      return next;
    });
  }, []);

  const deletePeriod = useCallback((id: string) => {
    setParsedPeriods(prev => {
      const next = prev.filter(p => p.id !== id);
      setHasReviewErrors(next.some(p => p.selected && (p.missingSubject || p.missingDay)));
      return next;
    });
  }, []);

  const togglePeriod = useCallback((id: string) => {
    setParsedPeriods(prev => {
      const next = prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p);
      setHasReviewErrors(next.some(p => p.selected && (p.missingSubject || p.missingDay)));
      return next;
    });
  }, []);

  // ─── Confirm import ───────────────────────────────────────────────────────────

  const handleConfirmReview = useCallback(async () => {
    const selected = parsedPeriods.filter(p => p.selected);
    if (selected.length === 0) {
      crossAlert('', t('timetable.noLessonsManual'));
      return;
    }
    if (hasReviewErrors) return;

    const newTimetable = periodsToTimetable(selected);
    const ok = await saveTimetable(newTimetable);
    if (ok) {
      crossAlert('', t('timetable.saveSuccess'));
      setMode('view');
    } else {
      crossAlert('', t('timetable.saveError'));
    }
  }, [parsedPeriods, hasReviewErrors, saveTimetable, t]);

  // ─── Manual save ─────────────────────────────────────────────────────────────

  const handleConfirmManual = useCallback(async () => {
    const filtered: Timetable = {};
    WEEK_DAYS_WITH_FRIDAY.forEach(day => {
      filtered[day] = (manualTimetable[day] ?? []).filter(p => p.subject.trim());
    });
    const total = Object.values(filtered).reduce((s, ps) => s + ps.length, 0);

    const doSave = async () => {
      const ok = await saveTimetable(filtered);
      if (ok) {
        crossAlert('', t('timetable.saveSuccess'));
        setMode('view');
      } else {
        crossAlert('', t('timetable.saveError'));
      }
    };

    // Saving an EMPTY schedule is legal — it's how a parent wipes last year's
    // timetable (e.g. school year → camp). It just needs explicit consent;
    // the old hard block made clearing impossible (Adi, 2026-07-07).
    if (total === 0) {
      crossAlert(
        t('timetable.clearAllTitle'),
        t('timetable.clearAllMsg'),
        [
          { text: t('timetable.cancel'), style: 'cancel' },
          { text: t('timetable.clearAllConfirm'), style: 'destructive', onPress: () => { void doSave(); } },
        ],
      );
      return;
    }
    await doSave();
  }, [manualTimetable, saveTimetable, t]);

  const manualAddLesson = (day: WeekDay) => {
    setManualTimetable(prev => {
      const existing = prev[day] ?? [];
      return { ...prev, [day]: [...existing, { subject: '', startTime: generateBuffStandardTime(existing.length) }] };
    });
  };

  // ── Copy-day handlers ───────────────────────────────────────────────────────
  const openCopyDay  = () => { setCopyTargets([]); setCopyDayOpen(true); };
  const closeCopyDay = () => setCopyDayOpen(false);

  const applyCopyDay = (copyMode: CopyDayMode) => {
    setManualTimetable(prev => copyTimetableDay(prev, manualDay, copyTargets, copyMode));
    setCopyDayOpen(false);
    // Jump to the first target so the result is visible instantly.
    if (copyTargets.length > 0) setManualDay(copyTargets[0]);
  };

  const handleCopyDayConfirm = () => {
    // Never silently overwrite a day that already has named lessons.
    const conflict = copyTargets.some(d => dayHasLessons(manualTimetable, d));
    if (conflict) {
      crossAlert(
        t('timetable.copyDay.existingTitle'),
        t('timetable.copyDay.existingMsg'),
        [
          { text: t('timetable.cancel'), style: 'cancel' },
          { text: t('timetable.copyDay.append'),  onPress: () => applyCopyDay('append') },
          { text: t('timetable.copyDay.replace'), style: 'destructive', onPress: () => applyCopyDay('replace') },
        ],
      );
      return;
    }
    applyCopyDay('replace');
  };

  const manualUpdateLesson = (day: WeekDay, idx: number, updates: Partial<PeriodInfo>) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: (prev[day] ?? []).map((p, i) => i === idx ? { ...p, ...updates } : p),
    }));
  };

  const manualDeleteLesson = (day: WeekDay, idx: number) => {
    setManualTimetable(prev => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((_, i) => i !== idx),
    }));
  };

  // Clear the whole day in one tap (season change: school year → camp).
  // Local editor state only — nothing persists until the parent saves, and
  // Back discards, so no confirm dialog is needed here.
  const manualClearDay = (day: WeekDay) => {
    setManualTimetable(prev => ({ ...prev, [day]: [] }));
  };

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderChildSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childBar}>
      {children.map(c => {
        const active = c.childId === resolvedChildId;
        return (
          <TouchableOpacity
            key={c.childId}
            onPress={() => setSelectedChildId(c.childId)}
            style={[styles.childChip, active && { backgroundColor: T.accent }]}
          >
            <Text style={styles.childEmoji}>{c.avatar}</Text>
            <Text style={[styles.childName, { color: active ? '#fff' : T.textMuted }]}>
              {c.displayName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderDayTabs = (
    selectedDay: WeekDay,
    onSelect: (d: WeekDay) => void,
    activeDays: WeekDay[],
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayBar}>
      {activeDays.map(day => {
        const active = day === selectedDay;
        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelect(day)}
            style={[styles.dayChip, active && { backgroundColor: T.accent }]}
          >
            <Text style={[styles.dayChipText, { color: active ? '#fff' : T.textMuted }]}>
              {dayLabels[day]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ─── VIEW mode ────────────────────────────────────────────────────────────────

  if (mode === 'view') {
    const hasTimetable = Object.values(timetable).some(ps => (ps ?? []).length > 0);
    const activeDays   = hasTimetable
      ? WEEK_DAYS_WITH_FRIDAY.filter(d => (timetable[d] ?? []).length > 0)
      : WEEK_DAYS;
    const viewPeriods  = timetable[viewDay] ?? [];
    const isLoading    = childrenLoading || timetableLoading;

    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        <View style={[styles.header, headerPad]}>
          <Text style={[styles.title, { color: T.text }]}>{t('timetable.title')}</Text>
          <View style={styles.headerRight}>
            {hasTimetable && (
              <TouchableOpacity
                onPress={() => setMode('choose')}
                style={[styles.headerBtn, { backgroundColor: T.accent }]}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={styles.headerBtnText}>{t('timetable.updateBtn')}</Text>
              </TouchableOpacity>
            )}
            <ParentNotificationBell />
          </View>
        </View>

        {childrenLoading ? (
          <ActivityIndicator color={T.accent} style={styles.centered} />
        ) : children.length === 0 ? (
          <View style={styles.centered}>
            <Text style={{ color: T.textMuted }}>{t('timetable.noChildren')}</Text>
          </View>
        ) : (
          <>
            {renderChildSelector()}

            {isLoading ? (
              <ActivityIndicator color={T.accent} style={styles.centered} />
            ) : !hasTimetable ? (
              <View style={styles.centered}>
                <Ionicons name="calendar-outline" size={56} color={T.textMuted} />
                <Text style={[styles.emptyTitle, { color: T.text }]}>
                  {t('timetable.emptyTitle')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: T.textMuted }]}>
                  {t('timetable.emptySubtitle')}
                </Text>
                <TouchableOpacity
                  onPress={() => setMode('choose')}
                  style={[styles.importBtn, { backgroundColor: T.accent }]}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.importBtnText}>{t('timetable.importBtn')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {renderDayTabs(viewDay, setViewDay, activeDays)}
                <ScrollView contentContainerStyle={styles.periodList}>
                  {viewPeriods.map((p, i) => (
                    <View key={i} style={[styles.periodRow, { borderColor: T.cardBorder }]}>
                      <View style={[styles.timeBadge, { backgroundColor: T.accent + '18' }]}>
                        <Text style={[styles.timeBadgeText, { color: T.accent }]}>{p.startTime}</Text>
                      </View>
                      <View style={styles.periodInfo}>
                        <Text style={[styles.periodSubject, { color: T.text }]}>{p.subject}</Text>
                        {!!p.equipment && (
                          <Text style={[styles.periodEquip, { color: T.textMuted }]}>
                            🎒 {p.equipment}
                          </Text>
                        )}
                      </View>
                      <View style={styles.lessonNum}>
                        <Text style={[styles.lessonNumText, { color: T.textMuted }]}>{i + 1}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}
      </View>
    );
  }

  // ─── CHOOSE mode ──────────────────────────────────────────────────────────────

  if (mode === 'choose') {
    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        <View style={[styles.header, headerPad]}>
          <TouchableOpacity onPress={() => setMode('view')}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: T.text }]}>{t('timetable.chooseTitle')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[styles.chooseSubtitle, { color: T.textMuted }]}>
          {t('timetable.chooseSubtitle')}
        </Text>

        <View style={styles.methodGrid}>
          {/* Excel + photo import rely on native file pickers + expo-file-system
              (no web file-read path yet) — hide them on web so there's no broken
              button. Web parents use Manual entry below; full web import is a
              follow-up. */}
          {Platform.OS !== 'web' && (
            <>
              <TouchableOpacity
                onPress={handleExcel}
                style={[styles.methodCard, { borderColor: T.cardBorder, backgroundColor: T.card }]}
              >
                <Ionicons name="document-text-outline" size={36} color={T.accent} />
                <Text style={[styles.methodLabel, { color: T.text }]}>{t('timetable.methodExcel')}</Text>
                <Text style={[styles.methodSub,   { color: T.textMuted }]}>{t('timetable.methodExcelSub')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImage}
                style={[styles.methodCard, { borderColor: T.cardBorder, backgroundColor: T.card }]}
              >
                <Ionicons name="camera-outline" size={36} color={T.accent} />
                <Text style={[styles.methodLabel, { color: T.text }]}>{t('timetable.methodPhoto')}</Text>
                <Text style={[styles.methodSub,   { color: T.textMuted }]}>{t('timetable.methodPhotoSub')}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={openManual}
            style={[styles.methodCard, { borderColor: T.cardBorder, backgroundColor: T.card }]}
          >
            <Ionicons name="create-outline" size={36} color={T.accent} />
            <Text style={[styles.methodLabel, { color: T.text }]}>{t('timetable.methodManual')}</Text>
            <Text style={[styles.methodSub,   { color: T.textMuted }]}>{t('timetable.methodManualSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode('paste')}
            style={[styles.methodCard, { borderColor: T.cardBorder, backgroundColor: T.card }]}
          >
            <Ionicons name="clipboard-outline" size={36} color={T.accent} />
            <Text style={[styles.methodLabel, { color: T.text }]}>{t('timetable.methodPaste')}</Text>
            <Text style={[styles.methodSub,   { color: T.textMuted }]}>{t('timetable.methodPasteSub')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── PASTE mode ──────────────────────────────────────────────────────────────

  if (mode === 'paste') {
    const lineCount = pasteText.split('\n').filter(l => l.trim()).length;
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: T.bg }]}
      >
        <View style={[styles.header, headerPad]}>
          <TouchableOpacity onPress={() => setMode('choose')}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: T.text }]}>{t('timetable.pasteTitle')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[styles.chooseSubtitle, { color: T.textMuted }]}>
          {t('timetable.pasteSubtitle')}
        </Text>

        <View style={[styles.pasteHint, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
          <Ionicons name="information-circle-outline" size={18} color={T.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pasteHintTitle, { color: T.text }]}>
              {t('timetable.pasteFormatsTitle')}
            </Text>
            <Text style={[styles.pasteHintLine,  { color: T.textMuted }]}>
              {t('timetable.pasteFormat1')}
            </Text>
            <Text style={[styles.pasteHintLine,  { color: T.textMuted }]}>
              {t('timetable.pasteFormat2')}
            </Text>
            <Text style={[styles.pasteHintLine,  { color: T.textMuted }]}>
              {t('timetable.pasteFormat3')}
            </Text>
          </View>
        </View>

        <TextInput
          value={pasteText}
          onChangeText={setPasteText}
          multiline
          placeholder={t('timetable.pastePlaceholder')}
          placeholderTextColor={T.textMuted}
          style={[
            styles.pasteTextarea,
            { borderColor: T.cardBorder, color: T.text, backgroundColor: T.card },
          ]}
          textAlignVertical="top"
        />

        <View style={[styles.reviewFooter, footerPad, { borderTopColor: T.cardBorder }]} testID="timetable-footer-paste">
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.outlineBtn}>
            <Text style={{ color: T.textMuted }}>{t('timetable.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleProcessPaste}
            disabled={lineCount === 0 || pastePending}
            style={[
              styles.confirmBtn,
              { backgroundColor: (lineCount === 0 || pastePending) ? T.cardBorder : T.accent },
            ]}
          >
            {pastePending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.confirmBtnText}>
                  {t('timetable.pasteParseBtn', { count: lineCount })}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── PROCESSING mode ──────────────────────────────────────────────────────────

  if (mode === 'processing') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={[styles.processingMsg, { color: T.text }]}>{processingMsg}</Text>
        <TouchableOpacity onPress={cancelProcessing} style={styles.cancelBtn}>
          <Text style={{ color: T.textMuted }}>{t('timetable.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── REVIEW mode ──────────────────────────────────────────────────────────────

  if (mode === 'review') {
    const selected    = parsedPeriods.filter(p => p.selected);
    const errorCount  = selected.filter(p => p.missingSubject || p.missingDay).length;
    const reviewDays  = WEEK_DAYS_WITH_FRIDAY.filter(d => parsedPeriods.some(p => p.day === d));
    const dayPeriods  = parsedPeriods
      .filter(p => p.day === reviewDay)
      .sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0) || a.time.localeCompare(b.time));

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: T.bg }]}
      >
        {/* Header */}
        <View style={[styles.header, headerPad]}>
          <TouchableOpacity onPress={() => setMode('choose')}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: T.text }]}>{t('timetable.reviewTitle')}</Text>
            <Text style={[styles.reviewCount, { color: T.textMuted }]}>
              {t('timetable.reviewSubtitle', { selected: selected.length, total: parsedPeriods.length })}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Warnings */}
        {hasAutoTime && (
          <View style={[styles.banner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Ionicons name="warning-outline" size={16} color="#D97706" />
            <Text style={[styles.bannerText, { color: '#92400E' }]}>
              {t('timetable.autoTimeWarning')}
            </Text>
          </View>
        )}
        {hasReviewErrors && (
          <View style={[styles.banner, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={[styles.bannerText, { color: '#991B1B' }]}>
              {t('timetable.validationError')}
            </Text>
          </View>
        )}

        {/* Day tabs */}
        {renderDayTabs(reviewDay, setReviewDay, reviewDays)}

        {/* Split-groups banner (shown once if any split slot exists in the parsed set) */}
        {parsedPeriods.some(p => (p.groupTotal ?? 0) > 1) && (
          <View style={[styles.banner, { backgroundColor: '#EEF2FF', borderColor: '#6366F1' }]}>
            <Ionicons name="people-outline" size={16} color="#4338CA" />
            <Text style={[styles.bannerText, { color: '#3730A3' }]}>
              {t('timetable.splitGroupsBanner')}
            </Text>
          </View>
        )}

        {/* Period rows */}
        <ScrollView contentContainerStyle={styles.periodList} keyboardShouldPersistTaps="handled">
          {dayPeriods.map(period => {
            const hasError = period.selected && (period.missingSubject || period.missingDay);
            const isSplit  = (period.groupTotal ?? 0) > 1;
            const isAlternate = isSplit && (period.groupIndex ?? 0) > 0;
            return (
              <View
                key={period.id}
                style={[
                  styles.equipCard,
                  { borderColor: hasError ? '#EF4444' : (isSplit ? '#6366F1' : T.cardBorder) },
                  hasError && { backgroundColor: '#FEE2E210' },
                  isAlternate && { backgroundColor: '#EEF2FF50' },
                ]}
              >
                <View style={styles.cardTopRow}>
                  {/* Select toggle */}
                  <TouchableOpacity
                    onPress={() => togglePeriod(period.id)}
                    style={[styles.checkbox, { borderColor: period.selected ? T.accent : T.cardBorder,
                      backgroundColor: period.selected ? T.accent : 'transparent' }]}
                  >
                    {period.selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>

                  {/* Lesson number */}
                  {!!period.lessonNumber && (
                    <View style={[styles.lessonBadge, { backgroundColor: T.accent + '22' }]}>
                      <Text style={[styles.lessonBadgeText, { color: T.accent }]}>
                        {period.lessonNumber}
                      </Text>
                    </View>
                  )}

                  {/* Split-group badge (e.g. "1/3") + teacher name */}
                  {isSplit && (
                    <View style={styles.groupBadge}>
                      <Text style={styles.groupBadgeText}>
                        {(period.groupIndex ?? 0) + 1}/{period.groupTotal}
                      </Text>
                      {!!period.teacher && (
                        <Text style={styles.groupTeacher} numberOfLines={1}>
                          {period.teacher}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Time — native OS picker (matches the task-edit modal) */}
                  <TimeField
                    value={period.time}
                    onChange={v => updatePeriod(period.id, { time: v, autoTime: false })}
                    style={[
                      styles.timeField,
                      { borderColor: period.autoTime ? '#F59E0B' : T.cardBorder },
                    ]}
                    textStyle={[styles.timeFieldText, { color: T.text }]}
                    accessibilityLabel={t('timetable.lessonTimeLabel')}
                    testID={`time-field-review-${period.id}`}
                  />

                  {/* Subject input */}
                  <TextInput
                    value={period.subject}
                    onChangeText={v => updatePeriod(period.id, { subject: v })}
                    style={[
                      styles.subjectInput,
                      { borderColor: period.missingSubject ? '#EF4444' : T.cardBorder, color: T.text },
                    ]}
                    placeholder={t('timetable.lessonPlaceholder')}
                    placeholderTextColor={T.textMuted}
                  />

                  {/* Day picker chip — tap to change day for this row */}
                  <TouchableOpacity
                    onPress={() => setDayPickerForId(period.id)}
                    style={[
                      styles.dayPickerChip,
                      {
                        borderColor: period.missingDay ? '#EF4444' : T.cardBorder,
                        backgroundColor: period.missingDay ? '#FEE2E210' : '#F3F4F6',
                      },
                    ]}
                    accessibilityLabel={t('timetable.changeDay')}
                  >
                    <Text style={[styles.dayPickerChipText, { color: T.text }]}>
                      {dayLabels[period.day]}
                    </Text>
                    <Ionicons name="chevron-down" size={10} color={T.textMuted} />
                  </TouchableOpacity>

                  {/* Delete */}
                  <TouchableOpacity onPress={() => deletePeriod(period.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Equipment for this lesson — bounded multiline so a long gear
                    list stays readable without one field swallowing the screen */}
                <View style={styles.equipRow}>
                  <Text style={styles.equipIcon}>🎒</Text>
                  <TextInput
                    value={period.equipment ?? ''}
                    onChangeText={v => updatePeriod(period.id, { equipment: v })}
                    style={[styles.equipInput, { borderColor: T.cardBorder, color: T.text }]}
                    placeholder={t('timetable.equipmentBagPlaceholder')}
                    placeholderTextColor={T.textMuted}
                    accessibilityLabel={t('timetable.equipmentForLesson')}
                    multiline
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Day picker modal */}
        <Modal
          visible={dayPickerForId !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setDayPickerForId(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDayPickerForId(null)}
          >
            <View style={[styles.dayPickerModal, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
              <Text style={[styles.dayPickerTitle, { color: T.text }]}>
                {t('timetable.changeDay')}
              </Text>
              <View style={styles.dayPickerGrid}>
                {WEEK_DAYS_WITH_FRIDAY.map(day => {
                  const currentPeriod = parsedPeriods.find(p => p.id === dayPickerForId);
                  const isActive = currentPeriod?.day === day;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => {
                        if (dayPickerForId) updatePeriod(dayPickerForId, { day });
                        setDayPickerForId(null);
                      }}
                      style={[
                        styles.dayPickerOption,
                        {
                          backgroundColor: isActive ? T.accent : 'transparent',
                          borderColor: isActive ? T.accent : T.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPickerOptionText,
                          { color: isActive ? '#fff' : T.text },
                        ]}
                      >
                        {dayLabels[day]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Confirm */}
        <View style={[styles.reviewFooter, footerPad, { borderTopColor: T.cardBorder }]} testID="timetable-footer-review">
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.outlineBtn}>
            <Text style={{ color: T.textMuted }}>{t('timetable.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmReview}
            disabled={selected.length === 0 || errorCount > 0 || saving}
            style={[
              styles.confirmBtn,
              { backgroundColor: (selected.length === 0 || errorCount > 0) ? T.cardBorder : T.accent },
            ]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.confirmBtnText}>
                  {errorCount > 0
                    ? t('timetable.fixErrors', { count: errorCount })
                    : t('timetable.confirmBtn', { count: selected.length })}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── MANUAL mode ──────────────────────────────────────────────────────────────

  if (mode === 'manual') {
    const manualLessons  = manualTimetable[manualDay] ?? [];
    const totalFilled    = WEEK_DAYS_WITH_FRIDAY.reduce(
      (s, d) => s + (manualTimetable[d] ?? []).filter(p => p.subject.trim()).length, 0,
    );

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: T.bg }]}
      >
        <View style={[styles.header, headerPad]}>
          <TouchableOpacity onPress={() => setMode('choose')}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: T.text }]}>{t('timetable.manualTitle')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderDayTabs(manualDay, setManualDay, WEEK_DAYS_WITH_FRIDAY)}

        <ScrollView contentContainerStyle={styles.periodList} keyboardShouldPersistTaps="handled">
          {manualLessons.map((lesson, i) => (
            <View key={i} style={[styles.equipCard, { borderColor: T.cardBorder }]}>
              <View style={styles.cardTopRow}>
                <View style={[styles.lessonBadge, { backgroundColor: T.accent + '22' }]}>
                  <Text style={[styles.lessonBadgeText, { color: T.accent }]}>{i + 1}</Text>
                </View>
                <TimeField
                  value={lesson.startTime}
                  onChange={v => manualUpdateLesson(manualDay, i, { startTime: v })}
                  style={[styles.timeField, { borderColor: T.cardBorder }]}
                  textStyle={[styles.timeFieldText, { color: T.text }]}
                  accessibilityLabel={t('timetable.lessonTimeLabel')}
                  testID={`time-field-manual-${i}`}
                />
                <TextInput
                  value={lesson.subject}
                  onChangeText={v => manualUpdateLesson(manualDay, i, { subject: v })}
                  style={[styles.subjectInput, { borderColor: T.cardBorder, color: T.text }]}
                  placeholder={t('timetable.lessonPlaceholder')}
                  placeholderTextColor={T.textMuted}
                />
                <TouchableOpacity onPress={() => manualDeleteLesson(manualDay, i)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.equipRow}>
                <Text style={styles.equipIcon}>🎒</Text>
                <TextInput
                  value={lesson.equipment ?? ''}
                  onChangeText={v => manualUpdateLesson(manualDay, i, { equipment: v })}
                  style={[styles.equipInput, { borderColor: T.cardBorder, color: T.text }]}
                  placeholder={t('timetable.equipmentBagPlaceholder')}
                  placeholderTextColor={T.textMuted}
                  accessibilityLabel={t('timetable.equipmentForLesson')}
                  multiline
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => manualAddLesson(manualDay)}
            style={[styles.addLessonBtn, { borderColor: T.cardBorder }]}
          >
            <Text style={[styles.addLessonText, { color: T.accent }]}>
              {t('timetable.addLesson')}
            </Text>
          </TouchableOpacity>

          {/* Copy this day's lessons to other days (visible affordance —
              features that hide don't exist; see SPEC discoverability note) */}
          {manualLessons.length > 0 && (
            <TouchableOpacity
              onPress={openCopyDay}
              style={[styles.addLessonBtn, { borderColor: T.cardBorder }]}
              testID="copy-day-open"
            >
              <Text style={[styles.addLessonText, { color: T.accent }]}>
                {t('timetable.copyDay.button')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Clear the whole day (season change: school → camp). Local-only
              until save; Back discards, so no confirm here. */}
          {manualLessons.length > 0 && (
            <TouchableOpacity
              onPress={() => manualClearDay(manualDay)}
              style={[styles.addLessonBtn, { borderColor: '#FCA5A5' }]}
              testID="clear-day"
            >
              <Text style={[styles.addLessonText, { color: '#EF4444' }]}>
                {t('timetable.clearDayBtn')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Copy-day target picker */}
        <Modal visible={copyDayOpen} transparent animationType="fade" onRequestClose={closeCopyDay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeCopyDay}>
            <View style={[styles.dayPickerModal, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
              <Text style={[styles.dayPickerTitle, { color: T.text }]}>
                {t('timetable.copyDay.title', { day: dayLabels[manualDay] })}
              </Text>
              <View style={styles.dayPickerGrid}>
                {WEEK_DAYS_WITH_FRIDAY.filter(d => d !== manualDay).map(day => {
                  const selected = copyTargets.includes(day);
                  const hasRows  = dayHasLessons(manualTimetable, day);
                  return (
                    <TouchableOpacity
                      key={day}
                      testID={`copy-day-chip-${day}`}
                      onPress={() =>
                        setCopyTargets(prev =>
                          selected ? prev.filter(d => d !== day) : [...prev, day])
                      }
                      style={[
                        styles.dayPickerOption,
                        {
                          backgroundColor: selected ? T.accent : 'transparent',
                          borderColor: selected ? T.accent : T.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.dayPickerOptionText, { color: selected ? '#fff' : T.text }]}>
                        {dayLabels[day]}
                      </Text>
                      {hasRows && (
                        <Text style={[styles.copyDayHint, { color: selected ? '#fff' : T.textMuted }]}>
                          {t('timetable.copyDay.hasLessons')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                testID="copy-day-confirm"
                disabled={copyTargets.length === 0}
                onPress={handleCopyDayConfirm}
                style={[
                  styles.confirmBtn, styles.copyDayConfirm,
                  { backgroundColor: copyTargets.length === 0 ? T.cardBorder : T.accent },
                ]}
              >
                <Text style={styles.confirmBtnText}>
                  {t('timetable.copyDay.confirm', { count: copyTargets.length })}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={[styles.reviewFooter, footerPad, { borderTopColor: T.cardBorder }]} testID="timetable-footer-manual">
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.outlineBtn}>
            <Text style={{ color: T.textMuted }}>{t('timetable.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmManual}
            disabled={saving}
            style={[styles.confirmBtn, { backgroundColor: totalFilled === 0 ? '#EF4444' : T.accent }]}
            testID="manual-save"
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.confirmBtnText}>
                  {totalFilled === 0
                    ? t('timetable.saveEmpty')
                    : t('timetable.saveLessons', { count: totalFilled })}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1 },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 12 },
  title:         { fontSize: 20, fontWeight: '700' },
  headerBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12,
                   paddingVertical: 6, borderRadius: 20 },
  headerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },

  childBar:      { paddingHorizontal: 12, paddingBottom: 8, flexGrow: 0 },
  childChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14,
                   paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#F3F4F6' },
  childEmoji:    { fontSize: 16 },
  childName:     { fontSize: 13, fontWeight: '600' },

  dayBar:        { paddingHorizontal: 12, paddingBottom: 8, flexGrow: 0 },
  dayChip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                   backgroundColor: '#F3F4F6' },
  dayChipText:   { fontSize: 13, fontWeight: '600' },

  periodList:    { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  periodRow:     { flexDirection: 'row', alignItems: 'center', gap: 10,
                   padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: '#fff' },
  timeBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timeBadgeText: { fontSize: 13, fontWeight: '700' },
  periodInfo:    { flex: 1 },
  periodSubject: { fontSize: 15, fontWeight: '600' },
  periodEquip:   { fontSize: 12, marginTop: 2 },
  lessonNum:     { width: 24, alignItems: 'center' },
  lessonNumText: { fontSize: 12 },

  emptyTitle:    { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 14, marginBottom: 20 },
  importBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6,
                   paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  importBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  chooseSubtitle: { textAlign: 'center', fontSize: 14, marginBottom: 24, paddingHorizontal: 16 },
  methodGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  methodCard:    { flex: 1, minWidth: '28%', alignItems: 'center', padding: 16,
                   borderRadius: 16, borderWidth: 1.5, gap: 6 },
  methodLabel:   { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  methodSub:     { fontSize: 11, textAlign: 'center' },

  processingMsg: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  cancelBtn:     { marginTop: 20, padding: 10 },

  banner:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16,
                   marginBottom: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  bannerText:    { flex: 1, fontSize: 13 },

  equipCard:     { padding: 10, borderRadius: 12, borderWidth: 1.5, backgroundColor: '#fff', gap: 8 },
  cardTopRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  equipRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  equipIcon:     { fontSize: 15 },
  // Bounded multiline: grows to ~3 lines then scrolls internally, so one long
  // gear list can never push the footer off-screen (Noa, 2026-07-06).
  equipInput:    { flex: 1, minHeight: 34, maxHeight: 76, borderWidth: 1.5, borderRadius: 8,
                   paddingHorizontal: 8, paddingVertical: 6, fontSize: 13 },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                   alignItems: 'center', justifyContent: 'center' },
  lessonBadge:   { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  lessonBadgeText:{ fontSize: 11, fontWeight: '700' },
  timeField:     { width: 76, height: 36, borderWidth: 1.5, borderRadius: 8,
                   flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  timeFieldText: { fontSize: 13, fontWeight: '600' },
  subjectInput:  { flex: 1, height: 36, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, fontSize: 14 },
  deleteBtn:     { padding: 4 },

  reviewCount:   { fontSize: 12, marginTop: 2 },
  reviewFooter:  { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1 },
  outlineBtn:    { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  confirmBtn:    { flex: 1, alignItems: 'center', justifyContent: 'center',
                   paddingVertical: 12, borderRadius: 12 },
  confirmBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },

  addLessonBtn:  { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12,
                   paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addLessonText: { fontSize: 14, fontWeight: '600' },
  copyDayHint:   { fontSize: 9, marginTop: 2 },
  copyDayConfirm:{ marginTop: 16 },

  groupBadge:    { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
                   paddingVertical: 2, borderRadius: 8, backgroundColor: '#E0E7FF',
                   borderWidth: 1, borderColor: '#6366F1', maxWidth: 80 },
  groupBadgeText:{ fontSize: 11, fontWeight: '700', color: '#3730A3' },
  groupTeacher:  { fontSize: 9, color: '#4338CA', marginTop: 1 },

  dayPickerChip: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8,
                   height: 36, borderRadius: 8, borderWidth: 1.5 },
  dayPickerChipText: { fontSize: 13, fontWeight: '600' },

  modalBackdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dayPickerModal: { width: '80%', maxWidth: 320, padding: 20, borderRadius: 16, borderWidth: 1 },
  dayPickerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  dayPickerGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  dayPickerOption:{ minWidth: 80, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                    borderWidth: 1.5, alignItems: 'center' },
  dayPickerOptionText: { fontSize: 14, fontWeight: '600' },

  pasteHint:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16,
                   marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  pasteHintTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 4 },
  pasteHintLine: { fontSize: 12, lineHeight: 18 },
  pasteTextarea: { marginHorizontal: 16, marginBottom: 12, minHeight: 220, borderRadius: 12,
                   borderWidth: 1.5, padding: 12, fontSize: 14, textAlign: 'right' },
});
