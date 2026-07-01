import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { crossAlert } from '../../platform';
import LanguagePicker from '../../components/LanguagePicker';
import AppleSignInButton from '../../components/AppleSignInButton';
import { PASTEL_MODE as T } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';
import { webAuthColumn } from './authLayout';

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, signInWithGoogle } = useAuth();
  const navigation = useNavigation<Nav>();

  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password state
  const [resetVisible,  setResetVisible]  = useState(false);
  const [resetEmail,    setResetEmail]    = useState('');
  const [resetLoading,  setResetLoading]  = useState(false);
  const [resetSent,     setResetSent]     = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      crossAlert(t('auth.fillAllFields'));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) crossAlert(t('auth.invalidCredentials'));
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) crossAlert('Google sign-in failed', error.message);
  };

  const handleSendReset = async () => {
    if (!resetEmail) {
      crossAlert(t('auth.fillAllFields'));
      return;
    }
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail);
    setResetLoading(false);
    setResetSent(true);
  };

  const closeReset = () => {
    setResetVisible(false);
    setResetSent(false);
    setResetEmail('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LanguagePicker />

      <View style={[styles.inner, webAuthColumn(400)]}>
        {/* Logo / Title */}
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>BUFF</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor={T.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Password */}
        <TextInput
          style={[styles.input, { marginBottom: 8 }]}
          placeholder={t('auth.password')}
          placeholderTextColor={T.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Forgot password link */}
        <TouchableOpacity
          onPress={() => setResetVisible(true)}
          style={styles.forgotRow}
        >
          <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>

        {/* Sign In button */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={[styles.primaryBtn, { opacity: loading ? 0.7 : 1 }]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>{t('auth.login')}</Text>}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign in with Apple — iOS only (Guideline 4.8) */}
        <AppleSignInButton mode="signin" />

        {/* Google sign-in */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          style={[styles.googleBtn, { opacity: googleLoading ? 0.7 : 1 }]}
        >
          {googleLoading
            ? <ActivityIndicator color={T.accent} />
            : <Text style={styles.googleBtnText}>{t('auth.continueWithGoogle')}</Text>}
        </TouchableOpacity>

        <Text style={styles.googleHint}>{t('auth.googleRoleSelection')}</Text>

        {/* Sign up link — fully translated */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          style={styles.signupRow}
        >
          <Text style={styles.signupText}>
            {t('auth.noAccount')}{' '}
            <Text style={styles.signupLink}>{t('auth.signup')}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Forgot Password Modal ─────────────────────────────────────── */}
      <Modal
        visible={resetVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReset}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeReset}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('auth.resetPasswordTitle')}</Text>

            {resetSent ? (
              <Text style={styles.modalSuccess}>{t('auth.checkEmail')}</Text>
            ) : (
              <>
                <Text style={styles.modalPrompt}>{t('auth.resetPasswordPrompt')}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={t('auth.email')}
                  placeholderTextColor={T.textMuted}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={handleSendReset}
                  disabled={resetLoading}
                  style={[styles.primaryBtn, { opacity: resetLoading ? 0.7 : 1 }]}
                >
                  {resetLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>{t('auth.sendResetLink')}</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={closeReset} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: T.canvas },
  inner:          { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  logoBlock:      { alignItems: 'center', marginBottom: 40 },
  logo:           { color: T.accent, fontSize: 40, fontWeight: 'bold', marginBottom: 8, marginTop: 20 },
  tagline:        { color: T.text, fontSize: 14, textAlign: 'center' },

  input:          { backgroundColor: T.card, color: T.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: T.cardBorder },

  forgotRow:      { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText:     { color: T.accent, fontSize: 13 },

  primaryBtn:     { backgroundColor: T.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  divider:        { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: T.cardBorder },
  dividerText:    { color: T.textMuted, marginHorizontal: 12, fontSize: 13 },

  googleBtn:      { backgroundColor: T.card, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder, marginBottom: 12 },
  googleBtnText:  { color: T.accent, fontSize: 16, fontWeight: '600' },
  googleHint:     { color: T.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 24 },

  signupRow:      { alignItems: 'center' },
  signupText:     { color: T.textMuted, fontSize: 14 },
  signupLink:     { color: T.accent, fontWeight: '600' },

  // Modal
  modalBackdrop:  { flex: 1, backgroundColor: 'rgba(26,22,54,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard:      { backgroundColor: T.card, borderRadius: 20, padding: 28, width: 320, borderWidth: 1, borderColor: T.cardBorder },
  modalTitle:     { color: T.text, fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalPrompt:    { color: T.textMuted, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  modalInput:     { backgroundColor: T.canvas, color: T.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: T.cardBorder },
  modalSuccess:   { color: '#0E9F6E', fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  modalClose:     { position: 'absolute', top: 14, right: 16 },
  modalCloseText: { color: T.textMuted, fontSize: 20 },
});
