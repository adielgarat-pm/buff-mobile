import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { callRpc } from '@/lib/api'

interface InsightRow {
  child_id:       string
  child_name:     string
  family_id:      string
  weekly_count:   number
  week_start:     string
  last_headline:  string | null
  last_generated: string | null
  vote:           1 | -1 | null
  parent_context: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function VoteBadge({ vote }: { vote: 1 | -1 | null }) {
  if (vote === 1)  return <span className="text-lg" title="Helpful">👍</span>
  if (vote === -1) return <span className="text-lg" title="Not helpful">👎</span>
  return <span className="text-xs text-muted-foreground">—</span>
}

function QuotaBar({ count }: { count: number }) {
  const pct = Math.min(count / 3, 1)
  const color = count >= 3 ? 'bg-red-400' : count >= 2 ? 'bg-yellow-400' : 'bg-violet-400'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{count}/3</span>
    </div>
  )
}

export function SmartInsightFeedback() {
  const { session } = useAuth()
  const [rows, setRows]       = useState<InsightRow[] | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  const reload = useCallback(async () => {
    if (!session) return
    setError(null)
    try {
      const data = await callRpc<InsightRow[]>('get_admin_smart_insights', session.access_token)
      setRows(data)
      setUpdatedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { reload() }, [reload])

  // Aggregate stats
  const total     = rows?.length ?? 0
  const voted     = rows?.filter(r => r.vote !== null).length ?? 0
  const positive  = rows?.filter(r => r.vote === 1).length ?? 0
  const pctPos    = voted > 0 ? Math.round((positive / voted) * 100) : null
  const generated = rows?.filter(r => r.weekly_count > 0).length ?? 0

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
  }
  if (error) {
    return <div className="py-12 text-center text-sm text-red-500">{error}</div>
  }
  if (!rows || rows.length === 0) {
    return <div className="py-12 text-center text-sm text-muted-foreground">No Smart Insights generated yet.</div>
  }

  return (
    <div className="space-y-4">

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 rounded-xl border bg-white p-4">
        <Stat label="Children with insights" value={String(total)} />
        <Stat label="Generated this week" value={String(generated)} />
        <Stat label="Voted" value={`${voted}/${total}`} />
        {pctPos !== null && (
          <Stat label="Positive votes" value={`${pctPos}%`} color={pctPos >= 70 ? 'text-green-600' : 'text-yellow-600'} />
        )}
        {updatedAt && (
          <span className="ml-auto self-center text-xs text-muted-foreground">
            Updated {timeAgo(new Date(updatedAt).toISOString())}
            <button onClick={reload} className="ml-2 text-violet-600 hover:underline">↻</button>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left">Child</th>
              <th className="px-4 py-2 text-left">Last insight</th>
              <th className="px-4 py-2 text-left">Generated</th>
              <th className="px-4 py-2 text-left">Quota</th>
              <th className="px-4 py-2 text-left">Vote</th>
              <th className="px-4 py-2 text-left">Parent context</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.child_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{row.child_name}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={row.last_headline ?? ''}>
                  {row.last_headline ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo(row.last_generated)}
                </td>
                <td className="px-4 py-3">
                  <QuotaBar count={row.weekly_count} />
                </td>
                <td className="px-4 py-3">
                  <VoteBadge vote={row.vote} />
                </td>
                <td className="max-w-[220px] px-4 py-3 text-xs text-muted-foreground" title={row.parent_context ?? ''}>
                  {row.parent_context
                    ? <span className="italic">"{row.parent_context.slice(0, 60)}{row.parent_context.length > 60 ? '…' : ''}"</span>
                    : <span>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, color = 'text-foreground' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
