import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface SmartInsight {
  headline:  string;
  message:   string;
  action:    string;
  cta_type:  string;
}

interface UseSmartInsightsResult {
  smartInsight:   SmartInsight | null;
  parentContext:  string;
  setParentContext: (v: string) => void;
  generating:     boolean;
  generate:       () => Promise<void>;
  error:          string | null;
}

const MAX_CONTEXT_LENGTH = 140;

export function useSmartInsights(childId: string | null): UseSmartInsightsResult {
  const [smartInsight,    setSmartInsight]    = useState<SmartInsight | null>(null);
  const [parentContext,   setParentContextRaw] = useState('');
  const [generating,      setGenerating]       = useState(false);
  const [error,           setError]            = useState<string | null>(null);

  const setParentContext = useCallback((v: string) => {
    setParentContextRaw(v.slice(0, MAX_CONTEXT_LENGTH));
  }, []);

  const generate = useCallback(async () => {
    if (!childId) return;
    setGenerating(true);
    setError(null);

    try {
      const { data: insight, error: fnError } = await supabase.functions.invoke<SmartInsight>(
        'generate-child-insights',
        {
          body: {
            child_id:       childId,
            parent_context: parentContext.trim() || undefined,
          },
        },
      );

      if (fnError) {
        // FunctionsHttpError carries the HTTP status in its message
        if (fnError.message?.includes('402')) { setError('premium'); return; }
        setError('server');
        return;
      }
      if (!insight) { setError('server'); return; }
      setSmartInsight(insight);
    } catch (e) {
      console.error('useSmartInsights error', e);
      setError('network');
    } finally {
      setGenerating(false);
    }
  }, [childId, parentContext]);

  return { smartInsight, parentContext, setParentContext, generating, generate, error };
}
