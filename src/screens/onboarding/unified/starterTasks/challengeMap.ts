/**
 * Maps every onboarding challenge id (OPTIONS_BY_AGE + legacy keys) → its
 * research domain (1–7). Adding/renaming a challenge = one line here; the
 * generator and task library never hard-code challenge ids.
 */
import type { Domain } from './types';

export const CHALLENGE_TO_DOMAIN: Record<string, Domain> = {
  // 1 — Morning routine / getting ready
  calm_mornings: 1,
  morning_routine: 1,
  getting_ready: 1,

  // 2 — Homework / focus / academics
  homework_reading: 2,
  homework_focus: 2,
  homework_focus_adv: 2,
  academic_perf: 2,

  // 3 — Organisation / planning / working memory
  organisation: 3,
  organisation_memory: 3,
  planning_org: 3,
  focus_planning: 3,

  // 4 — Screen time / social media
  screen_time: 4,
  screen_balance: 4,
  screen_limits: 4,
  social_media: 4,

  // 5 — Confidence / social-emotional / friendships
  confidence: 5,
  confidence_friends: 5,
  social_friendships: 5,

  // 6 — Time management / self-management
  time_management: 6,
  self_management: 6,

  // 7 — Independence / life skills
  independence: 7,
  life_independence: 7,
};

/** Resolve a challenge id to its domain, or null if unknown. */
export function domainForChallenge(challenge: string): Domain | null {
  return CHALLENGE_TO_DOMAIN[challenge] ?? null;
}
