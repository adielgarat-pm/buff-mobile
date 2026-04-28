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

import { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';

import { PARENT_THEME as T } from '../../theme';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'view' | 'choose' | 'processing' | 'review' | 'manual';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TimetableScreen() {
  const { t, i18n } = useTranslation();
  const isHebrew    = i18n.language === 'he';
  const dayLabels   = isHebrew ? WEEK_DAY_LABELS : WEEK_DAY_LABELS_EN;

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

  // ── Processing ─────────────────────────────────────────────────────────────
  const [processingMsg, setProcessingMsg]     = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // ── Review ─────────────────────────────────────────────────────────────────
  const [parsedPeriods,    setParsedPeriods]    = useState<ParsedPeriod[]>([]);
  const [hasAutoTime,      setHasAutoTime]      = useState(false);
  const [hasReviewErrors,  setHasReviewErrors]  = useState(false);
  const [reviewDay,        setReviewDay]        = useState<WeekDay>('sunday');

  // ── Manual ─────────────────────────────────────────────────────────────────
  const [manualTimetable, setManualTimetable] = useState<Timetable>({});
  const [manualDay,       setManualDay]       = useState<WeekDay>('sunday');

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
        Alert.alert(t('timetable.parseError'), t('timetable.noLessonsFound'));
        setMode('choose');
        return;
      }

      if (isPivot) {
        Alert.alert('', t('timetable.pivotDetected'));
      }

      openReview(periods, hasAuto, hasErrors);
    } catch (err: unknown) {
      console.error('[TimetableScreen] Excel error:', err);
      const msg = err instanceof Error ? err.message : t('timetable.parseError');
      Alert.alert(t('timetable.parseError'), msg);
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
        Alert.alert('', 'Photo library permission required');
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
        Alert.alert('', t('timetable.noLessonsFound'));
        setMode('choose');
        return;
      }

      const { periods, hasAuto, hasErrors } = processApiResponse(data.tasks);
      openReview(periods, hasAuto, hasErrors);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('[TimetableScreen] OCR error:', err);
      Alert.alert(t('timetable.parseError'), (err instanceof Error ? err.message : ''));
      setMode('choose');
    }
  }, [t, openReview]);

  const cancelProcessing = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMode('choose');
  }, []);

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
      Alert.alert('', t('timetable.noLessonsManual'));
      return;
    }
    if (hasReviewErrors) return;

    const newTimetable = periodsToTimetable(selected);
    const ok = await saveTimetable(newTimetable);
    if (ok) {
      Alert.alert('', t('timetable.saveSuccess'));
      setMode('view');
    } else {
      Alert.alert('', t('timetable.saveError'));
    }
  }, [parsedPeriods, hasReviewErrors, saveTimetable, t]);

  // ─── Manual save ─────────────────────────────────────────────────────────────

  const handleConfirmManual = useCallback(async () => {
    const filtered: Timetable = {};
    WEEK_DAYS_WITH_FRIDAY.forEach(day => {
      filtered[day] = (manualTimetable[day] ?? []).filter(p => p.subject.trim());
    });
    const total = Object.values(filtered).reduce((s, ps) => s + ps.length, 0);
    if (total === 0) {
      Alert.alert('', t('timetable.noLessonsManual'));
      return;
    }
    const ok = await saveTimetable(filtered);
    if (ok) {
      Alert.alert('', t('timetable.saveSuccess'));
      setMode('view');
    } else {
      Alert.alert('', t('timetable.saveError'));
    }
  }, [manualTimetable, saveTimetable, t]);

  const manualAddLesson = (day: WeekDay) => {
    setManualTimetable(prev => {
      const existing = prev[day] ?? [];
      return { ...prev, [day]: [...existing, { subject: '', startTime: generateBuffStandardTime(existing.length) }] };
    });
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: T.text }]}>{t('timetable.title')}</Text>
          {hasTimetable && (
            <TouchableOpacity
              onPress={() => setMode('choose')}
              style={[styles.headerBtn, { backgroundColor: T.accent }]}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={styles.headerBtnText}>{t('timetable.updateBtn')}</Text>
            </TouchableOpacity>
          )}
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
        <View style={styles.header}>
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

          <TouchableOpacity
            onPress={openManual}
            style={[styles.methodCard, { borderColor: T.cardBorder, backgroundColor: T.card }]}
          >
            <Ionicons name="create-outline" size={36} color={T.accent} />
            <Text style={[styles.methodLabel, { color: T.text }]}>{t('timetable.methodManual')}</Text>
            <Text style={[styles.methodSub,   { color: T.textMuted }]}>{t('timetable.methodManualSub')}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        {/* Header */}
        <View style={styles.header}>
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

        {/* Period rows */}
        <ScrollView contentContainerStyle={styles.periodList}>
          {dayPeriods.map(period => {
            const hasError = period.selected && (period.missingSubject || period.missingDay);
            return (
              <View
                key={period.id}
                style={[
                  styles.reviewRow,
                  { borderColor: hasError ? '#EF4444' : T.cardBorder },
                  hasError && { backgroundColor: '#FEE2E210' },
                ]}
              >
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

                {/* Time input */}
                <TextInput
                  value={period.time}
                  onChangeText={v => updatePeriod(period.id, { time: v, autoTime: false })}
                  style={[
                    styles.timeInput,
                    { borderColor: period.autoTime ? '#F59E0B' : T.cardBorder, color: T.text },
                  ]}
                  placeholder="HH:MM"
                  placeholderTextColor={T.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
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

                {/* Delete */}
                <TouchableOpacity onPress={() => deletePeriod(period.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* Confirm */}
        <View style={[styles.reviewFooter, { borderTopColor: T.cardBorder }]}>
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
      </View>
    );
  }

  // ─── MANUAL mode ──────────────────────────────────────────────────────────────

  if (mode === 'manual') {
    const manualLessons  = manualTimetable[manualDay] ?? [];
    const totalFilled    = WEEK_DAYS_WITH_FRIDAY.reduce(
      (s, d) => s + (manualTimetable[d] ?? []).filter(p => p.subject.trim()).length, 0,
    );

    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode('choose')}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: T.text }]}>{t('timetable.manualTitle')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderDayTabs(manualDay, setManualDay, WEEK_DAYS_WITH_FRIDAY)}

        <ScrollView contentContainerStyle={styles.periodList}>
          {manualLessons.map((lesson, i) => (
            <View key={i} style={[styles.reviewRow, { borderColor: T.cardBorder }]}>
              <View style={[styles.lessonBadge, { backgroundColor: T.accent + '22' }]}>
                <Text style={[styles.lessonBadgeText, { color: T.accent }]}>{i + 1}</Text>
              </View>
              <TextInput
                value={lesson.startTime}
                onChangeText={v => manualUpdateLesson(manualDay, i, { startTime: v })}
                style={[styles.timeInput, { borderColor: T.cardBorder, color: T.text }]}
                placeholder="HH:MM"
                placeholderTextColor={T.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
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
          ))}

          <TouchableOpacity
            onPress={() => manualAddLesson(manualDay)}
            style={[styles.addLessonBtn, { borderColor: T.cardBorder }]}
          >
            <Text style={[styles.addLessonText, { color: T.accent }]}>
              {t('timetable.addLesson')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.reviewFooter, { borderTopColor: T.cardBorder }]}>
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.outlineBtn}>
            <Text style={{ color: T.textMuted }}>{t('timetable.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmManual}
            disabled={totalFilled === 0 || saving}
            style={[styles.confirmBtn, { backgroundColor: totalFilled === 0 ? T.cardBorder : T.accent }]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.confirmBtnText}>
                  {t('timetable.saveLessons', { count: totalFilled })}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
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

  reviewRow:     { flexDirection: 'row', alignItems: 'center', gap: 8,
                   padding: 10, borderRadius: 12, borderWidth: 1.5, backgroundColor: '#fff' },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                   alignItems: 'center', justifyContent: 'center' },
  lessonBadge:   { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  lessonBadgeText:{ fontSize: 11, fontWeight: '700' },
  timeInput:     { width: 64, height: 36, borderWidth: 1.5, borderRadius: 8,
                   paddingHorizontal: 6, fontSize: 13, textAlign: 'center' },
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
});
