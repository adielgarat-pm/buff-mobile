import { useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Animated, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { PASTEL_MODE } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';
import LanguagePicker from '../../components/LanguagePicker';
import { webAuthColumn } from './authLayout';
// Web-only native-install CTA. Metro resolves the native stub (renders null) on
// Android/iOS, so this import is inert in the native bundle. RoleSelection is
// pre-auth / role-choice — no child or View-as-Child session reaches it.
import GetTheAppCta from '../../components/install/GetTheAppCta';

type Nav = StackNavigationProp<RootStackParamList, 'RoleSelection'>;

const BG         = PASTEL_MODE.canvas;     // #F4F0FA — brand Pastel canvas
const ACCENT     = PASTEL_MODE.accent;     // #7C3AED
const TEXT_DARK  = PASTEL_MODE.text;       // #1a1636
const TEXT_MUTED = PASTEL_MODE.textMuted;  // #6B5B8A

export default function RoleSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { t }      = useTranslation();
  const compact    = useWindowDimensions().height < 640;
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
      <LanguagePicker />

      {/* Scrollable (was a plain View): on short phones the centred column
          overflowed and, natively, clipped the "Already have an account? Log
          in" button with no way to reach it. Compact spacing below 640px
          keeps it on screen at 360×560 (UX review 2026-09-24). */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <Animated.View style={[styles.inner, compact && styles.innerCompact, webAuthColumn(440), { opacity: fadeAnim }]}>

        {/* Native-install strip (web-only; null on native + non-Android) — slim
            and subordinate, above the logo so it never competes with the choice */}
        <GetTheAppCta placement="entry" />

        {/* Logo */}
        <View style={[styles.logoWrap, compact && styles.logoWrapCompact] as object}>
          <Image
            source={require('../../../assets/BUFF_LOGO_LAVENDER.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoWordmark}>BUFF</Text>
        </View>

        <Text style={styles.headline}>{t('roleSelection.headline')}</Text>

        {/* Parent card — new-parent path goes to Signup with the role
            preselected. Returning parents use the "Already have an account?"
            footer link below, which still routes to Login. */}
        <TouchableOpacity
          style={[styles.card, compact && styles.cardCompact]}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Signup', { initialRole: 'parent' })}
        >
          <Text style={[styles.cardEmoji, compact && styles.cardEmojiCompact]}>⚡</Text>
          <Text style={styles.cardTitle}>{t('auth.iAmParent')}</Text>
          <Text style={styles.cardSub}>{t('auth.parentSub')}</Text>
        </TouchableOpacity>

        {/* Child card */}
        <TouchableOpacity
          style={[styles.card, compact && styles.cardCompact]}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('ChildJoin')}
        >
          <Text style={[styles.cardEmoji, compact && styles.cardEmojiCompact]}>🎯</Text>
          <Text style={styles.cardTitle}>{t('auth.iAmChild')}</Text>
          <Text style={styles.cardSub}>{t('auth.childSub')}</Text>
        </TouchableOpacity>

        {/* Returning-user login entry. This is the ONLY path back into an
            existing account from the web entry screen: both role cards above lead
            forward into new setup (parent → Signup, child → ChildJoin), so a
            returning user who cannot find this control is funneled into
            onboarding with no way back in (bug 2026-09-23). It was previously a
            faint text link that returning users missed; promoted to a full-width
            outlined button so it reads as a first-class choice without competing
            with the primary "new here" cards. Both platforms. */}
        <TouchableOpacity
          testID="rolesel-login"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginBtn}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Text style={styles.loginBtnText}>{t('roleSelection.alreadyHaveAccount')}</Text>
        </TouchableOpacity>

      </Animated.View>
      </ScrollView>
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

  // Short screens (< 640px tall, e.g. 360×560): same content, tighter rhythm.
  innerCompact:     { paddingVertical: 16 },
  logoWrapCompact:  { marginBottom: 16 },
  cardCompact:      { padding: 16 },
  cardEmojiCompact: { fontSize: 40, marginBottom: 6 },

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

  // Returning-user login button — prominent, full-width, outlined so it is
  // unmistakable but visually subordinate to the filled primary cards.
  loginBtn: {
    width:            '100%',
    marginTop:        8,
    paddingVertical:  16,
    borderRadius:     16,
    borderWidth:      1.5,
    borderColor:      ACCENT,
    backgroundColor:  'transparent',
    alignItems:       'center',
  },
  loginBtnText: { color: ACCENT, fontSize: 16, fontWeight: '800', textAlign: 'center' },
});
