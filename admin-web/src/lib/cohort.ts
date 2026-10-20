// Pure derivation helpers for the Tester Board. No I/O — everything is computed
// from the RPC payload so the same logic powers the board and the deep-dive.

import type { Entitlement, Flag, Stage, TesterChild, TesterFamily } from './types'

const DAY = 24 * 60 * 60 * 1000

/** Patterns that mark an internal/test/dev account (shown with a "test" tag):
 *  the word "test", dev sandboxes (@example.com), and internal BUFF accounts
 *  (buffapp, demo, @buff.app, @buffadhd.com, buff.parenting, Adi's aliases). */
const TEST_PATTERNS = [
  /test/i,
  /buffapp/i,
  /demo/i,
  /adi\.elgarat/i,
  /eli ?elgarat/i,
  /אקדא4/,
  /@example\.com/i,
  /@buff\.app/i,
  /@buffadhd\.com/i,
  /buff\.parenting/i,
  /leia@/i,
]

export function isTestFamily(f: TesterFamily): boolean {
  const haystack = `${f.name} ${f.parent_name ?? ''} ${f.parent_email ?? ''} ${f.children
    .map((c) => c.name)
    .join(' ')}`
  return TEST_PATTERNS.some((re) => re.test(haystack))
}

// ---- aggregate signals across a family's children -------------------------

export function totalTasks(f: TesterFamily): number {
  return f.children.reduce((n, c) => n + c.tasks.length, 0)
}

export function childProposedTasks(f: TesterFamily): number {
  return f.children.reduce((n, c) => n + c.tasks.filter((t) => t.proposed_by_child).length, 0)
}

export function totalCompletions(f: TesterFamily): number {
  return f.children.reduce((n, c) => n + c.completions_total, 0)
}

/** Most recent sign of life across the family — a completed task, an app open
 *  (last_seen_at) or a login (last_sign_in_at), whichever is latest. Opening the
 *  app counts as activity, not only finishing a task (Adi, 2026-10-20). */
export function lastActive(f: TesterFamily): Date | null {
  let max: number | null = null
  const bump = (iso: string | null | undefined) => {
    if (!iso) return
    const t = new Date(iso).getTime()
    if (!Number.isNaN(t) && (max === null || t > max)) max = t
  }
  for (const c of f.children) {
    bump(c.last_active)
    bump(c.last_seen_at)
    bump(c.last_sign_in_at)
  }
  for (const p of f.parents ?? []) {
    bump(p.last_seen_at)
    bump(p.last_sign_in_at)
  }
  return max === null ? null : new Date(max)
}

/** Latest app-open / login across the whole family (opens + logins only, NOT
 *  completions). Lets us tell "opened recently but completed nothing" apart
 *  from a truly dormant family. Caveat: shared-device kids stamp the parent's
 *  profile, and web opens were unreliable before migration 060 — so this is
 *  strongest for own-device kids and parents. */
export function lastOpen(f: TesterFamily): Date | null {
  let max: number | null = null
  const bump = (iso: string | null | undefined) => {
    if (!iso) return
    const t = new Date(iso).getTime()
    if (!Number.isNaN(t) && (max === null || t > max)) max = t
  }
  for (const c of f.children) {
    bump(c.last_seen_at)
    bump(c.last_sign_in_at)
  }
  for (const p of f.parents ?? []) {
    bump(p.last_seen_at)
    bump(p.last_sign_in_at)
  }
  return max === null ? null : new Date(max)
}

/** True when someone in the family opened the app or logged in within `days`. */
export function openedWithin(f: TesterFamily, days: number, now = Date.now()): boolean {
  const o = lastOpen(f)
  return o !== null && now - o.getTime() <= days * DAY
}

/** A single child's latest sign of life: completion, app open, or login. */
export function childLastActivity(c: TesterChild): string | null {
  let max: number | null = null
  for (const iso of [c.last_active, c.last_seen_at, c.last_sign_in_at]) {
    if (!iso) continue
    const t = new Date(iso).getTime()
    if (!Number.isNaN(t) && (max === null || t > max)) max = t
  }
  return max === null ? null : new Date(max).toISOString()
}

/** Completions in the last `days` days across the whole family. */
export function completionsWithin(f: TesterFamily, days: number, now = Date.now()): number {
  const cutoff = now - days * DAY
  let sum = 0
  for (const c of f.children) {
    for (const d of c.completions_by_day) {
      if (new Date(d.date).getTime() >= cutoff) sum += d.count
    }
  }
  return sum
}

// ---- funnel stage + attention flag ----------------------------------------

export function stageOf(f: TesterFamily, now = Date.now()): Stage {
  const activated = f.children.length > 0
  const engaged = activated && totalTasks(f) > 0
  const active = engaged && completionsWithin(f, 7, now) > 0
  if (active) return 'active'
  if (engaged) return 'engaged'
  if (activated) return 'activated'
  return 'signed_up'
}

