/**
 * UStep2_Goal — auto-advances on tap (no Continue button).
 * Uses a custom header to replicate OnboardingShell's top bar + progress.
 */
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { useRTLStyles } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useStepReachedLog } from '../../../hooks/useStepReachedLog';
import { OPTIONS_BY_AGE } from './onboardingData';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep2_Goal'>;
type Route = RouteProp<RootStackParamList, 'UStep2_Goal'>;

const STEP = 1; const TOTAL = 6; // 0-indexed step, total meaningful steps

export default function UStep2_Goal() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t }       = useTranslation();
  const { isRTL }   = useRTLStyles();
  const { familyId } = useAuth();

  useStepReachedLog('2_goal', familyId);

  const options = OPTIONS_BY_AGE[params.ageGroup];
  const progress = (STEP + 1) / (TOTAL + 1);

  const select = (goalId: string) => {
    navigation.navigate('UStep3_Challenges', { ...params, mainChallenge: goalId });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* Top bar */}
      <View style={[styles.topBar, isRTL && styles.rowReverse]}>
        <TouchableOpacity
          testID="onb-back"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backChevron}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.flowLabel}>{t('onboarding.flowLabel')}</Text>
          <Text style={styles.stepCount}>{STEP + 1} / {TOTAL + 1}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* flex:1 keeps the ScrollView bounded so any future absolute footer stays
          pinned to the viewport on web (parity with UStep3/4/5) — hardening. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, isRTL && styles.textRight]}>
          {t('onboarding.step2.title', { name: params.childName })}
        </Text>
        <Text style={[styles.sub, isRTL && styles.textRight]}>{t('onboarding.step2.sub')}</Text>

        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            testID={`onb2-goal-${opt.id}`}
            style={[styles.card, isRTL && styles.rowReverse]}
            onPress={() => select(opt.id)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t(opt.labelKey)}
          >
            <Text style={styles.cardEmoji}>{opt.emoji}</Text>
            <Text style={[styles.cardLabel, isRTL && styles.textRight]}>{t(opt.labelKey)}</Text>
            <Text style={styles.cardArrow}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: T.bg },
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backChevron:  { color: T.accent, fontSize: 28, lineHeight: 32, width: 36 },
  stepInfo:     { flex: 1, alignItems: 'center' },
  flowLabel:    { color: T.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  stepCount:    { color: T.text, fontSize: 13, fontWeight: '600' },
  barTrack:     { height: 3, backgroundColor: T.cardBorder, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  barFill:      { height: '100%', backgroundColor: T.accent, borderRadius: 2 },
  content:      { padding: 24, paddingTop: 28, paddingBottom: 40 },
  heading:      { color: T.text, fontSize: 24, fontWeight: '700', marginBottom: 6 },
  sub:          { color: T.textMuted, fontSize: 15, marginBottom: 24, lineHeight: 22 },
  card:         { backgroundColor: T.card, borderRadius: 14, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder },
  cardEmoji:    { fontSize: 26, marginRight: 14, width: 34 },
  cardLabel:    { flex: 1, color: T.text, fontSize: 16, fontWeight: '600' },
  cardArrow:    { color: T.textMuted, fontSize: 20 },
  rowReverse:   { flexDirection: 'row-reverse' },
  textRight:    { textAlign: 'right' },
});
