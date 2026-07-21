/**
 * Child Settings — Gamer/Mint Mode (Menu)
 * Pet customisation, theme picker, sign-out.
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
import { useRTLStyles, useLanguage } from '../../contexts/LanguageContext';
import { useBuddyRelationship } from '../../hooks/useBuddyRelationship';
import { BuddyToggleModal } from '../../components/buddy/BuddyToggleModal';
import { BuddyNameModal } from '../../components/buddy/BuddyNameModal';
import LanguagePickerModal from '../../components/LanguagePickerModal';
import { getBuddyDefaultName } from '../../components/buddy/buddyAssets';
import { useChildData } from '../../hooks/useChildProgress';
import { usePetState } from '../../hooks/usePetState';
import { PET_SKINS, getSkinsForTheme, getDefaultSkin } from '../../types/pet';
import type { RootStackParamList } from '../../navigation/types';
import { formatNum } from '../../lib/uiLocale';
import { crossAlert } from '../../platform/crossAlert';

type Nav = StackNavigationProp<RootStackParamList>;

// Theme options — label/desc resolved via t() inside the component so they
// stay reactive to language switches. labelKey/descKey are stable i18n
// lookups; the emoji is a glyph (no translation needed).
const THEME_OPTIONS: { name: ChildThemeName; labelKey: string; descKey: string; emoji: string }[] = [
  { name: 'mint',  labelKey: 'childSettings.themes.mint.label',  descKey: 'childSettings.themes.mint.desc',  emoji: '🌿' },
  { name: 'gamer', labelKey: 'childSettings.themes.gamer.label', descKey: 'childSettings.themes.gamer.desc', emoji: '🎮' },
];

export default function ChildSettingsScreen() {
  const navigation  = useNavigation<Nav>();
  const { profile } = useAuth();
  const { isChildPreview, exitChildPreview, viewMode, previewChildId, previewChildName } = useMode();
  const T = useChildTheme();
  const { themeName, setTheme } = useTheme();
  const { rowDirection } = useRTLStyles();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isChildViewer = viewMode === 'child';

  const childId = previewChildId ?? profile?.id ?? null;
  const { relationship, setBuddyVisible, setBuddyName, refetch: refetchBuddy } = useBuddyRelationship(childId);
  useFocusEffect(useCallback(() => { refetchBuddy(); }, [refetchBuddy]));

  const { totalBalance } = useChildData(childId);

  // Pet skin comes from the real pet state (device-local AsyncStorage, shared
  // with the dashboard), not a hardcoded value — so the menu shows the buddy
  // the child actually has, and tapping a skin persists the change.
  const { petState, changeSkin } = usePetState(getDefaultSkin(themeName));
  const selectedSkin = petState.current_skin;
  const themeSkins   = getSkinsForTheme(themeName);

  const [hapticsOn, setHapticsOn]       = useState(true);
  const [toggleModalVisible, setToggleModalVisible] = useState(false);
  const [nameModalVisible,   setNameModalVisible]   = useState(false);
  const [langModalOpen,      setLangModalOpen]      = useState(false);

  const buddyVisible = relationship?.buddy_visible ?? true;
  const toggleMode: 'hide' | 'show' = buddyVisible ? 'hide' : 'show';
  // Skin-specific default (STORMY/LUNA) → translated generic default. Never
  // a person's name — the buddy-name slot must not inherit a profile name.
  const buddyDefaultName = getBuddyDefaultName(relationship?.current_skin_id ?? null) ?? t('pet.defaultName');
  const buddyDisplayName = relationship?.buddy_name ?? buddyDefaultName;

  // Active child's name for the profile card. In View-as-Child `profile` is
  // still the PARENT's profile — rendering profile.display_name here leaked
  // the parent's name ("ADI") next to the pet emoji in the Menu.
  const childDisplayName = isChildPreview
    ? (previewChildName ?? '')
    : (profile?.display_name ?? '');

  const showBuddySaveError = () => {
    crossAlert(t('childSettings.buddySaveError.title'), t('childSettings.buddySaveError.body'));
  };

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
          <Text style={[styles.exitText, { color: T.primaryForeground }]}>{t('childSettings.exitChildPreview')}</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.pageTitle, { color: T.primary }]}>{t('childSettings.menuTitle')}</Text>

      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <Text style={styles.profileEmoji}>{PET_SKINS[selectedSkin]?.emoji ?? '🐶'}</Text>
        <View>
          <Text style={[styles.profileName,  { color: T.foreground }]}>
            {childDisplayName}
          </Text>
          <Text style={[styles.profileBuffs, { color: T.buff }]}>
            {formatNum(totalBalance)} {t('childSettings.buffsSuffix')}
          </Text>
        </View>
      </View>

      {/* ── Theme picker ───────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>{t('childSettings.themesSection')}</Text>
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
              <Text style={[styles.themeLabel, { color: preview.foreground }]}>{t(opt.labelKey)}</Text>
              <Text style={[styles.themeDesc, { color: preview.mutedForeground }]}>{t(opt.descKey)}</Text>
              {active && (
                <View style={[styles.themeActiveBadge, { backgroundColor: preview.primary }]}>
                  <Text style={[styles.themeActiveBadgeText, { color: preview.primaryForeground }]}>
                    {t('childSettings.themeActive')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Pet skin ───────────────────────────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>{t('childSettings.petSkinSection')}</Text>
      </View>
      <View style={[styles.skinGrid, { backgroundColor: T.card, borderColor: T.border }]}>
        {themeSkins.map((skin) => {
          const isSelected = selectedSkin === skin.id;
          return (
            <TouchableOpacity
              key={skin.id}
              style={[
                styles.skinBtn,
                {
                  borderColor: isSelected ? T.primary : 'transparent',
                  backgroundColor: isSelected ? T.muted : 'transparent',
                },
              ]}
              onPress={() => changeSkin(skin.id)}
            >
              <Text style={styles.skinEmoji}>{skin.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Buddy section ──────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>{t('childSettings.buddySection')}</Text>
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
        <Text style={[styles.settingLabel, { color: T.foreground }]}>{t('childSettings.haptics')}</Text>
        <Switch
          value={hapticsOn}
          onValueChange={handleHapticsToggle}
          trackColor={{ false: T.mutedForeground, true: T.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* ── General ────────────────────────────────────────────────────────── */}
      {/* Language is parent-owned (per-child language lives on EditChild). A
          child cannot change it on their own device, and in View-as-Child the
          picker would wrongly flip the parent's DEVICE language — so the whole
          section is hidden for any child viewer (real child or parent preview). */}
      {!isChildViewer && (
        <>
          <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>{t('childSettings.generalSection')}</Text>
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: T.card, borderColor: T.border, flexDirection: rowDirection }]}
            onPress={() => setLangModalOpen(true)}
            accessibilityRole="button"
            testID="language-entry"
          >
            <Text style={[styles.settingLabel, { color: T.foreground }]}>{t('settings.rowLanguage')}</Text>
            <Text style={[styles.settingStatus, { color: T.mutedForeground }]}>
              {language === 'he' ? 'עברית' : 'English'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <BuddyToggleModal
        visible={toggleModalVisible}
        mode={toggleMode}
        onConfirm={async () => {
          setToggleModalVisible(false);
          const { error } = await setBuddyVisible(!buddyVisible);
          if (error) showBuddySaveError();
        }}
        onCancel={() => setToggleModalVisible(false)}
      />

      <BuddyNameModal
        visible={nameModalVisible}
        currentName={relationship?.buddy_name ?? null}
        defaultName={buddyDefaultName}
        onSave={async (name) => {
          setNameModalVisible(false);
          const { error } = await setBuddyName(name);
          if (error) showBuddySaveError();
        }}
        onCancel={() => setNameModalVisible(false)}
      />

      <LanguagePickerModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
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
