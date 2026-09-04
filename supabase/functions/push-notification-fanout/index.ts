// pkg/fcm-push-notifications Phase 3 — Edge Function dispatch
//
// Triggered by Database Webhook on INSERT to public.notifications.
// Pulls device tokens for the recipient, applies activity-based suppression,
// formats per-type copy (parent or kid voice), dispatches via Expo Push API.
//
// Delivery path: the client mints Expo push tokens (getExpoPushTokenAsync);
// this function forwards them to Expo's push service, which proxies to FCM
// using the FCM credentials configured on the EAS project. No service-account
// secret is needed here — Expo holds the FCM credentials.
//
// Locked principles applied here:
//   - IN-2026-05-19-02: generic delivery + activity-based suppression
//                        (skip push if recipient last_seen_at < 5 min)
//   - IN-2026-05-17-01: parent copy = declarative + connection-not-rescue
//   - IN-2026-05-19-03: kid copy = body-doubling, presence + autonomy-marker
//   - OQ-A18: idempotency via notification_pushes PK (notification_id)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

// ─── Types ───────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  family_id: string;
  parent_id: string;
  type: string;
  child_id: string | null;
  child_name: string;
  entity_id: string | null;
  entity_name: string;
  is_read: boolean;
  created_at: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: NotificationRow | null;
  old_record: NotificationRow | null;
}

interface DeviceToken {
  token: string;
  token_type: 'fcm-android' | 'fcm-ios' | 'fcm-web';
}

interface WebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

interface ProfileMeta {
  id: string;
  display_name: string;
  preferred_language: string;
  last_seen_at: string;
  role: 'parent' | 'child';
}

interface PushPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

// ─── Constants (matches Event × Channel Matrix) ─────────────────────────

// pkg/notifications-hardening L6: "push = action-required". Parent-recipient
// types here all PUSH. INFO-level parent events live in the bell only (see
// SKIP_PUSH_TYPES below). child_suggestion (L7) needs the parent's approval, so
// it pushes; recipient = parent_id.
const PARENT_RECIPIENT_TYPES = new Set([
  'parent_sos',
  'reward_redeemed',
  'reward_redemption_requested',
  'child_suggestion', // L7 — was unmatched → suppressed as unknown_type
  'anchor_recovery', // churned kids only (cron applies ever-active gate)
  'activation_nudge', // L8 — never-activated families (new cron)
  'child_vibe_shared', // pkg/vibe-share-notification — kid-initiated positive twin of SOS
  'teen_task_added', // pkg/teen-autonomy — teen self-authored a task; FYI to parent (they can price it)
]);

const KID_RECIPIENT_TYPES = new Set(['kid_engagement', 'reward_approved']);

const SKIP_PUSH_TYPES = new Set([
  'task_completed', // E3 locked off
  'quest_milestone', // E4 stale
  // pkg/notifications-hardening L6 — INFO-level: bell-only, no push.
  'parent_engagement', // "kid active this week" — informational, not actionable
  'family_joined', // "X joined the family" — informational
]);

// pkg/notifications-hardening Phase 3b — per-channel preference enforcement.
// Maps a notification type to the app_settings column the family controls from
// the in-app Notification Settings screen. A type with no mapping is always
// allowed (e.g. reward_approved — a direct response to the kid's own request).
// Note: child reminders are gated family-level here; the 6–12 vs 13–18
// self-opt-in age split is Phase 5.
const TYPE_TO_PREF_COLUMN: Record<string, string> = {
  parent_sos: 'notif_parent_alerts',
  reward_redeemed: 'notif_parent_alerts',
  reward_redemption_requested: 'notif_parent_alerts',
  child_suggestion: 'notif_parent_alerts',
  anchor_recovery: 'notif_anchor_nudges',
  activation_nudge: 'notif_activation_nudges',
  kid_engagement: 'notif_child_reminders',
  // pkg/vibe-share-notification (D3): same channel as SOS — "my child reached out to me".
  child_vibe_shared: 'notif_parent_alerts',
  // pkg/teen-autonomy: reuse the parent-alerts channel (Adi 2026-09-04).
  teen_task_added: 'notif_parent_alerts',
};

const SUPPRESSION_WINDOW_MS = 5 * 60 * 1000;

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// ─── Copy library (parent declarative + kid body-doubling) ──────────────

type Lang = 'he' | 'en';

