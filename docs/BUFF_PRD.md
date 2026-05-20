BUFF

Product Requirements Document (PRD)

Version 1.0  |  MVP Release


| Product | BUFF — Family Routine & Habit App |
|---|---|
| Owner | Adi Elgarat German |
| Status | Planning — Pre-Development |
| Version | 1.0 MVP |
| Date | April 2026 |
| Target Launch | Android native — Q3 2026 |


## 1. Executive Summary

BUFF is a gamified routine and habit app for children with ADHD aged 6–18, designed around a core philosophical belief: children do not need to be managed — they need to be empowered. Built on positive coaching principles, BUFF scaffolds independence so that over time, children no longer need the app.

Unlike competitor Joon (500K users, $6.4M raised), which relies on extrinsic rewards (virtual pet coins tied to a game), BUFF builds intrinsic motivation through real rewards the child chooses, a buddy character that grows with the child, and a teen interface built for autonomy. BUFF defines success at 70% — not 100% — because demanding perfection causes ADHD children to not start at all. BUFF is the only app in this space that explicitly plans for the child to outgrow it.

The primary paying customer is the parent. The primary user is the child. The product wins when the parent stops nagging and the child develops genuine self-efficacy.


## 2. Problem Statement


### 2.1 The Core Problem

Children with ADHD struggle with executive function — the ability to plan, prioritize, and initiate tasks. This is not defiance or laziness. It is a neurological challenge that creates daily friction at home:

- Parents repeat instructions multiple times every morning and evening
- Children feel like failures; parents feel like wardens
- The parent-child relationship suffers from constant conflict around basic routines
- Traditional solutions (sticker charts, verbal reminders, punishment) do not address the neurological root cause

### 2.2 Evidence from User Research

From surveys and interviews with BUFF beta users (183 families, Israel & international):

- Top reason for trying BUFF: 'Daily friction at home due to routines' and 'Child with ADHD who struggles to start tasks'
- AHA moment (Noa Morag, top user): 'The day I didn't need to remind things multiple times — maybe just asked if it was done'
- Primary churn reason: Disruption to routine (war, vacation, illness) with no easy way back
- Secondary churn reason: Child's motivation drops after 1–2 months as novelty wears off
- 65% of children use the parent's phone (no independent device) — a critical UX constraint

### 2.3 The Gap in the Market

Joon solves the 'get tasks done today' problem with extrinsic motivation. No app in the market solves:

- Long-term independence building (ages 6–18 in one continuous product)
- Disruption recovery (pause and resume without losing progress)
- Teen-specific interface built for autonomy, not compliance
- Child-initiated tasks (ownership of their own routine)
- Reliable push notifications on mobile (PWA limitations)

## 3. Product Vision & Positioning


### 3.1 Vision Statement

BUFF is the app that grows with your child — from the chaos of morning routines at age 6, to the independence of managing their own schedule at 18. We win when the child doesn't need us anymore.


### 3.2 Positioning


| Joon | BUFF |
|---|---|
| Ages 6–12 only | Ages 6–18, two child aesthetics (Pastel & Gamer) — kid picks |
| Extrinsic: coins for game access | Intrinsic: buddy grows with child's success |
| Parent controls everything | Child proposes tasks & rewards (real-life) |
| No disruption recovery | Pause mode — resume without rebuilding |
| No AI insights | AI insights for parent (Phase 2) |

Tagline: "Joon is for kids. BUFF is for your family."


## 4. Target Audience


### 4.1 Primary Customer (Paying)

Parent of a child with ADHD, age 6–18

- Profile: Parent who has already been exposed to positive discipline or coaching approaches
- Pain: Daily conflict around routines — morning, homework, bedtime
- Goal: Reduce friction AND build long-term independence in their child
- Willingness to pay: Already pays for therapists ($50-150/session), parenting courses, supplements
- Discovery channel: Facebook ADHD Parenting groups, word of mouth from other parents

### 4.2 Primary User (Child)

