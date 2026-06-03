import { useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView, SafeAreaView, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { PASTEL_MODE } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';

type Nav   = StackNavigationProp<RootStackParamList, 'ChildJoin'>;
type Route = RouteProp<RootStackParamList, 'ChildJoin'>;

// Locked decision (color-consolidation): ChildJoin goes LIGHT for everyone — at
// join time the kid's age is unknown, so we default to the Pastel home base.
const BG         = PASTEL_MODE.canvas;     // #F4F0FA
const CARD_BG    = PASTEL_MODE.card;       // #FFFFFF
const BORDER     = PASTEL_MODE.cardBorder; // #E2DAF2
const ACCENT     = PASTEL_MODE.accent;     // #7C3AED
const TEXT_LIGHT = PASTEL_MODE.text;       // #1a1636 (body text on light)
const TEXT_MUTED = PASTEL_MODE.textMuted;  // #6B5B8A

export default function ChildJoinScreen() {
  const { t }              = useTranslation();
  const { signUp, signIn } = useAuth();
  const navigation         = useNavigation<Nav>();
  const { params }         = useRoute<Route>();

  // Pre-fill from buff://join/:code deep link. React Navigation makes params
  // available synchronously at mount when arriving via a deep link, so a
  // useState initializer is enough — no useEffect race.
  const initialCode = params?.code ? params.code.toUpperCase().slice(0, 6) : '';

  const [name, setName]             = useState('');
  const [familyCode, setFamilyCode] = useState(initialCode);
  const [loading, setLoading]       = useState(false);

  const handleJoin = async () => {
    if (!name.trim()) {
      Alert.alert(t('auth.fillAllFields'));
      return;
    }
    if (!familyCode || familyCode.length < 6) {
      Alert.alert(t('auth.invalidCode'));
      return;
    }

    // Derive an ASCII-safe, deterministic login username. Names with non-ASCII
    // characters (e.g. Hebrew "ליה") would otherwise produce an invalid email
    // local-part and Supabase rejects them ("invalid format"). ASCII-only names
    // are byte-identical to the legacy derivation, so existing logins are stable;
    // names that strip to <2 chars fall back to a hex encoding of the raw string,
    // which stays unique per distinct name so cross-device sign-in still works.
    const rawUsername  = name.trim().toLowerCase().replace(/\s+/g, '_');
    const asciiUsername = rawUsername.replace(/[^a-z0-9_]/g, '');
    const username     = asciiUsername.length >= 2
      ? asciiUsername
      : 'c' + Array.from(rawUsername).map(ch => ch.charCodeAt(0).toString(16)).join('');
    const email        = `${username}@buff.app`;
    const code         = familyCode.trim().toUpperCase();
    const autoPassword = `${username}_${code}_buff2026`;

    setLoading(true);

    const { error } = await signUp(email, autoPassword, name.trim(), 'child', code);

    if (!error) {
      // New child — persist the auto-password so future sign-ins can derive it
      await AsyncStorage.setItem(`child_auth_${username}`, autoPassword);
      setLoading(false);
      return; // RootNavigator detects the session and routes to ChildApp
    }

    const msg = error.message.toLowerCase();

    if (msg.includes('auth.orphanambiguous')) {
      // Preflight blocked: orphan match was ambiguous (2+ candidates) or
      // cross-script (e.g. parent created "דני", child typed "Dani").
      // Parent must confirm the name before the child can join.
      Alert.alert(t('auth.orphanAmbiguous'));
    } else if (msg.includes('already registered') || msg.includes('already exists')) {
      // Returning child — attempt silent sign-in with the same deterministic password
      const { error: signInError } = await signIn(email, autoPassword);
      if (!signInError) {
        setLoading(false);
        return; // Signed in — RootNavigator takes over
      }
      // Password mismatch (different device with different username+code combo)
      Alert.alert(t('auth.usernameTaken'));
    } else if (error.message.includes('לא נמצא') || msg.includes('not found')) {
      Alert.alert(t('auth.codeNotFound'));
    } else {
      Alert.alert(t('auth.signupFailed'), error.message);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back link */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.navigate('RoleSelection')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backText}>{t('auth.back')}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap as object}>
            <Image
              source={require('../../../assets/BUFF_LOGO_LAVENDER.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoWordmark}>BUFF</Text>
          </View>

          <Text style={styles.helpText}>{t('auth.childJoinHelp')}</Text>

          {/* Field 1 — Display name */}
          <TextInput
            style={styles.input}
            placeholder={t('auth.childNamePlaceholder')}
            placeholderTextColor={TEXT_MUTED}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />

          {/* Field 2 — Family code (prominent) */}
          <Text style={styles.familyCodeLabel}>{t('auth.familyCodeLabel')}</Text>
          <TextInput
            style={styles.familyCodeInput}
            placeholder="ABC123"
            placeholderTextColor={TEXT_MUTED}
            value={familyCode}
            onChangeText={(v) => setFamilyCode(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('auth.joinFamily')}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  backBtn: {
    paddingHorizontal: 20,
    paddingVertical:   12,
    alignSelf:         'flex-start',
  },
  backText: { color: TEXT_MUTED, fontSize: 14 },

  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: 28,
    paddingBottom:     48,
  },

  logoWrap: {
    alignItems:   'center',
    marginBottom: 20,
    direction:    'ltr',
  },
  logoImage:    { width: 64, height: 64 },
  logoWordmark: { color: ACCENT, fontSize: 22, fontWeight: '900', letterSpacing: 7, marginTop: 8 },

  helpText: {
    color:        TEXT_MUTED,
    fontSize:     15,
    textAlign:    'center',
    marginBottom: 28,
    lineHeight:   22,
  },

  input: {
    backgroundColor:   CARD_BG,
    color:             TEXT_LIGHT,
    borderRadius:      12,
    paddingHorizontal: 16,
    paddingVertical:   15,
    marginBottom:      14,
    borderWidth:       1,
    borderColor:       BORDER,
    fontSize:          16,
  },

  familyCodeLabel: {
    color:        ACCENT,
    fontSize:     14,
    fontWeight:   '700',
    textAlign:    'center',
    marginBottom: 10,
    marginTop:    8,
  },
  familyCodeInput: {
    backgroundColor:   CARD_BG,
    color:             TEXT_LIGHT,
    borderRadius:      14,
    borderWidth:       2,
    borderColor:       ACCENT,
    paddingVertical:   22,
    paddingHorizontal: 20,
    marginBottom:      28,
    fontSize:          28,
    fontWeight:        '800',
    textAlign:         'center',
    letterSpacing:     6,
  },

  btn:         { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 17, fontWeight: '800' },
});
