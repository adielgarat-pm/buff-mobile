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
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguagePicker from '../../components/LanguagePicker';
import AppleSignInButton from '../../components/AppleSignInButton';
import { PASTEL_MODE as T } from '../../theme/modes';
import type { RootStackParamList } from '../../navigation/types';

type Nav   = StackNavigationProp<RootStackParamList, 'Signup'>;
type Route = RouteProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const { t } = useTranslation();
  const { signUp, signInWithGoogle } = useAuth();
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();

  const initialRole = route.params?.initialRole ?? 'parent';
  const roleLocked  = !!route.params?.initialRole;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [familyCode, setFamilyCode]   = useState('');
  const [role, setRole]               = useState<'parent' | 'child'>(initialRole);
  const [marketing, setMarketing]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = async () => {
    if (role === 'child') {
      if (!displayName || !username || !password) {
        Alert.alert(t('auth.fillAllFields'));
        return;
      }
      if (!familyCode) {
        Alert.alert(t('auth.enterFamilyCode'));
        return;
      }
    } else {
      if (!displayName || !email || !password) {
        Alert.alert(t('auth.fillAllFields'));
        return;
      }
    }
    if (password.length < 6) {
      Alert.alert(t('auth.passwordMinLength'));
      return;
    }

    const effectiveEmail = role === 'child' ? `${username.trim().toLowerCase()}@buff.app` : email;
    setLoading(true);
    const { error } = await signUp(effectiveEmail, password, displayName, role, familyCode || undefined, marketing);
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      const isDuplicate = msg.includes('already registered') || msg.includes('already exists');
      if (isDuplicate && role === 'child') {
        Alert.alert(t('auth.usernameTaken'));
      } else {
        Alert.alert(t('auth.error.signupFailedTitle'));
      }
    }
    // On success, auth state change triggers navigation automatically via RootNavigator
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) Alert.alert('Google sign-up failed', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LanguagePicker />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.logo}>BUFF</Text>
        <Text style={styles.subtitle}>{t('auth.createAccount')}</Text>

        {/* Role toggle — hidden when role is pre-selected from RoleSelectionScreen */}
        {!roleLocked && (
          <>
            <Text style={styles.label}>{t('auth.iAm')}</Text>
            <View style={styles.roleRow}>
              {(['parent', 'child'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                >
                  <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                    {r === 'parent' ? t('auth.parent') : t('auth.teen')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder={t('auth.displayName')}
          placeholderTextColor={T.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
        />
        {role === 'child' ? (
          <TextInput
            style={styles.input}
            placeholder={t('auth.username')}
            placeholderTextColor={T.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
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
        )}
        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          placeholderTextColor={T.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Family code (only for children) — prominent */}
        {role === 'child' && (
          <>
            <Text style={styles.familyCodeLabel}>{t('auth.familyCodeLabel')}</Text>
            <TextInput
              style={styles.familyCodeInput}
              placeholder={t('auth.familyCodePlaceholder')}
              placeholderTextColor={T.textMuted}
              value={familyCode}
              onChangeText={(v) => setFamilyCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
          </>
        )}

        {/* Marketing consent */}
        <TouchableOpacity style={styles.checkRow} onPress={() => setMarketing(!marketing)}>
          <View style={[styles.checkbox, marketing && styles.checkboxChecked]}>
            {marketing && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>{t('auth.marketingConsent')}</Text>
        </TouchableOpacity>

        {/* Sign up button */}
        <TouchableOpacity
          style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{t('auth.createAccount')}</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign up with Apple — iOS only (Guideline 4.8) */}
        <AppleSignInButton mode="signup" />

        {/* Google */}
        <TouchableOpacity
          style={[styles.googleBtn, { opacity: googleLoading ? 0.7 : 1 }]}
          onPress={handleGoogleSignUp}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color={T.accent} />
          ) : (
            <Text style={styles.googleBtnText}>{t('auth.signupWithGoogle')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.googleNote}>{t('auth.googleRoleSelection')}</Text>

        {/* Back to login */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 24 }}>
          <Text style={styles.loginLink}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Text style={{ color: T.accent, fontWeight: '600' }}>{t('auth.login')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:            { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logo:              { color: T.accent, fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle:          { color: T.text, fontSize: 14, textAlign: 'center', marginBottom: 28 },
  label:             { color: T.textMuted, fontSize: 13, marginBottom: 8 },
  roleRow:           { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn:           { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: T.cardBorder, alignItems: 'center', backgroundColor: T.card },
  roleBtnActive:     { backgroundColor: T.accent, borderColor: T.accent },
  roleBtnText:       { color: T.textMuted, fontWeight: '600' },
  roleBtnTextActive: { color: '#fff' },
  input:             { backgroundColor: T.card, color: T.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: T.cardBorder },
  hint:              { color: T.textMuted, fontSize: 12, marginBottom: 12 },
  familyCodeLabel:   { color: T.accent, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 8 },
  familyCodeInput:   { backgroundColor: T.card, color: T.text, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 12, borderWidth: 2, borderColor: T.accent, fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 6 },
  checkRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 10 },
  checkbox:          { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: T.cardBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: T.card },
  checkboxChecked:   { backgroundColor: T.accent, borderColor: T.accent },
  checkLabel:        { flex: 1, color: T.textMuted, fontSize: 13 },
  btn:               { backgroundColor: T.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText:           { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider:           { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine:       { flex: 1, height: 1, backgroundColor: T.cardBorder },
  dividerText:       { color: T.textMuted, marginHorizontal: 12, fontSize: 13 },
  googleBtn:         { backgroundColor: T.card, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder, marginBottom: 8 },
  googleBtnText:     { color: T.accent, fontSize: 16, fontWeight: '600' },
  googleNote:        { color: T.textMuted, fontSize: 12, textAlign: 'center' },
  loginLink:         { color: T.textMuted, textAlign: 'center', fontSize: 14 },
});
