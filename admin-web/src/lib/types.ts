// Shapes returned by the get_admin_tester_board() RPC (see migration
// admin_tester_board_rpc). One TesterFamily per mobile-onboarded cohort family.

export interface OnboardingData {
  mainChallenge?: string
  additionalChallenges?: string[]
  motivators?: string[]
}

export interface TesterTask {
  id: string
  title: string
  category: string | null
  time: string | null
  credits: number | null
  icon: string | null
  created_at: string
  proposed_by_child: boolean
  is_system_generated: boolean
}

export interface TesterReward {
  id: string
  title: string | null
  title_he: string | null
  emoji: string | null
  size: string | null
  credits_needed: number | null
  is_redeemed: boolean
  proposed_by_child: boolean
}

export interface CompletionDay {
  date: string // 'YYYY-MM-DD'
  count: number
}

export interface TesterChild {
  id: string
  name: string
  age_group: string | null
  gender: string | null
  language: string | null
  created_at: string
  /** Platform this child's profile was last seen on (profiles.last_platform).
   *  Null until a stamping build runs on their device. */
  last_platform: string | null
  last_seen_at: string | null
  /** auth.users.last_sign_in_at when the child has their own login (server
   *  truth, unlike client-stamped last_seen_at). Null on shared-device kids. */
  last_sign_in_at: string | null
  /** True when the child profile has its own auth user (own-device login,
   *  e.g. joined with the family code on their phone). False = shared device
   *  via the parent's View-as-Child. */
  own_device: boolean
  onboarding: OnboardingData | null
  balance: number
  tasks: TesterTask[]
  rewards: TesterReward[]
  completions_total: number
  completions_by_day: CompletionDay[]
  first_active: string | null
  last_active: string | null
}

/** Canonical signup platform (families.platform, captured once at signup). */
export type Platform = 'android' | 'ios' | 'web'

/** One parent profile in a family (get_admin_tester_board `parents`, migration
 *  055). Unlike the legacy parent_name/parent_email pair (first parent only),
 *  this covers every non-deleted parent — co-parent families show both. */
export interface TesterParent {
  id: string
  name: string | null
  email: string | null
  /** profiles.last_platform — client-stamped; null until a stamping build
   *  runs on their device (web currently doesn't stamp it). */
  last_platform: string | null
  last_seen_at: string | null
  /** auth.users.last_sign_in_at — server truth for "did they log in",
   *  independent of client telemetry. */
  last_sign_in_at: string | null
  last_country: string | null
  /** This parent created the family (families.created_by, migration 050+).
   *  Lets the UI fall back to families.platform when telemetry never stamped
   *  last_platform (web doesn't stamp it). False for pre-050 families. */
  is_creator: boolean
  created_at: string
}

export interface TesterFamily {
  id: string
  name: string
  created_at: string
  preferred_language: string | null
  short_code: string | null
  /** Legacy: first parent only (kept for back-compat). Prefer `parents`. */
  parent_name: string | null
  parent_email: string | null
  /** Every non-deleted parent profile, oldest first (migration 055). */
  parents: TesterParent[]
  platform: Platform | null
  /** ISO 3166-1 alpha-2 device-locale region of the most recently seen family
   *  member (profiles.last_country, migration 045). Forward-filling: null
   *  until someone opens a build that stamps it. */
  country: string | null
  /** Most recently seen profiles.last_platform in the family — finer-grained
   *  than `platform` ('android' | 'ios' | 'android-web' | 'ios-web' |
   *  'desktop-web'). Forward-filling like `country`. */
  last_platform: string | null
  /** When the family's automatic 14-day trial started (families.trial_started_at,
   *  set by the start_trial_on_activation trigger on the 2nd active day). */
  trial_started_at: string | null
  /** Latest premium_until across the family. NOTE: also written by the
   *  auto-trial trigger — use entitlementOf() to tell trial from paying. */
  premium_until: string | null
  /** Any member granted lifetime access (free grant, not a payer). */
  has_lifetime: boolean
  /** Normalized channel the family arrived from, captured once at family_created
   *  (families.acquisition_source, migration 052). null for pre-052 families. */
  acquisition_source: string | null
  /** ISO 3166-1 alpha-2 device-locale region captured AT signup
   *  (families.acquisition_country). Unlike `country` (mutable last_country),
   *  this is fixed at family_created. null for pre-052 families. */
  acquisition_country: string | null
  children: TesterChild[]
}

/** Billing status derived from premium_until / trial_started_at / has_lifetime.
 *  'paying' = active paid grant; 'trial' = auto 14-day trial (NOT a payer);
 *  'expired' = paid before, lapsed; 'lifetime' = granted free access;
 *  null = free (incl. lapsed trials). */
export type Entitlement = 'paying' | 'trial' | 'expired' | 'lifetime' | null

/** Funnel stage a family has reached (highest one). */
export type Stage = 'signed_up' | 'activated' | 'engaged' | 'active'

/** Attention-triage flag for the CRM column. */
export type Flag = 'active' | 'churn_risk' | 'not_started' | 'stuck'
