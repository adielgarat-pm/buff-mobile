import { childRewardRedeemed, relativeTime } from '@/lib/cohort'
import { challengeLabel, motivatorLabel } from '@/lib/labels'
import { onboardingDiff } from '@/lib/onboardingDiff'
import type { TesterChild, TesterFamily } from '@/lib/types'

function exportFamilyJson(f: TesterFamily) {
  const blob = new Blob([JSON.stringify(f, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safe = (f.parent_name ?? f.name).replace(/[^a-zA-Z0-9]+/g, '-')
  a.href = url
  a.download = `family-${safe}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{children}</span>
  )
}

function OnboardingDiffSection({ child }: { child: TesterChild }) {
  const diff = onboardingDiff(child)
  if (!diff) return null
  const cols: { label: string; items: string[]; className: string }[] = [
    {
      label: `✅ Kept BUFF templates (${diff.fromTemplate.length})`,
      items: diff.fromTemplate.map((t) => t.title),
      className: 'text-emerald-700',
    },
    {
      label: `✎ Personalized / added (${diff.custom.length})`,
      items: diff.custom.map((t) => (t.proposed_by_child ? `${t.title} (kid)` : t.title)),
      className: 'text-violet-700',
    },
  ]
  return (
    <div className="mt-3 rounded-lg bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tasks: template vs personalized
        </span>
        <span className="text-xs text-gray-400">{Math.round(diff.customRate * 100)}% personalized</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cols.map((c) => (
          <div key={c.label}>
            <div className={`mb-1 text-xs font-semibold ${c.className}`}>{c.label}</div>
            <ul className="space-y-0.5">
              {c.items.map((it, i) => (
                <li key={i} className="text-xs text-gray-600">
                  {it}
                </li>
              ))}
              {c.items.length === 0 && <li className="text-xs text-gray-300">—</li>}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-gray-400">
        "Removed" (offered-then-deleted) isn't reconstructable yet — needs an onboarding-origin flag.
      </p>
    </div>
  )
}

function ChildSection({ child }: { child: TesterChild }) {
  const onb = child.onboarding
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{child.name}</span>
          <Chip>{child.age_group ?? '?'}</Chip>
          {child.gender && <Chip>{child.gender}</Chip>}
          <Chip>💰 {child.balance} BUFFs</Chip>
        </div>
        <div className="text-xs text-muted-foreground">
          {child.completions_total} completions · last {relativeTime(child.last_active)}
        </div>
      </div>

      {/* Onboarding choices */}
      <div className="mt-3 space-y-1.5 text-sm">
        <div>
          <span className="text-muted-foreground">Main challenge: </span>
          <span className="font-medium">{challengeLabel(onb?.mainChallenge)}</span>
        </div>
        {onb?.additionalChallenges && onb.additionalChallenges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Also: </span>
            {onb.additionalChallenges.map((c) => (
              <Chip key={c}>{challengeLabel(c)}</Chip>
            ))}
          </div>
        )}
        {onb?.motivators && onb.motivators.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Motivators: </span>
            {onb.motivators.map((m) => (
              <Chip key={m}>{motivatorLabel(m)}</Chip>
            ))}
          </div>
        )}
      </div>

      {/* Onboarding diff — kept / removed / added vs the offered starter set */}
      <OnboardingDiffSection child={child} />

      {/* Tasks */}
      <div className="mt-3">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tasks ({child.tasks.length})
        </div>
        <ul className="space-y-1">
          {child.tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <span>{t.icon ?? '•'}</span>
              <span>{t.title}</span>
              {t.time && <span className="text-xs text-gray-400">{t.time}</span>}
              {t.proposed_by_child && (
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                  kid proposed
                </span>
              )}
            </li>
          ))}
          {child.tasks.length === 0 && <li className="text-sm text-muted-foreground">No tasks</li>}
        </ul>
      </div>

      {/* Rewards */}
      <div className="mt-3">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Rewards ({child.rewards.length} · {childRewardRedeemed(child)} redeemed)
        </div>
        <ul className="space-y-1">
          {child.rewards.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <span>{r.emoji ?? '🎁'}</span>
              <span>{r.title_he || r.title}</span>
              {r.size && <span className="text-xs text-gray-400">{r.size}</span>}
              <span className="text-xs text-gray-400">· {r.credits_needed} BUFFs</span>
              {r.is_redeemed && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  redeemed
                </span>
              )}
            </li>
          ))}
          {child.rewards.length === 0 && (
            <li className="text-sm text-muted-foreground">No rewards</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export function FamilyModal({ family, onClose }: { family: TesterFamily; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-gray-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b bg-white px-5 py-4 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">{family.parent_name ?? family.name}</h2>
            <div className="text-sm text-muted-foreground">
              {family.parent_email && (
                <span>
                  <a href={`mailto:${family.parent_email}`} className="text-blue-600 hover:underline">
                    {family.parent_email}
                  </a>{' '}
                  ·{' '}
                </span>
              )}
              {family.children.length} {family.children.length === 1 ? 'child' : 'children'} · joined{' '}
              {relativeTime(family.created_at)}
              {family.short_code && <span> · code {family.short_code}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportFamilyJson(family)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Export JSON
            </button>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 p-5">
          {family.children.map((c) => (
            <ChildSection key={c.id} child={c} />
          ))}
        </div>
      </div>
    </div>
  )
}
