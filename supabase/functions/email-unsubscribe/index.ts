/**
 * email-unsubscribe — one-click unsubscribe for lifecycle emails.
 *
 * pkg/lifecycle-emails Phase 1 (SPEC: docs/sessions/lifecycle-emails/SPEC.md).
 *
 * Every lifecycle email footer links here:
 *   GET  <fn-url>?pid=<profile_id>&sig=<hmac>
 * and the List-Unsubscribe-Post one-click flow POSTs to the same URL.
 *
 * Token: sig = hex(HMAC-SHA256(key = SUPABASE_SERVICE_ROLE_KEY, msg = "unsub:" + pid)).
 * The sender function derives the same signature, so no extra secret is needed.
 * Rotating the service-role key invalidates old links (documented in SPEC —
 * acceptable: a dead link fails CLOSED, and the recipient can reply instead).
 *
 * Effect: sets profiles.marketing_consent = false (the single consent gate all
 * lifecycle sends re-check at send time) and appends an email_logs row
 * (template_key 'unsubscribe'). Idempotent — repeat clicks return the same page.
 *
 * verify_jwt = false: recipients click from their inbox with no session.
 * Auth is the HMAC signature; without a valid sig nothing is mutated.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function expectedSig(profileId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SERVICE_ROLE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`unsub:${profileId}`),
  );
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function htmlPage(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#f7f7fb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
main{background:#fff;border-radius:16px;padding:32px 28px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.06)}
h1{font-size:1.25rem;margin:0 0 12px}p{color:#444;line-height:1.6;margin:0}</style></head>
<body><main><h1>${title}</h1><p>${body}</p></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

Deno.serve(async (req: Request) => {
  // GET = human click from the email footer; POST = RFC 8058 one-click
  // (List-Unsubscribe-Post). Both carry pid/sig in the query string.
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const pid = url.searchParams.get("pid") ?? "";
  const sig = url.searchParams.get("sig") ?? "";

  if (!UUID_RE.test(pid) || !/^[0-9a-f]{64}$/i.test(sig)) {
    return htmlPage(
      "הקישור לא תקין",
      "אפשר פשוט להשיב למייל שקיבלתם ולכתוב 'הסרה' — ונטפל בזה ידנית.",
      400,
    );
  }

  const expected = await expectedSig(pid);
  if (!timingSafeEqual(sig.toLowerCase(), expected)) {
    console.warn(`[email-unsubscribe] bad signature for pid=${pid}`);
    return htmlPage(
      "הקישור לא תקין",
      "אפשר פשוט להשיב למייל שקיבלתם ולכתוב 'הסרה' — ונטפל בזה ידנית.",
      400,
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: updateError } = await supabase
    .from("profiles")
    .update({ marketing_consent: false })
    .eq("id", pid)
    .select("id, user_id")
    .maybeSingle();

  if (updateError) {
    console.error(`[email-unsubscribe] update failed: ${updateError.message}`);
    return htmlPage(
      "משהו השתבש",
      "לא הצלחנו להסיר אתכם אוטומטית. השיבו למייל עם המילה 'הסרה' ונעשה זאת ידנית.",
      500,
    );
  }

  if (!profile) {
    // Valid signature but no such profile (deleted account) — nothing to do.
    return htmlPage("הוסרתם מהרשימה", "לא תקבלו מאיתנו יותר מיילים.");
  }

  const { error: logError } = await supabase.from("email_logs").insert({
    profile_id: profile.id,
    user_id: profile.user_id,
    email_to: "", // PII minimization — profile_id is enough to identify the row
    template_key: "unsubscribe",
    language: "he",
    status: "unsubscribed",
  });
  if (logError) {
    // Consent is already off — the log row is best-effort.
    console.error(`[email-unsubscribe] log insert failed: ${logError.message}`);
  }

  console.log(`[email-unsubscribe] consent removed for profile=${pid}`);
  return htmlPage(
    "הוסרתם מהרשימה",
    "לא תקבלו מאיתנו יותר מיילים. אם תתחרטו — אפשר להפעיל מחדש בהגדרות האפליקציה.",
  );
});
