// Classify a child's CURRENT tasks against BUFF's starter templates.
//
// Honest scope: the DB has no flag marking a task as onboarding-origin
// (is_system_generated is never written today), and testers were onboarded with
// an OLDER task source than the current generator — so we cannot reliably
// reconstruct the exact "offered" set, and a task that was offered-then-deleted
// ("removed") is unknowable. What we CAN tell reliably is whether each surviving
// task matches a known BUFF template (kept) or was personalized/added (custom).
//
// To recover true kept/removed/added for future cohorts, start writing
// is_system_generated=true (or snapshot the offered set) at onboarding.

import { isStarterTitle } from './starterTitles'
import type { TesterChild, TesterTask } from './types'

export interface OnboardingDiff {
  /** Current tasks whose title matches a BUFF starter template. */
  fromTemplate: TesterTask[]
  /** Current tasks with no template match — parent-personalized or kid-proposed. */
  custom: TesterTask[]
  /** Share of tasks that are custom (0–1) — a personalization signal. */
  customRate: number
}

export function onboardingDiff(child: TesterChild): OnboardingDiff | null {
  if (child.tasks.length === 0) return null
  const fromTemplate: TesterTask[] = []
  const custom: TesterTask[] = []
  for (const t of child.tasks) {
    if (isStarterTitle(t.title)) fromTemplate.push(t)
    else custom.push(t)
  }
  return {
    fromTemplate,
    custom,
    customRate: custom.length / child.tasks.length,
  }
}
