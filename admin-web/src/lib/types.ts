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

export interface TesterFamily {
  id: string
  name: string
  created_at: string
  preferred_language: string | null
  short_code: string | null
  parent_name: string | null
  parent_email: string | null
  children: TesterChild[]
}

/** Funnel stage a family has reached (highest one). */
export type Stage = 'signed_up' | 'activated' | 'engaged' | 'active'

/** Attention-triage flag for the CRM column. */
export type Flag = 'active' | 'churn_risk' | 'not_started' | 'stuck'
