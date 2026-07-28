// track-referral-click — public, anonymous referral-click logger.
//
// Called (fire-and-forget) from the landing /join page before it forwards the
// visitor into the app. Inserts one row into public.referral_clicks using the
// service role key (bypasses RLS). verify_jwt is disabled so the anonymous
// beacon can reach it; the body is strictly validated and only a sanitised
// code + user agent are stored (no PII, no IP).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  // Same CORS-preflight foot-gun as track-install-cta: allow the headers
  // supabase-js sends so any future functions.invoke() caller isn't dropped.
  // (The landing beacon itself is text/plain — a simple request, no preflight.)
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Link-preview crawlers fetch the shared URL to build a rich preview — that hit
// is NOT a human click. The messaging apps this feature targets (WhatsApp,
// Telegram, Slack, iMessage/Applebot, social unfurlers) all do this, so without
// this filter the funnel's click count would be dominated by phantom crawler
// hits. A real user tap opens a normal browser (Chrome custom tab / Safari),
// whose UA does NOT match these tokens, so genuine clicks still log.
const BOT_UA =
  /bot|crawl|spider|preview|whatsapp|telegram|slackbot|facebookexternalhit|twitterbot|linkedinbot|discordbot|embedly|applebot|bingpreview|googlebot|skypeuripreview|vkshare|redditbot/i;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: cors });
  }

  try {
    const ua = req.headers.get('user-agent') ?? '';

    // Skip known link-preview crawlers so they don't inflate the funnel.
    if (BOT_UA.test(ua)) {
      return new Response(null, { status: 204, headers: cors });
    }

    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.code === 'string' ? body.code : '';
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

    // Silently accept a missing/invalid code — never surface errors to the
    // beacon; tracking must not affect the visitor's redirect.
    if (code.length >= 4) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await supabase.from('referral_clicks').insert({ code, user_agent: ua.slice(0, 300) });
    }
  } catch {
    // Non-fatal — respond 204 regardless so the beacon never blocks navigation.
  }

  return new Response(null, { status: 204, headers: cors });
});
