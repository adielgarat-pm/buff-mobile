/**
 * ModeContext — tracks whether the app is rendering in "parent (Zen) mode" or
 * "child (Gamer) mode".
 *
 * - A child user always sees Gamer mode.
 * - A parent user sees Zen mode by default and can preview Gamer mode via
 *   enterChildPreview() (mirrors the web app's "View as Child" feature).
 * - The RootNavigator swaps between ParentTabs and ChildTabs based on viewMode.
 */
import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type ViewMode = 'parent' | 'child';

interface ModeContextType {
  viewMode: ViewMode;
  isChildPreview: boolean; // true when a parent is in child-preview mode
  previewChildId: string | null;
  enterChildPreview: (childId: string) => void;
  exitChildPreview: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [isChildPreview, setIsChildPreview] = useState(false);
  const [previewChildId, setPreviewChildId] = useState<string | null>(null);

  // Natural mode follows the profile role; falls back to 'parent' while loading
  const naturalMode: ViewMode = profile?.role === 'child' ? 'child' : 'parent';

  // Parents can temporarily enter child-preview mode
  const viewMode: ViewMode =
    naturalMode === 'parent' && isChildPreview ? 'child' : naturalMode;

  const enterChildPreview = (childId: string) => {
    if (profile?.role === 'parent') {
      setPreviewChildId(childId);
      setIsChildPreview(true);
    }
  };

  const exitChildPreview = () => {
    setIsChildPreview(false);
    setPreviewChildId(null);
  };

  return (
    <ModeContext.Provider value={{ viewMode, isChildPreview, previewChildId, enterChildPreview, exitChildPreview }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextType {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within a ModeProvider');
  return ctx;
}
