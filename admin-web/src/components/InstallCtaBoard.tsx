import { useMemo } from 'react'
import { useInstallCtaFunnel, type InstallCtaFunnelRow } from '@/hooks/useInstallCtaFunnel'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div> : null}
    </div>
  )
}

function Row({ r }: { r: InstallCtaFunnelRow }) {
  const ctr = r.impressions > 0 ? Math.round((100 * r.clicks) / r.impressions) : 0
  const seen = r.last_seen ? new Date(r.last_seen).toLocaleDateString() : '—'
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 pr-3 font-mono text-sm font-semibold text-foreground">{r.target}</td>
      <td className="py-2 pr-3 text-sm text-muted-foreground">{r.placement}</td>
      <td className="py-2 pr-3 text-center text-sm font-medium text-foreground">{r.impressions}</td>
      <td className="py-2 pr-3 text-center text-sm font-medium text-foreground">{r.clicks}</td>
      <td className="py-2 pr-3 text-center text-sm text-muted-foreground">{ctr}%</td>
      <td className="py-2 pr-3 text-center text-sm text-muted-foreground">{r.dismisses}</td>
      <td className="py-2 pr-3 text-center text-sm text-muted-foreground">{r.opens}</td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{seen}</td>
    </tr>
  )
}

/**
 * Web-to-native install-CTA engagement funnel — impression → click per visitor
 * class (target) and placement. Fed by the track-install-cta beacon; expect data
 * only once an Android build carrying the CTA ships. The per-family
 * install→activation conversion is a follow-up (needs the cta_id→family bridge).
 */
export function InstallCtaBoard() {
  const { data, error, loading } = useInstallCtaFunnel()

  const totals = useMemo(() => {
    const rows = data ?? []
    const impressions = rows.reduce((s, r) => s + (r.impressions ?? 0), 0)
    const clicks = rows.reduce((s, r) => s + (r.clicks ?? 0), 0)
    const opens = rows.reduce((s, r) => s + (r.opens ?? 0), 0)
    const ctr = impressions > 0 ? Math.round((100 * clicks) / impressions) : 0
    return { impressions, clicks, opens, ctr }
  }, [data])

  if (loading) return <p className="text-sm text-muted-foreground">Loading install funnel…</p>
  if (error) return <p className="text-sm text-red-600">Error: {error}</p>

  const rows = data ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Impressions" value={String(totals.impressions)} />
        <Stat label="Clicks" value={String(totals.clicks)} />
        <Stat label="Click-through" value={`${totals.ctr}%`} hint="clicks ÷ impressions" />
        <Stat label="Opened installed" value={String(totals.opens)} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No install-CTA events yet — expected until an Android build carrying the CTA ships.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="pb-2 pr-3 font-medium">Target</th>
                <th className="pb-2 pr-3 font-medium">Placement</th>
                <th className="pb-2 pr-3 text-center font-medium">Impr.</th>
                <th className="pb-2 pr-3 text-center font-medium">Clicks</th>
                <th className="pb-2 pr-3 text-center font-medium">CTR</th>
                <th className="pb-2 pr-3 text-center font-medium">Dismiss</th>
                <th className="pb-2 pr-3 text-center font-medium">Opened</th>
                <th className="pb-2 pr-3 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => <Row key={`${r.target}:${r.placement}`} r={r} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
