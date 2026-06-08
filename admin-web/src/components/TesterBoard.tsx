import { useMemo, useState } from 'react'
import { useTesterBoard } from '@/hooks/useTesterBoard'
import {
  childCount,
  childProposedTasks,
  dayInWindow,
  exactStageCounts,
  flagCounts,
  flagOf,
  funnelCounts,
  isTestFamily,
  lastActive,
  relativeTime,
  retentionCells,
  stageOf,
  totalCompletions,
  totalTasks,
} from '@/lib/cohort'
import { challengeLabel } from '@/lib/labels'
import type { Flag, Stage, TesterFamily } from '@/lib/types'
import { FlagBadge, StageBadge, TestTag } from './badges'
import { FamilyModal } from './FamilyModal'
import { RetentionStrip } from './RetentionStrip'

const STAGE_ORDER: { key: Stage; label: string }[] = [
  { key: 'signed_up', label: 'Signed up' },
  { key: 'activated', label: 'Activated' },
  { key: 'engaged', label: 'Engaged' },
  { key: 'active', label: 'Active (7d)' },
]

const FLAG_ORDER: { key: Flag; label: string; dot: string }[] = [
  { key: 'stuck', label: 'Stuck', dot: '🔴' },
  { key: 'not_started', label: 'Not started', dot: '⚪' },
  { key: 'churn_risk', label: 'Churn risk', dot: '🟡' },
  { key: 'active', label: 'Active', dot: '🟢' },
]

function FunnelBar({
  families,
  stageFilter,
  onPick,
}: {
  families: TesterFamily[]
  stageFilter: Stage | null
  onPick: (s: Stage) => void
}) {
  const reached = funnelCounts(families)
  const exact = exactStageCounts(families)
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {STAGE_ORDER.map((s, i) => {
        const pct = reached.signed_up ? Math.round((reached[s.key] / reached.signed_up) * 100) : 0
        const selected = stageFilter === s.key
        return (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => onPick(s.key)}
              title={`Click to show families currently at "${s.label}" (${exact[s.key]})`}
              className={`min-w-[120px] rounded-lg border px-3 py-2 text-left transition-colors ${
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-input bg-white hover:bg-accent/50'
              }`}
            >
              <div className="text-2xl font-bold text-foreground">{reached[s.key]}</div>
              <div className="text-xs text-muted-foreground">
                {s.label} {i > 0 && <span className="text-gray-400">· {pct}%</span>}
              </div>
              <div className="text-[10px] text-gray-500">{exact[s.key]} at this stage</div>
            </button>
            {i < STAGE_ORDER.length - 1 && <span className="text-gray-300">→</span>}
          </div>
        )
      })}
    </div>
  )
}

