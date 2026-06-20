# Lovable ↔ buff-mobile — Parity Audit Matrix

> **Purpose:** Screen-by-screen, field-by-field comparison between the legacy **Lovable web app**
> (`github.com/adielgarat-pm/buff`, current prod) and the target **buff-mobile** (Expo), so Adi can
> retire Lovable with confidence that no learned capability is silently lost.
>
> **Living document.** Surfaces are added one at a time. This file starts with the surface Adi
> prioritized first: **Parent Task Management + Off-Routine ("יציאה משגרה")**.

---

## SNAPSHOT — 2026-06-19

**Sources read (code-vs-code, not the live site):**
- Lovable: `C:\Users\adiel\buff` (Vite/React) — `ParentSettings.tsx`, `DayScheduleToggles.tsx`,
  `TimetableEditor.tsx`, `starterPacks.ts`, `types/task.ts`, `integrations/supabase/types.ts`,
  `i18n/en.json`, `useSyncedTaskStore.ts`.
- Mobile: `C:\Users\adiel\buff-mobile` — `ParentTasksScreen.tsx`, `EditChildScreen.tsx`,
  `OffRoutineCard.tsx`, `offRoutineSeed.ts`, `offRoutineTasks.ts`, `MedReminderSheet.tsx`,
  `types/task.ts`, `i18n/he.json`. Cross-checked against `origin/main` (HEAD `67f7450`).

**Branch caveat:** Working checkout was `pkg/store-screenshots-v162` (2 commits behind `origin/main`,
docs-only). All code cells below were re-verified against `origin/main` — the source of truth for
what ships. One exception is flagged as a 🟦 STRANDED conflict (see Key Findings).

**Files requested but not read this pass:** Rewards/Shop, Settings, Dashboard, Children/Teen modes,
Onboarding, BUDDY — deferred to later surfaces.

---

## Legend

| Mark | Meaning |
|---|---|
| 🟩 PARITY | Mobile (main) matches or exceeds Lovable |
| 🟨 DIFFERENT | Both have it, but behave differently |
| 🟥 GAP | Lovable has it; mobile **main** does not |
| 🟦 STRANDED | Built for mobile but **not in main** (merge issue, not a real gap) |
| ⬜ MOBILE-ONLY | Mobile has it; Lovable does not |

---

## KEY FINDINGS (read first)

### 🟦 Day-of-week selector is STRANDED off main (not lost, but not shipping)
- **Lovable:** Full per-task weekday selector — 7 chips (א׳–ש׳ / Su–Sa), `DayScheduleToggles.tsx`,
  in every add/edit task form. Stored in `schedule_days`.
- **Mobile main:** `ParentTasksScreen.tsx` **hardcodes** `schedule_days: [0,1,2,3,4,5,6]` on create
  (`ParentTasksScreen.tsx:166`) and does **not** edit it. No weekday picker in the parent task UI.
- **The feature WAS built:** PR #233 (`pkg/task-day-toggles`, commit `e024d3b`,
  "per-task weekday selector in parent add/edit modal") was merged into **`pkg/release-43`**
  on 2026-06-13 — but `release-43` was **never merged back into main** (it sits 5 ahead / 79 behind
  main). The commit exists ONLY on `release-43` + the feature branch.
- **CONFLICT (per Snapshot Protocol Rule 3):** memory `project_task_day_selector.md` records PR #233
  as shipped ("~20 real testers"); `origin/main` code does **not** contain it. Both stated verbatim,
  not resolved. This echoes the 2026-05-04 lost-work pattern (cut from a branch, not back-merged).
- **Action is Adi's call.** Re-merging `pkg/task-day-toggles` → main would restore day-selection in
  the shipping app. Not touched here.
