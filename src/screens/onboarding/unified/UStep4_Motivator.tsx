/**
 * UStep4_Motivator — auto-advances on tap (no Continue button).
 */
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';
import { MOTIVATORS } from './onboardingData';

type Nav   = StackNavigationProp<RootStackParamList, 'UStep4_Motivator'>;
type Route = RouteProp<RootStackParamList, 'UStep4_Motivator'>;

const STEP = 3; const TOTAL = 6;

export default function UStep4_Motivator() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t }       = useTranslation();

  const progress = (STEP + 1) / (TOTAL + 1);

  const select = (motivatorId: string) => {
    navigation.navigate('ULoadingScreen', { ...params, motivator: motivatorId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backChevron}>‹</Text>
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>
          {t('onboarding.step4.title', { name: params.childName })}
        </Text>
        <Text style={styles.sub}>{t('onboarding.step4.sub')}</Text>

        {MOTIVATORS.map((mot) => (
          <TouchableOpacity
            key={mot.id}
            style={styles.card}
            onPress={() => select(mot.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.cardEmoji}>{mot.emoji}</Text>
            <Text style={styles.cardLabel}>{t(mot.labelKey)}</Text>
            <Text style={styles.cardArrow}>›</Text>
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
});
