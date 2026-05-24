/**
 * Child Settings — Gamer/Mint Mode (Menu)
 * Pet customisation, theme picker, sound, sign-out.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useTheme, useChildTheme, CHILD_THEMES, type ChildThemeName } from '../../contexts/ThemeContext';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useBuddyRelationship } from '../../hooks/useBuddyRelationship';
import { BuddyToggleModal } from '../../components/buddy/BuddyToggleModal';
import { BuddyNameModal } from '../../components/buddy/BuddyNameModal';
import { getBuddyDefaultName } from '../../components/buddy/buddyAssets';
import { MOCK_MY_CHILD, PET_STAGES } from '../../mock/data';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const PET_SKINS = ['🐶', '🐱', '🐰', '🐼', '🐉', '🦄', '🐯', '🦊', '🦈', '🦁', '🦫'];

const THEME_OPTIONS: { name: ChildThemeName; label: string; emoji: string; desc: string }[] = [
  { name: 'mint',  label: 'Mint',  emoji: '🌿', desc: 'Light & playful' },
  { name: 'gamer', label: 'Gamer', emoji: '🎮', desc: 'Dark neon energy' },
];

export default function ChildSettingsScreen() {
  const navigation  = useNavigation<Nav>();
  const { profile } = useAuth();
  const { isChildPreview, exitChildPreview, viewMode, previewChildId } = useMode();
  const T = useChildTheme();
  const { themeName, setTheme } = useTheme();
  const { rowDirection } = useRTLStyles();
  const { isSubscribed } = useSubscription();
  const { t } = useTranslation();
  const isChildViewer = viewMode === 'child';

  const childId = previewChildId ?? profile?.id ?? null;
  const { relationship, setBuddyVisible, setBuddyName, refetch: refetchBuddy } = useBuddyRelationship(childId);
  useFocusEffect(useCallback(() => { refetchBuddy(); }, [refetchBuddy]));

  const child = MOCK_MY_CHILD;
  const petCfg = PET_STAGES[child.petStage];
  const [hapticsOn, setHapticsOn]       = useState(true);
  const [selectedSkin, setSelectedSkin] = useState('🐉');
  const [toggleModalVisible, setToggleModalVisible] = useState(false);
  const [nameModalVisible,   setNameModalVisible]   = useState(false);

  const buddyVisible = relationship?.buddy_visible ?? true;
  const toggleMode: 'hide' | 'show' = buddyVisible ? 'hide' : 'show';
  const buddyDefaultName = getBuddyDefaultName(relationship?.current_skin_id ?? null) ?? 'Buddy';
  const buddyDisplayName = relationship?.buddy_name ?? buddyDefaultName;

  // Load persisted haptics preference on mount
  useEffect(() => {
    AsyncStorage.getItem('hapticsOn').then(v => {
      if (v !== null) setHapticsOn(v === 'true');
    });
  }, []);

  const handleHapticsToggle = (value: boolean) => {
    setHapticsOn(value);
    AsyncStorage.setItem('hapticsOn', String(value));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: T.background }}
      contentContainerStyle={styles.content}
    >
      {/* Parent preview exit banner */}
      {isChildPreview && (
        <TouchableOpacity
          style={[styles.exitBanner, { backgroundColor: T.accent }]}
          onPress={exitChildPreview}
        >
          <Text style={[styles.exitText, { color: T.primaryForeground }]}>← Exit Child Preview</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.pageTitle, { color: T.primary }]}>Menu</Text>

      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <Text style={styles.profileEmoji}>{selectedSkin}</Text>
        <View>
          <Text style={[styles.profileName,  { color: T.foreground }]}>
            {profile?.display_name ?? child.name}
          </Text>
          <Text style={[styles.profilePet,   { color: T.accent }]}>
            {child.petName} · {petCfg.label}
          </Text>
          <Text style={[styles.profileBuffs, { color: T.buff }]}>
            {child.buffs.toLocaleString()} Buffs ⚡
          </Text>
        </View>
      </View>

      {/* ── Theme picker ───────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>Theme</Text>
      <View style={[styles.themeRow]}>
        {THEME_OPTIONS.map((opt) => {
          const preview = CHILD_THEMES[opt.name];
          const active  = themeName === opt.name;
          return (
            <TouchableOpacity
              key={opt.name}
              style={[
                styles.themeCard,
                {
                  backgroundColor: preview.card,
                  borderColor: active ? preview.primary : preview.border,
                  borderWidth: active ? 2 : 1,
                },
              ]}
              onPress={() => setTheme(opt.name)}
              activeOpacity={0.85}
            >
              {/* Mini colour dots */}
              <View style={styles.themeDotsRow}>
                {[preview.primary, preview.accent, preview.success].map((c, i) => (
                  <View key={i} style={[styles.themeDot, { backgroundColor: c }]} />
                ))}
              </View>
              <Text style={styles.themeEmoji}>{opt.emoji}</Text>
              <Text style={[styles.themeLabel, { color: preview.foreground }]}>{opt.label}</Text>
              <Text style={[styles.themeDesc, { color: preview.mutedForeground }]}>{opt.desc}</Text>
              {active && (
                <View style={[styles.themeActiveBadge, { backgroundColor: preview.primary }]}>
                  <Text style={[styles.themeActiveBadgeText, { color: preview.primaryForeground }]}>
                    Active
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Pet skin ───────────────────────────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>Pet Skin</Text>
        {/* "✨ Premium" badge only shown to parent viewers — children should not
            be shown subscription CTAs. The locked overlays on the skins stay
            so children still see what's possible to unlock. */}
        {!isSubscribed && !isChildViewer && (
          <Text style={[styles.premiumBadge, { color: T.accent }]}>✨ Premium</Text>
        )}
      </View>
      <View style={[styles.skinGrid, { backgroundColor: T.card, borderColor: T.border }]}>
        {PET_SKINS.map((skin) => (
          <TouchableOpacity
            key={skin}
            style={[
              styles.skinBtn,
              {
                borderColor: selectedSkin === skin ? T.primary : 'transparent',
                backgroundColor: selectedSkin === skin ? T.muted : 'transparent',
              },
            ]}
            onPress={() => {
              if (!isSubscribed) {
                // Child viewer: tap is inert. They see what's locked but
                // we don't nudge them toward a payment they can't action.
                if (isChildViewer) return;
                navigation.navigate('Paywall', {
                  childName: profile?.display_name ?? undefined,
                });
                return;
              }
              setSelectedSkin(skin);
            }}
          >
            <Text style={[styles.skinEmoji, !isSubscribed && styles.skinLocked]}>{skin}</Text>
            {!isSubscribed && <Text style={styles.lockOverlay}>🔒</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Buddy section ──────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>Buddy</Text>
      <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: T.card, borderColor: T.border, flexDirection: rowDirection }]}
        onPress={() => setToggleModalVisible(true)}
        accessibilityRole="button"
        testID="buddy-view-entry"
      >
        <Text style={[styles.settingLabel, { color: T.foreground }]}>
          {t('childSettings.buddyView.entry')}
        </Text>
        <Text style={[styles.settingStatus, { color: T.mutedForeground }]}>
          {t(buddyVisible ? 'childSettings.buddyView.statusShown' : 'childSettings.buddyView.statusHidden')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: T.card, borderColor: T.border, flexDirection: rowDirection }]}
        onPress={() => setNameModalVisible(true)}
        accessibilityRole="button"
        testID="rename-buddy-entry"
      >
        <Text style={[styles.settingLabel, { color: T.foreground }]}>
          {t('childSettings.renameBuddy.entry')}
        </Text>
        <Text style={[styles.settingStatus, { color: T.mutedForeground }]} numberOfLines={1}>
          {buddyDisplayName}
        </Text>
      </TouchableOpacity>

      {/* ── Haptics toggle ─────────────────────────────────────────────────── */}
      <View style={[styles.settingRow, { backgroundColor: T.card, borderColor: T.border, flexDirection: rowDirection }]}>
        <Text style={[styles.settingLabel, { color: T.foreground }]}>📳 Completion Haptics</Text>
        <Switch
          value={hapticsOn}
          onValueChange={handleHapticsToggle}
          trackColor={{ false: T.border, true: T.primary }}
          thumbColor={T.card}
        />
      </View>

      <BuddyToggleModal
        visible={toggleModalVisible}
        mode={toggleMode}
        onConfirm={async () => {
          setToggleModalVisible(false);
          await setBuddyVisible(!buddyVisible);
        }}
        onCancel={() => setToggleModalVisible(false)}
      />

      <BuddyNameModal
        visible={nameModalVisible}
        currentName={relationship?.buddy_name ?? null}
        defaultName={buddyDefaultName}
        onSave={async (name) => {
          setNameModalVisible(false);
          await setBuddyName(name);
        }}
        onCancel={() => setNameModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content:             { padding: 20, paddingTop: 52, paddingBottom: 40 },
  exitBanner:          { borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  exitText:            { fontWeight: '600', fontSize: 14 },
  pageTitle:           { fontSize: 28, fontWeight: '900', marginBottom: 20 },

  profileCard:         { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, gap: 16 },
  profileEmoji:        { fontSize: 50 },
  profileName:         { fontSize: 18, fontWeight: '700', marginBottom: 3 },
  profilePet:          { fontSize: 14, marginBottom: 3 },
  profileBuffs:        { fontSize: 14, fontWeight: '700' },

  sectionTitle:        { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  themeRow:            { flexDirection: 'row', gap: 12, marginBottom: 24 },
  themeCard:           { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6 },
  themeDotsRow:        { flexDirection: 'row', gap: 4, marginBottom: 4 },
  themeDot:            { width: 8, height: 8, borderRadius: 4 },
  themeEmoji:          { fontSize: 22 },
  themeLabel:          { fontSize: 14, fontWeight: '700' },
  themeDesc:           { fontSize: 11 },
  themeActiveBadge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  themeActiveBadgeText: { fontSize: 10, fontWeight: '700' },

  sectionHeaderRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  premiumBadge:        { fontSize: 12, fontWeight: '700' },
  skinGrid:            { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 14, padding: 12, marginBottom: 20, borderWidth: 1, gap: 8 },
  skinBtn:             { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, position: 'relative' },
  skinEmoji:           { fontSize: 26 },
  skinLocked:          { opacity: 0.4 },
  lockOverlay:         { position: 'absolute', bottom: 0, right: 0, fontSize: 10 },

  settingRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  settingLabel:        { fontSize: 15 },
  settingStatus:       { fontSize: 13, maxWidth: 140 },
});