Child with ADHD, ages 6–18. The product has **three modes** — one for the buying parent, two for the kid as aesthetic choices. The kid picks their aesthetic at first launch, with the parent's device or a shared desktop being the typical context (per §2.2 — 65% of beta users share a device). The kid can switch modes anytime in Settings, no parent approval required.

**Mode structure:**

|  | Parent Mode | Pastel Mode | Gamer Mode |
|---|---|---|---|
| For | Buying parent | Kid who prefers softer aesthetic | Kid who prefers dashboard / dark aesthetic |
| Default for | All parents | Kid ages 6–8 if no choice made; age 9+ default suggested but kid picks | Kid age 9+ when they choose it |
| BUDDY character | N/A | Default on (kid can turn off) | Default off (kid can turn on) |
| Visual feel | Light, soft violet, friendly | Dark canvas, neon-leaning, dashboard-style |  |
| Motivation | Approval queue, dashboard | Buddy growth, skins, real rewards child chose, 70% = success | Self-proposed tasks/rewards, deal-making, autonomy, real rewards |
| Cooperation | N/A | High — responds quickly to buddy/rewards | Conditional — needs ownership and respect |
| Vibe Check display | N/A | Emoji faces | Energy bars |

**Rationale for aesthetic-based modes** (not age-gated): kid agency is Pillar 3 (Independence-Building). Age is a heuristic, not a value — Itay (15) and Emi (9) both made individual choices that happened to match stereotypes, but at scale many won't. Gender is never used as a default (reputational + Pillar-3 risk). See D-2026-05-11-01.


### 4.3 Geographic Market

- Primary: International English-speaking markets (US, UK, Canada, Australia)
- Secondary: Israel (existing user base, product validation)
- Discovery: Facebook ADHD Parenting groups — primary acquisition channel
- Note: 96% of beta users are Israeli; international expansion is the primary growth target

## 5. Business Model


### 5.1 Pricing Tiers


| Tier | Free | Family ($9/mo) | Family Pro ($19/mo) |
|---|---|---|---|
| Children | 1 child | Up to 3 children | Unlimited children |
| Tasks | 5 tasks | Unlimited | Unlimited |
| Buddy & Skins | Basic buddy only | Full buddy + skins | Full buddy + all skins |
| Push notifications | Basic | Smart reminders | Smart reminders + weekly reports |
| Ads | None (ever) | None | None |

No ads policy: BUFF will never show ads. The audience is parents of children with ADHD under stress. Ads would destroy trust.


### 5.2 Special Programs

Beta User Free-for-Life

The is_lifetime_access field already exists in the database (profiles table). Implementation is simple: set this flag to true for qualifying beta users. The current codebase already has a grace period active until May 1, 2026 (GRACE_PERIOD_END), giving all existing users temporary pro access. The MVP must include a real payment system before this date. Beta users who qualify will have is_lifetime_access = true permanently after the grace period ends. Criteria:

- Completed family + child setup
- Created at least 1 task
- OR responded to the beta survey
Rationale: These users contributed to the product. They are the founding community and should be rewarded accordingly.

Referral Program (Phase 2)

A referral program will be built into the architecture from day one but not activated until:

- 20-30 families demonstrate genuine 30-day retention
- NPS score is positive
Activating referrals too early risks burning warm leads on an unproven product.


## 6. Product Philosophy


### 6.1 Core Principles

BUFF is built on the following non-negotiable principles:

- Independence over dependency — The goal is for children to not need BUFF. Every feature must be evaluated against this principle.
- Positive reinforcement only — No negative consequences, no 'sad buddy', no punishment mechanics. Research shows positive reinforcement outperforms punishment for ADHD children.
- The child is a stakeholder — Children can propose tasks and rewards (subject to parent approval). Ownership drives compliance.
- Scaffold that fades — BUFF is a set of training wheels. Phase 1: parent + app remind. Phase 2: app reminds only. Phase 3: child self-initiates. Phase 4: child doesn't need the app.
- Disruption is normal, not failure — Life interrupts routines. BUFF must make resumption frictionless, not shameful.
- 70% is success — BUFF defines task completion success at 70%, not 100%. Demanding perfection causes ADHD children to not even start, out of fear of failure. A child who completes 7 out of 10 tasks is succeeding. This principle is embedded in how streaks, credits, and progress are calculated throughout the app.

