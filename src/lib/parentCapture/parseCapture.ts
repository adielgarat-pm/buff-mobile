/**
 * parseCapture — calls the `parse-capture` Supabase Edge Function (real Gemini).
 *
 * Replaces the stub in the live app. The Gemini key lives only in the Edge
 * Function; the client just sends text or a base64 file + familyId and gets
 * back ParsedItem[]. Gated by FEATURE_PARENT_CAPTURE. See docs/sessions/parent-capture/.
 */

import { Platform } from 'react-native';
// SDK 54: readAsStringAsync lives in the legacy entry — the root export throws
// at runtime (broke Android file capture, 2026-07-22).
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '../../integrations/supabase/client';
import type { CaptureInput, ParsedItem } from '../../types/parentCapture';

/**
 * Parse result. `runId` is the capture_runs row the Edge Function wrote for this
 * call — the screen attaches the parent's confirm summary to it (usability
 * metric, migration 047). Null when the server could not log the run; the parse
 * itself is unaffected.
 */
export interface CaptureParseResult {
  items: ParsedItem[];
  runId: string | null;
}

/** Typed failure so the screen can show the right message (paywall vs retry). */
export class CaptureParseError extends Error {
  constructor(public code: 'premium_required' | 'rate_limited' | 'timeout' | 'generic') {
    super(code);
    this.name = 'CaptureParseError';
  }
}

/**
 * Client-side ceiling on the whole parse round-trip. A real Gemini parse has
 * been measured at 60-90s in production (2026-07-28), so this is a BACKSTOP
 * against a dead connection — not a UX budget. It sits above the server's own
 * Gemini timeout (100s), which is the layer that should normally fire first.
 * RN's fetch has NO default timeout: without this, a lost response means the
 * spinner runs forever and the feature reads as broken.
 */
export const PARSE_TIMEOUT_MS = 120_000;

/**
 * Reject with CaptureParseError('timeout') if `promise` doesn't settle in time.
 * `onTimeout` lets the caller abort the underlying request so it doesn't keep
 * the radio open. The race (not the signal alone) guarantees the UI recovers
 * even if some fetch layer ignores AbortSignal.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(new CaptureParseError('timeout'));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** Read a picked file as base64 — FileSystem on native, fetch+FileReader on web
 *  (expo-file-system does not implement readAsStringAsync on web). */
async function readFileBase64(uri: string): Promise<string> {
  if (Platform.OS !== 'web') {
    return FileSystem.readAsStringAsync(uri, { encoding: 'base64' as const });
  }
  const blob = await (await fetch(uri)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function parseCapture(
  input: CaptureInput,
  familyId: string,
  language?: string,
  /** Parent's upfront "who is this about?" pick — biases the server-side match. */
  childHint?: string | null,
): Promise<CaptureParseResult> {
  let body: Record<string, unknown>;
  if (input.kind === 'file' && input.fileUri) {
    const fileBase64 = await readFileBase64(input.fileUri);
    body = {
      kind: 'file',
      fileBase64,
      mimeType: input.mimeType,
      familyId,
      childHint: childHint ?? null,
      messageSentAt: input.messageSentAt ?? null,
      platform: Platform.OS,
      language: language ?? null,
    };
  } else {
    body = {
      kind: 'text',
      text: input.text ?? '',
      familyId,
      childHint: childHint ?? null,
      messageSentAt: input.messageSentAt ?? null,
      platform: Platform.OS,
      language: language ?? null,
    };
  }

  const controller = new AbortController();
  const { data, error } = await withTimeout(
    supabase.functions.invoke('parse-capture', { body, signal: controller.signal }),
    PARSE_TIMEOUT_MS,
    () => controller.abort(),
  );
  if (error) {
    console.error('[parseCapture] invoke error:', error.message);
    // FunctionsHttpError carries the Response — map the server's typed errors.
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 402) throw new CaptureParseError('premium_required');
    if (status === 429) throw new CaptureParseError('rate_limited');
    if (status === 504) throw new CaptureParseError('timeout'); // server-side Gemini timeout
    throw new CaptureParseError('generic');
  }
  const payload = data as { items?: ParsedItem[]; run_id?: string | null } | null;
  return {
    items: (payload?.items ?? []) as ParsedItem[],
    runId: payload?.run_id ?? null,
  };
}
