/**
 * parseCapture — calls the `parse-capture` Supabase Edge Function (real Gemini).
 *
 * Replaces the stub in the live app. The Gemini key lives only in the Edge
 * Function; the client just sends text or a base64 file + familyId and gets
 * back ParsedItem[]. Gated by FEATURE_PARENT_CAPTURE. See docs/sessions/parent-capture/.
 */

import * as FileSystem from 'expo-file-system';

import { supabase } from '../../integrations/supabase/client';
import type { CaptureInput, ParsedItem } from '../../types/parentCapture';

export async function parseCapture(
  input: CaptureInput,
  familyId: string,
): Promise<ParsedItem[]> {
  let body: Record<string, unknown>;
  if (input.kind === 'file' && input.fileUri) {
    const fileBase64 = await FileSystem.readAsStringAsync(input.fileUri, {
      encoding: 'base64' as const,
    });
    body = {
      kind: 'file',
      fileBase64,
      mimeType: input.mimeType,
      familyId,
      messageSentAt: input.messageSentAt ?? null,
    };
  } else {
    body = {
      kind: 'text',
      text: input.text ?? '',
      familyId,
      messageSentAt: input.messageSentAt ?? null,
    };
  }

  const { data, error } = await supabase.functions.invoke('parse-capture', { body });
  if (error) {
    console.error('[parseCapture] invoke error:', error.message);
    throw error;
  }
  return ((data as { items?: ParsedItem[] } | null)?.items ?? []) as ParsedItem[];
}