// pkg/vibe-share-notification — map a non-low vibe_level (3/4/5, carried in
// entity_name) to a warm mood word for the push body. Draft copy (OQ-B), Adi's
// gate. Kept inline here because the Edge runtime has no app-i18n access.
function vibeMoodWord(level: string, lang: Lang): string {
  const he: Record<string, string> = { '3': 'בסדר', '4': 'טוב', '5': 'מעולה' };
  const en: Record<string, string> = { '3': 'okay', '4': 'good', '5': 'great' };
  return (lang === 'he' ? he : en)[level] ?? '';
}

function copyForType(
  type: string,
  lang: Lang,
  fields: { name?: string; reward?: string; buddy_name?: string },
): PushPayload | null {
  const name = fields.name ?? '';
  const reward = fields.reward ?? '';
  const buddy = fields.buddy_name ?? 'BUDDY';

  if (lang === 'he') {
    switch (type) {
      case 'parent_sos':
        return { title: `${name} רצה/רצתה לשתף`, body: 'יום של אנרגיה נמוכה', data: {} };
      case 'reward_redeemed':
        return { title: `${name} בחר/ה פרס`, body: reward, data: {} };
      case 'reward_redemption_requested':
        return { title: `${name} רוצה לממש פרס`, body: reward, data: {} };
      case 'child_suggestion':
        return { title: `${name} רוצה להציע משהו 💡`, body: reward, data: {} };
      case 'teen_task_added':
        // pkg/teen-autonomy — teen self-authored a task; declarative FYI.
        return { title: `${name} הוסיף/ה משימה 📝`, body: reward, data: {} };
      case 'parent_engagement':
        return { title: `${name} פעיל/ה השבוע`, body: 'בא לראות?', data: {} };
      case 'family_joined':
        return { title: `${name} הצטרף/ה למשפחה 👋`, body: '', data: {} };
      case 'child_vibe_shared':
        // pkg/vibe-share-notification — kid-initiated; declarative, warm (OQ-B draft).
        return { title: `${name} רצה/רצתה לשתף איתך 💛`, body: `מרגיש/ה ${vibeMoodWord(reward, 'he')}`, data: {} };
      case 'anchor_recovery':
        // L-OQ4: canonical SPEC-approved copy (normalizing, connection-not-rescue).
        return { title: 'כולנו צריכים התחלה חדשה לפעמים', body: `הנה דרך עדינה לעזור ל-${name} לחזור`, data: {} };
      case 'activation_nudge':
        return { title: `${name} עוד לא התחיל/ה`, body: 'בואו ננסה צעד ראשון קטן ביחד 🌱', data: {} };
      case 'kid_engagement':
        return { title: buddy, body: 'פה, מוכן/ה כשתרצה', data: {} };
      case 'reward_approved':
        return { title: buddy, body: 'ההורה אישר/ה משהו שביקשת 🎉', data: {} };
      default:
        return null;
    }
  }
  // EN
  switch (type) {
    case 'parent_sos':
      return { title: `${name} wanted to share`, body: 'low energy today', data: {} };
    case 'reward_redeemed':
      return { title: `${name} chose a reward`, body: reward, data: {} };
    case 'reward_redemption_requested':
      return { title: `${name} wants to redeem a reward`, body: reward, data: {} };
    case 'child_suggestion':
      return { title: `${name} has a suggestion 💡`, body: reward, data: {} };
    case 'teen_task_added':
      // pkg/teen-autonomy — teen self-authored a task; declarative FYI.
      return { title: `${name} added a task 📝`, body: reward, data: {} };
    case 'parent_engagement':
      return { title: `${name} has been active this week`, body: 'Wanna see?', data: {} };
    case 'family_joined':
      return { title: `${name} joined the family 👋`, body: '', data: {} };
    case 'child_vibe_shared':
      // pkg/vibe-share-notification — kid-initiated; declarative, warm (OQ-B draft).
      return { title: `${name} wanted to share with you 💛`, body: `feeling ${vibeMoodWord(reward, 'en')}`, data: {} };
    case 'anchor_recovery':
      return { title: 'Everyone needs a fresh start sometimes', body: `Here's a gentle way to help ${name} return`, data: {} };
    case 'activation_nudge':
      return { title: `${name} hasn't started yet`, body: "let's try one small first step together 🌱", data: {} };
    case 'kid_engagement':
      return { title: buddy, body: 'here, ready when you are', data: {} };
    case 'reward_approved':
      return { title: buddy, body: 'parent said yes to something you asked for 🎉', data: {} };
    default:
      return null;
  }
}

// ─── Web Push dispatch (VAPID) ──────────────────────────────────────────

