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
        Alert.alert('Sign up failed', error.message);
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
      style={{ flex: 1, backgroundColor: '#0F0F1A' }}
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
          placeholderTextColor="#6B7280"
          value={displayName}
          onChangeText={setDisplayName}
        />
        {role === 'child' ? (
          <TextInput
            style={styles.input}
            placeholder={t('auth.username')}
            placeholderTextColor="#6B7280"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
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
        )}
        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          placeholderTextColor="#6B7280"
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
              placeholderTextColor="#6B7280"
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

        {/* Google */}
        <TouchableOpacity
          style={[styles.googleBtn, { opacity: googleLoading ? 0.7 : 1 }]}
          onPress={handleGoogleSignUp}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#A78BFA" />
          ) : (
            <Text style={styles.googleBtnText}>{t('auth.signupWithGoogle')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.googleNote}>{t('auth.googleRoleSelection')}</Text>

        {/* Back to login */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 24 }}>
          <Text style={styles.loginLink}>
            Already have an account?{' '}
            <Text style={{ color: '#A78BFA' }}>{t('auth.login')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:            { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logo:              { color: '#A78BFA', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle:          { color: '#6D28D9', fontSize: 14, textAlign: 'center', marginBottom: 28 },
  label:             { color: '#9CA3AF', fontSize: 13, marginBottom: 8 },
  roleRow:           { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn:           { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
  roleBtnActive:     { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  roleBtnText:       { color: '#6B7280', fontWeight: '600' },
  roleBtnTextActive: { color: '#fff' },
  input:             { backgroundColor: '#1A1A2E', color: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  hint:              { color: '#6B7280', fontSize: 12, marginBottom: 12 },
  familyCodeLabel:   { color: '#A78BFA', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 8 },
  familyCodeInput:   { backgroundColor: '#1A1A2E', color: '#E5E7EB', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 12, borderWidth: 2, borderColor: '#7C3AED', fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 6 },
  checkRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 10 },
  checkbox:          { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:   { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  checkLabel:        { flex: 1, color: '#9CA3AF', fontSize: 13 },
  btn:               { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText:           { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider:           { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine:       { flex: 1, height: 1, backgroundColor: '#374151' },
  dividerText:       { color: '#6B7280', marginHorizontal: 12, fontSize: 13 },
  googleBtn:         { backgroundColor: '#1A1A2E', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#374151', marginBottom: 8 },
  googleBtnText:     { color: '#A78BFA', fontSize: 16, fontWeight: '600' },
  googleNote:        { color: '#6B7280', fontSize: 12, textAlign: 'center' },
  loginLink:         { color: '#6B7280', textAlign: 'center', fontSize: 14 },
});
