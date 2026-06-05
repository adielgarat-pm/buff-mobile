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
| F-006 | Beta user migration from PWA | System | Out | M | Phase 2 | D-2026-05-14: only 2 active Lovable users; manual self-migration via Android app or future Web build (F-073). No automated migration tooling planned. |
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
| F-024 | Daily summary email/notification to parent | Parent | Out | XL | Phase 2 | D-2026-05-14: source = Lovable daily-summary edge function; envelopes F-020 + F-022. Pillar 2 flag for design phase: must NOT be a "child failures report" — must lead with progress and opportunity, not deficits. |
| F-025 | Schedule parsing (free text → timetable, AI) | Parent | Out | XL | Phase 2 | D-2026-05-14: source = Lovable parse-schedule edge function; reduces parent friction in F-004 setup. AI inference cost not justified for MVP. |
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
| F-039 | Push notifications (task reminders) | Child | Must Have | L | ✅ Shipped 2026-05-20 (`pkg/fcm-push-notifications`) | Kid-side via `expo-notifications` local scheduler (E7 body-doubling per-phase reminders), POST first-task-missed + 60min grace. Server push (E5 kid disengagement, E9 reward approved) via Edge Function. |
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
| F-063 | Firebase Cloud Messaging (push) | System | Must Have | L | ✅ Shipped 2026-05-20 (`pkg/fcm-push-notifications`) | FCM HTTP v1 single backend (IN-2026-05-19-01). Edge Function `push-notification-fanout`. Database Webhook on notifications INSERT. Activity-based suppression (IN-2026-05-19-02). |
| F-064 | Supabase database migration + cleanup | System | Must Have | M | MVP | Preserve beta users |
| F-065 | Hebrew + English i18n (RTL) | System | Must Have | M | MVP | Israeli + international market |
| F-066 | Offline caching (task list) | System | Should Have | M | MVP | User-requested; no internet at school |
| F-067 | Apple App Store submission | System | Out | M | Phase 2 | Android first; iOS after retention proven |
| F-068 | Referral program mechanics | System | Out | L | Phase 2 | Build architecture; activate after retention |
| F-069 | RevenueCat + Google Play Billing (Android MVP) + App Store Billing (iOS Phase 2). Lemon Squeezy for web payments. RevenueCat is free up to $2,500 MRR. | System | Must Have | L | MVP | Revenue — free-for-life + paid tiers |
| F-070 | Admin dashboard (preserve existing) | System | Must Have | M | MVP | Owner needs visibility into metrics |
| F-071 | In-app reviews mechanism (submit → moderate → display) | System | Out | L | Phase 2 | D-2026-05-14 (refined): Lovable has a full reviews flow (submit → pending → admin approve → public on Landing) + a `translate-review` edge function (Gemini Flash Lite). **Decision (Adi): Play Store ratings cover MVP need — don't build duplicate in-app system.** Existing Lovable reviews to be extracted and translated for use as testimonials (see INTEGRATION_LEARNINGS F-2026-05-14-02 + BUFF_TESTIMONIALS.md). Revisit F-071 only if pre-Play-Store in-app testimonials become a real need. |
| F-072 | Email password recovery (ResetPassword screen + deep link) | System | Out | S | Phase 2 | D-2026-05-14 **CONDITIONAL**: code partially exists (LoginScreen.tsx:65 calls resetPasswordForEmail; screen missing). Adi 2026-05-14: "if Google supports that, not sure we need it". If a future Auth Strategy session removes email/password auth → permanently cancelled. If email/password stays → returns to Should Have / MVP. Note: ChildJoinScreen.tsx:49 uses signUp(email, autoPassword, ...) — removing email/password auth would break child invite flow. |
| F-073 | Web build via Expo Web + PWA install | System | Should Have | L | Phase 2 | D-2026-05-14: single codebase across mobile + web (per BUFF_PRD §9.4 Web Strategy). Temporary iOS replacement until iOS native ships. Expo Web = React Native Web — production-grade at X/Twitter, Coinbase, Discord per Expo official docs (2026). |
| F-074 | Static marketing landing (buffadhd.com revamp) | System | Should Have | M | Phase 2 | D-2026-05-14: source = Lovable Landing.tsx; separate codebase from app (no logic-sharing needed for a static marketing site). Use translated Lovable reviews as social proof — see F-071 rationale + INTEGRATION_LEARNINGS F-2026-05-14-02. |
| F-075 | Sunset Lovable + white-glove migration of 2 active users | System | Should Have | M | Phase 2 | D-2026-05-14: 49 Lovable sign-ups, only 2 active per admin (verified 2026-05-14). **White-glove approach (Adi choice 2026-05-14):** (1) Adi/CC manually create accounts in mobile Supabase using the 2 users' emails; (2) set `is_lifetime_access=true`; (3) send personal email "your BUFF account is ready, set your password here"; (4) NO automated data migration — they re-onboard fresh kids/family in the mobile app; (5) decommission Lovable infra after both users confirm switchover. Trigger: after MVP stable in production + 30-day observation. Effort S→M to cover white-glove ops + email drafting. |
| F-076 | Parent Capture — share message/email/photo → AI structured tasks/events → transfer to child (the "parent half" of BUFF / mental-load layer) | Parent | Out | XL | Phase 2 — exploring | D-2026-06-05 (PM brainstorm with Adi): drafted, **NOT approved**. Feasibility proven on Gemini Flash (Hebrew text + WhatsApp photo + roster auto-assign). Market scan: combination is **white space** (kid-EF apps don't capture; parent-capture apps don't have a kid engine / transfer); Milo died Jan 2026 → position as the *transfer/family pipeline*, not "AI capture" (commodity). Superset of F-025 (schedule parsing) + F-024 (daily summary). Full strategy + detailed spec: `docs/sessions/parent-capture/DECISION.md` + `SPEC.md`. **Two hard gates before build (Adi's call): (1) now-vs-V-next focus; (2) Gemini dependency + children's-app privacy approval.** |


## Summary Counts


| Priority | Count | In MVP? |
|---|---|---|
| Must Have | 36 | Yes — all |
| Should Have | 12 | Yes — include |
| Nice to Have | 1 | If time allows |
| Out / Phase 2 | 12 | No — Phase 2 |

BUFF Feature Prioritization v1.0 — Confidential