### 6.3 The BUFF Rewards System

Credits in BUFF are called BUFFs. The reward system is built on three core beliefs:

- Real rewards, not virtual coins — Rewards are things the child actually wants: a movie night, extra screen time, a day trip, a fan convention. Parent and child define these together. The child is always working toward something meaningful to them personally.
- Always close to a win — BUFF calculates each child’s daily BUFF-earning capacity (based on their task list) and guides parents to price rewards so that: small rewards are achievable every 1–2 days, medium rewards every 5–7 days. The child is never in a situation where the next reward feels unreachable. This is the same reinforcement schedule behind every successful game — applied to real life.
- Child-proposed rewards — Children, especially teens, can suggest rewards they want to work toward. This creates genuine ownership: “I’m doing my homework because I’m 3 days away from ComicCon” is fundamentally different from “I’m doing my homework because mom said so.”

### 6.4 What BUFF Is NOT

- Not a surveillance tool — BUFF does not track children's location or behavior beyond task completion
- Not a game — The buddy is a companion, not a game character to compete over
- Not a replacement for therapy — BUFF is a complement to professional support
- Not a forever product — If a child no longer needs BUFF, that is success

## 7. MVP Scope


### 7.1 IN — MVP Features

The following features must be present in the MVP. All features from the existing BUFF app are preserved EXCEPT School Quest.

Parent Interface

- Family and child setup (onboarding — preserve existing flow)
- Task creation and management by category (Self-Care, Organization, Learning, Responsibility, Movement)
- Timetable / schedule loading (class schedule entry)
- Equipment list per day based on timetable
- Bag packing reminder based on next day's schedule
- Reward definition — parent and child together define real-life rewards (movie night, extra screen time, fan convention, day trip). Each reward is priced in BUFFs (BUFF’s credit currency). The system guides the parent to price rewards so small rewards are achievable every 1–2 days and larger rewards every 5–7 days, based on the child’s daily earning capacity. The child is always close to a win.
- Task approval (parent reviews and approves child-submitted completions)
- Child-proposed task approval (new) — child suggests a task, parent approves or edits
- Child-proposed reward approval (new) — child suggests a reward, parent approves
- PAUSE MODE (new, critical) — single button to freeze all tasks without deleting progress
- Resume from pause with 'Welcome back' experience
- Family dashboard — task completion overview
Child Interface — Pastel Mode (default for 6–8 fallback; chosen by kid age 9+)

- Buddy character that evolves from egg to full character (default on; kid can toggle off)
- Buddy skins (unlockable)
- Daily task view — one task at a time, clear and unambiguous
- Task completion marking
- Points and credits accumulation (BUFFs balance)
- Reward redemption
- Ability to propose a new task to parent (new)
- Daily Vibe Check — kid rates energy level 1-5 at start of day. In Pastel Mode: emoji faces. If level ≤2: Low Power Mode activates (reduced task list), SOS button to parent, and Instant Buff option. Already fully implemented in current codebase.
- Rest Tickets — child earns 1 ticket per 5 completed tasks. Ticket skips a day without hurting 70% goal. Already implemented. This is the daily disruption mechanism.
- Push notifications: buddy waiting, task reminder, progress notification
- Visual: lighter violet palette, soft accents, friendly tone

Child Interface — Gamer Mode (chosen by kid; recommended default for age 13+ unless kid picks otherwise)

