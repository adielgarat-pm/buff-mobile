import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface FamilyMember {
  id: string;
  userId: string;
  displayName: string;
  role: 'parent' | 'child';
  createdAt: string;
  avatar: string;
  // DB-backed subscription flags — used by useSubscription so a child can
  // inherit the family parent's entitlement (BUFF gates on the family plan).
  isLifetimeAccess: boolean;
  isLifetimeFounding: boolean;
  premiumUntil: string | null;
}

export function useFamilyMembers() {
  const { familyId } = useAuth();
  const [members, setMembers]   = useState<FamilyMember[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!familyId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_deleted', false) // exclude soft-deleted children
        .order('role', { ascending: false }) // parents first
        .order('created_at');

      if (error) {
        console.error('Error fetching family members:', error);
        return;
      }

      setMembers(
        (data || []).map(p => ({
          id:                 p.id,
          userId:             p.user_id,
          displayName:        p.display_name,
          role:               p.role as 'parent' | 'child',
          createdAt:          p.created_at,
          avatar:             p.avatar || '🚀',
          isLifetimeAccess:   p.is_lifetime_access ?? false,
          isLifetimeFounding: p.is_lifetime_founding ?? false,
          premiumUntil:       p.premium_until ?? null,
        }))
      );
    } catch (err) {
      console.error('Error fetching family members:', err);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Realtime subscription
  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`family-members-${familyId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `family_id=eq.${familyId}` },
        () => { fetchMembers(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, fetchMembers]);

  const children = members.filter(m => m.role === 'child');
  const parents  = members.filter(m => m.role === 'parent');

  return { members, children, parents, loading, refetch: fetchMembers };
}
