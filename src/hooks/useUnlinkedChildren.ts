/**
 * useUnlinkedChildren
 *
 * Detects child accounts that joined via family code but haven't been
 * linked to a parent-created profile yet.
 *
 * "Unlinked" = profile with role='child', user_id != null,
 *               and pro_settings->source = 'child_signup'
 *
 * Also returns the parent-created profiles (user_id IS NULL) available
 * to link against.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface UnlinkedChild {
  id: string;
  userId: string;
  displayName: string;
}

export interface LinkableProfile {
  id: string;
  displayName: string;
}

export function useUnlinkedChildren() {
  const { familyId } = useAuth();
  const [unlinked,  setUnlinked]  = useState<UnlinkedChild[]>([]);
  const [linkable,  setLinkable]  = useState<LinkableProfile[]>([]);
  const [loading,   setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    if (!familyId) {
      setUnlinked([]);
      setLinkable([]);
      setLoading(false);
      return;
    }

    const [{ data: unlinkedData }, { data: linkableData }] = await Promise.all([
      // Children who joined via code (have user_id, marked with source flag)
      supabase
        .from('profiles')
        .select('id, user_id, display_name')
        .eq('family_id', familyId)
        .eq('role', 'child')
        .eq('is_deleted', false)
        .filter('pro_settings->>source', 'eq', 'child_signup')
        .not('user_id', 'is', null),

      // Parent-created profiles waiting to be claimed (no user_id yet)
      supabase
        .from('profiles')
        .select('id, display_name')
        .eq('family_id', familyId)
        .eq('role', 'child')
        .eq('is_deleted', false)
        .is('user_id', null),
    ]);

    setUnlinked(
      (unlinkedData ?? []).map(p => ({
        id:          p.id,
        userId:      p.user_id as string,
        displayName: p.display_name ?? '—',
      }))
    );

    setLinkable(
      (linkableData ?? []).map(p => ({
        id:          p.id,
        displayName: p.display_name ?? '—',
      }))
    );

    setLoading(false);
  }, [familyId]);

  useEffect(() => { fetch(); }, [fetch]);

  /**
   * Link unlinkedChild → targetProfile.
   * 1. Set user_id on the parent-created profile.
   * 2. Delete the child-signup profile (it has no data).
   */
  const linkChild = useCallback(async (
    unlinkedChild: UnlinkedChild,
    targetProfileId: string,
  ): Promise<{ error: string | null }> => {
    // 1. Assign the real user_id to the parent-created profile
    //    and clear the source flag from its pro_settings.
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ user_id: unlinkedChild.userId, pro_settings: {} } as never)
      .eq('id', targetProfileId);

    if (updateErr) return { error: updateErr.message };

    // 2. Delete the temporary child-signup profile
    const { error: deleteErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', unlinkedChild.id);

    if (deleteErr) return { error: deleteErr.message };

    await fetch();
    return { error: null };
  }, [fetch]);

  return { unlinked, linkable, loading, refetch: fetch, linkChild };
}
