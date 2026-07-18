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
  onboarding: OnboardingData | null
  balance: number
  tasks: TesterTask[]
  rewards: TesterReward[]
  completions_total: number
  completions_by_day: CompletionDay[]
  first_active: string | null
  last_active: string | null
}

/** Last platform a family member opened the app on. Null until a build that
 *  stamps profiles.last_platform runs (forward-filling). */
export type Platform = 'android' | 'ios' | 'web'

export interface TesterFamily {
  id: string
  name: string
  created_at: string
  preferred_language: string | null
  short_code: string | null
  parent_name: string | null
  parent_email: string | null
  platform: Platform | null
  /** Latest premium_until across the family (real paid subscription). */
  premium_until: string | null
  /** Any member granted lifetime access (free grant, not a payer). */
  has_lifetime: boolean
  children: TesterChild[]
}

/** Billing status derived from premium_until / has_lifetime.
 *  'paying' = active paid subscription; 'expired' = paid before, lapsed;
 *  'lifetime' = granted free access; null = free. */
export type Entitlement = 'paying' | 'expired' | 'lifetime' | null

/** Funnel stage a family has reached (highest one). */
export type Stage = 'signed_up' | 'activated' | 'engaged' | 'active'

/** Attention-triage flag for the CRM column. */
export type Flag = 'active' | 'churn_risk' | 'not_started' | 'stuck'
