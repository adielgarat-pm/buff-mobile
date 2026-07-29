import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../integrations/supabase/client';
import { FREE_INSIGHTS_PER_CHILD } from './useAutoCoachInsight';

export interface SmartInsight {
  headline:  string;
  message:   string;
  action:    string;
  cta_type:  string;
}

interface UseSmartInsightsResult {
  smartInsight:     SmartInsight | null;
  /** ISO timestamp of when the saved insight was computed — powers the
   *  "valid as of {date}" stamp (D: Adi 2026-07-14). Null until loaded. */
  computedAt:       string | null;
  parentContext:    string;
  setParentContext: (v: string) => void;
  generating:       boolean;
  generate:         () => Promise<void>;
  error:            string | null;
  generationsLeft:  number;
  /** Lifetime insights generated for this child (migration 048) — drives the
   *  free-taste gate. 0 means this child has never had one. */
  totalCount:       number;
  loadingState:     boolean;
  userVote:         1 | -1 | null;
  submitVote:       (vote: 1 | -1) => Promise<void>;
  /** Silent re-pull of the saved insight + vote (no flicker: state is updated
   *  in place, not cleared). Screens call this on focus / pull-to-refresh so a
   *  generate on one screen is reflected on the other (Adi 2026-07-17: the
   *  dashboard card kept a stale insight + "as of" date after generating on
   *  the Insights screen — tab screens stay mounted, so mount-load isn't enough). */
  reload:           () => Promise<void>;
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
  const [computedAt,      setComputedAt]      = useState<string | null>(null);
  const [parentContext,   setParentContextRaw] = useState('');
  const [generating,      setGenerating]       = useState(false);
  const [error,           setError]            = useState<string | null>(null);
  const [weeklyCount,     setWeeklyCount]      = useState(0);
  // Defaults to "taste already used" so a child whose state has not loaded yet
  // can never spend a free generation on a render race.
  const [totalCount,      setTotalCount]       = useState(FREE_INSIGHTS_PER_CHILD);
  const [loadingState,    setLoadingState]     = useState(false);
  const [userVote,        setUserVote]         = useState<1 | -1 | null>(null);
  const [windowEnd,       setWindowEnd]        = useState<string>('');

  const setParentContext = useCallback((v: string) => {
    setParentContextRaw(v.slice(0, MAX_CONTEXT_LENGTH));
  }, []);

  // Load saved insight + parent context + weekly count from DB on mount / child change.
  // The Insights child-selector switches childId IN PLACE (the hook does not remount),
  // so every per-child field must be reset here first — otherwise a child with no
  // saved insight keeps showing the previously-selected child's insight (leak between
  // kids, e.g. Itay's insight appearing for Emi).
  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    setSmartInsight(null);
    setComputedAt(null);
    setParentContextRaw('');
    setWeeklyCount(0);
    setTotalCount(FREE_INSIGHTS_PER_CHILD);
    setError(null);
    setLoadingState(true);
    supabase
      .rpc('get_smart_insight_state', { p_child_id: childId })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError || !data || data.length === 0) {
          setLoadingState(false);
          return;
        }
        const row = data[0];
        setSmartInsight((row.smart_insight as SmartInsight) ?? null);
        setComputedAt((row.computed_at as string | null) ?? null);
        setParentContextRaw(row.parent_context ?? '');
        setWeeklyCount(row.weekly_count ?? 0);
        setTotalCount(row.total_count ?? 0);
        setLoadingState(false);
      });
    return () => { cancelled = true; };
  }, [childId]);

  // Silent refresh — update in place (no reset/flicker). Used on screen focus
  // and pull-to-refresh so both surfaces converge on the latest saved insight.
  const reload = useCallback(async () => {
    if (!childId) return;
    const { data, error: rpcError } = await supabase
      .rpc('get_smart_insight_state', { p_child_id: childId });
    if (rpcError || !data || data.length === 0) return;
    const row = data[0];
    setSmartInsight((row.smart_insight as SmartInsight) ?? null);
    setComputedAt((row.computed_at as string | null) ?? null);
    setWeeklyCount(row.weekly_count ?? 0);
    setTotalCount(row.total_count ?? 0);
    // Latest vote for this week too — a vote cast on the other screen should
    // show as selected here. (parentContext is deliberately NOT overwritten:
    // the parent may be mid-typing on the Insights screen.)
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const monday = d.toISOString().split('T')[0];
    const { data: voteRow } = await supabase
      .from('smart_insight_feedback')
      .select('explicit_vote')
      .eq('child_id', childId)
      .gte('window_end', monday)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setUserVote((voteRow?.explicit_vote as 1 | -1 | undefined) ?? null);
  }, [childId]);

  // Load existing vote for this week
  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    setUserVote(null);   // reset so the previous child's vote never lingers
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
        if (!cancelled && data?.explicit_vote) setUserVote(data.explicit_vote as 1 | -1);
      });
    return () => { cancelled = true; };
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
            platform:       Platform.OS,   // telemetry only — the server gates on family_is_entitled, never on this
          },
        },
      );

      if (fnError) {
        // supabase-js wraps a non-2xx response as FunctionsHttpError whose
        // .message is generic ("…non-2xx status code") — the status code is NOT
        // in it. Read the HTTP status off the Response in .context; keep the
        // string fallback for older/edge shapes.
        const status = (fnError as { context?: { status?: number } }).context?.status;
        const msg = fnError.message ?? '';
        if (status === 402 || msg.includes('402'))                          { setError('premium');    return; }
        if (status === 429 || msg.includes('429') || msg.includes('rate'))  { setError('rate-limit'); return; }
        setError('server');
        return;
      }
      if (!raw) { setError('server'); return; }

      const { _weekly_count, ...insight } = raw;
      setSmartInsight(insight as SmartInsight);
      setComputedAt(new Date().toISOString());
      if (typeof _weekly_count === 'number') setWeeklyCount(_weekly_count);
      else setWeeklyCount(prev => prev + 1);
      setTotalCount(prev => prev + 1);   // a free taste, once spent, is spent
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
    computedAt,
    parentContext,
    setParentContext,
    generating,
    generate,
    error,
    generationsLeft: Math.max(0, WEEKLY_LIMIT - weeklyCount),
    totalCount,
    loadingState,
    userVote,
    submitVote,
    reload,
  };
}
