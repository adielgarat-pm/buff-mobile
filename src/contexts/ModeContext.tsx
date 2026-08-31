/**
 * ModeContext — tracks whether the app is rendering in "parent (Zen) mode" or
 * "child (Gamer) mode".
 *
 * - A child user always sees Gamer mode.
 * - A parent user sees Zen mode by default and can preview Gamer mode via
 *   enterChildPreview() (mirrors the web app's "View as Child" feature).
 * - The RootNavigator swaps between ParentTabs and ChildTabs based on viewMode.
 *
 * View-as-Child language: entering a preview switches the i18n STRINGS to the
 * previewed child's language so the parent sees the child's content in the
 * child's tongue. This is strings-only — we deliberately do NOT touch
 * I18nManager.forceRTL or trigger a restart (a preview is tapped many times a
 * day), so the layout direction stays the parent device's. Hebrew text still
 * renders RTL within each text box via the BiDi algorithm. Exiting restores the
 * device language with no restart (direction never changed → no flicker).
 */
import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../integrations/supabase/client';
import { resolveChildLang } from '../lib/i18nString';
import i18n from '../i18n';

export type ViewMode = 'parent' | 'child';

interface ModeContextType {
  viewMode: ViewMode;
  isChildPreview: boolean; // true when a parent is in child-preview mode
  previewChildId: string | null;
  previewChildName: string | null; // the previewed child's real display name, if known
  // The previewed child's age band (pro_settings.age_group), fetched on preview
  // entry. On shared devices (~65% of families) view-as-child IS the kid's real
  // interface, so the experience-band gate (theme-age-decouple) must read the
  // PREVIEWED child's age, not the parent's. Null until the fetch resolves or
  // when age_group is unset (family-code signups) — callers fall back per Q3.
  previewChildAgeGroup: string | null;
  enterChildPreview: (childId: string, childName?: string) => void;
  exitChildPreview: () => void;
}

// Exported so hooks that may render OUTSIDE a ModeProvider (e.g. useChildProgress
// in unit tests) can read it null-safely via useContext instead of useMode(),
// which throws. A completion recorded with no ModeProvider is, by definition,
// not view-as-child.
export const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { language: deviceLanguage } = useLanguage();
  const [isChildPreview, setIsChildPreview] = useState(false);
  const [previewChildId, setPreviewChildId] = useState<string | null>(null);
  const [previewChildName, setPreviewChildName] = useState<string | null>(null);
  const [previewChildAgeGroup, setPreviewChildAgeGroup] = useState<string | null>(null);

  // Natural mode follows the profile role; falls back to 'parent' while loading
  const naturalMode: ViewMode = profile?.role === 'child' ? 'child' : 'parent';

  // Parents can temporarily enter child-preview mode
  const viewMode: ViewMode =
    naturalMode === 'parent' && isChildPreview ? 'child' : naturalMode;

  const enterChildPreview = (childId: string, childName?: string) => {
    if (profile?.role !== 'parent') return;
    setPreviewChildId(childId);
    setPreviewChildName(childName ?? null); // synchronous when the caller knows it
    setPreviewChildAgeGroup(null); // reset until the fetch below resolves the real band
    setIsChildPreview(true);

    // Switch i18n strings to the previewed child's language (strings-only — see
    // the file header). Fetch the child's stored language + name; on any error
    // we leave the device language in place rather than guessing.
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, pro_settings')
        .eq('id', childId)
        .single();
      if (error || !data) return;
      if (data.display_name) setPreviewChildName(data.display_name);
      // Surface the previewed child's age band for the experience-band gate.
      const ag = (data.pro_settings as { age_group?: string } | null)?.age_group ?? null;
      setPreviewChildAgeGroup(ag);
      const childLang = resolveChildLang(data as never, deviceLanguage);
      if (childLang !== i18n.language) {
        i18n.changeLanguage(childLang).catch(() => { /* non-fatal */ });
      }
    })();
  };

  const exitChildPreview = () => {
    setIsChildPreview(false);
    setPreviewChildId(null);
    setPreviewChildName(null);
    setPreviewChildAgeGroup(null);
    // Restore the parent's device language. Direction never changed during the
    // preview, so this is a strings-only swap with no restart and no flicker.
    if (i18n.language !== deviceLanguage) {
      i18n.changeLanguage(deviceLanguage).catch(() => { /* non-fatal */ });
    }
  };

  return (
    <ModeContext.Provider value={{ viewMode, isChildPreview, previewChildId, previewChildName, previewChildAgeGroup, enterChildPreview, exitChildPreview }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextType {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within a ModeProvider');
  return ctx;
}
