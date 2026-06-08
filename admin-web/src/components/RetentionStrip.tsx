import type { RetentionCell } from '@/lib/cohort'

const CELL_CLASS: Record<RetentionCell, string> = {
  hit: 'bg-emerald-500',
  miss: 'bg-gray-200',
  future: 'bg-transparent border border-dashed border-gray-200',
}

/** A 14-square strip: green = completed something that day, gray = missed,
 *  dashed = day not reached yet in the tester's window. */
export function RetentionStrip({ cells }: { cells: RetentionCell[] }) {
  return (
    <div className="flex gap-[2px]" title="Day 1–14 since signup · green = activity that day">
      {cells.map((c, i) => (
        <div
          key={i}
          className={`h-3.5 w-2.5 rounded-[2px] ${CELL_CLASS[c]}`}
          title={`Day ${i + 1}: ${c === 'hit' ? 'active' : c === 'miss' ? 'no activity' : 'not reached'}`}
        />
      ))}
    </div>
  )
}
