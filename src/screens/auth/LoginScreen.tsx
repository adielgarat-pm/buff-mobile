import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import LanguagePicker from '../../components/LanguagePicker';
import type { RootStackParamList } from '../../navigation/types';

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
      Alert.alert(t('auth.fillAllFields'));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert(t('auth.invalidCredentials'));
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) Alert.alert('Google sign-in failed', error.message);
  };

  const handleSendReset = async () => {
    if (!resetEmail) {
      Alert.alert(t('auth.fillAllFields'));
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

      <View style={styles.inner}>
        {/* Logo / Title */}
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>BUFF</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor="#6B7280"
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
          placeholderTextColor="#6B7280"
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

        {/* Google sign-in */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          style={[styles.googleBtn, { opacity: googleLoading ? 0.7 : 1 }]}
        >
          {googleLoading
            ? <ActivityIndicator color="#A78BFA" />
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
                  placeholderTextColor="#6B7280"
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
  root:           { flex: 1, backgroundColor: '#0F0F1A' },
  inner:          { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  logoBlock:      { alignItems: 'center', marginBottom: 40 },
  logo:           { color: '#A78BFA', fontSize: 40, fontWeight: 'bold', marginBottom: 8, marginTop: 20 },
  tagline:        { color: '#6D28D9', fontSize: 14, textAlign: 'center' },

  input:          { backgroundColor: '#1A1A2E', color: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },

  forgotRow:      { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText:     { color: '#A78BFA', fontSize: 13 },

  primaryBtn:     { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  divider:        { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: '#374151' },
  dividerText:    { color: '#6B7280', marginHorizontal: 12, fontSize: 13 },

  googleBtn:      { backgroundColor: '#1A1A2E', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#374151', marginBottom: 12 },
  googleBtnText:  { color: '#A78BFA', fontSize: 16, fontWeight: '600' },
  googleHint:     { color: '#6B7280', fontSize: 12, textAlign: 'center', marginBottom: 24 },

  signupRow:      { alignItems: 'center' },
  signupText:     { color: '#6B7280', fontSize: 14 },
  signupLink:     { color: '#A78BFA' },

  // Modal
  modalBackdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard:      { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 28, width: 320, borderWidth: 1, borderColor: '#374151' },
  modalTitle:     { color: '#E5E7EB', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalPrompt:    { color: '#9CA3AF', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  modalInput:     { backgroundColor: '#0F0F1A', color: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  modalSuccess:   { color: '#34D399', fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  modalClose:     { position: 'absolute', top: 14, right: 16 },
  modalCloseText: { color: '#6B7280', fontSize: 20 },
});
