BUFF

Feature Prioritization — MVP v1.0

April 2026  |  Android First


## Prioritization Framework


| Priority | Definition | MVP included? |
|---|---|---|
| Must Have | Without this, the product cannot launch or the core promise is broken | YES — blocks launch |
| Should Have | Important for retention or differentiation; should ship in MVP if possible | YES — include in MVP |
| Nice to Have | Adds value but not critical for MVP success | MAYBE — if time allows |
| Out / Phase 2 | Deliberately excluded from MVP; will be built later | NO — Phase 2 |

Effort scale: S = 1-2 days, M = 3-5 days, L = 1-2 weeks, XL = 2+ weeks


## Full Feature List


| ID | Feature | Persona | Priority | Effort | Phase | Rationale |
|---|---|---|---|---|---|---|
| ONBOARDING | ONBOARDING | ONBOARDING | ONBOARDING | ONBOARDING | ONBOARDING | ONBOARDING |
| F-001 | Parent registration (email/Google) | Parent | Must Have | S | MVP | Cannot use app without account |
| F-002 | Child profile setup | Parent | Must Have | S | MVP | Core unit of the product |
| F-003 | UI mode auto-selection by age | Parent | Must Have | S | MVP | 6-12 buddy, 13-18 dashboard |
| F-004 | Timetable / schedule entry | Parent | Must Have | M | MVP | Enables bag packing feature |
| F-005 | Equipment list per subject | Parent | Must Have | M | MVP | Core daily utility value |
| F-006 | Beta user migration from PWA | System | Must Have | M | MVP | Retain existing users and data |
| F-007 | Free-for-life flag for beta users | System | Must Have | S | MVP | Honor commitment to early community |
| PARENT DASHBOARD & TASK MANAGEMENT | PARENT DASHBOARD & TASK MANAGEMENT | PARENT DASHBOARD & TASK MANAGEMENT | PARENT DASHBOARD & TASK MANAGEMENT | PARENT DASHBOARD & TASK MANAGEMENT | PARENT DASHBOARD & TASK MANAGEMENT | PARENT DASHBOARD & TASK MANAGEMENT |
| F-010 | Create tasks by category | Parent | Must Have | M | MVP | Core functionality |
| F-011 | Set task schedule (daily/specific days) | Parent | Must Have | M | MVP | Routine requires schedule |
| F-012 | Set credits per task | Parent | Must Have | S | MVP | Reward system depends on this |
| F-013 | Approve / reject task completions | Parent | Must Have | M | MVP | Trust mechanism |
| F-014 | Auto-approve option for tasks | Parent | Should Have | S | MVP | Reduces parent overhead |
| F-015 | Approve child-proposed tasks | Parent | Must Have | S | MVP | New feature — key differentiator |
| F-016 | Approve child-proposed rewards | Parent | Must Have | S | MVP | New feature — autonomy |
| F-017 | Define reward store | Parent | Must Have | M | MVP | Motivation system |
| F-018 | PAUSE MODE | Parent | Must Have | S | MVP | Critical retention fix — top user insight |
| F-019 | Resume with welcome-back message | Parent+Child | Must Have | S | MVP | Warm re-engagement after pause |
| F-020 | Family completion dashboard | Parent | Should Have | M | MVP | Parent needs visibility |
| F-021 | Push notification to parent on completion | Parent | Must Have | S | MVP | Enables async approval |
| F-022 | AI insights for parent | Parent | Out | XL | Phase 2 | High cost; not blocking retention |
| F-023 | Share progress with therapist/teacher | Parent | Out | L | Phase 2 | Important but complex |
| CHILD UI — BUDDY MODE (6-12) | CHILD UI — BUDDY MODE (6-12) | CHILD UI — BUDDY MODE (6-12) | CHILD UI — BUDDY MODE (6-12) | CHILD UI — BUDDY MODE (6-12) | CHILD UI — BUDDY MODE (6-12) | CHILD UI — BUDDY MODE (6-12) |
| F-030 | Single next-task view (not a list) | Child | Must Have | M | MVP | Prevents overwhelm — ADHD critical |
| F-031 | Task completion with buddy animation | Child | Must Have | M | MVP | Immediate positive reinforcement |
| F-032 | Buddy evolution (egg to full character) | Child | Must Have | L | MVP | Core retention mechanic |
| F-033 | Buddy skins (unlockable) | Child | Must Have | M | MVP | Long-term motivation |
| F-034 | Credits accumulation display | Child | Must Have | S | MVP | Visible progress |
| F-035 | Reward redemption from store | Child | Must Have | M | MVP | Closes the motivation loop |
| F-036 | Propose new task to parent | Child | Must Have | S | MVP | Key differentiator vs Joon — ownership |
| F-037 | Propose new reward to parent | Child | Must Have | S | MVP | Child-driven motivation |
| F-038 | Bag packing checklist (evening) | Child | Must Have | M | MVP | Daily utility — drives habit |
| F-039 | Push notifications (task reminders) | Child | Must Have | L | MVP | Without this, PWA problem repeats |
| F-040 | Offline mode (read-only task list) | Child | Should Have | M | MVP | Requested by users; no WiFi at school |
| F-041 | Streak display and celebration | Child | Should Have | M | MVP | Week-level retention |
| F-042 | Mini games for buddy (offline) | Child | Nice to Have | XL | Phase 2 | Requested; complex; not blocking |
| TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) |
| F-043 | Child + Teen | Daily Vibe Check — energy level 1-5 at start of day. Kids: emoji faces. Teens: energy bars. Level ≤2 activates Low Power Mode (reduced tasks), SOS to parent, Instant Buff. Already fully implemented in current codebase. | Fully implemented in PWA | Must Have | S | MVP | Existing feature — carry over to React Native. This is the daily disruption mechanism + daily emotional check-in. |
| TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) | TEEN UI — DASHBOARD MODE (13-18) |
| F-050 | Clean dashboard (no buddy) | Teen | Must Have | M | MVP | Teens reject childish UI |
| F-051 | Goals and streak view | Teen | Must Have | M | MVP | Autonomy and self-tracking |
| F-052 | Deal-making with parent (propose task+reward) | Teen | Must Have | S | MVP | Core teen differentiator |
| F-053 | Streak grace mechanic (1 miss = no break) | Teen | Should Have | S | MVP | ADHD reality — perfect streaks unrealistic |
| F-054 | Calendar heat-map of completions | Teen | Should Have | M | MVP | Visual progress — teen motivation |
| TECHNICAL INFRASTRUCTURE | TECHNICAL INFRASTRUCTURE | TECHNICAL INFRASTRUCTURE | TECHNICAL INFRASTRUCTURE | TECHNICAL INFRASTRUCTURE | TECHNICAL INFRASTRUCTURE | TECHNICAL INFRASTRUCTURE |
| F-060 | React Native app (Android build) | System | Must Have | XL | MVP | Core platform requirement |
| F-061 | Google Play Store submission + RevenueCat payment integration — CRITICAL: grace period expires May 1 2026. No payment system exists in current codebase. | System | Must Have | S | MVP | Distribution channel |
| F-062 | iOS architecture ready (not released) | System | Must Have | M | MVP | Build once, deploy twice later |
| F-063 | Firebase Cloud Messaging (push) | System | Must Have | L | MVP | Reliable push is non-negotiable |
| F-064 | Supabase database migration + cleanup | System | Must Have | M | MVP | Preserve beta users |
| F-065 | Hebrew + English i18n (RTL) | System | Must Have | M | MVP | Israeli + international market |
| F-066 | Offline caching (task list) | System | Should Have | M | MVP | User-requested; no internet at school |
| F-067 | Apple App Store submission | System | Out | M | Phase 2 | Android first; iOS after retention proven |
| F-068 | Referral program mechanics | System | Out | L | Phase 2 | Build architecture; activate after retention |
| F-069 | RevenueCat + Google Play Billing (Android MVP) + App Store Billing (iOS Phase 2). Lemon Squeezy for web payments. RevenueCat is free up to $2,500 MRR. | System | Must Have | L | MVP | Revenue — free-for-life + paid tiers |
| F-070 | Admin dashboard (preserve existing) | System | Must Have | M | MVP | Owner needs visibility into metrics |


## Summary Counts


| Priority | Count | In MVP? |
|---|---|---|
| Must Have | 37 | Yes — all |
| Should Have | 9 | Yes — include |
| Nice to Have | 1 | If time allows |
| Out / Phase 2 | 6 | No — Phase 2 |

BUFF Feature Prioritization v1.0 — Confidential
