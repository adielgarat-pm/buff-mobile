import { useMemo } from 'react'
import { useKidJoinFunnel, type KidJoinFunnelRow } from '@/hooks/useKidJoinFunnel'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div> : null}
    </div>
  )
}

function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((100 * n) / d)}%` : '—'
}

/** "n/d" for a window that has fully elapsed; "pending" when no child is old enough yet. */
function ratio(n: number, d: number): string {
  return d > 0 ? `${n}/${d}` : 'pending'
}

function Row({ r }: { r: KidJoinFunnelRow }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 pr-3 font-mono text-sm font-semibold text-foreground">{r.cohort_week}</td>
      <td className="py-2 pr-3 text-center text-sm font-medium text-foreground">{r.children}</td>
      <td className="py-2 pr-3 text-center text-sm font-medium text-foreground">
        {r.joined_48h} <span className="text-xs text-muted-foreground">({pct(r.joined_48h, r.children)})</span>
      </td>
      <td className="py-2 pr-3 text-center text-sm text-muted-foreground">{r.joined_ever}</td>
      <td className="py-2 pr-3 text-center text-sm text-foreground">{ratio(r.week2_routine, r.week2_eligible)}</td>
      <td className="py-2 pr-3 text-center text-sm text-foreground">{ratio(r.week4_active, r.week4_eligible)}</td>
    </tr>
  )
}

/**
 * Kid-on-board funnel (pkg/anchor-routine-onboarding M1). The 2026-10-20
 * sustained-families analysis found every long-term active kid had their own
 * login, so this tracks join-within-48h per signup week, then whether the
 * routine held in week 2 (>=3 completion days in days 7-13) and week 4
 * (>=1 completion in days 21-27).
 */
export function KidJoinBoard() {
  const { data, error, loading } = useKidJoinFunnel()

  const totals = useMemo(() => {
    const rows = data ?? []
    const sum = (k: keyof KidJoinFunnelRow) => rows.reduce((s, r) => s + Number(r[k] ?? 0), 0)
    return {
      children: sum('children'),
      joined48: sum('joined_48h'),
      estimated: sum('joined_estimated'),
      w2: sum('week2_routine'),
      w2e: sum('week2_eligible'),
      w4: sum('week4_active'),
      w4e: sum('week4_eligible'),
    }
  }, [data])

  if (loading) return <p className="text-sm text-muted-foreground">Loading kid-join funnel…</p>
  if (error) return <p className="text-sm text-red-600">Error: {error}</p>

  const rows = data ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Children (cohort)" value={String(totals.children)} hint="since Jun 1, test families excluded" />
        <Stat label="Joined ≤48h" value={pct(totals.joined48, totals.children)} hint={`${totals.joined48} kids`} />
        <Stat label="Routine week 2" value={pct(totals.w2, totals.w2e)} hint="≥3 days in days 7–13" />
        <Stat label="Active week 4" value={pct(totals.w4, totals.w4e)} hint="≥1 completion in days 21–27" />
      </div>

      {totals.estimated > 0 ? (
        <p className="text-xs text-muted-foreground">
          {totals.estimated} join time(s) are estimated from the child&apos;s account creation (linked before the
          kid_joined event existed).
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No children in the cohort yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="pb-2 pr-3 font-medium">Signup week</th>
                <th className="pb-2 pr-3 text-center font-medium">Kids</th>
                <th className="pb-2 pr-3 text-center font-medium">Joined ≤48h</th>
                <th className="pb-2 pr-3 text-center font-medium">Joined ever</th>
                <th className="pb-2 pr-3 text-center font-medium">Routine wk 2</th>
                <th className="pb-2 pr-3 text-center font-medium">Active wk 4</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => <Row key={r.cohort_week} r={r} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
