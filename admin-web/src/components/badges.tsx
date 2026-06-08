import type { Flag, Stage } from '@/lib/types'

const STAGE_META: Record<Stage, { label: string; className: string }> = {
  signed_up: { label: 'Signed up', className: 'bg-gray-100 text-gray-600' },
  activated: { label: 'Activated', className: 'bg-blue-100 text-blue-700' },
  engaged: { label: 'Engaged', className: 'bg-indigo-100 text-indigo-700' },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700' },
}

export function StageBadge({ stage }: { stage: Stage }) {
  const m = STAGE_META[stage]
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${m.className}`}>
      {m.label}
    </span>
  )
}

const FLAG_META: Record<Flag, { label: string; dot: string; className: string }> = {
  active: { label: 'Active', dot: '🟢', className: 'text-emerald-700' },
  churn_risk: { label: 'Churn risk', dot: '🟡', className: 'text-amber-700' },
  not_started: { label: 'Not started', dot: '⚪', className: 'text-gray-500' },
  stuck: { label: 'Stuck', dot: '🔴', className: 'text-red-700' },
}

export function FlagBadge({ flag }: { flag: Flag }) {
  const m = FLAG_META[flag]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.className}`}>
      <span>{m.dot}</span>
      {m.label}
    </span>
  )
}

export function TestTag() {
  return (
    <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
      test
    </span>
  )
}