/**
 * Send a Web Push notification to all of a recipient's browser subscriptions.
 * VAPID credentials are read from Supabase secrets at runtime:
 *   VAPID_PUBLIC_KEY  — base64url-encoded P-256 public key
 *   VAPID_PRIVATE_KEY — base64url-encoded P-256 private key
 *   VAPID_EMAIL       — mailto: contact for the push service (e.g. mailto:adi@buffadhd.com)
 *
 * Returns the count of successfully sent pushes and removes expired subscriptions.
 */
async function sendWebPushNotifications(
  supabase: SupabaseClient,
  subscriptions: WebPushSubscription[],
  payload: PushPayload,
  recipientProfileId: string,
): Promise<number> {
  if (subscriptions.length === 0) return 0;

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidEmail = Deno.env.get('VAPID_EMAIL') ?? 'mailto:adi@buffadhd.com';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('[webpush] VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set');
    return 0;
  }

  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error('[webpush] setVapidDetails failed:', err);
    return 0;
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data,
  });

  const deadEndpoints: string[] = [];
  let successCount = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          pushPayload,
        );
        successCount++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — clean up
          deadEndpoints.push(sub.endpoint);
        } else {
          console.error('[webpush] send failed:', err);
        }
      }
    }),
  );

  if (deadEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('profile_id', recipientProfileId)
      .in('endpoint', deadEndpoints);
  }

  return successCount;
}

// ─── Expo Push dispatch ─────────────────────────────────────────────────

/** Expo push tokens look like ExponentPushToken[...] or ExpoPushToken[...]. */
function isExpoPushToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface BatchSendResult {
  successCount: number;
  /** Tokens Expo reported as DeviceNotRegistered → delete from device_tokens */
  deadTokens: string[];
}

/**
 * Send a batch of messages to the Expo push service. Expo proxies to FCM/APNs
 * using the credentials configured on the EAS project. Tickets are returned in
 * request order, so we map them back to tokens by index.
 */
