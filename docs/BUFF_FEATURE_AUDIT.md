BUFF

Existing Feature Audit — MVP Planning

Source: BUFF-Knowledge-Base.md  |  April 2026


## Decision Legend


| Keep as-is | Feature exists and works well — carry over to React Native as-is |
|---|---|
| Keep + Expand | Feature exists but needs significant enhancement for MVP goals |
| New feature | Does not exist in current app — must be built from scratch |
| Remove / Archive | Exists in current app — deliberately removed from MVP scope |
| Defer to Phase 2 | Does not exist yet — valuable but not blocking MVP launch |

Terminology note: Credits = Buffs (באפים) throughout all documents. The rewards store = The Shop. Tasks = Missions. Phases = Stages.


## Complete Feature Audit


| # | Area | Feature | Current state | MVP decision | Notes |
|---|---|---|---|---|---|
| DESIGN SYSTEM | DESIGN SYSTEM | DESIGN SYSTEM | DESIGN SYSTEM | DESIGN SYSTEM | DESIGN SYSTEM |
| D-01 | Design | Dual-aesthetic: Child Gamer Mode (dark/neon) + Parent Zen Mode (light/minimal) | Fully implemented | Keep as-is | Core UX principle — preserve exactly |
| D-02 | Design | Teen dashboard UI (no buddy, clean layout) | Partially implemented | Keep + Expand | Needs dedicated design pass for 13+ segment |
| D-03 | Design | RTL Hebrew support | Implemented | Keep as-is | Verify in React Native build |
| D-04 | Design | English + Hebrew i18n | Implemented | Keep as-is | English primary, Hebrew secondary |
| ONBOARDING | ONBOARDING | ONBOARDING | ONBOARDING | ONBOARDING | ONBOARDING |
| O-01 | Onboarding | V2 Onboarding: quiz (name, age, challenge, goal) → roadmap → auth | Implemented (V2) | Keep as-is | This is the polished flow that reduced drop-off |
| O-02 | Onboarding | Language selection at start | Implemented | Keep as-is | Keep as first screen |
| O-03 | Onboarding | Classic onboarding (6-step flow) | Implemented (legacy) | Keep as-is | May consolidate with V2 in rebuild |
| O-04 | Onboarding | Family Code invite system | Implemented | Keep as-is | Simple and effective |
| O-05 | Onboarding | Starter Packs (Morning Flow, Evening, Homework Hero, Movement) | Implemented | Keep as-is | Pre-configured packs accelerate setup |
| PARENT FEATURES | PARENT FEATURES | PARENT FEATURES | PARENT FEATURES | PARENT FEATURES | PARENT FEATURES |
| P-01 | Parent | Family Overview: real-time progress of all children | Implemented | Keep as-is | Core parent dashboard |
| P-02 | Parent | Mission Management: create, edit, assign missions with Buff values | Implemented | Keep as-is | Core functionality |
| P-03 | Parent | Stage-based scheduling (Morning → School → Afternoon → Evening) | Implemented | Keep as-is | Important structure for ADHD routine |
| P-04 | Parent | Timetable: school schedule entry | Implemented | Keep as-is | Key daily utility |
| P-05 | Parent | My Gear / Bag Prep: equipment per subject + evening packing reminder | Implemented | Keep as-is | High value, drives daily habit |
| P-06 | Parent | The Shop: configure rewards children redeem with Buffs | Implemented | Keep + Expand | Add: pricing guidance based on daily earning capacity |
| P-07 | Parent | Daily Win Bonus: manual +20 Buffs to acknowledge invisible effort | Implemented | Keep as-is | Unique insight, aligned with philosophy |
| P-08 | Parent | View as Child: preview child's interface | Implemented | Keep as-is | Useful for onboarding and troubleshooting |
| P-09 | Parent | Stickers: send encouragement stickers to child | Implemented | Keep as-is | Simple engagement mechanic |
| P-10 | Parent | Approve / reject mission completions | Implemented | Keep as-is | Trust mechanism |
| P-11 | Parent | Auto-approve option for trusted missions | Implemented | Keep as-is | Reduces parent overhead |
| P-12 | Parent | Child-proposed missions (child suggests, parent approves) | NOT in app | New feature | Key differentiator vs Joon — must build |
| P-13 | Parent | Child-proposed rewards (child suggests, parent approves) | NOT in app | New feature | Critical for teen autonomy and motivation |
| P-14 | Parent | PAUSE MODE: freeze all missions for extended disruptions (war, illness) | NOT in app | New feature | Rest Tickets exist per-day but not for weeks/months |
| P-15 | Parent | Reward pricing guidance (daily earning capacity calculator) | NOT in app | New feature | Always close to a win — mathematical system |
| P-16 | Parent | Weekly Ignition Analysis (insights dashboard) | Implemented | Keep as-is | Parent analytics — mature feature |
| P-17 | Parent | Trend Detector: multi-week pattern recognition | Implemented | Keep as-is | Part of Insights |
| P-18 | Parent | Stage Performance: track success by Morning/School/Afternoon/Evening | Implemented | Keep as-is | Part of Insights |
| P-19 | Parent | Reflection Log: notes on learning | Implemented | Keep as-is | Part of Insights |
| P-20 | Parent | AI-powered insights and coaching recommendations | Partially | Defer to Phase 2 | Phase 2 — high cost, not blocking retention |
| CHILD FEATURES (Ages 6-12 — Buddy/Gamer Mode) | CHILD FEATURES (Ages 6-12 — Buddy/Gamer Mode) | CHILD FEATURES (Ages 6-12 — Buddy/Gamer Mode) | CHILD FEATURES (Ages 6-12 — Buddy/Gamer Mode) | CHILD FEATURES (Ages 6-12 — Buddy/Gamer Mode) | CHILD FEATURES (Ages 6-12 — Buddy/Gamer Mode) |
| C-01 | Child | Daily Missions view: one task at a time (not a list) | Implemented | Keep as-is | Critical for ADHD overwhelm prevention |
| C-02 | Child | Stage-based task flow (Morning → School → Afternoon → Evening) | Implemented | Keep as-is | Gives structure to the day |
| C-03 | Child | Mission completion with buddy animation and celebration | Implemented | Keep as-is | Immediate positive reinforcement |
| C-04 | Child | Focus Fuel Meter: visual daily progress indicator | Implemented | Keep as-is | Visual = ADHD friendly |
| C-05 | Child | Virtual Pet: egg → hatchling → scout → guardian | Implemented (4 stages) | Keep as-is | Core retention mechanic |
| C-06 | Child | Pet Skins: 10 options (puppy, cat, bunny, panda, capybara, unicorn, tiger, wolf, shark, dragon) | Implemented | Keep as-is | Personalization drives engagement |
| C-07 | Child | Command Center: skins, pet toggle, sound settings | Implemented | Keep as-is | Personalization hub |
| C-08 | Child | The Shop: redeem Buffs for parent-configured rewards | Implemented | Keep as-is | Closes the motivation loop |
| C-09 | Child | My Progress: weekly momentum bar, goal ring, ticket wallet | Implemented | Keep as-is | Streak and progress visualization |
| C-10 | Child | Rest Tickets: 1 ticket per 5 tasks, skip a day without breaking 70% goal | Implemented | Keep + Expand | Expand into full Pause Mode for longer disruptions |
| C-11 | Child | My Gear / Bag Prep: night mission checklist for tomorrow's bag | Implemented | Keep as-is | High daily utility |
| C-12 | Child | Cognitive Strategy Library (Power-Ups: Environment, Focus, Energy Buffs) | Implemented | Keep as-is | Unique educational layer |
| C-13 | Child | Day-Type Logic: auto-switch School Day vs Off Day missions | Implemented | Keep as-is | Reduces cognitive load |
| C-14 | Child | Birthday Celebrations: auto-detected | Implemented | Keep as-is | Delight moment |
| C-15 | Child | Midnight Reset: checkboxes reset at 00:00 (total Buffs don’t reset) | Implemented | Keep as-is | Correct mechanic |
| C-16 | Child | Propose new mission to parent | NOT in app | New feature | Child ownership — key differentiator |
| C-17 | Child | Propose new reward to parent | NOT in app | New feature | Child autonomy mechanic |
| C-18 | Child | Offline mode: task list visible without internet | NOT in app | New feature | Requested by users; school has no WiFi |
| TEEN FEATURES (Ages 13-18 — Dashboard Mode) | TEEN FEATURES (Ages 13-18 — Dashboard Mode) | TEEN FEATURES (Ages 13-18 — Dashboard Mode) | TEEN FEATURES (Ages 13-18 — Dashboard Mode) | TEEN FEATURES (Ages 13-18 — Dashboard Mode) | TEEN FEATURES (Ages 13-18 — Dashboard Mode) |
| T-01 | Teen | Clean dashboard UI (no buddy character) | Partial | Keep + Expand | Needs dedicated design — currently minimal |
| T-02 | Teen | Goals view (weekly, monthly) | Partial | Keep + Expand | Teen needs goal-setting, not just tasks |
| T-03 | Teen | Deal-making: propose task + reward bundle to parent | NOT in app | New feature | Core teen differentiator |
| T-04 | Teen | Streak tracker with grace mechanic (1 miss ≠ broken streak) | Partial | Keep + Expand | ADHD reality — needs explicit grace rule |
| T-05 | Teen | Calendar heat-map of completions | NOT in app | New feature | Visual progress for teen self-awareness |
| SMART & SYSTEM FEATURES | SMART & SYSTEM FEATURES | SMART & SYSTEM FEATURES | SMART & SYSTEM FEATURES | SMART & SYSTEM FEATURES | SMART & SYSTEM FEATURES |
| S-01 | System | Push Notifications: context-aware coaching nudges by pet stage + time of day | Implemented (PWA) | Keep + Expand | Critical: PWA push unreliable → native FCM required |
| S-02 | System | Notification messages library (morning, departure, focus, shower, bedtime) | Implemented | Keep as-is | Copy is good, just needs native delivery |
| S-03 | System | 15-Minute Rule: cognitive strategy for task startup | Implemented | Keep as-is | Unique pedagogical feature |
| S-04 | System | Dopamine Bridge: tiered reward system philosophy | Implemented | Keep as-is | Philosophy expressed in reward pricing |
| S-05 | System | Parent Bonus (+20 Buffs) for invisible effort | Implemented | Keep as-is | Aligned with positive reinforcement philosophy |
| S-06 | System | PWA Install: cross-platform installation | Implemented | Remove / Archive | Replaced by native Android app (React Native) |
| S-07 | System | Supabase backend with existing data | Implemented | Keep + Expand | Clean and migrate — preserve active user data |
| FEATURES TO REMOVE FROM MVP | FEATURES TO REMOVE FROM MVP | FEATURES TO REMOVE FROM MVP | FEATURES TO REMOVE FROM MVP | FEATURES TO REMOVE FROM MVP | FEATURES TO REMOVE FROM MVP |
| R-01 | Remove | School Quest: auto-generates 10-point missions per lesson | Implemented | Remove / Archive | 0 completions in 7 days; belongs to CatchUp product |
| R-02 | Remove | Lesson Reflection Log (School Quest sub-feature) | Implemented | Remove / Archive | Part of School Quest |
| R-03 | Remove | STEAM / Family Startup Pack (coming soon) | Stub only | Remove / Archive | Incomplete; not needed for MVP |


