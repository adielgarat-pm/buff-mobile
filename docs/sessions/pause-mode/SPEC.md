# Pause Mode — SPEC

> מצב היעד לחבילה זו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> Phase 0 MVP requirement per D-2026-05-02-14 + BUFF_GAP_ANALYSIS P-14.
> Pillar 2 (Positive Coaching) anchor: "disruption is normal, not failure."

**עודכן:** 2026-05-12
**מקור:** BUFF_PRD §7.1 (PAUSE MODE listed as MVP feature) · BUFF_VALUES Pillar 2 (D-2026-05-02-14) · BUFF_GAP_ANALYSIS P-14 (❌ NOT EXISTS, 🎯 MVP) · investigation 2026-05-12: `app_settings.pause_mode_active` column exists, `pause_until` missing, zero UI exists

---

## Why this exists

Per [BUFF_PRD §2.2](../../BUFF_PRD.md) primary churn reason from beta research: *"Disruption to routine (war, vacation, illness) with no easy way back."* Sticker charts and most ADHD apps fail at the first illness or vacation. BUFF's competitive answer is **Pause Mode**: one parent-side button freezes everything, no data lost, no "missed days" counter, no shame.

Per [BUFF_VALUES.md Pillar 2](../../BUFF_VALUES.md): *"Disruption is normal, not failure."* Welcome Back screen replaces guilt-trip with "Let's start fresh today."

---

## Capabilities & Bottlenecks

### מה Claude.ai (web) יכולה
- Brand/UX review of pause toggle copy + Welcome Back screen copy
- Validation against [BUFF_VALUES.md](../../BUFF_VALUES.md) 9 pillars questions
- Hebrew localization of all new strings

### מה Claude Code (CC, אני) יעשה
- Schema migration: add `pause_until` column to `app_settings`
- New hook: `useAppSettings(familyId)` reading + writing pause state
- Parent UI: toggle button in Settings (with optional duration picker)
- Parent dashboard: visible "App is paused" banner when active
- Child UI: gates task list when pause active, shows "We're on a break" empty state
- `WelcomeBackModal` component: shown on child sign-in after resume
- State machine: pause logic centralized in one hook, no scattered checks
- i18n keys (EN + HE)

### מה Adi חייבת לעצמה
1. **Approve the SPEC** — say `approved, proceed` before code work begins
2. **Decide pause duration options** — see Open Decisions §1
3. **Decide Welcome Back copy** — see Open Decisions §2
4. **Decide what "paused" means for child rewards** — see Open Decisions §3

### צוואר בקבוק / נקודות עצירה צפויות
- **Background timer for auto-resume on `pause_until`**: Supabase scheduler vs. client-side check on app open vs. cron edge function. Decision in §Phases.
- **Multiple parents in a family**: which parent toggles pause? Either? Both must agree? Defer to "either parent can toggle, both see the state."
- **Real-time pause across devices**: when Parent A pauses, Parent B's device should reflect immediately. Use Supabase realtime subscriptions on `app_settings` row.

---

## Values Check

> 9 questions from [BUFF_VALUES.md](../../BUFF_VALUES.md). **All must pass before code begins.**

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this feature without any virtual reward?**
   ✅ Yes. The child experience of "we're on a break, no pressure" is intrinsically good — it removes the threat of "missing" tasks. There's no reward, virtual or otherwise; just relief.
2. **Does it bring the child closer to a reward they chose themselves?**
   ✅ Neutral — pause has no direct reward mechanic. BUFFs already earned remain. Reward progress is preserved, not lost.
3. **Is success felt as "I want to" or "I have to"?**
   ✅ "I want to" — pause is the parent's tool, but its EFFECT on the child is reduction of "must" pressure. When resumed, the child returns to choice, not obligation.

