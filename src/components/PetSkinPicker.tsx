/**
 * PetSkinPicker — modal grid for choosing a BUDDY skin.
 *
 * Opened by long-pressing the pet emoji in PetDisplay (Phase 3 of
 * BUFF_GAP_ANALYSIS C-06 — "Pet Skins UI"). Shows all skins for the
 * child's theme path (sweet for mint, heroic for gamer), gates by
 * evolution_days_count >= skin.unlockAt.
 *
 * Locked skins still render (visible aspiration) but are non-tappable
 * and show "Unlocks at day N".
 *
 * Pillar 1 (Intrinsic Motivation) anchor:
 *   - "Always close to a win" — the next skin to unlock is always
 *     visible, giving the child a concrete near-term goal.
 *   - Skin choice is the CHILD's, not the parent's (kid agency).
 *
 * Source: docs/BUFF_GAP_ANALYSIS.md C-06.
 */
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChildTheme } from '../contexts/ThemeContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  PET_SKINS,
  getSkinsForTheme,
  isSkinUnlocked,
  type PetSkinDef,
} from '../types/pet';

interface Props {
  visible:         boolean;
  onClose:         () => void;
  currentSkin:     string;
  evolutionDays:   number;
  onSelect:        (skinId: string) => void;
}

export default function PetSkinPicker({
  visible, onClose, currentSkin, evolutionDays, onSelect,
}: Props) {
  const { t }         = useTranslation();
  const { themeName } = useTheme();
  const T             = useChildTheme();

  const skins = getSkinsForTheme(themeName);

  // Find the skin id from PetSkinDef (we know id by reverse-lookup from PET_SKINS map)
  const findSkinId = (skin: PetSkinDef): string => {
    const entry = Object.entries(PET_SKINS).find(
      ([, def]) => def.emoji === skin.emoji && def.path === skin.path,
    );
    return entry?.[0] ?? '';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: T.foreground }]}>
              {t('pet.skinPicker.title')}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[styles.closeX, { color: T.mutedForeground }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: T.mutedForeground }]}>
            {t('pet.skinPicker.subtitle')}
          </Text>

          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {skins.map(skin => {
              const id       = findSkinId(skin);
              const unlocked = isSkinUnlocked(skin, evolutionDays);
              const selected = id === currentSkin;
              const daysLeft = skin.unlockAt - evolutionDays;

              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.tile,
                    {
                      backgroundColor: selected ? T.primary : T.muted,
                      borderColor:     selected ? T.primary : T.border,
                      opacity:         unlocked ? 1 : 0.45,
                    },
                  ]}
                  disabled={!unlocked}
                  onPress={() => {
                    onSelect(id);
                    onClose();
                  }}
                >
                  <Text style={styles.tileEmoji}>{skin.emoji}</Text>
                  <Text style={[
                    styles.tileName,
                    { color: selected ? T.primaryForeground : T.foreground },
                  ]}>
                    {t(skin.nameKey)}
                  </Text>
                  {!unlocked && (
                    <Text style={[styles.tileLock, { color: T.mutedForeground }]}>
                      🔒 {t('pet.skinPicker.unlocksIn', { days: daysLeft })}
                    </Text>
                  )}
                  {selected && unlocked && (
                    <Text style={[styles.tileSelected, { color: T.primaryForeground }]}>
                      ✓ {t('pet.skinPicker.current')}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title:    { fontSize: 20, fontWeight: '800' },
  closeX:   { fontSize: 22, fontWeight: '600' },
  subtitle: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  tile: {
    width: '47%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 4,
  },
  tileEmoji:    { fontSize: 44, marginBottom: 8 },
  tileName:     { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  tileLock:     { fontSize: 10, marginTop: 4, textAlign: 'center' },
  tileSelected: { fontSize: 10, marginTop: 4, fontWeight: '700' },
});