- Buddy character default off (kid can opt in)
- Clean dashboard-style layout
- Goals view — weekly and monthly
- Task list with self-initiation emphasis
- Deal-making interface — propose tasks and rewards for parent approval
- Daily Vibe Check — same mechanic, but UI uses energy bars instead of emoji faces
- BUFFs balance + real-reward proximity prominent
- Push notifications: task reminders, goal progress
- Visual: dark violet canvas, gaming-tactical aesthetic, lime-green signaling (consistent with BUFF_BRAND.md §7)
Technical Infrastructure

- React Native app — Android first, iOS architecture ready
- Native push notifications (FCM for Android)
- Offline mode — task list visible without internet connection
- Supabase backend — migrate and clean existing database
- i18n support — English (primary) and Hebrew. Note: 1,036 translation keys exist in both languages already.
- Payment / subscription system (Stripe or RevenueCat) — CRITICAL: grace period expires May 1 2026. No payment system currently exists in the codebase.

### 7.2 OUT — Not in MVP


| Feature | Phase | Reason |
|---|---|---|
| School Quest | CatchUp product | 0 completions in 7 days; different use case |
| AI Insights for parent | Phase 2 | High cost, not critical to retention |
| iOS App Store release | Phase 2 | Android first; architecture supports iOS |
| Referral program activation | Phase 2 | Activate after 20-30 families with retention |
| Sharing with therapist / teacher | Phase 2 / Pro | Important but complex; not blocking MVP |


## 8. Retention Strategy


### 8.1 The Three Retention Cliffs

User research identified three distinct periods where churn occurs:


| Period | Problem | Solution |
|---|---|---|
| Days 1–3 | Child doesn't open app; parent forgets to remind | Native push at key times; buddy 'waiting' notification; onboarding sets parent expectation that reminding days 1-3 is normal |
| Week 2–4 | Disruption (vacation, illness, crisis) breaks streak | PAUSE MODE — one tap freezes everything. Resume with warm 'welcome back' message. Streak forgiveness mechanic. |
| Month 2+ | Novelty wears off; child loses motivation | New buddy evolution stages; child proposes new tasks (ownership); seasonal challenges; new reward categories |


## 9. Technical Requirements


### 9.1 Tech Stack


| Layer | Technology | Rationale |
|---|---|---|
| Mobile Framework | React Native | Single codebase for Android + iOS; familiar to React developers; strong community |
| Launch Platform | Android (Google Play Store) first | 36/39 existing PWA installations are Android; faster review process than Apple |
| Backend & DB | Supabase (existing, cleaned) | Existing data preserved; PostgreSQL; auth included; real-time capable |
| Push Notifications | Firebase Cloud Messaging (FCM HTTP v1) — replaces PWA Web Push | ✅ Shipped 2026-05-20 via `pkg/fcm-push-notifications` (Android live; Expo Web stub Phase 2-ready; iOS design-only). Single backend, multi-platform `device_tokens` table, Supabase Edge Function `push-notification-fanout` for dispatch with activity-based suppression. |
| Internationalization | i18next / react-i18next | English primary; Hebrew secondary; RTL support required |


### 9.2 Database Migration

- Preserve: families, profiles, tasks, store_rewards, notifications, timetables, child_vibes, credit_vault, daily_progress, stickers, app_settings, push_subscriptions, pwa_events tables
- Archive: School Quest tables (lesson_progress, lesson_reflections) — set school_quest_enabled = false on all profiles. Data kept, feature hidden.
- Clean: Remove test accounts (identified by name/email patterns: test, buffapp., אקדא4)
- Activate: Set is_lifetime_access = true for qualifying beta users. This field already exists in the profiles table.
- CRITICAL: Grace period expires May 1, 2026. Payment system must be live before this date or all users lose access.
- Add new fields: pause_mode_active (boolean) to app_settings; proposed_by_child (boolean) to tasks; proposed_by_child (boolean) to store_rewards
- Replace: push_subscriptions (Web Push) with FCM tokens table for native Android notifications

### 9.3 Critical Non-Functional Requirements

- Offline mode: Task list must be accessible without internet connection
- Push notification delivery rate: >95% within 2 minutes of scheduled time
- App launch time: <2 seconds on mid-range Android device
- RTL support: Full right-to-left layout for Hebrew UI
- COPPA compliance: No data collection from children without parental consent

