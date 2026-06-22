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
}

const MAX_CONTEXT_LENGTH = 140;
const WEEKLY_LIMIT       = 3;

export function useSmartInsights(childId: string | null): UseSmartInsightsResult {
  const { i18n } = useTranslation();
  const [smartInsight,    setSmartInsight]    = useState<SmartInsight | null>(null);
  const [parentContext,   setParentContextRaw] = useState('');
  const [generating,      setGenerating]       = useState(false);
  const [error,           setError]            = useState<string | null>(null);
  const [weeklyCount,     setWeeklyCount]      = useState(0);
  const [loadingState,    setLoadingState]     = useState(false);

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
        if (row.smart_insight) {
          setSmartInsight(row.smart_insight as SmartInsight);
        }
        if (row.parent_context) {
          setParentContextRaw(row.parent_context);
        }
        setWeeklyCount(row.weekly_count ?? 0);
        setLoadingState(false);
      });
    return () => { cancelled = true; };
  }, [childId]);

  const generate = useCallback(async () => {
    if (!childId) return;
    if (weeklyCount >= WEEKLY_LIMIT) { setError('rate-limit'); return; }

    setGenerating(true);
    setError(null);

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

      // Strip the internal _weekly_count field before storing as SmartInsight
      const { _weekly_count, ...insight } = raw;
      setSmartInsight(insight as SmartInsight);
      if (typeof _weekly_count === 'number') setWeeklyCount(_weekly_count);
      else setWeeklyCount(prev => prev + 1);
    } catch (e) {
      console.error('useSmartInsights error', e);
      setError('network');
    } finally {
      setGenerating(false);
    }
  }, [childId, parentContext, weeklyCount, i18n.language]);

  return {
    smartInsight,
    parentContext,
    setParentContext,
    generating,
    generate,
    error,
    generationsLeft: Math.max(0, WEEKLY_LIMIT - weeklyCount),
    loadingState,
  };
}
