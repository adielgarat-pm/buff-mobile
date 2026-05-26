// pkg/fcm-push-notifications Phase 3 — Edge Function dispatch
//
// Triggered by Database Webhook on INSERT to public.notifications.
// Pulls device tokens for the recipient, applies activity-based suppression,
// formats per-type copy (parent or kid voice), dispatches via FCM HTTP v1.
//
// Secret required (set via Supabase Dashboard → Edge Functions → Secrets):
//   FCM_SERVICE_ACCOUNT_JSON — full JSON content of the Firebase Admin SDK
//                              service account
//
// Locked principles applied here:
//   - IN-2026-05-19-01: FCM HTTP v1 as single cross-platform backend
//   - IN-2026-05-19-02: generic delivery + activity-based suppression
//                        (skip push if recipient last_seen_at < 5 min)
//   - IN-2026-05-17-01: parent copy = declarative + connection-not-rescue
//   - IN-2026-05-19-03: kid copy = body-doubling, presence + autonomy-marker
//   - OQ-A18: idempotency via notification_pushes PK (notification_id)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

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

const PARENT_RECIPIENT_TYPES = new Set([
  'parent_sos',
  'reward_redeemed',
  'parent_engagement',
  'family_joined',
  'anchor_recovery',
]);

const KID_RECIPIENT_TYPES = new Set(['kid_engagement', 'reward_approved']);

const SKIP_PUSH_TYPES = new Set([
  'task_completed', // E3 locked off
  'quest_milestone', // E4 stale
]);

const SUPPRESSION_WINDOW_MS = 5 * 60 * 1000;

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

// ─── Copy library (parent declarative + kid body-doubling) ──────────────

type Lang = 'he' | 'en';

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
      case 'parent_engagement':
        return { title: `${name} פעיל/ה השבוע`, body: 'בא לראות?', data: {} };
      case 'family_joined':
        return { title: `${name} הצטרף/ה למשפחה 👋`, body: '', data: {} };
      case 'anchor_recovery':
        return { title: `${name} לקח/ה הפסקה`, body: 'יש שתי הצעות עדינות לפתיחה מחדש', data: {} };
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
    case 'parent_engagement':
      return { title: `${name} has been active this week`, body: 'Wanna see?', data: {} };
    case 'family_joined':
      return { title: `${name} joined the family 👋`, body: '', data: {} };
    case 'anchor_recovery':
      return { title: `${name} took a pause`, body: 'two gentle ways to open the door again', data: {} };
    case 'kid_engagement':
      return { title: buddy, body: 'here, ready when you are', data: {} };
    case 'reward_approved':
      return { title: buddy, body: 'parent said yes to something you asked for 🎉', data: {} };
    default:
      return null;
  }
}

// ─── FCM OAuth2 (JWT-bearer flow, RS256) ────────────────────────────────

function base64UrlEncodeString(str: string): string {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  private_key_id: string;
}

// Simple in-memory access-token cache (function instance lifetime).
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id };
  const claims = {
    iss: sa.client_email,
    scope: FCM_SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(JSON.stringify(claims))}`;

  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const assertion = `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(sig))}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OAuth2 token fetch failed: ${resp.status} ${text}`);
  }
  const data = (await resp.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in,
  };
  return data.access_token;
}

// ─── FCM dispatch ───────────────────────────────────────────────────────

interface SendResult {
  ok: boolean;
  status: number;
  error?: string;
  /** True if FCM returned UNREGISTERED → token is dead, delete from device_tokens */
  dead: boolean;
}

async function sendFcm(
  projectId: string,
  accessToken: string,
  token: string,
  payload: PushPayload,
  notificationId: string,
): Promise<SendResult> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const body = {
    message: {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...payload.data,
        notification_id: notificationId,
      },
      android: {
        notification: {
          channel_id: 'default',
        },
      },
    },
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (resp.ok) {
    return { ok: true, status: resp.status, dead: false };
  }
  const errText = await resp.text();
  // FCM returns 404 with errorCode UNREGISTERED for dead tokens
  const dead = resp.status === 404 || errText.includes('UNREGISTERED');
  return { ok: false, status: resp.status, error: errText, dead };
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

  // Activity-based suppression (IN-2026-05-19-02)
  const lastSeenMs = new Date(profile.last_seen_at).getTime();
  const sinceLastSeen = Date.now() - lastSeenMs;
  if (sinceLastSeen < SUPPRESSION_WINDOW_MS) {
    await recordPush(supabase, row.id, 0, 'recent_activity');
    return new Response(JSON.stringify({ skipped: 'recent_activity' }), { status: 200 });
  }

  // Load device tokens
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token, token_type')
    .eq('profile_id', recipientProfileId) as { data: DeviceToken[] | null };
  if (!tokens || tokens.length === 0) {
    await recordPush(supabase, row.id, 0, 'no_tokens');
    return new Response(JSON.stringify({ skipped: 'no_tokens' }), { status: 200 });
  }

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

  // Load FCM service account from env (set via Supabase Dashboard secrets)
  const saJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
  if (!saJson) {
    console.error('Missing FCM_SERVICE_ACCOUNT_JSON env secret');
    await recordPush(supabase, row.id, 0, 'no_service_account');
    return new Response('Service account not configured', { status: 500 });
  }
  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(saJson);
  } catch {
    console.error('Failed to parse FCM_SERVICE_ACCOUNT_JSON');
    await recordPush(supabase, row.id, 0, 'bad_service_account');
    return new Response('Bad service account', { status: 500 });
  }

  // Mint access token
  let accessToken: string;
  try {
    accessToken = await getAccessToken(serviceAccount);
  } catch (err) {
    console.error('OAuth2 token failed:', err);
    await recordPush(supabase, row.id, 0, 'oauth2_failed');
    return new Response('OAuth2 failed', { status: 500 });
  }

  // Dispatch to each token; collect dead ones for cleanup
  const deadTokens: string[] = [];
  let successCount = 0;
  for (const dt of tokens) {
    const result = await sendFcm(serviceAccount.project_id, accessToken, dt.token, copy, row.id);
    if (result.ok) {
      successCount++;
    } else if (result.dead) {
      deadTokens.push(dt.token);
    } else {
      console.error(`FCM send failed (non-dead): status=${result.status} err=${result.error}`);
    }
  }

  // Clean up dead tokens
  if (deadTokens.length > 0) {
    await supabase.from('device_tokens').delete().in('token', deadTokens);
  }

  // Audit log
  await recordPush(supabase, row.id, successCount, successCount > 0 ? null : 'all_dead');

  return new Response(
    JSON.stringify({
      notification_id: row.id,
      type: row.type,
      recipient: profile.role,
      tokens_attempted: tokens.length,
      success: successCount,
      dead: deadTokens.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