export function flagOf(f: TesterFamily, now = Date.now()): Flag {
  // No child (or child but no tasks) after >24h = stuck in onboarding.
  const ageMs = now - new Date(f.created_at).getTime()
  if (f.children.length === 0 && ageMs > DAY) return 'stuck'
  if (totalTasks(f) === 0 && ageMs > DAY) return 'stuck'

  const completed = totalCompletions(f) > 0
  if (!completed) {
    // Engaged (has tasks) but no completion yet. If someone opened the app or
    // logged in recently, they ARE using it — surface that distinctly from a
    // truly dormant family. Does not affect the completion-based funnel KPI.
    return openedWithin(f, 7, now) ? 'opened_no_tasks' : 'not_started'
  }

  // Has completed before — green if recent, yellow if gone quiet.
  if (completionsWithin(f, 3, now) > 0) return 'active'
  return 'churn_risk'
}

// ---- 14-day retention grid (per-tester window) ----------------------------

export type RetentionCell = 'hit' | 'miss' | 'na'

/** Sum of completions per calendar date across all children. */
function completionsByDate(f: TesterFamily): Map<string, number> {
  const m = new Map<string, number>()
  for (const c of f.children) {
    for (const d of c.completions_by_day) {
      m.set(d.date, (m.get(d.date) ?? 0) + d.count)
    }
  }
  return m
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/**
 * 14 cells for the trailing window ending today (rolling), so the strip lines
 * up with the "Active (7d)" badge instead of showing each family's first two
 * weeks forever. 'hit' = >=1 completion that day, 'miss' = none, 'na' = a day
 * before the family signed up. Only task completions have per-day history —
 * app-opens/logins aren't stored per day, so they can't light a cell (the
 * row-level "Last active" and the 🔵 "Opened, no tasks" flag carry that signal).
 */
export function retentionCells(f: TesterFamily, len = 14, now = Date.now()): RetentionCell[] {
  const byDate = completionsByDate(f)
  const signup = new Date(f.created_at)
  const signupIso = isoDate(
    Date.UTC(signup.getUTCFullYear(), signup.getUTCMonth(), signup.getUTCDate()),
  )
  const today = new Date(now)
  const endMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const cells: RetentionCell[] = []
  for (let i = 0; i < len; i++) {
    const dayIso = isoDate(endMs - (len - 1 - i) * DAY)
    if (dayIso < signupIso) cells.push('na')
    else cells.push((byDate.get(dayIso) ?? 0) > 0 ? 'hit' : 'miss')
  }
  return cells
}

/** Whole days since the family signed up (0 on the signup day). */
export function ageInDays(f: TesterFamily, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(f.created_at).getTime()) / DAY))
}

// ---- misc -----------------------------------------------------------------

export function relativeTime(iso: string | null, now = Date.now()): string {
  if (!iso) return '—'
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function childRewardRedeemed(c: TesterChild): number {
  return c.rewards.filter((r) => r.is_redeemed).length
}

export interface FunnelCounts {
  signed_up: number
  activated: number
  engaged: number
  active: number
}

export function funnelCounts(families: TesterFamily[], now = Date.now()): FunnelCounts {
  const c: FunnelCounts = { signed_up: 0, activated: 0, engaged: 0, active: 0 }
  for (const f of families) {
    c.signed_up++
    const s = stageOf(f, now)
    if (s === 'activated' || s === 'engaged' || s === 'active') c.activated++
    if (s === 'engaged' || s === 'active') c.engaged++
    if (s === 'active') c.active++
  }
  return c
}

/** How many families are stuck EXACTLY at each stage (didn't progress past it). */
export function exactStageCounts(families: TesterFamily[], now = Date.now()): Record<Stage, number> {
  const c: Record<Stage, number> = { signed_up: 0, activated: 0, engaged: 0, active: 0 }
  for (const f of families) c[stageOf(f, now)]++
  return c
}

/** How many families carry each attention flag. */
export function flagCounts(families: TesterFamily[], now = Date.now()): Record<Flag, number> {
  const c: Record<Flag, number> = {
    active: 0,
    churn_risk: 0,
    opened_no_tasks: 0,
    not_started: 0,
    stuck: 0,
  }
  for (const f of families) c[flagOf(f, now)]++
  return c
}

export function childCount(f: TesterFamily): number {
  return f.children.length
}

// ---- billing / entitlement ------------------------------------------------

/** Paying beats lifetime (a real payment is the stronger signal).
 *
 *  Trial detection: start_trial_on_activation writes premium_until =
 *  trial_started_at + 14 days for ALL parents in the family. A premium_until
 *  that lands in that window (±2d tolerance for later re-grants/extensions)
 *  is the auto-trial, NOT a payment. A real payment pushes premium_until
 *  beyond the trial window and classifies as 'paying' again. Lapsed trials
 *  return null (a trial that ended is just a free family, not 'expired'). */
export function entitlementOf(f: TesterFamily, now = Date.now()): Entitlement {
  if (f.premium_until) {
    const until = new Date(f.premium_until).getTime()
    const trialStart = f.trial_started_at ? new Date(f.trial_started_at).getTime() : null
    const isTrial =
      trialStart !== null && Math.abs(until - (trialStart + 14 * DAY)) <= 2 * DAY
    if (until > now) return isTrial ? 'trial' : 'paying'
    return isTrial ? null : 'expired'
  }
  return f.has_lifetime ? 'lifetime' : null
}

export function entitlementCounts(
  families: TesterFamily[],
  now = Date.now(),
): Record<'paying' | 'trial' | 'expired' | 'lifetime', number> {
  const c = { paying: 0, trial: 0, expired: 0, lifetime: 0 }
  for (const f of families) {
    const e = entitlementOf(f, now)
    if (e) c[e]++
  }
  return c
}
