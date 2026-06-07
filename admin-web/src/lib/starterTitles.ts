// A normalized set of every title BUFF has ever offered as a starter task,
// across BOTH onboarding sources:
//   - STARTER_TASKS_BY_CHALLENGE (the positional source the current testers
//     were onboarded with), and
//   - STARTER_TASK_LIBRARY (the newer generator engine).
//
// We classify a child's current task as "from a BUFF template" if its title
// matches any of these, else "custom / personalized". This avoids depending on
// which app version a given tester onboarded with — see onboardingDiff.ts.

import { STARTER_TASKS_BY_CHALLENGE } from './starterTasks/onboardingData'
import { STARTER_TASK_LIBRARY } from './starterTasks/taskLibrary'

const norm = (s: string) => s.trim().toLowerCase()

function build(): Set<string> {
  const set = new Set<string>()
  for (const list of Object.values(STARTER_TASKS_BY_CHALLENGE)) {
    for (const t of list) {
      set.add(norm(t.title.en))
      set.add(norm(t.title.he))
    }
  }
  for (const t of STARTER_TASK_LIBRARY) {
    set.add(norm(t.title.en))
    set.add(norm(t.title.he))
  }
  return set
}

export const KNOWN_STARTER_TITLES = build()

export function isStarterTitle(title: string): boolean {
  return KNOWN_STARTER_TITLES.has(norm(title))
}
