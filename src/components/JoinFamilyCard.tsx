/**
 * JoinFamilyCard — parent-facing "join an existing family" control.
 *
 * Rendered in ParentSettingsScreen. Lets a logged-in parent enter another
 * family's 6-char code and be moved into that family as a full equal parent
 * (role preserved) via the switch_user_family RPC. The RPC also cleans up the
 * caller's now-empty old family. This is how a second parent (a partner) joins.
 *
 * Source SPEC: docs/sessions/co-parent-join/SPEC.md (Phase 2)
 */
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert } from '../platform';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { PARENT_THEME as T } from '../theme';

// Map an RPC reason code to the user-facing i18n error key.
const REASON_TO_KEY: Record<string, string> = {
  invalid_input:  'joinFamily.errInvalidCode',
  code_not_found: 'joinFamily.errCodeNotFound',
  already_member: 'joinFamily.errAlreadyMember',
};

export default function JoinFamilyCard() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();

  const [code, setCode]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);

    const trimmed = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(trimmed)) {
      setError(t('joinFamily.errInvalidCode'));
      return;
    }

    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('switch_user_family', {
        p_new_family_code: trimmed,
      });

      const result = data as { success: boolean; reason?: string; new_family_id?: string } | null;

      if (rpcError || !result?.success) {
        setError(t(REASON_TO_KEY[result?.reason ?? ''] ?? 'joinFamily.errGeneric'));
        return;
      }

      // Re-resolve the profile so every family-scoped hook re-keys to the new
      // family_id and the parent app shows the joined family's data.
      if (user?.id) await refreshProfile(user.id);
      setCode('');
      crossAlert(t('joinFamily.success'));
    } catch {
      setError(t('joinFamily.errGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <View style={styles.headerRow}>
        <Ionicons name="people-outline" size={24} color={T.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.title, { color: T.text }]}>{t('joinFamily.title')}</Text>
          <Text style={[styles.subtitle, { color: T.textMuted }]}>{t('joinFamily.subtitle')}</Text>
        </View>
      </View>

      <Text style={[styles.label, { color: T.accent }]}>{t('joinFamily.codeLabel')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: T.bg, color: T.text, borderColor: T.accent }]}
        value={code}
        onChangeText={(v) => { setCode(v.toUpperCase().slice(0, 6)); setError(null); }}
        placeholder={t('joinFamily.placeholder')}
        placeholderTextColor={T.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        editable={!busy}
        // Codes are always LTR alphanumerics, even in Hebrew UI.
        textAlign="center"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: T.accent }, (busy || code.length !== 6) && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={busy || code.length !== 6}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{t('joinFamily.join')}</Text>}
      </TouchableOpacity>

      <Text style={[styles.hint, { color: T.textMuted }]}>{t('joinFamily.hint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:      { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title:     { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  subtitle:  { fontSize: 13, lineHeight: 18 },
  label:     { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 12,
  },
  error:     { color: '#EF4444', fontSize: 13, marginBottom: 12 },
  button:        { borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonDisabled:{ opacity: 0.5 },
  buttonText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint:      { fontSize: 12, marginTop: 12, textAlign: 'center', lineHeight: 16 },
});
