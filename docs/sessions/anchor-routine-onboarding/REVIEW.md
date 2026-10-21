# REVIEW — anchor-routine-onboarding SPEC (2026-10-20)

Reviewed by role: Architect, PM, UX/Copy, Values/Clinical, Data. Every claim below was checked against the DB or the code today.

## New facts that change the SPEC

1. **Parents who use the app already answer reward requests fast.** Median from request to approval is **8 minutes** (24 approvals). Only 2 requests are open (`requested`) and 1 is in `discussing`.
   The problem isn't a slow parent. It's a parent who has disappeared altogether, like Shani (last seen 9/11, **0 device tokens**). A reminder push won't reach her, and she won't see a dashboard card either.
2. **Push barely reaches anyone:** about 5.5% of families can receive push (memory, push reachability). The second invite reminder (Phase B) and the redemption reminders (Phase C) both ride on push, so expect very little from them.
3. **`access_mode` is NULL for 36 of 52 kids** in families since Jun 15. The "on board" definition per access mode (G4) can't be measured for most of them.
   Current numbers by mode: shared_device 0/7 linked, own_phone 3/6, home_device 1/3.
4. **There's a real bug in `notify_parent_on_redemption_request`.** It picks `LIMIT 1` with no `ORDER BY` and no `is_deleted` filter, so it can notify a deleted parent. Today only 1 family is affected; the fix is cheap.
5. `onboarding_events.event_type` has no CHECK constraint, so a new event costs no DDL.
6. `UStep5_Preview.tsx` is 601 lines. It creates the child, tasks and rewards, and its idempotency was only just fixed in #345. That makes it the most sensitive point in the activation funnel.

## By role

### Architect
- ✅ **Phase B's `kid_joined` as a server-side trigger:** a good fit. Platform-agnostic, no client changes, and it covers every path that sets `user_id`.
- ✅ **Phases A and B client work is JS only,** so it ships by OTA with no store build.
- ⚠️ **Phase A means refactoring UStep5:** high regression risk to the create-child/tasks/rewards path. Recommendation: **don't touch the insert path.** Change only (a) the generator's output, which is pure functions with tests, and (b) the preview cards, so they can be edited.
- ⚠️ **Drag-and-drop reordering** costs UI complexity on both platforms. Recommendation: no reordering in the MVP, because order follows from time.
- ⚠️ **An hourly redemption cron** is one more job to watch (see the cron failures in 064). Not worth it, given fact 1.
- Migrations live in two folders (`migrations/` and `supabase/migrations/`). New migrations go in `supabase/migrations/`.

### PM
- ✅ The direction is grounded in the data: 0/50 new families vs. 5/5 veterans.
- ⚠️ **Volume:** about 12 new families a month. In 6 weeks we'll get roughly 15–20 families, and that can't separate signal from noise. The metric is a **direction**, not proof. Talking to the families gives a faster signal than the data.
- ⚠️ **The SPEC is too wide** for what it can prove: 5 chunks, 2 migrations and 5 decisions. The hypothesis really fits in one sentence: *does one fixed, editable routine plus a kid who's on board lead to week 2?*
- ❌ Phase C as written (cron plus reminders) solves a problem that hardly exists (fact 1). Its one real case (Shani) needs a human, not a push.

### UX / Copy
- ✅ **Editing a task during onboarding** directly fixes something parents feel today ("these aren't my tasks").
- ⚠️ **The moment picker adds a decision** at an already loaded point. Recommendation: pre-select the moment from `mainChallenge` so the parent only confirms, one tap.
- ⚠️ **Keyboard on Android** for inline editing: the emulator has no soft keyboard (memory), so this needs a Hat-4 check on a real device.
- ⚠️ **Hebrew copy "לו/ה" reads badly.** It needs a humanizer pass and a version that doesn't assume gender.

### Values / Clinical
- ✅ **No auto-approve:** correct. Approving automatically breaks the promise of a real reward.
- ⚠️ **A medication toggle shown to every parent during onboarding** makes the moment feel medical for families who don't use medication, and puts BUFFs on taking medication on day 0.
  It already exists after onboarding (MedReminderSheet + anchor-recovery). Recommendation: **leave it out of the MVP.**
- ✅ A fixed routine that fades over time: Pillar 3 is strong here.

### Data
- ✅ **`kid_joined` is the most important missing measurement.** Today we can't know whether the kid got on board.
- ⚠️ **An admin-board cohort column** is needed, or there's nothing to read results from.

## Pros / Cons in one line
- **Pros:** grounded in real behavior. Most of the work is OTA. The server-side work is small and measurable.
- **Cons:** small n. Push hardly reaches anyone. The core screen is sensitive. Medication content is sensitive.

## MVP recommendation

**Build now (about 3 small chunks, everything OTA plus 1 migration):**
1. **M1 — measurement (server, S):** `kid_joined` trigger → `onboarding_events`, plus a cohort column on the admin board (kid_joined ≤48h, completions in week 2). Also fix the redemption trigger in the same migration: notify **every active parent**, not the first and not a deleted one.
2. **M2 — routine-shaped generator (JS, M):** without touching the insert path:
   - The generator picks 4–5 tasks from **one** moment that matches `mainChallenge`.
   - Times are spaced from a single start time instead of the 08:00/12:00/16:00/20:00 buckets.
   - The moment is pre-selected, and there's a "change" option.
3. **M3 — edit in the preview (JS, S–M):** inline edit of a title and the start time, plus deleting a step. No reordering, no adding steps beyond 6.

**Not code (today):** Adi writes to Shani personally on WhatsApp about Matan's request. Then a short call with Rachel and Tamar.

**Deferred** (until there's data from M1):
- The second invite reminder.
- The redemption reminder cron and the kid's waiting state.
- The medication toggle in onboarding.
- Drag reordering.
- Per-access-mode definitions.

**Decisions still open for Adi:**
- G1: change UStep5. Shrinks to the generator and editing only, without the insert path.
- G2: routine only. Recommended.

G3 (medication) and G5 (no auto-approve) are settled by the deferrals above. G4 is replaced by `kid_joined` plus `child_first_open` until access_mode is filled in.
