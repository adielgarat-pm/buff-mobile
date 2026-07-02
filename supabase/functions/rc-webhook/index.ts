/**
 * rc-webhook — Supabase Edge Function for RevenueCat Founding 100 events.
 *
 * Receives RevenueCat webhook POSTs, verifies the shared-secret in the
 * Authorization header, and dispatches to one of two Postgres RPCs:
 *
 *   - grant_founding_membership  — on INITIAL_PURCHASE / NON_RENEWING_PURCHASE
 *   - revoke_founding_membership — on CANCELLATION / EXPIRATION / REFUND
 *
 * Both RPCs are idempotent and race-safe (advisory lock). See
 * migrations/003_founding_100_rpc.sql for the SQL.
 *
 * Source SPEC: docs/sessions/founding-100-payment/SPEC.md §Phases / Phase 2
 *
 * Required Supabase secrets (set via `supabase secrets set` or dashboard):
 *   REVENUECAT_WEBHOOK_SECRET  — the shared secret configured in RC dashboard
 *
 * Auto-provided by Supabase runtime:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  — needed to call SECURITY DEFINER RPCs
 *
 * Why verify_jwt = false:
 *   This webhook is invoked by RevenueCat (external service) which does not
 *   send a Supabase JWT. We authenticate via shared secret instead. The edge
 *   function MUST be deployed with verify_jwt = false (set via the MCP tool's
 *   verify_jwt parameter or via supabase config).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RC_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// SKUs that map to Founding 100 lifetime tier. Update if pricing tiers change
// (e.g. if Adi adds a $129 mid-tier).
const FOUNDING_PRODUCT_IDS = new Set<string>([
  "lifetime_founding_99",
  "lifetime_founding_149",
]);

// RC event taxonomy: https://www.revenuecat.com/docs/webhooks
const PURCHASE_EVENTS = new Set<string>([
  "INITIAL_PURCHASE",      // first-time subscription (or first purchase of a one-time SKU)
  "NON_RENEWING_PURCHASE", // one-time / non-renewing product (the Founding 100 case)
]);

const REVOKE_EVENTS = new Set<string>([
  "CANCELLATION",  // user-initiated cancel
  "EXPIRATION",    // subscription expired (not really applicable to lifetime, but defensive)
  "REFUND",        // store-initiated refund (the main "money back" case)
]);

interface RCEvent {
  type?: string;
  id?: string;
  app_user_id?: string;
  product_id?: string;
  environment?: "PRODUCTION" | "SANDBOX";
  store?: string;
  event_timestamp_ms?: number;
  [key: string]: unknown;
}

interface RCWebhookPayload {
  api_version?: string;
  event?: RCEvent;
}

function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // ── 1. Method check ────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── 2. Auth: shared secret in Authorization header ─────────────────────────
  // RC sends the secret as the bare header value (newer) or "Bearer <secret>"
  // (older). Accept both forms.
  const authHeader = req.headers.get("authorization") ?? "";
  const presented = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!RC_WEBHOOK_SECRET) {
    console.error("[rc-webhook] REVENUECAT_WEBHOOK_SECRET is not set");
    return new Response("Server misconfigured", { status: 500 });
  }
  if (presented !== RC_WEBHOOK_SECRET) {
    console.warn("[rc-webhook] auth mismatch — request rejected");
    return new Response("Unauthorized", { status: 401 });
  }

  // ── 3. Parse body ──────────────────────────────────────────────────────────
  let payload: RCWebhookPayload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error("[rc-webhook] body parse error:", err);
    return new Response("Bad payload", { status: 400 });
  }

  const event = payload?.event;
  if (!event) {
    return jsonResponse({ skipped: "no event in payload" });
  }

  const {
    type,
    id: eventId,
    app_user_id: appUserId,
    product_id: productId,
    environment,
  } = event;

  // ── 3.5 Environment gate: only PRODUCTION purchases mutate the DB ───────────
  // SANDBOX events (license-tester / sandbox test purchases) are acknowledged
  // with 200 but never grant/revoke. Without this, a sandbox Founding test
  // purchase would consume a REAL Founding-100 cap slot — and revoked founding
  // numbers are never reissued, so the real cap would permanently drop below 100.
  if (environment !== "PRODUCTION") {
    console.log(
      `[rc-webhook] non-production event skipped: env=${environment} type=${type} event_id=${eventId}`,
    );
    return jsonResponse({
      skipped: "non-production environment",
      environment,
      event_id: eventId,
    });
  }

  // ── 4. Filter to Founding 100 products only ────────────────────────────────
  if (!productId || !FOUNDING_PRODUCT_IDS.has(productId)) {
    return jsonResponse({
      skipped: "not a founding product",
      product_id: productId,
      event_id: eventId,
    });
  }

  if (!appUserId) {
    return jsonResponse(
      { error: "missing app_user_id", event_id: eventId },
      400,
    );
  }

  // ── 5. Log the event ───────────────────────────────────────────────────────
  console.log(
    `[rc-webhook] type=${type} user=${appUserId} product=${productId} env=${environment} event_id=${eventId}`,
  );

  // ── 6. DB client ───────────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 7. Dispatch ────────────────────────────────────────────────────────────

  if (type && PURCHASE_EVENTS.has(type)) {
    const { data, error } = await supabase.rpc("grant_founding_membership", {
      p_user_id: appUserId,
    });

    if (error) {
      console.error(`[rc-webhook] grant failed: ${error.message}`);
      return jsonResponse(
        { error: error.message, event_id: eventId },
        500,
      );
    }

    if (data === null) {
      console.log(`[rc-webhook] cap reached — user=${appUserId} blocked`);
      return jsonResponse({
        granted: false,
        reason: "Founding 100 cap reached",
        event_id: eventId,
      });
    }

    console.log(`[rc-webhook] granted #${data} to user=${appUserId}`);
    return jsonResponse({
      granted: true,
      founding_member_number: data,
      event_id: eventId,
    });
  }

  if (type && REVOKE_EVENTS.has(type)) {
    const { data, error } = await supabase.rpc("revoke_founding_membership", {
      p_user_id: appUserId,
    });

    if (error) {
      console.error(`[rc-webhook] revoke failed: ${error.message}`);
      return jsonResponse(
        { error: error.message, event_id: eventId },
        500,
      );
    }

    console.log(`[rc-webhook] revoke result for user=${appUserId}: ${data}`);
    return jsonResponse({
      revoked: data === true,
      event_id: eventId,
    });
  }

  // ── 8. Unknown event type ──────────────────────────────────────────────────
  return jsonResponse({
    skipped: `event type ${type} not handled`,
    event_id: eventId,
  });
});
