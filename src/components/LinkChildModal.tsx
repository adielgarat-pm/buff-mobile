/**
 * LinkChildModal
 *
 * Shown to the parent when a child joined via family code but hasn't been
 * linked to a parent-created profile yet.
 *
 * Parent picks: "This is [existing child name]" → we link the accounts.
 */
import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';
import type { UnlinkedChild, LinkableProfile } from '../hooks/useUnlinkedChildren';

interface Props {
  unlinkedChild: UnlinkedChild | null;
  linkable: LinkableProfile[];
  onLink: (unlinked: UnlinkedChild, targetId: string) => Promise<{ error: string | null }>;
  onDismiss: () => void;
}

export default function LinkChildModal({ unlinkedChild, linkable, onLink, onDismiss }: Props) {
  const { t } = useTranslation();
  const [linking, setLinking] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  if (!unlinkedChild) return null;

  const handleLink = async (targetId: string) => {
    setLinking(true);
    setError(null);
    const { error: err } = await onLink(unlinkedChild, targetId);
    setLinking(false);
    if (err) {
      setError(err);
    } else {
      onDismiss();
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
        <View style={[styles.sheet, { backgroundColor: T.card }]}>

          <Text style={[styles.title, { color: T.text }]}>
            {t('linkChild.title')}
          </Text>
          <Text style={[styles.sub, { color: T.textMuted }]}>
            <Text style={{ fontWeight: '700', color: T.text }}>{unlinkedChild.displayName}</Text>
            {' '}{t('linkChild.subSuffix')}
          </Text>

          {linkable.length > 0 ? (
            <>
              {linkable.map(profile => (
                <TouchableOpacity
                  key={profile.id}
                  style={[styles.option, { borderColor: T.accent, backgroundColor: '#EDE9FE' }]}
                  onPress={() => handleLink(profile.id)}
                  disabled={linking}
                >
                  <Text style={[styles.optionText, { color: T.accent }]}>
                    {t('linkChild.thisIs', { name: profile.displayName })}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.option, { borderColor: T.cardBorder }]}
                onPress={onDismiss}
                disabled={linking}
              >
                <Text style={[styles.optionText, { color: T.textMuted }]}>
                  {t('linkChild.newChildSeparate')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.hint, { color: T.textMuted }]}>
                {t('linkChild.noChildrenHint')}
              </Text>
              <TouchableOpacity
                style={[styles.option, { borderColor: T.cardBorder }]}
                onPress={onDismiss}
              >
                <Text style={[styles.optionText, { color: T.textMuted }]}>{t('common.close')}</Text>
              </TouchableOpacity>
            </>
          )}

          {linking && <ActivityIndicator color={T.accent} style={{ marginTop: 12 }} />}
          {error   && <Text style={styles.error}>{error}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title:       { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub:         { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  hint:        { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  option:      { borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  optionText:  { fontSize: 16, fontWeight: '700' },
  error:       { color: '#EF4444', fontSize: 13, marginTop: 8, textAlign: 'center' },
});
