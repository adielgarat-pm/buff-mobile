/**
 * Child Settings — Gamer/Mint Mode (Menu)
 * Pet customisation, theme picker, sound, sign-out.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useTheme, useChildTheme, CHILD_THEMES, type ChildThemeName } from '../../contexts/ThemeContext';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { MOCK_MY_CHILD, PET_STAGES } from '../../mock/data';

const PET_SKINS = ['🐶', '🐱', '🐰', '🐼', '🐉', '🦄', '🐯', '🦊', '🦈', '🦁'];

const THEME_OPTIONS: { name: ChildThemeName; label: string; emoji: string; desc: string }[] = [
  { name: 'mint',  label: 'Mint',  emoji: '🌿', desc: 'Light & playful' },
  { name: 'gamer', label: 'Gamer', emoji: '🎮', desc: 'Dark neon energy' },
];

export default function ChildSettingsScreen() {
  const { profile, familyShortCode, signOut } = useAuth();
  const { isChildPreview, exitChildPreview } = useMode();
  const T = useChildTheme();
  const { themeName, setTheme } = useTheme();
  const { rowDirection } = useRTLStyles();

  const child = MOCK_MY_CHILD;
  const petCfg = PET_STAGES[child.petStage];
  const [soundOn, setSoundOn]         = useState(true);
  const [selectedSkin, setSelectedSkin] = useState('🐉');

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
      <Text style={[styles.sectionTitle, { color: T.mutedForeground }]}>Pet Skin</Text>
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
            onPress={() => setSelectedSkin(skin)}
          >
            <Text style={styles.skinEmoji}>{skin}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Sound toggle ───────────────────────────────────────────────────── */}
      <View style={[styles.settingRow, { backgroundColor: T.card, borderColor: T.border, flexDirection: rowDirection }]}>
        <Text style={[styles.settingLabel, { color: T.foreground }]}>🔊 Sound Effects</Text>
        <Switch
          value={soundOn}
          onValueChange={setSoundOn}
          trackColor={{ false: T.border, true: T.primary }}
          thumbColor={T.card}
        />
      </View>

      {/* ── Family code ────────────────────────────────────────────────────── */}
      {familyShortCode && (
        <View style={[styles.codeRow, { backgroundColor: T.card, borderColor: T.border, flexDirection: rowDirection }]}>
          <Text style={[styles.settingLabel, { color: T.foreground }]}>Family Code</Text>
          <Text style={[styles.codeValue, { color: T.primary, letterSpacing: 4 }]}>
            {familyShortCode}
          </Text>
        </View>
      )}

      {/* ── Sign out ───────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: T.border }]}
        onPress={signOut}
      >
        <Text style={[styles.signOutText, { color: T.mutedForeground }]}>Sign Out</Text>
      </TouchableOpacity>
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

  skinGrid:            { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 14, padding: 12, marginBottom: 20, borderWidth: 1, gap: 8 },
  skinBtn:             { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  skinEmoji:           { fontSize: 26 },

  settingRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  settingLabel:        { fontSize: 15 },
  codeRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1 },
  codeValue:           { fontSize: 18, fontWeight: '800' },
  signOutBtn:          { borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  signOutText:         { fontWeight: '600', fontSize: 15 },
});
