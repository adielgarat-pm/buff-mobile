# `pkg/anchor-routine-onboarding` — SPEC

**Status:** `draft — awaiting Adi review (5 decision gates below)`
**Slug:** `anchor-routine-onboarding`
**Branch:** `pkg/anchor-routine-onboarding` (off `main`)
**Source:** `docs/research/SUSTAINED_FAMILIES_2026-10-20.md`
**Builds on:** `onboarding-redesign` (#345), `smart-join-link`, `child-access-paths`, migration 059 (child invite reminder), `reward-redemption` (019/025/057), `anchor-recovery` (MedReminderSheet)
**Drafted:** 2026-10-20 by CC

---

## 0. Why this package exists

Sustained activity right now comes from 4 families: Noa Morag, Tal Eliyahu, Shani Yitbark and Tamar Belek. Rachel Snai came back in October. Every one of them is a January–February veteran. **0 of 50 families that signed up since Jun 15 are still active.** These veteran families share three things, and today's onboarding gives new families none of them:

| What the veteran families have | What a new family gets today |
|---|---|
| **One fixed routine:** the same 4–6 steps at the same time every day, written by the parent. 3 of 5 include a medication step. | Up to 5 generated tasks mixed across domains, each at a coarse bucket time (08:00 / 12:00 / 16:00 / 20:00). The parent can't edit titles or times in onboarding. |
| **Every kid has their own login** (10/10). | One 19:30 reminder 1–30h after the child is created. Nothing after that. There's also no `kid_joined` event, so we can't measure this. |
| **Rewards really get redeemed.** Tal's family has 9 approved, the kids proposed 4 of the rewards, and the last one was Oct 10. | There's no reminder for a request nobody answers. The notification goes to the first parent only (`LIMIT 1`, 019:80-108). Shani hasn't opened the app since Sep 11, and Matan's request from today will just sit there. |

The package closes these three gaps in the first 48 hours, before a family has the chance to drift away.

**Caveat (copy it into every review):** n=5. All five are Hebrew-speaking veterans with lifetime access, so this is correlation with survivorship bias, not cause. The package is sized as an experiment and measured against the current baseline (§5).

---

## 1. Decision Gates (Adi)

| # | Question | CC recommendation |
|---|---|---|
| G1 | **Conflict with an earlier constraint.** The `anchor-recovery` SPEC (5/23) says "No changes to onboarding. The onboarding lightness is sacred." #345 has changed onboarding since then. Can this package change UStep5? | Yes, as long as the step **doesn't add a screen**. The routine *replaces* the read-only preview, so the length stays the same. |
| G2 | Routine instead of the generator, or the routine plus a generated extra? | **Routine only** (4–6 steps). The generator stays available in Edit Focus. A short fixed list beats a mixed one. |
| G3 | Medication step: whom do we offer it to? | Offer an **optional toggle, off by default, shown to everyone**, worded neutrally. Reuse the MedReminderSheet defaults ("נטילת תרופה", 5 credits) and never store the medication name or dose. |
| G4 | **Conflict with memory.** "Kids never see a login screen" (65% of families use a shared device) vs. the data: every sustained kid has their own login. What counts as "kid on board" for `shared_device`? | Per access mode: `own_phone` → `link_child_profile`. `home_device` → also `link_child_profile`. `shared_device` → the kid's first **independent** session (`child_first_open` in View-as-Child **plus** one completion the kid ticks). Nobody gets forced through a login. |
| G5 | What happens to a reward request nobody answers? | **No auto-approve.** It would deduct BUFFs and promise a real-world reward the parent doesn't know about. Instead: remind the parents at 24h and again at 72h, and show the kid a calm "waiting" state. |
| — | "No morning focus in copy" (7/30) | That rule covers **marketing copy**. In the product the parent picks the moment, and "morning" is one of three options, so this doesn't violate it. Adi confirms. |

---

## 2. Values Check

### Pillar 1 — Intrinsic Motivation
1. **Would the kid want this even without a virtual reward?** Yes. The routine is the morning itself (getting dressed, bag, breakfast), so its value sits outside the app.
2. **Does it bring the kid closer to a reward they chose?** Yes. Phase C makes sure a reward request actually gets answered. Phase A adds a check that the first seeded reward can be reached within about 2 days of the routine ("Always close to a win").
3. **"I want" or "I have to"?** "I want". There's no streak, no penalty, and a "successful day" stays ~3 tasks (`min(3, assigned)`) even when the routine has 6 steps.

### Pillar 2 — Positive Coaching
1. **Does any wording shame, blame, compare, or show failure?** No, as long as the kid's waiting state says nothing like "Mom hasn't approved yet". Draft: "Your request is saved ✨". The parent reminders count nothing.
2. **When the kid fails, is the response empathy or pressure?** Nothing changes for the kid if the routine isn't done. The 48h invite reminder goes to the parent only, and there are at most 2 per child.
3. **Is there any suffering/loss/anger mechanic?** No. And the medication step doesn't show "missed" either.

### Pillar 3 — Independence-Building
1. **More capable without the app?** Yes. One stable routine is exactly what's supposed to become automatic and then fade out. The veteran kids carried on even after the parent stopped opening the app.
2. **Does the kid have a voice?** Partly. The parent builds the routine during onboarding. ⚠️ **Open:** after the kid joins, they should be able to suggest changing a step. That already exists through child suggestions (Phase 1.1), so the SPEC only adds a CTA to it on the kid's first screen. No new mechanism.
3. **Still necessary in 6 months?** No. It's scaffolding. Measured by the routine completing without parent activity (§5).

**Medical sensitivity (Pillar 2 + privacy):** the medication step is optional and off by default. We don't store the medication name, dose or diagnosis. It isn't a medical recommendation and has no "you forgot your pill" copy. Same privacy line as `medReminder.*`.

---

## 3. Goals / Non-goals

**Goals**
- Every new family leaves onboarding with **one routine of 4–6 steps at a fixed time** that the parent has edited or confirmed.
- **The kid is on board within 48 hours** (definition by access mode, G4), and we can measure it.
- **Every reward request gets a parent response,** and the kid always sees a calm status.

**Non-goals**
- No new screen in onboarding. No change to the success rule (~3 tasks).
- No auto-approve. No kid login on shared devices.
- No lifecycle emails (that's a separate package, `lifecycle-emails`). Push and in-app only.
- No backfill for existing families. The Phase C reminders do apply to existing families too; see §8.

---

## 4. Behavior Contract

### Phase A — Anchor Routine in UStep5 (replaces the read-only preview)
1. **Choose a moment.** The parent picks *one*: "Getting out of the house" / "After school" / "Before bed". Default is whatever matches `mainChallenge`; the parent can change it.
2. **Pre-filled steps.** 5 steps by default, taken from `taskLibrary.ts` and filtered by `timeOfDay` = the chosen moment and the age band. New: a `routineOrder` field on library items that belong in a routine.
3. **Editing.** The parent can edit a title inline, delete a step, add a step (free text), and drag to reorder. Minimum 4, maximum 6. Below 4, the "Continue" button stays enabled with a soft hint; it never blocks.
4. **One start time.** The parent sets the start time; step times are derived as `start + i × spacing` (default 5 minutes, or 15 minutes for "After school").
5. **Medication (G3).** Optional toggle "Add a medication step", off. When it's on, a step goes in at the start of the routine using MedReminderSheet's title and credits. No medication name is stored.
6. **Insert.** Same path as today (UStep5 `:276-303`): `schedule_days [0..6]`, `is_system_generated=false` (the parent wrote it), and the step is still skipped if the child already has tasks.
7. **Reward reachability check.** After `buildSeedRewards`, at least one seeded reward has `credits_needed ≤ 2 × daily routine credits`. If none qualifies, the cheapest one is lowered to that threshold.
8. **Telemetry.** `routine_built` {moment, steps, edited_count, added_count, meds_included}.

### Phase B — Kid on board within 48h
1. **`kid_joined` event, written server-side.** A trigger on `profiles` fires when `user_id` goes from NULL to NOT NULL for `role='child'`, and logs `onboarding_events.kid_joined`. Server-side so web and Android match. For `shared_device`: `kid_independent_session` (the first completion in a View-as-Child session after `child_first_open`), logged client-side.
2. **Second reminder.** Extends `scan_for_child_invite_reminder` (059):
   - It now also covers the window **40–52h** after the child is created, at 19:30 local time, with a different `kind` and different copy.
   - Cap 2 per child.
   - Same guards as today: `day1_push_optout`, pause, and `user_id IS NULL`.
   - `shared_device` is excluded, same as today.
3. **The invite card on the dashboard.** `ResumeHandoffBanner` currently shows while a child has 0 `daily_progress` rows. New rule: it also shows while the child hasn't joined (by access mode), even if the parent already ticked tasks.

### Phase C — Close the reward-approval loop
1. **Every parent gets notified.** `trg_notify_redemption_request` sends to **all** parents in the family, not just the first (`LIMIT 1`). This fixes the co-parent case.
2. **Reminders.** New cron, `scan_pending_redemptions`, runs hourly:
   - The request is in `requested` status for ≥24h → `reward_request_pending` goes to all parents (once).
   - Still `requested` at ≥72h → a second one.
   - It doesn't fire if the family is paused.
   - It never sends between 21:00 and 08:00 local time.
3. **Persistent card on the parent dashboard.** "{child} is waiting on a reward", linking to `ParentRewardsScreen` with that child selected (the deep link already exists, `:136`).
4. **Kid's waiting state.** On the kid's reward screen, a calm status: "Your request is saved" and a time without counting days. Nothing about the parent.
5. **Telemetry.** `redemption_reminder_sent` {hours}, plus a response-time measurement (`resolved_at - requested_at`).

---

## 5. Success Metrics

| Metric | Baseline (new families since Jun 15) | Target, after 6 weeks |
|---|---|---|
| Kid on board ≤48h (G4 definition) | 7/50 kid logins ever. Measurable only from Phase B. | ≥30% |
| Routine completed on ≥3 days in week 2 | ~1/50 | ≥15% |
| ≥1 completion in week 4 | 1/50 (Efrat) | ≥10% |
| Median time from request to parent response | not measured | ≤24h |
| Requests open >72h | Matan (Shani) is open today | 0 open without a reminder |

**Measurement:** on the Admin Tester Board, a cohort of families that go through onboarding after release. Compare to the 50 families from Jun 15 to the release date. Small n, so read it as a direction, not significance.

---

## 6. ROADMAP (chunked; a diff after every chunk)

| Chunk | Contents | Size | Order |
|---|---|---|---|
| C1 | Phase C: migration 065 (trigger to all parents + `scan_pending_redemptions` + 2 notification types + fanout map) | S | **First.** It helps the existing families today, Matan included. |
| C2 | Phase C UI: parent dashboard card + kid waiting state | S | |
| C3 | Phase B: migration 066 (`kid_joined` trigger + 059 extension to 40–52h) + `kid_independent_session` client event + banner rule | M | |
| C4 | Phase A: `routineOrder` in the library + Anchor Routine UI in UStep5 + medication toggle + reward check + `routine_built` | L | after G1–G3 |
| C5 | Admin board: cohort columns for kid_joined ≤48h, routine week 2, redemption response | S | |

**MVP cut-line:** C1 + C3 (both server-side; they measure and fix today). C4 is the experiment itself.

---

## 7. Schema Changes (need Adi approval)

- `065_redemption_reminders.sql`: replace `trg_notify_redemption_request` (all parents), add the `scan_pending_redemptions()` function plus an hourly cron job, and allow the new notification types.
- `066_kid_joined_and_48h_invite.sql`: trigger `tg_profiles_child_joined` → `onboarding_events`; extend `scan_for_child_invite_reminder` with a second window and a cap of 2.
- No new columns. Note: `onboarding_events.event_type` is text. Check there's no CHECK constraint on it.
- GRANTs in the migration (see reference_mcp_table_grants).

## 8. Impact on existing users

- **Phase C fires for existing families too.** Matan's open request will trigger a reminder to Shani within an hour of the migration. That's the intent, but Adi should know in advance.
- Phase B: the second window applies only to children created after the migration, so there's no burst.
- Phase A: new onboarding only. Existing families aren't touched.

## 9. Platform parity

- **Phase A:** an RN screen with no native modules. Reordering must work on web too: use up/down arrows rather than a native-only drag library, so **no new dependency**. Verify with `npm run web` and on the emulator.
- **Phase B/C:** server-side. The fanout already sends Expo push and Web Push. The cards and statuses are shared RN components. Verify on both platforms.

## 10. UI / Copy (drafts; everything through `t()`, EN+HE; goes through humanizer and Adi)

| Key | EN (draft) | HE (draft) |
|---|---|---|
| `onboarding.routine.title` | Pick one moment to make easier | בחרו רגע אחד ביום שנעשה קל יותר |
| `onboarding.routine.moment.out` | Getting out of the house | יציאה מהבית |
| `onboarding.routine.moment.afterSchool` | After school | אחרי בית הספר |
| `onboarding.routine.moment.bed` | Before bed | לפני השינה |
| `onboarding.routine.hint` | Same steps, same time, every day. Edit anything. | אותם צעדים, באותה שעה, כל יום. אפשר לשנות הכל. |
| `onboarding.routine.meds` | Add a medication step | להוסיף צעד של נטילת תרופה |
| `notif.childInvite2` | {child}'s routine is ready, send them the link | השגרה של {child} מוכנה, שלחו לו/ה את הקישור |
| `notif.rewardPending` | {child} asked for "{reward}" | {child} ביקש/ה "{reward}" |
| `rewards.child.waiting` | Your request is saved ✨ | הבקשה שלך שמורה ✨ |

## 11. Out of scope / flags

- An emailed reminder for the reward request: waits for `lifecycle-emails`.
- The kid editing the routine directly: uses the existing child suggestions.
- `kid_engagement` on shared devices: that's `kid-nudge-parent-fallback` (DRAFT), not touched here.
- `pack.task.medication` and `onboarding.step3.pack.morning_pro.desc` are orphaned i18n keys. Flagged only.