## Summary — What This Means for the Build


### New features to build (not in current app)

These 7 features do not exist and must be built from scratch:

- Child-proposed missions (P-12, C-16)
- Child-proposed rewards (P-13, C-17)
- PAUSE MODE for extended disruptions (P-14) — extends existing Rest Tickets mechanic
- Reward pricing guidance / daily earning capacity (P-15)
- Teen deal-making interface (T-03)
- Teen calendar heat-map (T-05)
- Offline mode for task list (C-18)

### Features to expand (exist but need significant improvement)

These 8 features exist but require meaningful enhancement:

- Push notifications: PWA → native FCM (biggest technical change, highest retention impact)
- The Shop: add reward pricing guidance based on child's daily earning capacity
- Teen UI: dedicated design pass for 13+ (currently minimal)
- Rest Tickets: extend into full Pause Mode for weeks/months disruptions
- Teen goals view: add monthly goal-setting and streak grace mechanic
- Supabase: clean migration, remove test data, flag beta users for free-for-life

### Good news: most of the app already works

The vast majority of features — 30+ — are fully implemented and just need to be carried over cleanly into the React Native build. The core product is solid. What we are building is a better foundation (native) with 7 new features on top.


### Key insight from audit: Rest Tickets already solve part of the disruption problem

The existing Rest Tickets mechanic (1 ticket per 5 completed tasks, skips a day without hurting 70% goal) already addresses daily disruptions. The Pause Mode we planned is a macro version of this for multi-week disruptions. Both should co-exist: Rest Tickets for single days, Pause Mode for extended breaks.

BUFF Feature Audit v1.0 — Confidential
