/**
 * useReferral — referral code management for the sharing UI.
 *
 * Calls get_or_create_referral_code RPC (lazy: returns existing pending
 * code or creates a new one). Also exposes completed referral count.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

interface ReferralState {
  code: string | null;
  completedCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useReferral(): ReferralState {
  const [code,           setCode]           = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_or_create_referral_code');
      if (rpcErr) throw rpcErr;
      if (data?.success) {
        setCode(data.code as string);
      } else {
        setError(data?.error ?? 'unknown_error');
      }

      // Count completed referrals for this family
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      setCompletedCount(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { code, completedCount, loading, error, refresh };
}
