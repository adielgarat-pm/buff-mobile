/**
 * Shared layout wrapper for all onboarding steps.
 * Provides: step progress bar, back chevron, BUFF branding, Next button.
 */
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';

interface Props {
  step: number;      // 0-indexed
  total: number;     // total steps in this flow
  flowLabel: string; // e.g. "Full Discovery"
  onNext: () => void;
  canProceed: boolean;
  nextLabel?: string;    // defaults to translated "Continue"
  headerRight?: ReactNode; // rendered in the right slot of the top bar
  children: ReactNode;
}

export default function OnboardingShell({
  step, total, flowLabel, onNext, canProceed, nextLabel, headerRight, children,
}: Props) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const progress = (step + 1) / (total + 1);
  // Fall back to translated "Continue" when no label is explicitly passed
  const displayLabel = nextLabel ?? t('onboarding.continue');
  // Chevron character must flip manually — forceRTL doesn't affect Unicode glyphs
  const chevron = isRTL ? '›' : '‹';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backChevron}>{chevron}</Text>
        </TouchableOpacity>

        <View style={styles.stepInfo}>
          <Text style={styles.flowLabel}>{flowLabel}</Text>
          <Text style={styles.stepCount}>
            {step + 1} / {total + 1}
          </Text>
        </View>

        {/* Right slot — mirrors back button width to keep step counter centred */}
        <View style={styles.headerRight}>
          {headerRight ?? null}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Content — paddingBottom leaves room for the absolute footer */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* Next button — absolutely pinned to bottom so it never scrolls away */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={onNext}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>{displayLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: T.bg },
  topBar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:         { width: 36, height: 36, justifyContent: 'center' },
  backChevron:     { color: T.accent, fontSize: 28, lineHeight: 32 },
  stepInfo:        { flex: 1, alignItems: 'center' },
  flowLabel:       { color: T.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  stepCount:       { color: T.text, fontSize: 13, fontWeight: '600' },
  headerRight:     { minWidth: 36, alignItems: 'flex-end', justifyContent: 'center' },
  barTrack:        { height: 3, backgroundColor: T.cardBorder, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  barFill:         { height: '100%', backgroundColor: T.accent, borderRadius: 2 },
  content:         { padding: 24, paddingTop: 28, paddingBottom: 110 },
  footer:          {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: T.bg,
    padding: 20, paddingBottom: 32,
  },
  nextBtn:         { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
