import { useMemo, useState } from 'react'
import { useFeedbackReviews, type AdminReview } from '@/hooks/useFeedbackReviews'
import { useTesterBoard } from '@/hooks/useTesterBoard'
import { FamilyModal } from './FamilyModal'
import type { TesterFamily } from '@/lib/types'

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-500" title={`${n} / 5`}>
      {'★'.repeat(Math.max(0, Math.min(5, n)))}
      <span className="text-gray-300">{'★'.repeat(5 - Math.max(0, Math.min(5, n)))}</span>
    </span>
  )
}

/**
 * Publish status (consent-based, pkg/rate-us-port):
 *   private  → parent did NOT consent; team-only, never public.
 *   pending  → parent consented; awaiting Adi's approval to go public.
 *   approved → published as a site testimonial.
 */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    approved: { cls: 'bg-green-100 text-green-700', label: 'published' },
    pending: { cls: 'bg-blue-100 text-blue-700', label: 'awaiting publish' },
    private: { cls: 'bg-gray-100 text-gray-600', label: 'private' },
  }
  const s = map[status] ?? { cls: 'bg-gray-100 text-gray-600', label: status }
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
}

function ReviewRow({
  r,
  family,
  onViewFamily,
}: {
  r: AdminReview
  family: TesterFamily | null
  onViewFamily: (f: TesterFamily) => void
}) {
  const date = new Date(r.created_at).toLocaleDateString()
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">{r.display_name ?? '—'}</span>
          <Stars n={r.rating} />
        </div>
        <div className="flex items-center gap-2">
          {r.rating < 4 && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              needs attention
            </span>
          )}
          <StatusBadge status={r.status} />
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>
      {r.review_text ? (
        <p className="text-sm text-muted-foreground">{r.review_text}</p>
      ) : (
        <p className="text-sm italic text-gray-400">no text</p>
      )}

      {/* Contact line — reach out to the parent (option A: feedback has no
          in-app contact number; the team follows up from here). */}
      <div className="mt-0.5 flex items-center gap-3 text-xs">
        {family?.parent_email ? (
          <a
            href={`mailto:${family.parent_email}`}
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            ✉ {family.parent_email}
          </a>
        ) : (
          <span className="italic text-gray-400">no email on file</span>
        )}
        {family ? (
          <button
            onClick={() => onViewFamily(family)}
            className="text-primary underline"
          >
            View family →
          </button>
        ) : r.family_id ? (
          <span className="italic text-gray-400">family not loaded</span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Feedback board — every rating/feedback submitted from the app, newest first.
 * Low ratings (<4★) are flagged "needs attention" so Adi can reach out. Each row
 * links to the parent's email + Tester Board family card (the team's follow-up
 * surface — option A ships no in-app contact number). Rows the parent consented
 * to publish show "awaiting publish" (status 'pending'); set status='approved' in
 * Supabase to publish one as a site testimonial.
 */
export function FeedbackBoard() {
  const { data, error, loading } = useFeedbackReviews()
  const { data: families } = useTesterBoard()
  const [selected, setSelected] = useState<TesterFamily | null>(null)

  const familiesById = useMemo(() => {
    const m = new Map<string, TesterFamily>()
    for (const f of families ?? []) m.set(f.id, f)
    return m
  }, [families])

  const { lowCount, total } = useMemo(() => {
    const rows = data ?? []
    return { lowCount: rows.filter((r) => r.rating < 4).length, total: rows.length }
  }, [data])

  return (
    <section className="mt-8 rounded-lg border bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-foreground">Feedback &amp; ratings</h2>
        <span className="text-xs text-muted-foreground">
          {total} total{lowCount > 0 ? ` · ${lowCount} need attention` : ''}
        </span>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (data?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">No feedback yet.</p>
      )}

      {!loading && !error && (data?.length ?? 0) > 0 && (
        <div>
          {data!.map((r) => (
            <ReviewRow
              key={r.id}
              r={r}
              family={r.family_id ? familiesById.get(r.family_id) ?? null : null}
              onViewFamily={setSelected}
            />
          ))}
        </div>
      )}

      {selected && <FamilyModal family={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
