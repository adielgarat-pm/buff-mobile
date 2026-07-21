/**
 * parseCapture — calls the `parse-capture` Supabase Edge Function (real Gemini).
 *
 * Replaces the stub in the live app. The Gemini key lives only in the Edge
 * Function; the client just sends text or a base64 file + familyId and gets
 * back ParsedItem[]. Gated by FEATURE_PARENT_CAPTURE. See docs/sessions/parent-capture/.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

import { supabase } from '../../integrations/supabase/client';
import type { CaptureInput, ParsedItem } from '../../types/parentCapture';

/** Typed failure so the screen can show the right message (paywall vs retry). */
export class CaptureParseError extends Error {
  constructor(public code: 'premium_required' | 'rate_limited' | 'generic') {
    super(code);
    this.name = 'CaptureParseError';
  }
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
): Promise<ParsedItem[]> {
  let body: Record<string, unknown>;
  if (input.kind === 'file' && input.fileUri) {
    const fileBase64 = await readFileBase64(input.fileUri);
    body = {
      kind: 'file',
      fileBase64,
      mimeType: input.mimeType,
      familyId,
      messageSentAt: input.messageSentAt ?? null,
      platform: Platform.OS,
      language: language ?? null,
    };
  } else {
    body = {
      kind: 'text',
      text: input.text ?? '',
      familyId,
      messageSentAt: input.messageSentAt ?? null,
      platform: Platform.OS,
      language: language ?? null,
    };
  }

  const { data, error } = await supabase.functions.invoke('parse-capture', { body });
  if (error) {
    console.error('[parseCapture] invoke error:', error.message);
    // FunctionsHttpError carries the Response — map the server's typed errors.
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 402) throw new CaptureParseError('premium_required');
    if (status === 429) throw new CaptureParseError('rate_limited');
    throw new CaptureParseError('generic');
  }
  return ((data as { items?: ParsedItem[] } | null)?.items ?? []) as ParsedItem[];
}
