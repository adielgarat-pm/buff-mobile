// track-install-cta — public, anonymous web-to-native install-CTA funnel logger.
//
// Called (fire-and-forget) from GetTheAppCta.web on impression/click/dismiss/
// open_installed. Inserts one row into public.install_cta_events using the
// service role key (bypasses RLS). verify_jwt is disabled so the anonymous
// beacon can reach it before an account exists; the body is strictly validated
// and only non-PII fields are stored (no email, no IP).
//
// SPEC: docs/sessions/web-to-native-cta/SPEC.md §4.4.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  // supabase-js functions.invoke() sends authorization/apikey/x-client-info;
  // allowing only content-type made the browser fail the preflight and drop
  // EVERY event (the client swallows the error by design) — allow them all.
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Skip link-preview crawlers / bots so they don't inflate the funnel.
const BOT_UA =
  /bot|crawl|spider|preview|whatsapp|telegram|slackbot|facebookexternalhit|twitterbot|linkedinbot|discordbot|embedly|applebot|bingpreview|googlebot|skypeuripreview|vkshare|redditbot/i;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_TYPES = new Set(['impression', 'click', 'dismiss', 'open_installed']);

const asUuid = (v: unknown): string | null =>
  typeof v === 'string' && UUID_RE.test(v) ? v : null;
const asShort = (v: unknown): string | null =>
  typeof v === 'string' ? v.slice(0, 32) : null;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: cors });
  }

  try {
    const ua = req.headers.get('user-agent') ?? '';
    if (BOT_UA.test(ua)) return new Response(null, { status: 204, headers: cors });

    const body = await req.json().catch(() => ({}));
    const ctaId = asUuid(body?.cta_id);
    const eventType =
      typeof body?.event_type === 'string' && EVENT_TYPES.has(body.event_type)
        ? body.event_type
        : null;

    // Silently accept invalid payloads — the beacon must never surface errors.
    if (ctaId && eventType) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await supabase.from('install_cta_events').insert({
        cta_id: ctaId,
        event_type: eventType,
        placement: asShort(body?.placement),
        target: asShort(body?.target),
        user_id: asUuid(body?.user_id),
        family_id: asUuid(body?.family_id),
        user_agent: ua.slice(0, 300),
      });
    }
  } catch {
    // Non-fatal — respond 204 regardless so the beacon never blocks the UX.
  }

  return new Response(null, { status: 204, headers: cors });
});