async function sendExpoPush(
  tokens: string[],
  payload: PushPayload,
  notificationId: string,
): Promise<BatchSendResult> {
  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: { ...payload.data, notification_id: notificationId },
    channelId: 'default',
    priority: 'high',
  }));

  const resp = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Expo push request failed: status=${resp.status} err=${errText}`);
    return { successCount: 0, deadTokens: [] };
  }

  const json = (await resp.json()) as { data?: ExpoTicket[] };
  const tickets = json.data ?? [];

  const deadTokens: string[] = [];
  let successCount = 0;
  tickets.forEach((ticket, i) => {
    if (ticket.status === 'ok') {
      successCount++;
    } else {
      const detail = ticket.details?.error;
      if (detail === 'DeviceNotRegistered') {
        deadTokens.push(tokens[i]);
      } else {
        console.error(`Expo ticket error: ${detail ?? ''} ${ticket.message ?? ''}`);
      }
    }
  });

  return { successCount, deadTokens };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getRecipientProfileId(row: NotificationRow): string | null {
  if (KID_RECIPIENT_TYPES.has(row.type)) return row.child_id;
  if (PARENT_RECIPIENT_TYPES.has(row.type)) return row.parent_id;
  return null;
}

async function loadBuddyName(
  supabase: SupabaseClient,
  childId: string | null,
): Promise<string> {
  if (!childId) return 'BUDDY';
  const { data } = await supabase
    .from('buddy_relationships')
    .select('buddy_name')
    .eq('child_profile_id', childId)
    .maybeSingle();
  return data?.buddy_name ?? 'BUDDY';
}

async function recordPush(
  supabase: SupabaseClient,
  notificationId: string,
  recipientTokenCount: number,
  suppressedReason: string | null,
): Promise<void> {
  await supabase
    .from('notification_pushes')
    .insert({
      notification_id: notificationId,
      recipient_token_count: recipientTokenCount,
      suppressed_reason: suppressedReason,
    });
}

// ─── Main handler ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (
    payload.type !== 'INSERT' ||
    payload.table !== 'notifications' ||
    payload.schema !== 'public' ||
    !payload.record
  ) {
    return new Response('Ignored', { status: 200 });
  }

  const row = payload.record;

  // Skip types we never push
  if (SKIP_PUSH_TYPES.has(row.type)) {
    return new Response(JSON.stringify({ skipped: 'type_locked_off', type: row.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Init Supabase service-role client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response('Server misconfigured', { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Idempotency guard — has this notification already been processed?
  const { data: existingPush } = await supabase
    .from('notification_pushes')
    .select('notification_id')
    .eq('notification_id', row.id)
    .maybeSingle();
  if (existingPush) {
    return new Response(JSON.stringify({ idempotent_skip: true, id: row.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Determine recipient
  const recipientProfileId = getRecipientProfileId(row);
  if (!recipientProfileId) {
    await recordPush(supabase, row.id, 0, 'unknown_type');
    return new Response(JSON.stringify({ skipped: 'unknown_type', type: row.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Load recipient profile (for language + last_seen_at)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, preferred_language, last_seen_at, role')
    .eq('id', recipientProfileId)
    .maybeSingle() as { data: ProfileMeta | null };
  if (!profile) {
    await recordPush(supabase, row.id, 0, 'no_recipient_profile');
    return new Response(JSON.stringify({ skipped: 'no_recipient_profile' }), { status: 200 });
  }

  // Preference enforcement (Phase 3b) — respect the family's in-app toggles.
  // Read once per fanout; suppress if the channel's column is explicitly false.
  const prefColumn = TYPE_TO_PREF_COLUMN[row.type];
  if (prefColumn) {
    const { data: settings } = await supabase
      .from('app_settings')
      .select(prefColumn)
      .eq('family_id', row.family_id)
      .maybeSingle() as { data: Record<string, boolean> | null };
    // Default-allow when no row/column value is present (mirrors column defaults;
    // only an explicit false suppresses).
    if (settings && settings[prefColumn] === false) {
      await recordPush(supabase, row.id, 0, 'pref_off');
      return new Response(JSON.stringify({ skipped: 'pref_off', channel: prefColumn }), { status: 200 });
    }
  }

  // Activity-based suppression (IN-2026-05-19-02)
  const lastSeenMs = new Date(profile.last_seen_at).getTime();
  const sinceLastSeen = Date.now() - lastSeenMs;
  if (sinceLastSeen < SUPPRESSION_WINDOW_MS) {
    await recordPush(supabase, row.id, 0, 'recent_activity');
    return new Response(JSON.stringify({ skipped: 'recent_activity' }), { status: 200 });
  }

  // Load device tokens (Expo/native). A recipient may have only web subscriptions —
  // so we don't early-exit here; we fall through to the web-push branch.
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token, token_type')
    .eq('profile_id', recipientProfileId) as { data: DeviceToken[] | null };

  // Format copy
  const lang: Lang = (profile.preferred_language === 'he' ? 'he' : 'en');
  const buddyName = KID_RECIPIENT_TYPES.has(row.type)
    ? await loadBuddyName(supabase, row.child_id)
    : '';
  const copy = copyForType(row.type, lang, {
    name: row.child_name,
    reward: row.entity_name,
    buddy_name: buddyName,
  });
  if (!copy) {
    await recordPush(supabase, row.id, 0, 'no_copy_for_type');
    return new Response(JSON.stringify({ skipped: 'no_copy_for_type' }), { status: 200 });
  }

  // Add routing data
  copy.data = {
    ...copy.data,
    type: row.type,
    entity_id: row.entity_id ?? '',
    child_id: row.child_id ?? '',
    family_id: row.family_id,
  };

  // ── Expo push (native Android + iOS) ──────────────────────────────────
  const expoTokens = (tokens ?? []).map((t) => t.token).filter(isExpoPushToken);
  let expoSuccess = 0;
  let expoDeadCount = 0;
  if (expoTokens.length > 0) {
    const { successCount, deadTokens } = await sendExpoPush(expoTokens, copy, row.id);
    expoSuccess = successCount;
    expoDeadCount = deadTokens.length;
    if (deadTokens.length > 0) {
      await supabase.from('device_tokens').delete().in('token', deadTokens);
    }
  }

  // ── Web Push (PWA — browser subscriptions) ─────────────────────────────
  const { data: webSubs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('profile_id', recipientProfileId) as { data: WebPushSubscription[] | null };

  let webSuccess = 0;
  try {
    webSuccess = await sendWebPushNotifications(
      supabase,
      webSubs ?? [],
      copy,
      recipientProfileId,
    );
  } catch (err) {
    console.error('[webpush] sendWebPushNotifications threw:', err);
  }

  const totalSuccess = expoSuccess + webSuccess;

  // Audit log (total across channels)
  await recordPush(supabase, row.id, totalSuccess, totalSuccess > 0 ? null : 'all_dead');

  return new Response(
    JSON.stringify({
      notification_id: row.id,
      type: row.type,
      recipient: profile.role,
      expo_tokens_attempted: expoTokens.length,
      expo_success: expoSuccess,
      expo_dead: expoDeadCount,
      web_subs_attempted: (webSubs ?? []).length,
      web_success: webSuccess,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