function FlagChips({
  families,
  flagFilter,
  onPick,
}: {
  families: TesterFamily[]
  flagFilter: Flag | null
  onPick: (f: Flag) => void
}) {
  const counts = flagCounts(families)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Attention:</span>
      {FLAG_ORDER.map((f) => {
        const selected = flagFilter === f.key
        return (
          <button
            key={f.key}
            onClick={() => onPick(f.key)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-input bg-white hover:bg-accent/50'
            }`}
          >
            {f.dot} {f.label} <span className="text-gray-400">({counts[f.key]})</span>
          </button>
        )
      })}
    </div>
  )
}

/** Container: fetches the board and handles loading/error, then renders the view. */
export function TesterBoard({
  onSelectFamily,
}: {
  onSelectFamily?: (f: TesterFamily) => void
}) {
  const { data, error, loading, reload } = useTesterBoard()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="font-medium">Failed to load tester board</div>
        <div className="mt-1 font-mono text-xs">{error}</div>
        <button onClick={() => void reload()} className="mt-2 underline">
          Retry
        </button>
      </div>
    )
  }

  return <TesterBoardView families={data ?? []} onReload={reload} onSelectFamily={onSelectFamily} />
}

/** Presentational: pure render of the board from a families array. */
export function TesterBoardView({
  families: allFamilies,
  onReload,
  onSelectFamily,
}: {
  families: TesterFamily[]
  onReload?: () => void
  onSelectFamily?: (f: TesterFamily) => void
}) {
  const [excludeTest, setExcludeTest] = useState(true) // default: hide test/dev accounts
  const [selected, setSelected] = useState<TesterFamily | null>(null)
  const [stageFilter, setStageFilter] = useState<Stage | null>(null)
  const [flagFilter, setFlagFilter] = useState<Flag | null>(null)

  // Funnel + flag counts ALWAYS exclude test/dev accounts — they're the real
  // KPIs and test noise would distort them, even when the table shows tests.
  const real = useMemo(() => allFamilies.filter((f) => !isTestFamily(f)), [allFamilies])

  // The table respects the toggle (so tests can still be inspected on demand).
  const base = excludeTest ? real : allFamilies

  const families = useMemo(
    () =>
      base.filter(
        (f) =>
          (!stageFilter || stageOf(f) === stageFilter) &&
          (!flagFilter || flagOf(f) === flagFilter),
      ),
    [base, stageFilter, flagFilter],
  )

  const filterActive = stageFilter !== null || flagFilter !== null
  const clearFilters = () => {
    setStageFilter(null)
    setFlagFilter(null)
  }

  const handleSelect = (f: TesterFamily) => {
    setSelected(f)
    onSelectFamily?.(f)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <FunnelBar
          families={real}
          stageFilter={stageFilter}
          onPick={(s) => setStageFilter((cur) => (cur === s ? null : s))}
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={excludeTest}
              onChange={(e) => setExcludeTest(e.target.checked)}
            />
            Exclude test
          </label>
          {onReload && (
            <button
              onClick={() => onReload()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FlagChips
          families={real}
          flagFilter={flagFilter}
          onPick={(f) => setFlagFilter((cur) => (cur === f ? null : f))}
        />
        {filterActive && (
          <button onClick={clearFilters} className="text-xs text-primary underline">
            Clear filter ({families.length} shown)
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Parent / Children</th>
              <th className="px-3 py-2 font-medium">Signed up</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Challenge</th>
              <th className="px-3 py-2 font-medium">Tasks</th>
              <th className="px-3 py-2 font-medium">Done</th>
              <th className="px-3 py-2 font-medium">Last active</th>
              <th className="px-3 py-2 font-medium">14-day</th>
              <th className="px-3 py-2 font-medium">Flag</th>
            </tr>
          </thead>
          <tbody>
            {families.map((f) => {
              const proposed = childProposedTasks(f)
              const test = isTestFamily(f)
              const mainChallenges = f.children
                .map((c) => challengeLabel(c.onboarding?.mainChallenge))
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(', ')
              return (
                <tr
                  key={f.id}
                  onClick={() => handleSelect(f)}
                  className="cursor-pointer border-b last:border-0 hover:bg-accent/40"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">
                      {f.parent_name ?? '—'}
                      {test && <TestTag />}
                    </div>
                    {f.parent_email && (
                      <a
                        href={`mailto:${f.parent_email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {f.parent_email}
                      </a>
                    )}
                    {childCount(f) === 0 ? (
                      <div className="text-xs font-medium text-amber-600">⚠️ No child yet</div>
                    ) : (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {f.children.map((c) => (
                          <span
                            key={c.id}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700"
                          >
                            👤 {c.name}{' '}
                            <span className="text-gray-400">{c.age_group ?? '?'}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {relativeTime(f.created_at)}
                    <div className="text-xs text-gray-400">day {dayInWindow(f)}/14</div>
                  </td>
                  <td className="px-3 py-2">
                    <StageBadge stage={stageOf(f)} />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{mainChallenges}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {totalTasks(f)}
                    {proposed > 0 && (
                      <span
                        className="ml-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700"
                        title="Tasks the child proposed"
                      >
                        +{proposed} kid
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{totalCompletions(f)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {relativeTime(lastActive(f)?.toISOString() ?? null)}
                  </td>
                  <td className="px-3 py-2">
                    <RetentionStrip cells={retentionCells(f)} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <FlagBadge flag={flagOf(f)} />
                  </td>
                </tr>
              )
            })}
            {families.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                  {filterActive ? 'No families match this filter.' : 'No cohort families found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Cohort = families that completed mobile onboarding ({families.length} shown). The 14-day
        strip starts from each tester's signup date.
      </p>

      {selected && <FamilyModal family={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
