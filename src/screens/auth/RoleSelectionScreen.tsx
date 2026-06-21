import { useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { PASTEL_MODE } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'RoleSelection'>;

const BG         = PASTEL_MODE.canvas;     // #F4F0FA — brand Pastel canvas
const ACCENT     = PASTEL_MODE.accent;     // #7C3AED
const TEXT_DARK  = PASTEL_MODE.text;       // #1a1636
const TEXT_MUTED = PASTEL_MODE.textMuted;  // #6B5B8A

export default function RoleSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { t }      = useTranslation();
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

        {/* Logo */}
        <View style={styles.logoWrap as object}>
          <Image
            source={require('../../../assets/BUFF_LOGO_LAVENDER.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoWordmark}>BUFF</Text>
        </View>

        <Text style={styles.headline}>{t('roleSelection.headline')}</Text>

        {/* Parent card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.cardEmoji}>⚡</Text>
          <Text style={styles.cardTitle}>{t('auth.iAmParent')}</Text>
          <Text style={styles.cardSub}>{t('auth.parentSub')}</Text>
        </TouchableOpacity>

        {/* Child card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('ChildJoin')}
        >
          <Text style={styles.cardEmoji}>🎯</Text>
          <Text style={styles.cardTitle}>{t('auth.iAmChild')}</Text>
          <Text style={styles.cardSub}>{t('auth.childSub')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>{t('roleSelection.alreadyHaveAccount')}</Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: BG },
  inner: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 28,
    paddingVertical:   32,
  },

  logoWrap: {
    alignItems:   'center',
    marginBottom: 36,
    // Native-only: prevents the RTL pass from mirroring the logo. RN Web rejects
    // the `direction` style prop (logs a warning) and handles RTL via the DOM, so
    // we omit it on web.
    ...(Platform.OS === 'web' ? null : { direction: 'ltr' as const }),
  },
  logoImage:    { width: 72, height: 72 },
  logoWordmark: { color: ACCENT, fontSize: 26, fontWeight: '900', letterSpacing: 8, marginTop: 8 },

  headline: {
    color:        TEXT_DARK,
    fontSize:     22,
    fontWeight:   '900',
    textAlign:    'center',
    marginBottom: 28,
  },

  card: {
    width:            '100%',
    backgroundColor:  PASTEL_MODE.card,
    borderRadius:     16,
    borderWidth:      1.5,
    borderColor:      PASTEL_MODE.cardBorder,
    padding:          24,
    alignItems:       'center',
    marginBottom:     16,
    shadowColor:      '#a78bfa',
    shadowOpacity:    0.12,
    shadowRadius:     10,
    shadowOffset:     { width: 0, height: 3 },
    elevation:        3,
  },
  cardEmoji: { fontSize: 64, marginBottom: 12 },
  cardTitle: { color: TEXT_DARK,  fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  cardSub:   { color: TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  loginLink:     { marginTop: 12 },
  loginLinkText: { color: ACCENT, fontSize: 14, fontWeight: '600' },
});
