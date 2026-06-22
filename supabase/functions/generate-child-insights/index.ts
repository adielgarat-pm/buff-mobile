// generate-child-insights — Smart Insights Edge Function (Premium only)
//
// Called by the parent after optionally adding a weekly context note.
// Reads all child data, calls Claude Haiku, writes smart_insight to child_insights.
//
// Auth: JWT from the calling parent (authenticated role).
// Premium gate: checks subscription_status on the parent's profile.
// Language: uses child's pro_settings.language (he | en), defaults to 'he'.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY       = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL            = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY       = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLast14Days(): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

interface CategoryStat { category: string | null; rate: number; count: number }

function buildCategoryStats(
  tasks: { id: string; category: string | null }[],
  progress: { task_id: string; date: string; completed: boolean }[],
  dates: string[],
): CategoryStat[] {
  const byCategory = new Map<string, { scheduled: number; completed: number }>();

  for (const task of tasks) {
    const cat = task.category ?? 'other';
    const taskProgress = progress.filter(p => p.task_id === task.id);
    for (const date of dates) {
      const entry = taskProgress.find(p => p.date === date);
      const stat = byCategory.get(cat) ?? { scheduled: 0, completed: 0 };
      stat.scheduled++;
      if (entry?.completed) stat.completed++;
      byCategory.set(cat, stat);
    }
  }

  return Array.from(byCategory.entries()).map(([category, s]) => ({
    category: category === 'other' ? null : category,
    rate: s.scheduled > 0 ? Math.round((s.completed / s.scheduled) * 100) : 0,
    count: s.scheduled,
  }));
}

