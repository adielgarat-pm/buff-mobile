import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../integrations/supabase/client';

export interface SmartInsight {
  headline:  string;
  message:   string;
  action:    string;
  cta_type:  string;
}

interface UseSmartInsightsResult {
  smartInsight:     SmartInsight | null;
  parentContext:    string;
  setParentContext: (v: string) => void;
  generating:       boolean;
  generate:         () => Promise<void>;
  error:            string | null;
  generationsLeft:  number;
  loadingState:     boolean;
  userVote:         1 | -1 | null;
  submitVote:       (vote: 1 | -1) => Promise<void>;
}

const MAX_CONTEXT_LENGTH = 140;
const WEEKLY_LIMIT       = 3;

/** Lightweight, no-crypto hash — enough to identify an insight version. */
function insightHash(insight: SmartInsight): string {
  const raw = insight.headline + '|' + insight.message;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

export function useSmartInsights(childId: string | null): UseSmartInsightsResult {
  const { i18n } = useTranslation();
  const [smartInsight,    setSmartInsight]    = useState<SmartInsight | null>(null);
  const [parentContext,   setParentContextRaw] = useState('');
  const [generating,      setGenerating]       = useState(false);
  const [error,           setError]            = useState<string | null>(null);
  const [weeklyCount,     setWeeklyCount]      = useState(0);
  const [loadingState,    setLoadingState]     = useState(false);
  const [userVote,        setUserVote]         = useState<1 | -1 | null>(null);
  const [windowEnd,       setWindowEnd]        = useState<string>('');

  const setParentContext = useCallback((v: string) => {
    setParentContextRaw(v.slice(0, MAX_CONTEXT_LENGTH));
  }, []);

  // Load saved insight + parent context + weekly count from DB on mount / child change
  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    setLoadingState(true);
    supabase
      .rpc('get_smart_insight_state', { p_child_id: childId })
      .then(({ data, error: rpcError }) => {
        if (cancelled || rpcError || !data || data.length === 0) {
          setLoadingState(false);
          return;
        }
        const row = data[0];
        if (row.smart_insight) setSmartInsight(row.smart_insight as SmartInsight);
        if (row.parent_context) setParentContextRaw(row.parent_context);
        setWeeklyCount(row.weekly_count ?? 0);
        setLoadingState(false);
      });
    return () => { cancelled = true; };
  }, [childId]);

  // Load existing vote for this week
  useEffect(() => {
    if (!childId) return;
    const today = new Date().toISOString().split('T')[0];
    // Monday of this week
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const monday = d.toISOString().split('T')[0];
    setWindowEnd(today);
    supabase
      .from('smart_insight_feedback')
      .select('explicit_vote')
      .eq('child_id', childId)
      .gte('window_end', monday)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.explicit_vote) setUserVote(data.explicit_vote as 1 | -1);
      });
  }, [childId]);

  const generate = useCallback(async () => {
    if (!childId) return;
    if (weeklyCount >= WEEKLY_LIMIT) { setError('rate-limit'); return; }

    setGenerating(true);
    setError(null);
    setUserVote(null);

    try {
      const { data: raw, error: fnError } = await supabase.functions.invoke<SmartInsight & { _weekly_count?: number }>(
        'generate-child-insights',
        {
          body: {
            child_id:       childId,
            parent_context: parentContext.trim() || undefined,
            language:       i18n.language,
          },
        },
      );

      if (fnError) {
        const msg = fnError.message ?? '';
        if (msg.includes('429') || msg.includes('rate')) { setError('rate-limit'); return; }
        if (msg.includes('402'))                         { setError('premium');    return; }
        setError('server');
        return;
      }
      if (!raw) { setError('server'); return; }

      const { _weekly_count, ...insight } = raw;
      setSmartInsight(insight as SmartInsight);
      if (typeof _weekly_count === 'number') setWeeklyCount(_weekly_count);
      else setWeeklyCount(prev => prev + 1);
      setWindowEnd(new Date().toISOString().split('T')[0]);
    } catch (e) {
      console.error('useSmartInsights error', e);
      setError('network');
    } finally {
      setGenerating(false);
    }
  }, [childId, parentContext, weeklyCount, i18n.language]);

  const submitVote = useCallback(async (vote: 1 | -1) => {
    if (!childId || !smartInsight) return;
    setUserVote(vote);
    await supabase.rpc('record_insight_vote', {
      p_child_id:   childId,
      p_hash:       insightHash(smartInsight),
      p_window_end: windowEnd || new Date().toISOString().split('T')[0],
      p_vote:       vote,
    });
  }, [childId, smartInsight, windowEnd]);

  return {
    smartInsight,
    parentContext,
    setParentContext,
    generating,
    generate,
    error,
    generationsLeft: Math.max(0, WEEKLY_LIMIT - weeklyCount),
    loadingState,
    userVote,
    submitVote,
  };
}