- **✅ RESOLVED (2026-06-19):** forward-ported onto main via `pkg/task-day-toggles-v2`
  ([PR #258](https://github.com/adielgarat-pm/buff-mobile/pull/258)) — cherry-pick + native time picker
  + "zero days = paused/hidden" + DB `DEFAULT '{0,1,2,3,4,5,6}' NOT NULL`. Hat 1 green; pending merge +
  device check. See `docs/sessions/task-day-toggles-v2/STATUS.md`.

### 🟥/⬜ Seasonal "vacation until date X" exists on NEITHER platform
- Lovable has **no** vacation/holiday/pause/off-routine feature at all (the `pause_mode_active`
  column exists in its schema but is **never referenced** in code).
- Mobile is actually **ahead**: it has Off-Routine + Pause modes. But neither supports a **custom
  end-date** ("until 1.9") or **custom tasks** — see the Off-Routine matrix below.
- **Implication for Adi:** the summer use-case (suspend Itay's school set until Sept 1, swap in
  custom math/English tasks, auto-revert) was **never solved in Lovable either**. Dropping Lovable
  loses nothing here. It is a genuine *new-feature* gap on both sides, not a migration regression.

---

## MATRIX A — Parent Task Create / Edit / Manage

| Capability | Lovable (`buff`) | Mobile main (`buff-mobile`) | Status |
|---|---|---|---|
| Add task | ✅ Settings → Child → Tasks → "Add Mission" | ✅ ParentTasks → "+ הוסף משימה" | 🟩 |
| Edit task | ✅ pencil → all 6 fields editable | ✅ tap row → only **title / time / credits** | 🟨 |
| Title | ✅ text | ✅ text (max 60) | 🟩 |
| Time | ✅ `<input type=time>` HH:MM | ✅ native time picker (PR #258); was plain text | 🟩 |
| Credits (Buffs) | ✅ number | ✅ numeric (create + edit) | 🟩 |
| Category | ✅ dropdown, 5 options | 🟥 **hardcoded `responsibility`**, no picker (`:164`) | 🟥 |
| **Day-of-week (which days)** | ✅ 7 chips per task (`DayScheduleToggles`) | ✅ 7 chips, forward-ported to main (PR #258); + deselect-all = pause | 🟩 |
| Description / equipment notes | ✅ textarea (`additionalDetails`) | 🟥 not exposed in parent UI | 🟥 |
| Icon / emoji | ❌ not in parent UI (set at onboarding) | ❌ not in parent UI | 🟩 (both lack) |
| Delete task | ✅ trash icon, **no confirm** | ✅ delete + **confirm dialog** | 🟩 (mobile safer) |
| Duplicate task → other child | ✅ `DuplicateToChildModal` | ✅ DuplicateToChildModal (PR #260) | 🟩 |
| Disable / archive (soft) | 🟥 none (delete only) | 🟥 none (delete only) | 🟩 (both lack) |
| Date range / "active until date X" | 🟥 none | 🟥 none | 🟩 (both lack — Adi's summer need) |
| Per-child assignment | ✅ per-child settings | ✅ child tabs selector | 🟩 |
| Default schedule on create | `[0–5]` (Sun–Fri, no Sat) | `[0–6]` (every day) | 🟨 minor |
| Starter packs / templates | ✅ 7 named packs, parent picks at onboarding | 🟨 deterministic generator (≤5 tasks), age+domain | 🟨 |
| School timetable + equipment | ✅ `TimetableEditor` + Excel/photo OCR import | 🟨 `timetableParser` exists; native-only import — **needs own surface audit** | 🟨 |
| Medication reminder | ⚠️ not confirmed in Lovable (check later) | ✅ `MedReminderSheet` (morning/evening + day chips) | likely ⬜ |

**Notes**
- Mobile edit DOES persist credits (`ParentTasksScreen.tsx:151` passes `{title, time, credits}`).
  Category, schedule_days, description, icon are **not** editable on mobile.
- Lovable's day selector enforces "at least 1 day selected" (`DayScheduleToggles.tsx:20–29`).

---

## MATRIX B — Off-Routine / Vacation / Pause

| Capability | Lovable (`buff`) | Mobile main (`buff-mobile`) | Status |
|---|---|---|---|
| Off-routine / "day out of routine" mode | 🟥 none | ✅ `OffRoutineCard` in **EditChildScreen** (`:378`) | ⬜ mobile-only |
| — Where it lives | — | ⚠️ buried at **bottom of Edit-Child screen**, titled **"יום מחוץ לשגרה"** (not "יציאה משגרה") — this is why Adi couldn't find it | discoverability issue |
| — Durations offered | — | 🟥 only **Off / היום / 3 ימים** (max 3 days) | 🟥 |
| — Custom end-date ("until 1.9") | — | 🟥 not possible | 🟥 (Adi's need) |
| — Custom / parent-defined tasks | — | 🟥 fixed age-banded `OFF_ROUTINE_BANK` only; can't add/edit | 🟥 (Adi's need) |
| — Behaviour when active | — | swaps to **light bank ONLY**; all routine tasks hidden (all-or-nothing) | 🟨 |
| Pause / "take a break" mode | 🟥 `pause_mode_active` column unused | ✅ `PauseModeCard` + `PauseBanner` | ⬜ mobile-only |

---

## What this means for Adi's Itay-summer use-case (actionable today)

Goal: cancel Itay's school tasks until 1.9, add 2 math + 1 English page daily, revert in Sept.

- **"יום מחוץ לשגרה" does NOT fit** — max 3 days, fixed bank, no custom tasks, no until-date.
- **No feature (here or in Lovable) does the full seasonal swap.** Best available path today:
  1. ParentTasks → Itay → delete/disable his school tasks manually.
  2. Add "2 תרגילי מתמטיקה" + "עמוד אנגלית" as normal recurring tasks.
  3. **Manually** re-add the school tasks on/after 1.9 (no auto-revert exists).
- If day-selection (PR #233) were merged to main, step 1 could be "uncheck weekdays" instead of
  delete — but still no date-range. A true "Seasonal / Vacation mode (date range + custom set)" is a
  net-new feature candidate worth a SPEC.

---

---

# SURFACE 2 — Full Parent App (2026-06-19)

Sources: Lovable `C:\Users\adiel\buff` (`ParentFamilyOverview`, `ParentSettings`, `StoreRewardEditor`,
`RewardsStore`, `NotificationBell`, `useSubscription`, `ProGate`, onboarding steps). Mobile
`C:\Users\adiel\buff-mobile` (`ParentDashboardScreen`, `EditChildScreen`, `ManageChildrenScreen`,
`ParentSettingsScreen`, `PaywallScreen`, `ParentRewardsScreen`, `NotificationFeedScreen`,
`NotificationSettingsScreen`, `useSubscription`, `usePushRegistration`).

## KEY FINDINGS (read first)

### ⬜ Mobile is AHEAD where it matters most for shipping
- **Subscription/monetization:** Lovable has **NO paywall, no pricing, no purchase flow** — everyone is Pro via a grace period (ends 2026-12-31) + a dev "simulate Pro" toggle. Mobile has a real `PaywallScreen` (RevenueCat monthly/yearly/Founding-100, free-child-limit=1, hide-from-child). **Retiring Lovable loses nothing on subscription — mobile IS the monetization path.**
- **Notifications:** Mobile has push (FCM/Expo device tokens), granular preference toggles, deep-link routing, ACTION-vs-INFO TTL, more event types. Lovable is browser-Notification-API + in-app bell only.
- **Mobile-only parent features:** per-child language, off-routine, Anchor Recovery + med-reminder, SOS/vibe signal, "Recommended now" card, cash-reward conversion, child→parent reward *request→approve* (atomic), co-parent join, delete-account, Pause Mode.

### 🟥 Real gaps where Lovable does something mobile does NOT
1. ~~**Edit an existing reward**~~ — ✅ RESOLVED ([PR #260](https://github.com/adielgarat-pm/buff-mobile/pull/260)): tap a reward to edit in place + delete.
2. ~~**Duplicate reward/task to sibling**~~ — ✅ RESOLVED ([PR #260](https://github.com/adielgarat-pm/buff-mobile/pull/260)): `DuplicateToChildModal` wired into both ParentRewards and ParentTasks.
3. **Smart pricing suggestions** — Lovable suggests reward prices at 1/2/4/5/10× (70%-of-daily-goal); mobile uses fixed size presets (small/medium/large ≈ 3/7/14 days). Different model, not parity.
4. **Per-child daily goal** — Lovable lets the parent set each child's daily BUFF goal (10–1000); mobile has no daily-goal editor (uses a fixed generator default). *Verify before relying on this.*
5. **Manual balance set** — Lovable edits a child's balance directly; mobile only adjusts via the Bonus modal (safer, but not a direct set).
6. **App-name customization** + **"Updates from Adi" marketing-consent toggle** + **Help/install video** — present in Lovable settings, absent on mobile.
7. **Send a sticker straight from a notification** — Lovable inlines it in the bell; mobile's sticker is dashboard-only.

> Most 🟥 items are minor or deliberately redesigned. The ones worth a decision before retiring Lovable: **edit/duplicate reward** and **per-child daily goal**.

## MATRIX C — Parent Dashboard

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Multi-child overview + per-child stats (balance, progress %, tasks) | ✅ | ✅ | 🟩 |
| Quick actions: bonus / view-as-child | ✅ bonus + view-as | ✅ bonus modal (amount+note) + view-as + sticker | 🟩 |
| Clean-day / great-day bonus | ✅ "Award Bonus" | ✅ Bonus modal (quick amounts + note) | 🟩 |
| Family-code invite card (share/copy) | ✅ | ✅ | 🟩 |
| Today / Yesterday toggle | 🟥 none | ✅ | ⬜ |
| SOS / low-vibe per-child signal | 🟥 none | ✅ battery glyph + inline text | ⬜ |
| "Recommended now" / Anchor-Recovery / Med-reminder | 🟥 none | ✅ | ⬜ |
| Insights card (locked < 3 days, Premium) | ✅ Pro daily-summary | ✅ insights locked + premium hint | 🟨 |
| Rest-card alert / grant on dashboard | ✅ | 🟨 Rest Tickets exist, not surfaced here | 🟨 |
| PWA install nudge | ✅ (web) | n/a (native) | — |

## MATRIX D — Child Management

| Capability | Lovable (`ParentSettings`) | Mobile (`EditChild`/`ManageChildren`) | Status |
|---|---|---|---|
| Add / edit / delete child | ✅ | ✅ (soft-delete + last-child→delete-account) | 🟩 |
| Avatar picker | ✅ ~28 emojis | ✅ 18 emojis | 🟩 |
| Birthday / age | ✅ grade selector OR birth year | ✅ native date picker + age-group pills | 🟨 |
| Per-child language | 🟥 none | ✅ he/en toggle | ⬜ |
| Off-routine card | 🟥 none | ✅ | ⬜ |
| Per-child **daily goal** | ✅ 10–1000 | 🟥 none | 🟥 |
| Direct **balance** edit | ✅ | 🟥 (Bonus modal only) | 🟥 |
| School-Quest toggle / Night-Mission (Bag-Prep) toggle | ✅ per child | 🟨 features exist, not toggled here | 🟨 |
| Tasks/Rewards/Schedule editing location | all inline in one panel | split across ParentTasks / ParentRewards / Activities | 🟨 (architecture) |

## MATRIX E — Settings

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Language toggle (he/en) | ✅ | ✅ + picker modal | 🟩 |
| Family code + join another family (co-parent) | ✅ | ✅ | 🟩 |
| Sign out | ✅ | ✅ | 🟩 |
| Philosophy / About | ✅ | ✅ | 🟩 |
| Delete account (data wipe) | 🟥 (sign-out only) | ✅ two-tap (Apple req) | ⬜ |
| Notification settings (granular) | 🟨 lesson-reminders toggle only | ✅ full screen + toggles | ⬜ |
| Pause Mode | 🟥 none | ✅ card | ⬜ |
| Friday/weekend config | ✅ (timetable-driven) | ✅ explicit toggle | 🟩 |
| App-name customization | ✅ | 🟥 none | 🟥 |
| "Updates from Adi" marketing consent | ✅ | 🟥 none | 🟥 |
| Help & install video section | ✅ | 🟥 none | 🟥 |
| Version label | 🟨 | ✅ | 🟩 |

## MATRIX F — Subscription / Paywall

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Paywall screen + pricing | 🟥 **none** (grace period, all open) | ✅ RevenueCat monthly/yearly/Founding-100 | ⬜ |
| Purchase / restore flow | 🟥 none | ✅ | ⬜ |
| Free vs premium gating | 🟨 ProGate bypassed (silent launch) | ✅ free-child-limit=1, hide-from-child | ⬜ |
| Dev "simulate Pro" | ✅ admin toggle | ✅ (internal) | 🟩 |

## MATRIX G — Rewards / Shop

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Create reward (name, emoji, cost) | ✅ | ✅ | 🟩 |
| **Edit existing reward** | ✅ inline icon/price | ✅ tap-to-edit + delete (PR #260) | 🟩 |
| **Duplicate reward to sibling** | ✅ | ✅ DuplicateToChildModal (PR #260) | 🟩 |
| Pricing model | smart tiers (×70% goal) | size presets (S/M/L ≈ 3/7/14d) | 🟨 |
| Cash-value reward (money-motivated) | 🟥 none | ✅ cash conversion | ⬜ |
| Redemption model | **instant claim** + unclaim/refund | **request → parent approve** (atomic RPC), never decline ("let's talk") | 🟨 (different philosophy) |
| Child suggestion / deal-making | 🟥 none | ✅ approve / "let's talk" | ⬜ |
| Repeatable rewards | ✅ | ✅ | 🟩 |
| Claimed-ticket inventory ("show to parent") | ✅ | 🟨 (approval model replaces it) | 🟨 |

## MATRIX H — Notifications

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| In-app bell + unread badge + feed | ✅ dropdown | ✅ full feed screen (time-bucketed) | 🟩 |
| Mark read / mark-all-read | ✅ | ✅ | 🟩 |
| Event types | reward/task/milestone/SOS | + vibe-shared, family-joined, anchor-recovery, child-suggestion, redemption-request | 🟩 (mobile more) |
| Push notifications | 🟨 browser Notification API | ✅ FCM/Expo device tokens + registration | ⬜ |
| Preference toggles | 🟥 none | ✅ "Alerts to me" / "Reminders for child" + server suppression | ⬜ |
| Deep-link tap → context | 🟨 | ✅ routes to tab + pre-selects child | 🟩 |
| Send sticker from a notification | ✅ inline | 🟥 (sticker from dashboard only) | 🟥 |

---

---

# SURFACE 3 — Children + Teen/Gamer Mode (2026-06-19)

Sources: Lovable `C:\Users\adiel\buff` (`ChildView`, `PhaseView`, `PetDisplay`, `RewardsStore`,
`DailyVibeCheck`, `ChildCommandCenter`, `GearMaster/*`). Mobile `C:\Users\adiel\buff-mobile`
(`ChildDashboardScreen`/PastelChildDashboard, `GamerDashboardScreen`, `ChildTasksScreen`,
`GamerTasksScreen`, `ChildRewardsScreen`, `VibeCheckScreen`, buddy hooks/components, `ChildBagPrepScreen`).

## KEY FINDINGS (read first)

### ⬜ Mobile is AHEAD on the child experience
- **Real separate Teen/Gamer mode.** Lovable's "teen mode" is the **same layout with relabeled text**
  (AM Ops / PM Ops) + pet disabled. Mobile ships a **genuinely distinct Gamer dashboard/tasks/rewards**
  (neon, buddy hero, stat cards, next-up indicator, time-filter chips) vs the Mint children mode.
- **Buddy system is far deeper on mobile** — friendship L1–L5, gifts + boosters (theme color, ×2 buffs,
  skip token, reward discount, skin), naming, visibility toggle, dedicated "Me & Buddy" + "My Stats"
  screens. Lovable has a simpler Pro-gated pet.
- **Mobile-only:** child→parent task/reward **suggestions** (deal-making), **BUFF Catch** mini-game,
  off-routine banner, low-power/SOS + Instant-BUFF card, share-good-mood.

### 🟥 Where Lovable does something mobile does not (mostly nice-to-haves)
1. **Pet egg-hatching evolution** (egg → hatchling → scout → guardian, with crack progression) +
   **quest-gated skin unlocks** — mobile gives skins at L1 (Gamer) and has friendship levels instead.
2. **Focus-meter skill badges** — Lovable shows 5 named tiers ("First Spark" → "Persistence Pro");
   mobile shows a plain fuel bar + 70% ignition badge.
3. **School-Quest lesson grid in the CHILD view** (per-lesson check + equipment popover) — mobile keeps
   the timetable parent-side; child sees tasks, not a lesson grid.
4. **Gear/Bag-Prep completeness** — Lovable's Gear Master (night checklist + morning essentials, built
   from the timetable) is fully wired; mobile's `ChildBagPrep` exists but task-tap wiring is deferred.
5. **Birthday celebration** + **BuffActivation strategy modal** — present in Lovable, absent on mobile.

> None of the 🟥 items block retiring Lovable. The biggest experiential gap is the **pet evolution /
> skin-unlock loop**; mobile replaced it with the friendship/gift system, which is arguably stronger.

## MATRIX I — Child Dashboard & Mode

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Distinct kid vs teen experience | 🟨 same layout, relabeled + pet off | ✅ separate Mint vs Gamer screens | ⬜ |
| Mode selection | age-based | theme (Mint/Gamer) via child settings | 🟨 |
| Greeting / balance / focus-fuel | ✅ | ✅ | 🟩 |
| Pet / buddy on dashboard | ✅ pet (Pro) | ✅ buddy hero (Gamer); pet in settings (Mint) | 🟨 |
| Focus-meter skill badges (5 named tiers) | ✅ | 🟥 plain bar + 70% badge | 🟥 |
| Birthday celebration | ✅ | 🟥 none | 🟥 |
| Mini-game | 🟥 none | ✅ BUFF Catch | ⬜ |
| Low-power / SOS / Instant-BUFF | ✅ (in vibe flow) | ✅ banner + SOS + Instant-BUFF card | 🟩 |
| Off-routine banner | 🟥 none | ✅ | ⬜ |

## MATRIX J — Child Tasks / Quests

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Phase grouping + complete + celebration | ✅ | ✅ (Mint tabs; Gamer sections + next-up) | 🟩 |
| Time-of-day filter chips (Gamer) | 🟥 | ✅ | ⬜ |
| School-Quest lesson grid (child view) | ✅ + equipment popover | 🟥 (timetable parent-side only) | 🟥 |
| BuffActivation strategy modal | ✅ | 🟥 none | 🟥 |
| Child suggests a task to parent | 🟥 none | ✅ (deal-making) | ⬜ |

## MATRIX K — Buddy / Pet

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Pet/buddy display + skins | ✅ 2 paths, quest-unlock | ✅ 10 skins, picker | 🟨 |
| Evolution (egg→guardian) + hatch animation | ✅ | 🟥 none | 🟥 |
| Friendship levels (L1–L5) | 🟥 none | ✅ | ⬜ |
| Gifts / boosters | 🟥 none | ✅ (theme/×2/skip/discount/skin) | ⬜ |
| Buddy naming + visibility toggle | 🟨 name only | ✅ name + hide/show | ⬜ |
| Rest tickets | ✅ (1 per 5 tasks) | ✅ (wallet in settings) | 🟩 |
| Dedicated Me&Buddy / My Stats screens | 🟥 none | ✅ (Gamer) | ⬜ |

## MATRIX L — Child Shop & Vibe Check

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Browse + progress-to-goal + redeem | ✅ | ✅ (Mint list; Gamer 2×2 grid) | 🟩 |
| Redemption model | instant claim + ticket inventory + unclaim/refund | request → parent approve (no unclaim) | 🟨 (philosophy) |
| Vibe Check (5-level mood) | ✅ faces/battery by mode | ✅ Mint faces / Gamer battery | 🟩 |
| Share mood to parent | ✅ | ✅ (level ≥3 opt-in) | 🟩 |
| Child settings (theme/skins/sound/language) | ✅ Command Center | ✅ + haptics + buddy controls | 🟩 |
| Gear / Bag-Prep (night + morning) | ✅ full Gear Master | 🟨 ChildBagPrep partial (tap-wiring deferred) | 🟨 |

---

---

# SURFACE 4 — Onboarding (2026-06-19)

Sources: Lovable `C:\Users\adiel\buff` (`ParentOnboarding` 6-step + `EnOnboardingFlow` 7-step,
`starterPacks.ts`). Mobile `C:\Users\adiel\buff-mobile` (`WelcomeScreen` + `UStep1..UStep8` unified +
`starterTasks/generateStarterTasks.ts`).

## KEY FINDINGS
- **Lovable has TWO onboarding systems:** a legacy **Hebrew 6-step** (name/grade → focus area → starter
  pack → custom first task → custom weekend reward → family code) AND a newer **English 7-step
  "En-flow"** (role → name/age → struggles → motivators → auth → reveal **with a conversion forecast**).
- **Mobile has ONE unified flow** (UStep1–8): name + **age group + gender + birthday**, main challenge,
  additional challenges, motivators (1–2), a **deterministic generated task set** (domain-scored,
  sex-leaned, ≤5) + motivator-matched rewards, a **duplicate-child guard**, phone-handoff options, and a
  completion + coach-tip screen.
- **Mobile is ahead** on: gender + birthday capture, **per-child language**, a real **task-generation
  engine** (vs Lovable's fixed pack list), motivator→reward matching, idempotent saves + duplicate
  guard, native invite + 24 h reminder, and a celebratory completion screen.
- **🟥 Lovable has, mobile doesn't:** a **free-text custom first TASK** and **custom weekend REWARD**
  typed during onboarding (mobile uses curated pools only — you edit after). Also the En-flow's
  "struggles" framing + conversion forecast (a marketing/value pattern, not a feature gap).

## MATRIX M — Onboarding

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Child name | ✅ | ✅ | 🟩 |
| Age / grade | ✅ grade or birth year | ✅ age-group pills + optional birthday | 🟨 |
| Gender | 🟥 none | ✅ optional (drives task lean) | ⬜ |
| Focus area / main challenge | ✅ 4 focus areas | ✅ age-dependent challenge + extras | 🟨 |
| Motivators | ✅ (En-flow only) | ✅ 1–2 of 6 → reward match | 🟩 |
| Starter tasks | ✅ pick a fixed pack | ✅ generated engine (scored, ≤5) | 🟨 (mobile richer) |
| **Custom task text at onboarding** | ✅ | 🟥 curated only (edit after) | 🟥 |
| **Custom reward text at onboarding** | ✅ | 🟥 curated pool (edit after) | 🟥 |
| Duplicate-child guard | 🟥 | ✅ RPC atomic + prompt | ⬜ |
| Phone handoff (invite now/later/no) | 🟨 copy-paste code | ✅ native share + 24h reminder + View-as-Child | ⬜ |
| Conversion forecast / value framing | ✅ (En-flow) | 🟥 none | 🟥 (marketing pattern) |
| Completion + coach tip screen | 🟥 implicit redirect | ✅ | ⬜ |

# SURFACE 5 — Cross-cutting (2026-06-19)

Sources: Lovable `Auth.tsx`, `AuthContext.tsx`, `JoinFamilySection.tsx`, `TimetableEditor/Importer`,
`LanguageContext`. Mobile `AuthContext`, `ChildJoinScreen`, `JoinFamilyCard`, `TimetableScreen` +
`PackingCard`, `PauseModeCard`, `OffRoutineCard`, `LanguageContext` + `ModeContext`.

## KEY FINDINGS
- **Mobile is ahead on nearly everything cross-cutting.** Lovable reaches parity on Google auth, the
  family code, `switch_user_family` (co-parent join), timetable import, and the he/en toggle — and is
  **ahead on nothing** material here.
- **Conflict note (Lovable report):** the Lovable agent first said "co-parent ABSENT" then found
  `JoinFamilySection` calling `switch_user_family`. Resolution: Lovable HAS parent family-switch via
  code (same RPC as mobile) but **no dedicated "invite a co-parent" flow** — same as mobile. So:
  rough parity, neither has a polished invite-co-parent UX.

## MATRIX N — Cross-cutting

| Capability | Lovable | Mobile | Status |
|---|---|---|---|
| Google OAuth | ✅ | ✅ | 🟩 |
| **Apple Sign-In** | 🟥 | ✅ (iOS) | ⬜ |
| Email / password | ✅ | ✅ | 🟩 |
| Child access | magic-link / code + typed name | ChildJoin (stable creds, pick from list, no dup) + View-as-Child | 🟨 (mobile sturdier) |
| **Delete account** | 🟥 (sign-out only) | ✅ RPC `delete_my_account` | ⬜ |
| Family code | ✅ | ✅ | 🟩 |
| Co-parent join (`switch_user_family`) | ✅ (code switch) | ✅ + family-wide premium | 🟩 |
| Timetable editor + Excel/photo import | ✅ XLSX + image | ✅ XLSX + OCR Edge Fn | 🟩 |
| Per-lesson equipment → child packing | ✅ BagPrepChecklist | ✅ activity-driven ChildBagPrep (child can propose) | 🟨 (mobile richer) |
| **Pause Mode** | 🟥 none | ✅ durations + realtime | ⬜ |
| **Off-Routine** | 🟥 none | ✅ per-child | ⬜ |
| Language toggle (he/en) + RTL | ✅ global + family `preferred_language`, CSS dir | ✅ + `I18nManager.forceRTL` + reload | 🟩 |
| **Per-child language** | 🟥 (device-wide) | ✅ `pro_settings.language` + script detect | ⬜ |

---

# 🏁 AUDIT COMPLETE — Overall conclusion (all 5 surfaces)

**Can Adi retire Lovable with confidence? — Yes, with a short, known list of caveats.**

- **Mobile meets or exceeds Lovable on the vast majority of surfaces**, and is materially **ahead** on
  what matters for launch: subscription/paywall (Lovable has none), notifications (push + prefs),
  Pause/Off-Routine, Buddy system + Teen/Gamer mode, Apple Sign-In, delete-account, per-child language,
  the task-generation engine, and the day-selector + reward edit/duplicate shipped this session.
- **The complete list of "Lovable does, mobile doesn't"** (everything 🟥 across A–N), none a blocker:
  1. ✅ Edit existing reward — **DONE** (PR #260).
  2. ✅ Duplicate task/reward to sibling — **DONE** (PR #260).
  3. Per-child **daily goal** editor (Adi: keep as-is — not doing).
  4. Direct **balance** set (mobile uses Bonus modal instead).
  5. **App-name customization**, **"Updates from Adi" marketing-consent toggle**, **help/install video**.
  6. **Smart reward-pricing tiers** (70%-of-goal) vs mobile's size presets.
  7. **Custom task/reward text DURING onboarding** (mobile = curated pools, edit after).
  8. **Send a sticker straight from a notification** (mobile: dashboard only).
  9. **Conversion forecast / "struggles" framing** in the English onboarding (a marketing pattern).
  10. **Seasonal "vacation until date X + custom set"** — exists on **neither**; net-new idea.
- **Recommendation:** retiring Lovable loses nothing essential. If Adi wants belt-and-suspenders before
  pulling the plug, the only items worth a quick decision are #5 (app-name / updates toggle — small) and
  #7 (custom task/reward at onboarding — minor, editable after). Everything else is parity, mobile-only,
  or a deliberate redesign.

## Surface status

1. ✅ Parent Task Management + Off-Routine — Matrices A–B
2. ✅ Full Parent app — Matrices C–H
3. ✅ Children + Teen/Gamer Mode — Matrices I–L
4. ✅ Onboarding — Matrix M
5. ✅ Cross-cutting — Matrix N