### 9.4 Web Strategy (post-MVP)

D-2026-05-14: Long-term goal is **single codebase across mobile and web** to avoid maintaining two source trees. The Lovable web POC (separate Supabase project, frozen since 2026-04-18) will be sunset post-MVP.

**Three-layer architecture (target state):**

| Layer | Technology | Codebase | Notes |
|---|---|---|---|
| 1. Marketing landing | Static site (Astro / Next / plain HTML) | Separate, lightweight | SEO-optimized; no app logic. buffadhd.com revamp = F-074 |
| 2. App (mobile + web) | Expo (React Native + React Native Web) | **Single codebase** | Compiles to Android, iOS, and Web/PWA from one source. Web build = F-073. Industry-standard at 2026: X/Twitter, Coinbase, Discord, Tesla all use RNW in production (per Expo docs) |
| 3. Backend | Supabase (existing) | Unchanged | — |

**Why Expo Web over alternatives:**

- **Capacitor** (web-first, wrap in native shell): wrong fit — we already invested in Expo and have native modules (FCM, Google OAuth) that work cleanly in React Native.
- **Separate web codebase** (Next.js + RN mobile in parallel): defeats the single-codebase goal — exactly what we are avoiding.
- **React Strict DOM** (Meta's evolution beyond RNW): production-ready in Meta's VR but **built on top of RNW, not a replacement** — no risk of "RNW deprecation" mid-stream.

**Known trade-offs (must plan for):**

- Native-only modules (notably FCM push, native vibration, deep camera access) have limited or no PWA support. Web users will have a degraded experience compared to native — accepted as a temporary fallback.
- Mobile-first UI will look narrow on desktop. Responsive work needed for parent-facing screens (parents often use desktop).
- F-039 already notes: "Without push, the PWA problem repeats" — the web build is intended for users without an Android device, NOT as the long-term default.

**Lovable sunset (F-075):** 49 sign-ups in Lovable, only 2 active per admin dashboard (verified 2026-05-14). The 2 active users will be notified and self-migrate to either the Android app or the Web build (when shipped). No automated data migration — schemas diverged and the cost of migration tooling > the cost of re-onboarding 2 humans. Trigger date: after MVP stable in production + 30-day observation window.

**Engineering discipline:** Before adding any new native dep to `package.json`, verify it builds for `expo export --platform web` — otherwise the future Web build will break silently. Tracked in INTEGRATION_LEARNINGS.md as F-2026-05-14-01.

**Sources:** Expo for Web (docs.expo.dev/workflow/web), React Strict DOM (facebook.github.io/react-strict-dom), Coinbase React Native transition (coinbase.com/blog), PkgPulse RN/Expo/Capacitor 2026 comparison.

## 10. Success Metrics


### 10.1 MVP Success Criteria

The MVP is considered successful when the following metrics are achieved within 90 days of launch:


| Metric | Target | Why it matters |
|---|---|---|
| Paying families | 10 families | Proof of willingness to pay |
| 30-day retention (WAU) | >40% | Core retention problem solved |
| Onboarding completion rate | >70% | Preserve existing strong onboarding |
| Child-initiated task proposals | >20% of active families | Validates ownership/autonomy mechanic |
| Pause mode usage after disruption | Track + analyze | Validate disruption recovery hypothesis |
| App Store rating (Android) | >4.2 stars | Social proof for acquisition |


## 11. Open Questions & Decisions Pending


| Question | Options | To be validated by |
|---|---|---|
| Free trial length for freemium conversion? | 7 days / 14 days / 30 days | Community survey + A/B test |
| Exact beta users eligible for free-for-life? | Survey respondents / all with tasks created | Owner decision (Adi) |
| Community survey before or after MVP build? | Before (validate MVP) / After (feature requests) | Decided: validate MVP first, then survey |

BUFF PRD v1.0 — Confidential
