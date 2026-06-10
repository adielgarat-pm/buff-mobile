import type { Flag, Platform, Stage } from '@/lib/types'

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

const PLATFORM_META: Record<Platform, { label: string; icon: string; className: string }> = {
  android: { label: 'Android', icon: '🤖', className: 'bg-green-100 text-green-700' },
  ios: { label: 'iOS', icon: '🍏', className: 'bg-gray-100 text-gray-700' },
  web: { label: 'Web', icon: '🌐', className: 'bg-sky-100 text-sky-700' },
}

/** Platform a family last opened the app on. `null` → unknown (no stamped
 *  build yet); rendered as a muted dash so the column never looks empty. */
export function PlatformBadge({ platform }: { platform: Platform | null }) {
  if (!platform) {
    return (
      <span className="text-xs text-gray-400" title="No platform recorded yet">
        —
      </span>
    )
  }
  const m = PLATFORM_META[platform]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${m.className}`}
    >
      <span>{m.icon}</span>
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