### Pillar 2 — Positive Coaching
1. **Does any copy shame / compare / display failure?**
   ✅ No. Pause copy is matter-of-fact: "App is paused." Welcome Back: "Let's start fresh today." No "you missed X days" counter, ever. (Anti-pattern is explicit in [BUFF_VALUES.md:78](../../BUFF_VALUES.md#L78).)
2. **If the parent declines to use pause, is the response empathy or pressure?**
   ✅ Empathy — pause is purely opt-in. No nags, no "you should pause now" notifications.
3. **Is there a "sad / lost / angry" BUDDY or app state?**
   ✅ No. BUDDY enters its own paused state — no longer interactive, no longer expressing emotions. **Not** sad-faced, **not** crying. Just neutral / "see you soon."

### Pillar 3 — Independence-Building
1. **Does the feature make the child more capable *without* the app, or more dependent *on* it?**
   ✅ More capable, indirectly. Pause Mode trains the family in a key skill: "we can step away from the system without it collapsing." A kid who internalizes that lesson is more resilient long-term.
2. **Does the child have a voice in this feature?**
   ⚠️ No direct voice. Pause is parent-controlled per D-2026-05-02-14 ("ההורה מפעיל"). **However:** child can request pause via Vibe Check SOS (existing low-power-mode mechanic — different feature, different scope). Logged as **not a blocker** since pause is explicitly parent-side per the decision.
3. **Will this feature still be necessary in 6 months?**
   ✅ Yes. Pause is permanent infrastructure. Families have illness, vacations, exam weeks, life events forever. The need doesn't diminish.

**Result:** All 9 questions pass. ✅ OK to proceed once Adi approves.

---

## Scope

### IN — this package

**Schema (`migrations/006_pause_mode.sql`):**
- `app_settings.pause_until timestamptz NULL` (NEW column)
- Existing `app_settings.pause_mode_active boolean` — leave as-is (already there)
- Comment on both columns referencing this SPEC

**Hook (`src/hooks/useAppSettings.ts`):**
- New hook. Reads `app_settings` for current family. Subscribes to realtime changes on the row.
- Exposes: `{ isPaused, pauseUntil, isPauseActive, togglePause, resumePause, settings, loading }`
- `isPauseActive` = `pause_mode_active === true` AND (`pause_until === null` OR `pause_until > now()`)
- `togglePause(durationDays?: number)` — sets `pause_mode_active=true`, `pause_until=now()+N days` (or NULL for indefinite)
- `resumePause()` — sets both to false/NULL, triggers Welcome Back state

**Parent UI:**
- New `PauseModeCard` component on **`ParentSettingsScreen`**
  - When NOT paused: button "Pause BUFF" + duration picker (Today / 3 days / 1 week / Indefinite)
  - When paused: status "App paused until [date]" + "Resume now" button
- Banner on **`ParentDashboardScreen`** (top of screen) when pause active: "App is paused. Tasks hidden from kids." with "Resume" CTA

**Child UI:**
- When pause active, `ChildDashboardScreen` shows **PauseEmptyState** instead of tasks:
  - Friendly illustration / BUDDY in idle state
  - Copy: "We're on a break. See you when we're back!" (and if `pause_until` set: "Back on [day]")
  - **NO** task list rendered
  - **NO** notifications fire (existing notification logic checks `isPauseActive`)
  - Vibe Check still available — kid can still log how they feel
- `useChildTasks` (and similar) returns empty array when paused

**Welcome Back flow:**
- New `WelcomeBackModal` component
- Triggered on child sign-in when:
  - `pause_mode_active` was true on their last session AND is now false, OR
  - `app_settings.last_child_activity` is > 3 days ago (already-existing column for "3+ days absence" — converges with pause resume)
- Copy: "Hey, you're back! Let's start fresh today." (EN) / "היי, חזרת! בוא נתחיל מחדש היום." (HE)
- Single button: "Let's go" — dismisses, lands on dashboard
- **NO** count of days missed, NO catch-up tasks, NO shame copy

**i18n keys (`src/i18n/en.json` + `he.json`):**
- `pause.parentCardTitle` — "Take a break"
- `pause.parentCardSubtitle` — "Pause tasks for the family. Nothing is lost — resume any time."
- `pause.duration.today` — "Just today"
- `pause.duration.threeDays` — "3 days"
- `pause.duration.oneWeek` — "1 week"
- `pause.duration.indefinite` — "Until I resume"
- `pause.pauseButton` — "Pause BUFF"
- `pause.resumeButton` — "Resume now"
- `pause.statusActive` — "Paused until {date}"
- `pause.statusActiveIndefinite` — "Paused indefinitely"
- `pause.dashboardBanner` — "App is paused. Tasks hidden from kids."
- `pause.childEmptyTitle` — "We're on a break"
- `pause.childEmptySubtitle.withDate` — "See you when we're back — {date}"
- `pause.childEmptySubtitle.indefinite` — "See you when we're back!"
- `welcomeBack.title` — "Hey, you're back!"
- `welcomeBack.subtitle` — "Let's start fresh today."
- `welcomeBack.cta` — "Let's go"

### OUT — deferred

- **Child-initiated pause request** — Vibe Check already covers "I'm having a hard day" via Low Power Mode. Full pause stays parent-side.
- **Per-child pause** (pause one kid, not the family) — adds complexity, not in MVP scope. The family-level pause is the lever that solves the disruption-recovery use case.
- **Pause history / audit log** — defer until we need analytics on pause patterns.
- **Auto-resume notifications to parent** — when `pause_until` passes silently, no notification. Defer; can be added in 1.1 if real users report missing it.
- **Pause + BUDDY emotion state coordination** — BUDDY enters a generic "idle" state. Sophisticated "BUDDY checks in after pause" interactions defer to BUDDY V0.5 session.

---

## Phases

### Phase 1 — Schema + Hook (~3 hours)

**CC:**
1. Write `migrations/006_pause_mode.sql` — add `pause_until` column + comments
2. Apply migration via Supabase Management API (read-only flag removed in yesterday's session, so direct apply works)
3. Generate TypeScript types or update `Profile`/`AppSettings` interfaces manually if no auto-typegen
4. Write `src/hooks/useAppSettings.ts` — read state, subscribe to realtime, expose pause actions
5. Unit-test the `isPauseActive` derivation logic (boolean + nullable timestamp = 4 cases × time-passed states)

**Exit criteria:**
- DB has `pause_until` column ✓
- Hook returns correct state for: unpaused / paused-with-future-date / paused-with-past-date / paused-indefinitely
- Realtime subscription fires when row updates

---

### Phase 2 — Parent UI (~3 hours)

**CC:**
1. `PauseModeCard.tsx` component
2. Integrate into `ParentSettingsScreen.tsx`
3. Pause status banner on `ParentDashboardScreen.tsx`
4. Wire to `useAppSettings` hook
5. Confirmation modal: "Pause BUFF for the family?" — yes/no
6. i18n strings

**Claude.ai (review):**
- Brand check: copy matches Pillar 2 voice (no shame, calm, empathic)

**Exit criteria:**
- Parent can toggle pause from Settings
- Parent dashboard shows banner when paused
- Resume works
- Other family members see realtime update

---

### Phase 3 — Child UI + Task gating (~3 hours)

**CC:**
1. `PauseEmptyState.tsx` component
2. Wire `ChildDashboardScreen.tsx` to check `isPauseActive`
3. Update `useChildTasks` (or equivalent) to return `[]` when paused
4. Suppress all task-related notifications (read pause state in notification logic)
5. Vibe Check remains accessible — DOES NOT pause
6. i18n strings

**Exit criteria:**
- Child sees empty state with friendly copy when paused
- No tasks displayed
- No notifications fire
- Vibe Check still works (so kid can still flag a bad day even mid-pause)

---

### Phase 4 — Welcome Back Modal (~2 hours)

**CC:**
1. `WelcomeBackModal.tsx` component
2. Trigger logic in `ChildDashboardScreen` (or root child layout):
   - Read previous pause state from local storage (AsyncStorage)
   - If previous=paused AND current=unpaused → show modal
   - If `last_child_activity > 3 days ago` (existing column) → show modal
3. Update `app_settings.last_child_activity` on child interactions
4. Single dismiss → never-show-again-this-resume-cycle
5. i18n strings

**Exit criteria:**
- Modal shows once on first child sign-in after resume
- Modal does NOT show repeatedly
- No "missed days" counter anywhere

---

### Phase 5 — Tests + ship (~1 hour)

**CC:**
1. Manual flow test:
   - Parent pauses indefinite → child opens app → empty state ✓
   - Parent pauses 3 days → child opens app on day 4 → tasks return + Welcome Back ✓
   - Two parents in family — Parent A pauses, Parent B's device updates without refresh
2. Update `STATUS.md` with phase completion
3. Update `BUFF_GAP_ANALYSIS.md` P-14 from ❌ to ✅
4. Update PRD §7.1 Pause Mode bullet to reflect implementation reality

**Exit criteria:**
- All scenarios tested manually
- Canonical docs updated per [SPEC_SYNC.md](../_template/SPEC_SYNC.md) row for this package
- Ready to merge to main

---

## Files Affected

### Mobile (`buff-mobile`)
- **New:**
  - `migrations/006_pause_mode.sql`
  - `src/hooks/useAppSettings.ts`
  - `src/components/PauseModeCard.tsx`
  - `src/components/PauseEmptyState.tsx`
  - `src/components/WelcomeBackModal.tsx`
- **Edit:**
  - `src/screens/parent/ParentSettingsScreen.tsx` (insert PauseModeCard)
  - `src/screens/parent/ParentDashboardScreen.tsx` (insert banner)
  - `src/screens/child/ChildDashboardScreen.tsx` (gate task list, show empty state, show Welcome Back)
  - `src/hooks/useChildTasks.ts` (or equivalent — return [] when paused)
  - Notification logic (`useNotifications` or similar) — short-circuit when paused
  - `src/i18n/en.json` + `src/i18n/he.json`

### Web (`buff-main`)
- N/A — pause is a mobile-app concern. Web landing is unaffected.

---

## Open Decisions for Adi

1. **Duration picker options.** SPEC default: `Today / 3 days / 1 week / Indefinite`. Want different presets? E.g., add `Weekend` or `Until [date picker]`?

2. **Welcome Back copy variants** (will be public/visible — needs brand approval):
   - Default: *"Hey, you're back! Let's start fresh today."* / *"היי, חזרת! בוא נתחיל מחדש היום."*
   - Alternative: *"Welcome back. Today's a fresh start."* / *"ברוכים השבים. היום מתחילים מחדש."*
   - Your preference?

3. **What happens to in-progress BUFFs/rewards during pause?**
   - Existing: nothing — they sit in the credit_vault, untouched, ready when resume
   - Question: should the child SEE their BUFFs balance during pause? Default = yes (visible, reassures them nothing was lost). Override = hide entirely?

4. **Push notification suppression scope.** SPEC default: suppress ALL task-related notifications when paused. Should we also suppress:
   - Parent insight notifications? (probably yes — they're about kid behavior, not relevant during pause)
   - Sticker notifications? (probably no — they're positive surprises, fine during pause)

---

## Dependencies on Other Work

- **None blocking.** This is a self-contained MVP feature.
- After ship: this is a strong **case-study testimonial** for the Founding 100 outreach: "Sticker charts fail on vacation. BUFF has a Pause button."

---

## What This Unblocks

- ✅ MVP critical-path item — one fewer 🎯 MVP gap before Play Store launch
- ✅ Phase 0 ship readiness (Pause Mode is one of the explicit must-haves)
- ✅ Marketing differentiator — Pause Mode is in [BUFF_MESSAGING.md](../../BUFF_MESSAGING.md) hooks and forum reply templates (T4: "burned out on sticker charts"). Now those templates have working software behind them.

---

## Approval gate

**Status: awaiting `approved, proceed` from Adi.**

After approval:
1. CC starts Phase 1 (schema + hook)
2. After Phase 1 lands: show diff, wait for "continue" before Phase 2
3. Each phase ships as its own chunk per [WORKFLOW.md](../../WORKFLOW.md) chunk-by-chunk protocol

**Estimated total:** ~12 hours of engineering across 5 phases. Realistically: 2-3 focused sessions.
