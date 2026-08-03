import type { Entitlement, Flag, Platform, Stage, TesterFamily, TesterParent } from '@/lib/types'

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

/** Map fine-grained profiles.last_platform values ('android-web',
 *  'desktop-web', …) onto the canonical three-way badge. Unknown → null. */
export function normalizePlatform(p: string | null): Platform | null {
  if (!p) return null
  if (p === 'android' || p === 'ios' || p === 'web') return p
  if (p.includes('web')) return 'web'
  return null
}

/** Tiny inline icon for per-person platform in dense cells. Null → '·'. */
export function platformIcon(p: string | null): string {
  const n = normalizePlatform(p)
  return n ? PLATFORM_META[n].icon : '·'
}

/** Best-known device for a parent: client-stamped last_platform first, else
 *  the family signup platform when this parent created the family (web
 *  clients never stamp last_platform, so creators would otherwise show
 *  nothing — the Kiriati case, 2026-08-03). */
export function parentPlatform(p: TesterParent, familyPlatform: Platform | null): Platform | null {
  return normalizePlatform(p.last_platform) ?? (p.is_creator ? familyPlatform : null)
}

/** Distinct devices seen across the whole family (parents + children), for
 *  the table's Platform column — a co-parent family on Android + web shows
 *  BOTH badges instead of only the signup platform. */
export function familyPlatforms(f: TesterFamily): Platform[] {
  const set = new Set<Platform>()
  for (const p of f.parents ?? []) {
    const v = parentPlatform(p, f.platform)
    if (v) set.add(v)
  }
  for (const c of f.children) {
    const v = normalizePlatform(c.last_platform)
    if (v) set.add(v)
  }
  if (set.size === 0 && f.platform) set.add(f.platform)
  return [...set]
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

/** 'IL' → 🇮🇱 via regional-indicator codepoints. Null for bad/missing codes. */
function countryFlag(code: string): string | null {
  if (!/^[A-Z]{2}$/.test(code)) return null
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/** Device-locale country of the most recently seen family member. Null →
 *  nothing (the platform badge next to it already fills the cell). */
export function CountryBadge({ country }: { country: string | null }) {
  if (!country) return null
  const flag = countryFlag(country)
  return (
    <span
      title={`Device-locale region: ${country}`}
      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
    >
      {flag && <span>{flag}</span>}
      {country}
    </span>
  )
}

const SOURCE_META: Record<string, { label: string; icon: string; className: string }> = {
  organic: { label: 'Organic', icon: '🌱', className: 'bg-gray-100 text-gray-600' },
  winback: { label: 'Win-back', icon: '↩️', className: 'bg-amber-100 text-amber-700' },
  guide: { label: 'Guide/SEO', icon: '📄', className: 'bg-teal-100 text-teal-700' },
  fb: { label: 'Facebook', icon: '📘', className: 'bg-blue-100 text-blue-700' },
  reels: { label: 'Reels', icon: '🎬', className: 'bg-fuchsia-100 text-fuchsia-700' },
  referral: { label: 'Referral', icon: '🔗', className: 'bg-indigo-100 text-indigo-700' },
  play_ads: { label: 'Play Ads', icon: '📢', className: 'bg-lime-100 text-lime-700' },
  unknown: { label: 'Unknown', icon: '❓', className: 'bg-gray-100 text-gray-500' },
}

/** Acquisition channel a family arrived from (families.acquisition_source, set
 *  once at family_created). `null` → pre-052 family, no capture; rendered as a
 *  muted dash so the field never looks broken. An unmapped value still renders
 *  via its raw label. */
export function SourceBadge({ source }: { source: string | null }) {
  if (!source) {
    return (
      <span className="text-xs text-gray-400" title="No acquisition source recorded (pre-052 family)">
        —
      </span>
    )
  }
  const m = SOURCE_META[source] ?? { label: source, icon: '❓', className: 'bg-gray-100 text-gray-500' }
  return (
    <span
      title={`Acquisition source: ${source}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${m.className}`}
    >
      <span>{m.icon}</span>
      {m.label}
    </span>
  )
}

const ENTITLEMENT_META: Record<
  Exclude<Entitlement, null>,
  { label: string; icon: string; className: string }
> = {
  paying: { label: 'Paying', icon: '💳', className: 'bg-emerald-100 text-emerald-800' },
  trial: { label: 'Trial', icon: '🧪', className: 'bg-sky-100 text-sky-700' },
  expired: { label: 'Expired', icon: '💳', className: 'bg-orange-100 text-orange-700' },
  lifetime: { label: 'Lifetime', icon: '🎁', className: 'bg-violet-100 text-violet-700' },
}

/** Billing marker: real payers stand out; granted-lifetime testers are
 *  visually distinct so they're never mistaken for revenue. Free → nothing. */
export function EntitlementBadge({
  entitlement,
  premiumUntil,
}: {
  entitlement: Entitlement
  premiumUntil?: string | null
}) {
  if (!entitlement) return null
  const m = ENTITLEMENT_META[entitlement]
  const until =
    entitlement === 'trial'
      ? `Auto 14-day trial until ${premiumUntil ? new Date(premiumUntil).toLocaleDateString() : '?'} — NOT a payer`
      : premiumUntil && entitlement !== 'lifetime'
        ? `${entitlement === 'paying' ? 'Premium until' : 'Premium ended'} ${new Date(premiumUntil).toLocaleDateString()}`
        : 'Granted lifetime access (not a payer)'
  return (
    <span
      title={until}
      className={`ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${m.className}`}
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
