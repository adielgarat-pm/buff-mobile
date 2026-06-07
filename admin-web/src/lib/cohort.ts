// Pure derivation helpers for the Tester Board. No I/O — everything is computed
// from the RPC payload so the same logic powers the board and the deep-dive.

import type { Flag, Stage, TesterChild, TesterFamily } from './types'

const DAY = 24 * 60 * 60 * 1000

/** Patterns that mark an internal/test account (shown with a "test" tag). */
const TEST_PATTERNS = [/test/i, /buffapp/i, /demo/i, /adi\.elgarat/i, /אקדא4/]

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

/** Most recent completion timestamp across the family, or null. */
export function lastActive(f: TesterFamily): Date | null {
  let max: number | null = null
  for (const c of f.children) {
    if (c.last_active) {
      const t = new Date(c.last_active).getTime()
      if (max === null || t > max) max = t
    }
  }
  return max === null ? null : new Date(max)
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
  if (!completed) return 'not_started' // engaged but never completed anything

  // Has completed before — green if recent, yellow if gone quiet.
  if (completionsWithin(f, 3, now) > 0) return 'active'
  return 'churn_risk'
}

// ---- 14-day retention grid (per-tester window) ----------------------------

export type RetentionCell = 'hit' | 'miss' | 'future'

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
 * 14 cells starting from the family's signup date (per-tester window).
 * 'hit' = had >=1 completion that day, 'miss' = none, 'future' = day not reached.
 */
export function retentionCells(f: TesterFamily, len = 14, now = Date.now()): RetentionCell[] {
  const byDate = completionsByDate(f)
  const start = new Date(f.created_at)
  const startMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const todayIso = isoDate(now)
  const cells: RetentionCell[] = []
  for (let i = 0; i < len; i++) {
    const dayIso = isoDate(startMs + i * DAY)
    if (dayIso > todayIso) cells.push('future')
    else cells.push((byDate.get(dayIso) ?? 0) > 0 ? 'hit' : 'miss')
  }
  return cells
}

/** Which day-of-window the tester is on (1-based, capped at len). */
export function dayInWindow(f: TesterFamily, len = 14, now = Date.now()): number {
  const elapsed = Math.floor((now - new Date(f.created_at).getTime()) / DAY) + 1
  return Math.min(Math.max(elapsed, 1), len)
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
  const c: Record<Flag, number> = { active: 0, churn_risk: 0, not_started: 0, stuck: 0 }
  for (const f of families) c[flagOf(f, now)]++
  return c
}

export function childCount(f: TesterFamily): number {
  return f.children.length
}
