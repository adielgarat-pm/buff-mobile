// Human-readable labels for onboarding challenge + motivator ids.
// Challenge ids mirror src/screens/onboarding/unified/starterTasks/challengeMap.ts.

export const CHALLENGE_LABELS: Record<string, string> = {
  // Domain 1 — mornings
  calm_mornings: 'Calm mornings',
  morning_routine: 'Morning routine',
  getting_ready: 'Getting ready',
  // Domain 2 — homework / focus
  homework_reading: 'Homework & reading',
  homework_focus: 'Homework & focus',
  homework_focus_adv: 'Homework & focus (adv)',
  academic_perf: 'Academic performance',
  // Domain 3 — organisation
  organisation: 'Organisation',
  organisation_memory: 'Organisation & memory',
  planning_org: 'Planning & organisation',
  focus_planning: 'Focus & planning',
  // Domain 4 — screens
  screen_time: 'Screen time',
  screen_balance: 'Screen balance',
  screen_limits: 'Screen limits',
  social_media: 'Social media',
  // Domain 5 — confidence / social
  confidence: 'Confidence',
  confidence_friends: 'Confidence & friends',
  social_friendships: 'Social & friendships',
  // Domain 6 — time management
  time_management: 'Time management',
  self_management: 'Self-management',
  // Domain 7 — independence
  independence: 'Independence',
  life_independence: 'Life & independence',
}

export const MOTIVATOR_LABELS: Record<string, string> = {
  gaming: '🎮 Gaming',
  sports: '⚽ Sports',
  creative: '🎨 Creative',
  social: '👫 Social',
  privileges: '🎟️ Privileges',
  money: '💰 Money',
}

export function challengeLabel(id?: string): string {
  if (!id) return '—'
  return CHALLENGE_LABELS[id] ?? id
}

export function motivatorLabel(id: string): string {
  return MOTIVATOR_LABELS[id] ?? id
}
