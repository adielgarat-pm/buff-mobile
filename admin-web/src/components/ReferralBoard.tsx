import { useMemo } from 'react'
import { useReferralFunnel, type ReferralFunnelRow } from '@/hooks/useReferralFunnel'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'completed'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-600'
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
}

function Row({ r }: { r: ReferralFunnelRow }) {
  const created = new Date(r.created_at).toLocaleDateString()
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 pr-3 font-mono text-sm font-semibold text-foreground">{r.code}</td>
      <td className="py-2 pr-3 text-sm text-muted-foreground">{r.referrer_family ?? '—'}</td>
      <td className="py-2 pr-3 text-center text-sm font-medium text-foreground">{r.clicks}</td>
      <td className="py-2 pr-3"><StatusBadge status={r.status} /></td>
      <td className="py-2 pr-3 text-sm text-muted-foreground">{r.referred_family ?? '—'}</td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{created}</td>
    </tr>
  )
}

/**
 * Referral funnel board — share → click → redeem, per code.
 *
 * "Clicks" counts hits on buffadhd.com/join?ref=CODE (logged anonymously by the
 * track-referral-click edge function). Before that route existed the code was
 * dropped on the hop to the app, so historical clicks read 0 for old codes —
 * expect meaningful numbers only from 2026-07-01 onward.
 */
export function ReferralBoard() {
  const { data, error, loading } = useReferralFunnel()

  const totals = useMemo(() => {
    const rows = data ?? []
    const codes = rows.length
    const clicks = rows.reduce((s, r) => s + (r.clicks ?? 0), 0)
    const redeemed = rows.filter(r => r.status === 'completed').length
    // Clamp: redemptions via copy-link (never hit /join) or pre-tracking clicks
    // count as redeemed without a logged click, which can push this past 100%.
    const clickToRedeem = clicks > 0 ? Math.min(100, Math.round((100 * redeemed) / clicks)) : 0
    return { codes, clicks, redeemed, clickToRedeem }
  }, [data])

  if (loading) return <p className="text-sm text-muted-foreground">Loading referrals…</p>
  if (error) return <p className="text-sm text-red-600">Error: {error}</p>

  const rows = data ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Codes created" value={String(totals.codes)} />
        <Stat label="Link clicks" value={String(totals.clicks)} hint="since 2026-07-01" />
        <Stat label="Redeemed" value={String(totals.redeemed)} />
        <Stat
          label="Click → redeem"
          value={`${totals.clickToRedeem}%`}
          hint="of clicks that converted"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No referral codes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="pb-2 pr-3 font-medium">Code</th>
                <th className="pb-2 pr-3 font-medium">Referrer</th>
                <th className="pb-2 pr-3 text-center font-medium">Clicks</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Redeemed by</th>
                <th className="pb-2 pr-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => <Row key={r.code} r={r} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
