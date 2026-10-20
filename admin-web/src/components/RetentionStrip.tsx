import type { RetentionCell } from '@/lib/cohort'

const CELL_CLASS: Record<RetentionCell, string> = {
  hit: 'bg-emerald-500',
  miss: 'bg-gray-200',
  na: 'bg-transparent border border-dashed border-gray-200',
}

/** A 14-square strip for the trailing 14 days ending today: green = completed a
 *  task that day, gray = none, dashed = before this family signed up. Only task
 *  completions have per-day history — app-opens aren't tracked per day. */
export function RetentionStrip({ cells }: { cells: RetentionCell[] }) {
  return (
    <div
      className="flex gap-[2px]"
      title="Last 14 days (oldest → today) · green = completed a task that day · app-opens aren't tracked per day"
    >
      {cells.map((c, i) => {
        const daysAgo = cells.length - 1 - i
        const when = daysAgo === 0 ? 'today' : `${daysAgo}d ago`
        return (
          <div
            key={i}
            className={`h-3.5 w-2.5 rounded-[2px] ${CELL_CLASS[c]}`}
            title={`${when}: ${c === 'hit' ? 'completed a task' : c === 'miss' ? 'no completed task' : 'before signup'}`}
          />
        )
      })}
    </div>
  )
}