function countActiveDays(
  progress: { date: string; completed: boolean }[],
): number {
  const active = new Set<string>();
  for (const p of progress) {
    if (p.completed) active.add(p.date);
  }
  return active.size;
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

function buildPrompt(opts: {
  childName: string;
  age: number | null;
  gender: string | null;
  categoryStats: CategoryStat[];
  activeDays14: number;
  balance: number;
  cheapestReward: number | null;
  approvedRedemptions: number;
  parentContext: string | null | undefined;
  language: string;
}): string {
  const {
    childName, age, gender, categoryStats, activeDays14,
    balance, cheapestReward, approvedRedemptions, parentContext, language,
  } = opts;

  const isHebrew = language === 'he';

  // Category summary for prompt (human-readable)
  const catLines = categoryStats
    .filter(c => c.count >= 3)
    .sort((a, b) => a.rate - b.rate)
    .map(c => {
      const label = c.category ?? 'other';
      const level = c.rate >= 70 ? 'strong' : c.rate >= 40 ? 'moderate' : 'struggling';
      return `  - ${label}: ${c.rate}% (${level})`;
    })
    .join('\n');

  const rewardLine = cheapestReward !== null
    ? `Balance: ${balance} BUFFs, cheapest reward: ${cheapestReward} BUFFs, recent redeemed: ${approvedRedemptions} in 14 days`
    : `Balance: ${balance} BUFFs, no rewards defined yet`;

  const parentLine = parentContext
    ? (isHebrew
        ? `\nמה ההורה שיתף על השבוע הזה:\n"${parentContext}"`
        : `\nWhat the parent shared about this week:\n"${parentContext}"`)
    : '';

  const langInstruction = isHebrew
    ? 'Respond entirely in Hebrew (modern, warm Israeli Hebrew). Use "הילד/ה" according to gender below.'
    : 'Respond entirely in English.';

  const genderNote = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'unknown';

  return `You are a warm, evidence-based ADHD advisor for parents. You have real data about a child and must give the parent ONE insight and ONE specific action for this week.

CHILD: ${childName}, age ${age ?? 'unknown'}, gender: ${genderNote}

LAST 14 DAYS DATA:
- Active days (completed at least one task): ${activeDays14} of 14
- Task completion by category:
${catLines || '  - (no category data yet)'}
- Rewards: ${rewardLine}
${parentLine}

RULES (non-negotiable):
1. ${langInstruction}
2. Never use the words "failed", "behind", "dropped", "struggle", "problem" — always forward-facing.
3. The mechanism is always biological ("the way the brain works after a school day") not behavioral ("he/she is lazy").
4. Max 2 sentences for message, 1 sentence for action.
5. If parent context is provided, weave it into the insight — connect their lived experience to the data pattern.
6. The action must be something the parent can do TODAY or THIS WEEK — concrete, not theoretical.
7. Never mention percentages or numbers to the parent — translate to human language ("mornings are going really well", not "82% completion").
8. Sound like a knowledgeable friend who knows this child, not a clinical report.
9. cta_type must be exactly one of: "send-bonus", "open-rewards", "start-conversation", "set-anchor", "none"
   - send-bonus: when the week was genuinely strong → recognize it
   - open-rewards: when reward loop is broken (hoarding / can't afford)
   - set-anchor: when meds or one specific anchor task is the issue
   - start-conversation: when the insight requires an IRL conversation with the child
   - none: when the action is external (sleep, light, routine change)

Respond with ONLY valid JSON, no other text:
{
  "headline": "2-5 words summarizing the key pattern",
  "message": "1-2 sentences — what you observe (connect data + parent context if given)",
  "action": "1 sentence — the specific thing to try this week",
  "cta_type": "one of the 5 types above"
}`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // Verify the JWT to get the calling user
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // Service client for all data reads/writes
  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { child_id: string; parent_context?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400, headers: corsHeaders });
  }
  const { child_id, parent_context } = body;
  if (!child_id) {
    return new Response('child_id required', { status: 400, headers: corsHeaders });
  }

  // ── Premium gate ───────────────────────────────────────────────────────────
  const { data: parentProfile } = await svc
    .from('profiles')
    .select('family_id, subscription_status')
    .eq('id', user.id)
    .single();

  if (!parentProfile) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  const isPremium =
    parentProfile.subscription_status === 'premium' ||
    parentProfile.subscription_status === 'lifetime';

  if (!isPremium) {
    return new Response(
      JSON.stringify({ error: 'Premium required' }),
      { status: 402, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  }

  // ── Verify child belongs to this family ───────────────────────────────────
  const { data: childProfile } = await svc
    .from('profiles')
    .select('id, name, age, gender, pro_settings, family_id')
    .eq('id', child_id)
    .eq('family_id', parentProfile.family_id)
    .single();

  if (!childProfile) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  // ── Fetch child data ───────────────────────────────────────────────────────
  const dates14 = getLast14Days();

  const [
    { data: tasks },
    { data: progress },
    { data: creditVault },
    { data: rewards },
    { data: redemptions },
  ] = await Promise.all([
    svc.from('tasks')
      .select('id, title, category')
      .eq('family_id', parentProfile.family_id)
      .or(`assigned_to.is.null,assigned_to.eq.${child_id}`)
      .eq('is_off_routine', false),
    svc.from('daily_progress')
      .select('task_id, date, completed')
      .eq('child_id', child_id)
      .eq('family_id', parentProfile.family_id)
      .in('date', dates14),
    svc.from('credit_vault')
      .select('balance')
      .eq('child_id', child_id)
      .maybeSingle(),
    svc.from('store_rewards')
      .select('title, cost')
      .eq('family_id', parentProfile.family_id)
      .eq('is_active', true),
    svc.from('reward_redemptions')
      .select('status, created_at')
      .eq('child_id', child_id)
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const categoryStats = buildCategoryStats(tasks ?? [], progress ?? [], dates14);
  const activeDays14  = countActiveDays(progress ?? []);
  const balance       = creditVault?.balance ?? 0;
  const cheapestReward = rewards && rewards.length > 0
    ? Math.min(...rewards.map((r: { cost: number }) => r.cost))
    : null;
  const approvedRedemptions = (redemptions ?? []).filter(
    (r: { status: string }) => r.status === 'approved',
  ).length;

  const language = (childProfile.pro_settings as Record<string, string> | null)?.language ?? 'he';

  // ── Build prompt + call Claude Haiku ──────────────────────────────────────
  const prompt = buildPrompt({
    childName:          childProfile.name ?? 'הילד',
    age:                childProfile.age ?? null,
    gender:             childProfile.gender ?? null,
    categoryStats,
    activeDays14,
    balance,
    cheapestReward,
    approvedRedemptions,
    parentContext:      parent_context ?? null,
    language,
  });

  let smartInsight: Record<string, string>;
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          ANTHROPIC_API_KEY,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      console.error('Anthropic error', anthropicRes.status, await anthropicRes.text());
      return new Response('LLM unavailable', { status: 502, headers: corsHeaders });
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData.content?.[0]?.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    smartInsight = JSON.parse(jsonMatch?.[0] ?? rawText);
  } catch (e) {
    console.error('Parse error', e);
    return new Response('Parse error', { status: 500, headers: corsHeaders });
  }

  // ── Upsert to child_insights ───────────────────────────────────────────────
  // Use a raw SQL upsert so we can preserve the existing `weekly` + `tip` columns
  // (owned by pg_cron basic tier) while only updating the smart-tier columns.
  const { error: upsertError } = await svc.rpc('upsert_smart_insight', {
    p_child_id:      child_id,
    p_smart_insight: smartInsight,
    p_parent_context: parent_context ?? null,
    p_window_end:    new Date().toISOString().split('T')[0],
  });

  if (upsertError) {
    console.error('Upsert error', upsertError);
    // Don't fail the request — return the insight even if cache write failed
  }

  return new Response(JSON.stringify(smartInsight), {
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});
