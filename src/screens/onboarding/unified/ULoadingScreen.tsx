/**
 * ULoadingScreen — "Building [name]'s plan..."
 * Auto-advances after 2.5 seconds with an animated purple progress bar.
 */
import { useEffect, useRef } from 'react';
import { View, Text, Animated, SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { PARENT_THEME as T } from '../../../theme';

type Nav   = StackNavigationProp<RootStackParamList, 'ULoadingScreen'>;
type Route = RouteProp<RootStackParamList, 'ULoadingScreen'>;

const DURATION = 2500; // ms

export default function ULoadingScreen() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { t }       = useTranslation();

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate bar to 100%
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      useNativeDriver: false,
    }).start();

    // Navigate after animation completes
    const timer = setTimeout(() => {
      navigation.navigate('UStep5_Preview', params);
    }, DURATION);

    return () => clearTimeout(timer);
  }, [navigation, params, progress]);

  const barWidth = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.brain}>🧠</Text>
        <Text style={styles.title}>
          {t('onboarding.loading.title', { name: params.childName })}
        </Text>
        <Text style={styles.sub}>
          {t('onboarding.loading.sub', { name: params.childName })}
        </Text>

        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: T.bg },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  brain:    { fontSize: 64, marginBottom: 28 },
  title:    { color: T.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  sub:      { color: T.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 36, lineHeight: 22 },
  barTrack: { width: '100%', height: 8, backgroundColor: T.cardBorder, borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: '100%', backgroundColor: T.accent, borderRadius: 4 },
});
