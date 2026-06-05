# `pkg/notification-bell-show-new` SPEC

**Status:** `draft — awaiting Adi review; ready to spawn a CC session once approved`
**Slug:** `pkg/notification-bell-show-new`
**Branch:** `pkg/notification-bell-show-new` (off `main`)
**Parent package:** `pkg/parent-notification-feed` (shipped — this is a behavior change on top of it)
**Target release:** next train after current 1.2.0 (28)
**Drafted:** 2026-06-05 by Claude Code (acting PM) on `pkg/reward-redemption` working branch
**Source request (Adi, verbatim HE):** "הפעמון צריך לנקות את כל ההתראות שנקראו ולא להציג התראות ישנות לא רלוונטיות. המטרה שלו להציג דברים חדשים."

---

## Why this exists

The bell today is an **archive**, not a "what's new" surface. Two behaviors fight Adi's intent:

1. **Read items never leave the feed.** [`NotificationFeedScreen`](../../../src/screens/parent/NotificationFeedScreen.tsx) renders the 50 most recent `notifications` rows — **read and unread mixed**, ordered by `created_at`. A parent who processed everything last week still sees last week's items today. ([`useNotificationsFeed.ts`](../../../src/hooks/useNotificationsFeed.ts) fetches all rows; no read-state filter.)
2. **"Mark all read" fires automatically on open** ([`NotificationFeedScreen.tsx:88-95`](../../../src/screens/parent/NotificationFeedScreen.tsx) — `didAutoMark` ref calls `markAllRead()` on first load). So the badge clears the instant you peek, even if you didn't act on anything.

The net effect: the bell never feels like "new things." It accumulates and the badge zeroes on a glance.

**Target state:** the bell is a **fresh queue**. It shows what's new and unhandled. Once the parent handles an item (taps it, or clears the list), it's gone from the feed. Old, already-handled, and stale items don't clutter the surface.

This is a **behavior change, not a new feature** — no new screen, no new table, no new copy concept. It tightens the read/clear semantics of the existing feed. The full Pillar-3 / surveillance analysis from the parent package still holds and is re-verified here (see Values Check).

---

## The core conflict this SPEC resolves

> If the feed shows **only unread**, and opening the feed **auto-marks everything read**, the feed empties the moment you open it — you'd never see anything.

So the two changes are a matched pair and must ship together:

| Old behavior | New behavior |
|---|---|
| Feed shows read + unread (last 50) | Feed shows **unread only** ("what's new / unhandled") |
| Opening the feed auto-marks **all** read | Opening the feed marks **nothing**; items clear only on an **explicit act** |
| "Mark all as read" = the auto-action | "Clear all" = a deliberate button the parent taps when done |

A notification leaves the feed when, and only when, the parent:
- **taps the row** (handles it — it routes them to the relevant screen), or
- **taps "Clear all"** (deliberately empties the queue).

Glancing at the bell and closing it leaves unhandled items in place. That is the intended "it's still waiting for you" behavior.

---

## Recommended model (the two product forks)

These were surfaced to Adi as questions on 2026-06-05. The answers did not register in the tool; **CC is proceeding on the two recommended defaults below, both flippable at Phase 0 plan review.**

### Fork 1 — what "clear read" means → **HIDE from feed, KEEP in DB** (HIGH confidence)
Read rows are filtered out of the feed view but stay in `public.notifications`. Reversible, safe, and preserves the option to build a "History / Archive" view later (and preserves the rows the sister FCM package and dashboard selectors read). **Not** a hard `DELETE` — deletion is irreversible and would also destroy the dashboard SOS selector's source data.

### Fork 2 — when an item clears → **explicit act only** (HIGH confidence)
Opening the bell does **not** mark anything read. Items clear on row-tap or "Clear all". Rationale: if opening cleared the queue, hiding-read would empty the feed on every open (the core conflict above).

### Fork 3 — persistence by class → **ACTION persists, INFO expires** (Adi-decided 2026-06-05)
Two classes (see "classify by nature" below). **ACTION** items (need parent action + child communication) stay until explicitly handled — no time cap. **INFO** items (task-performance FYI) may disappear on their own. This replaces the earlier blanket 30-day cutoff.

---

## What about "old irrelevant" notifications? → classify by nature, not by age

Adi's refinement (2026-06-05, verbatim HE): *"לא נקרא ישאר עד שיטפלו בו אם דורש טיפול ותקשורת מול הילד, אם זה רק INFO על ביצוע משימות יוכל להעלם."*

→ The split is **not** time-based. It's by the **nature of the notification**:

| Class | Definition | Lifecycle |
|---|---|---|
| **ACTION** | Requires a parent action **and** communication with the child | **Persists until explicitly handled.** No time expiry. This is the real "still waiting for you" queue. |
| **INFO** | Pure FYI about the child's activity (e.g., task performance) | **May disappear on its own** after a short window, even if never tapped. Low-stakes; must not accumulate into a guilt-pile. |

### Type → class map (CC proposal — Adi reviews each row at Phase 0)

These are **exactly** the 8 types that render as a bell row (they have a `notificationFeed.row.<type>` copy key + a `NotificationRow` icon/case). Grounded in code as of 2026-06-05.

| # | Type | What the row says (EN) | Emitter | Proposed class | Why |
|---|---|---|---|---|---|
| 1 | `parent_sos` | "{name} wanted to share — low energy today" | **Live** — trigger `011` (child SOS in Low Power) | **ACTION** | Kid reached out; needs the parent to connect. The archetype ACTION. |
| 2 | `reward_redemption_requested` | "{name} wants to redeem: {reward}" | **Live** — trigger `018` (child requests redemption) | **ACTION** | Kid is blocked, waiting on parent approve/deny. |
| 3 | `child_suggestion` | "{name} suggested…" | **Live** — trigger `child-suggest` (child proposes a task/reward) | **ACTION** | Kid proposed something; needs a parent reply. |
| 4 | `parent_engagement` | "{name} has been active this week — wanna see?" | **Live** — scheduler `013` (weekly nudge **to** the parent) | **INFO** *(borderline)* | A nudge to the parent, not a kid request awaiting a response. Could be ACTION if Adi wants it to persist. |
| 5 | `reward_redeemed` | "{name} chose a reward: {reward}" | **Legacy** — Lovable-era rows; no live mobile emitter (live flow uses `requested`→`approved`) | **INFO** | The *request* is ACTION; this "already redeemed" confirmation is FYI. |
| 6 | `task_completed` | "{name} completed a task" | **Legacy** — Lovable-era rows; no live mobile emitter | **INFO** | Pure task-performance FYI. Adi named this case explicitly. |
| 7 | `quest_milestone` | "{name} reached a milestone" | **Legacy** — no live emitter | **INFO** | Celebration FYI. |
| 8 | `family_joined` | "{name} joined the family" | **Defensive** — copy exists; no live insert found | **INFO** *(borderline)* | One-time FYI; no action needed. Could persist as ACTION since it's rare + meaningful. |
| 9 | `child_vibe_shared` *(NEW — see below)* | "{name} shared how they feel: {mood}" | **Not built yet** — sibling package emits it (kid-initiated, non-SOS) | **INFO** | A positive/neutral mood the kid **chose** to share. FYI, doesn't block the kid (unlike SOS / redemption request). |

### New event #9 — `child_vibe_shared` (Adi-requested 2026-06-05)

A child's non-SOS mood that they **choose** to share with their parent ("your child said they feel…"). Distinct from `parent_sos`, which is the *down / low-power* escalation. This one is the *not-down* counterpart.

**Consent model — kid-initiated (Adi-decided 2026-06-05, mirrors SOS):**
- After a Vibe Check, the child taps a "share with my parent" affordance. **Only then** does the row insert. No share = stays private (the Vibe Check remains a private body-double moment — Pillar 3 + BUDDY trust).
- This is the values-passing choice: kid has a voice (Pillar 3 Q2), no surveillance, no auto-report of a state the kid didn't choose to share.

**Why this is NOT in this package's scope (own sibling package recommended — `pkg/vibe-share-notification`):**
1. **New notification type** `child_vibe_shared` + row copy + icon + router entry.
2. **New Supabase trigger / migration** (schema change → own Improvement Package per WORKFLOW; mirrors trigger `011`'s SECURITY-DEFINER pattern). Likely a new boolean on `child_vibes` (e.g. `vibe_shared_with_parent`) that the kid-share button flips, with a trigger inserting the notification — exactly the `parent_sos_sent` pattern.
3. **New kid-facing UI** on `VibeCheckScreen` (the "share with my parent" choice) — has its own Values Check (Pillar 3).

This SPEC only **registers the classification** (#9 = INFO) so the bell renders + expires it correctly once the sibling package ships it. The `notificationClass.ts` map includes `child_vibe_shared → INFO` from day one (harmless if no rows exist yet).

**Open for the sibling package (not decided here):** the `{mood}` label mapping (vibe_level 3/4/5 → words), whether the share button appears for every level or only non-low levels, and the exact kid-side copy (body-double voice per `feedback_kid_microcopy_pillar1`).

**Not bell rows (excluded from this package):**
- `anchor_recovery` — has **no** row copy / router / icon; rendered by a **separate** dashboard surface (`useAnchorRecoveryPrompts`), not the bell. Out of scope.
- `reward_approved`, `kid_engagement` — **kid-side** notifications (the router maps them to kid routes). Never render in the parent bell.

**Fail-safe:** any type **not** in this map (a future type) defaults to **ACTION** → it persists until handled, so we never silently auto-drop something that might need a parent response.

**INFO disappearance trigger (recommended): auto-expire from the feed after 7 days**, even if never tapped (the row stays in the DB; it just stops surfacing and stops counting in the badge). This keeps "no auto-mark on open" uniform across both classes — the *only* difference between the classes is that INFO has a 7-day shelf life and ACTION does not. See OQ-N5.

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| `public.notifications` table + `is_read` | ✅ shipped | No schema change. This package only changes read/filter semantics. |
| [`useNotificationsFeed.ts`](../../../src/hooks/useNotificationsFeed.ts) | ✅ shipped | Base hook keeps fetching all rows (read+unread) so selectors below don't regress. Feed filtering happens at the screen layer. |
| [`useParentNotifications.ts`](../../../src/hooks/useParentNotifications.ts) (dashboard SOS selector) | ✅ shipped | **MUST NOT regress.** It reads today's `parent_sos` rows regardless of `is_read`. This is why the base hook must keep returning read rows. |
| [`useAnchorRecoveryPrompts.ts`](../../../src/hooks/useAnchorRecoveryPrompts.ts) | ✅ shipped | Already filters `is_read=false` itself — unaffected. |
| Dashboard SOS dot (`child_vibes.parent_sos_sent`) | ✅ shipped | Decoupled from `is_read` per EX-3 (pkg/daily-vibe-check). Clearing the bell must NOT clear the dot. Regression target. |
| [`ParentNotificationBell.tsx`](../../../src/components/parent/ParentNotificationBell.tsx) | ✅ shipped (incl. RTL fix #157) | Badge already shows `count(is_read=false)`. **No change needed** — it's already "unread count." This package makes the *feed* agree with what the badge already promises. |

---

## Goal

After this merges:

- The bell badge keeps showing the unread count (unchanged).
- Tapping the bell opens a feed of **only unread** notifications — the "new / unhandled" queue.
- Opening the feed **no longer auto-marks** everything read.
- Tapping a row marks it read → it routes the parent to the relevant screen → it's gone from the feed.
- A **"Clear all"** action empties the queue deliberately (replaces the silent auto-mark-on-open).
- **ACTION** notifications (SOS, redemption request, child suggestion) persist until handled — no time expiry.
- **INFO** notifications (task completed, reward redeemed) auto-expire from the feed after 7 days even if untapped (OQ-N5).
- Empty state ("All caught up — quiet for now") now means *literally nothing new is waiting* — which is the honest, intended meaning.
- Dashboard SOS dot, anchor-recovery prompts, and the sister FCM read path are **unchanged**.
- Kid view: still **zero** exposure of `is_read`, the feed, or any read-receipt loop.

---

## Values Check

The parent package passed all 9. This change **strengthens** Pillars 1 and 2 (less clutter, no badge that nags after a glance, no accumulation) and is neutral-to-positive on Pillar 3. Re-verified:

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1 — kid want it without virtual reward? | ✅ Parent-only surface; kid never sees it. Unchanged. |
| Intrinsic Motivation | 2 — closer to kid's chosen real reward? | ✅ `reward_redeemed` / redemption-request rows still surface the kid's real reward moment — just only while unhandled. |
| Intrinsic Motivation | 3 — "I want to" vs "I have to"? | ✅ **Improved.** A queue that clears when handled is "I want to check what's new," not "I have a permanent backlog staring at me." |
| Positive Coaching | 1 — no shame / failure framing? | ✅ **Improved.** No accumulating pile; no badge that re-appears guilt-style. Empty state is now honest calm. |
| Positive Coaching | 2 — empathy if child fails? | ✅ Same neutral row component; no change to framing. |
| Positive Coaching | 3 — no suffering mechanic? | ✅ Empty state unchanged: no buddy face, no "your buddy misses you." |
| Independence-Building | 1 — more capable without app? | ✅ Feed still surfaces kid voice (SOS, requests), not behavioral logging. Showing only fresh items reduces the "surveillance feed" feel — net positive for Pillar 3. |
| Independence-Building | 2 — kid has voice? | ✅ `is_read` stays parent-private. **No "ההורה ראה" indicator** anywhere in kid UI. Unchanged hard rule. |
| Independence-Building | 3 — in 6 months still needed? | ✅ **Improved.** A self-clearing queue is sustainable long-term; an ever-growing archive is the drift this package prevents. |

**Values Check: ✅ all 9 pass (Pillars 1 & 2 strengthened).**

---

## Non-goals

- ❌ **Hard delete of read rows.** Hide-from-feed only; rows stay in DB (Fork 1).
- ❌ **A separate History / Archive view.** v1.1 — the kept rows make it possible later, but it's out of scope now.
- ❌ **Changing the bell badge logic.** The badge already = `count(is_read=false)`; untouched.
- ❌ **Changing per-type routing** ([`notificationRouter.ts`](../../../src/lib/notificationRouter.ts)). Tap still routes the same way.
- ❌ **Changing the dashboard SOS dot or its decoupling from `is_read`.** Hard regression boundary.
- ❌ **Kid-side anything.** Hard non-goal per Pillar 3 (carried from parent package).
- ❌ **Push / FCM changes.** Sister package owns push; this only changes the in-app read surface.
- ❌ **Per-type filter chips, swipe actions, long-press menus, search, group-by-child.** Still v1.1 (carried from parent package).
- ❌ **A confirmation dialog on "Clear all".** Reversible (rows kept; only hidden) → no destructive-action gate needed. (Re-evaluate only if Fork 1 flips to hard-delete.)

---

## Behavior Contract

**Scenario A — Parent opens the bell with unread items**
1. Feed renders **only** rows where `is_read = false` (and, per OQ-N5, `created_at` within 30 days), grouped by time bucket (Today / Yesterday / This week / Older).
2. **No auto-mark.** Badge count is unchanged by merely opening the feed.

**Scenario B — Parent taps a row**
1. Optimistic: `is_read → true`; the row animates out of the feed; badge decrements.
2. Async `UPDATE notifications SET is_read = true WHERE id = $1` (existing RLS).
3. Navigation routes per existing `notificationRouter` (unchanged).
4. On return to the bell, that row is gone (it's read).

**Scenario C — Parent taps "Clear all"**
1. Optimistic: every currently-visible unread row flips `is_read → true`; feed empties to the empty state; badge → 0.
2. Async bulk `UPDATE notifications SET is_read = true WHERE family_id = $1 AND is_read = false`.
3. **Dashboard SOS dot does NOT clear** (driven by `child_vibes.parent_sos_sent`, independent of `is_read` — EX-3). Regression check required.
4. Rollback on error: rows revert to unread, badge restores, toast surfaces failure.

**Scenario D — Parent opens the bell, glances, closes WITHOUT acting**
1. Nothing is marked read. Items remain in the queue.
2. Next open: the same unhandled items are still there. (Intended — "still waiting for you.")

**Scenario E — New notification arrives in realtime while feed is open**
1. INSERT (`is_read=false`) appears at the top of its time bucket.
2. Badge increments. (Unchanged from today, except the feed now only ever shows unread, so every realtime row is feed-eligible.)

**Scenario F — Empty state**
1. With unread-only filtering, the empty state now appears whenever there is nothing new/unhandled.
2. Copy unchanged: "All caught up — quiet for now" / "אין הודעות חדשות — שקט כרגע". It is now *literally true*.

**Scenario G — A read item from earlier today**
1. Does **not** appear in the feed (it's read). Even though it's "Today," read = handled = hidden. The time bucket only groups what's visible; it does not resurface read items.

**Scenario H — An ACTION item the parent never handled (e.g., a 6-week-old SOS or pending redemption request)**
1. **Still in the feed**, still counted in the badge. No time expiry for ACTION class.
2. It leaves only when the parent taps it or "Clear all" — because it needed parent action + child communication.

**Scenario H2 — An INFO item the parent never tapped, now 8 days old (e.g., "Emi finished a task" last week)**
1. **No longer surfaced** in the feed and no longer counted in the badge (7-day INFO shelf life, OQ-N5b). Row stays in the DB.
2. The parent is never nagged by week-old FYI clutter.

**Scenario I — Kid view (P-08 View-as-Child)**
- Unchanged: bell not rendered, `is_read` never exposed, no "parent saw your SOS." Re-verified at exit.

---

## CC defaults applied (Adi may override at any phase plan review)

| ID | Question | CC default | Rationale (confidence) |
|---|---|---|---|
| **OQ-N1** | What "clear read" means | **Hide read rows from the feed; keep them in `public.notifications`** | HIGH. Reversible; preserves dashboard SOS selector source + sister FCM read path + future archive. Hard-delete is irreversible and breaks selectors. |
| **OQ-N2** | When an item clears | **Explicit act only — row tap or "Clear all." Opening the bell marks nothing** | HIGH. Auto-mark-on-open + hide-read would empty the feed on every open (core conflict). |
| **OQ-N3** | Remove the existing auto-mark-on-open | **Yes — delete the `didAutoMark` effect** ([`NotificationFeedScreen.tsx:88-95`](../../../src/screens/parent/NotificationFeedScreen.tsx)) | HIGH. Direct consequence of OQ-N2. |
| **OQ-N4** | Where the unread filter lives | **At the feed-screen render layer** (`items.filter(n => !n.is_read)`), NOT in the base `useNotificationsFeed` query | HIGH. Base hook must keep returning read rows so `useParentNotifications` (dashboard SOS) doesn't regress. Lowest blast radius. |
| **OQ-N5** | "Old irrelevant" stale unread | **Classify by nature, not age: ACTION persists until handled (no expiry); INFO auto-expires from the feed after 7 days** (row kept in DB) | HIGH (model — Adi-decided). MEDIUM (the 7-day number — tune it). Honors "stays until handled if it needs action+child communication; task-performance info can disappear." |
| **OQ-N5a** | Type → class assignment | Per the **Type → class map** above (8 bell rows). Borderlines `parent_engagement` (→ INFO) and `family_joined` (→ INFO) flagged for Adi confirmation | MEDIUM. Clear-cut for SOS / redemption-request / child-suggestion (ACTION) and task_completed / reward_redeemed / quest_milestone (INFO); two borderlines need a call at Phase 0. |
| **OQ-N5b** | INFO disappearance trigger | **Auto-expire after 7 days, even if never tapped** (keeps "no auto-mark on open" uniform). Alternative: auto-mark-read on open for INFO only | MEDIUM. Recommended trigger avoids the "it vanished because I glanced" surprise; the alternative clears INFO faster but reintroduces a scoped auto-mark. |
| **OQ-N6** | Badge ↔ feed agreement | **Badge counts = visible feed rows = (all unread ACTION) + (unread INFO ≤7 days).** Expired INFO drops from both | HIGH. A badge number with no matching row is confusing; feed and badge must always match. |
| **OQ-N7** | "Mark all as read" button copy | **Rename to "Clear all" / "נקה הכל"** to match the new mental model (queue you clear, not receipts you mark) | MEDIUM. Copy decision — surfaced for Adi's review per `feedback_marketing_why_what`. Keep "Mark all as read" if she prefers. |
| **OQ-N8** | Button always visible or only when unread present | **Only when there is at least one unread item** (current behavior) | HIGH. Nothing to clear → no button. Unchanged. |
| **OQ-N9** | 50-row fetch window vs unread volume | **Keep base fetch at 50 (all rows); filter unread at screen.** Risk: if a family has >50 recent read rows, an older unread item could fall outside the window | LOW-MEDIUM. Expected unread volume is 1–3/week, so the 50-row window virtually always contains every unread item. If this proves false in practice, v1.1 switches the feed to a dedicated `is_read=false` query. Logged as a risk, not fixed in v1. |
| **OQ-N10** | Animate rows out on clear, or just disappear on next render | **Gentle fade/collapse on mark-read** if cheap with the current SectionList; otherwise plain re-render | LOW. Polish, not blocking. CC picks based on effort at Phase 2. |

---

## Files Likely Touched

- `src/lib/notificationClass.ts` — **new.** Single source of truth for the Type → class map (ACTION / INFO) + a `isVisibleInFeed(notification, now)` predicate encapsulating: `is_read === false` AND (class === ACTION OR `age ≤ 7 days`). Used by both the feed screen and the badge so they can never diverge.
- [`src/screens/parent/NotificationFeedScreen.tsx`](../../../src/screens/parent/NotificationFeedScreen.tsx) — **edit.** Remove `didAutoMark` auto-mark effect (OQ-N3); filter `items` via `isVisibleInFeed` (OQ-N4, N5); wire "Clear all" to `markAllRead`.
- [`src/hooks/useNotificationsFeed.ts`](../../../src/hooks/useNotificationsFeed.ts) — **edit.** Derive `unreadCount` from the same `isVisibleInFeed` predicate so the badge equals the feed row count (OQ-N6). Base fetch still returns all rows (read+unread) for the dashboard selector.
- [`src/components/parent/ParentNotificationBell.tsx`](../../../src/components/parent/ParentNotificationBell.tsx) — **untouched** if the hook's `unreadCount` already reflects the predicate (preferred); the bell just renders whatever count the hook gives.
- `src/i18n/he.json`, `src/i18n/en.json` — **edit** if OQ-N7 lands ("Clear all" / "נקה הכל"); else untouched.
- [`src/hooks/useParentNotifications.ts`](../../../src/hooks/useParentNotifications.ts) — **NOT touched** (regression target).
- [`src/screens/parent/ParentDashboardScreen.tsx`](../../../src/screens/parent/ParentDashboardScreen.tsx) — **NOT touched** (SOS-dot regression target).

---

## Proposed Phased Chunks

| # | Phase | Chunks | Exit criteria |
|---|---|---|---|
| **0** | Foundation | Confirm `useParentNotifications` reads read+unread today (so OQ-N4 is safe); **Adi confirms the Type → class map + the two borderlines (OQ-N5a) + the 7-day number (OQ-N5b)**; scaffold STATUS/TESTS/SPEC_SYNC | OQ-N1..N10 confirmed or overridden; class map locked; regression contract for dashboard SOS written into TESTS |
| **1** | Class map + show-new feed | New `notificationClass.ts` (map + `isVisibleInFeed`); remove auto-mark effect (OQ-N3); filter feed via the predicate (OQ-N4, N5); "Clear all" wired; optimistic + rollback verified | Feed shows only visible items (unread ACTION + unread INFO ≤7d); opening marks nothing; tapping a row + "Clear all" remove items; dashboard SOS dot + anchor-recovery unaffected |
| **2** | Badge/feed sync + copy | Hook `unreadCount` uses the same predicate (OQ-N6); OQ-N7 copy ("Clear all") in he/en; OQ-N10 polish | Badge count == number of feed rows in every case; copy parity clean; no kid-side exposure |
| **3** | Spec sync + tests + STATUS + PR | STATUS rows; `BUFF_FEATURE_AUDIT.md` notes the bell now shows unread-only; `INTEGRATION_LEARNINGS.md` entry (auto-mark-on-open removed, why); `RELEASE_QUEUE.md` row (Queued) | PR opened, build green, dashboard SOS smoke passes, kid UI verified clean, queue row added |

---

## Exit Deliverables — SPEC_SYNC matrix

(Will move into `SPEC_SYNC.md` at Phase 0.)

| Phase | Canonical doc update | What changes |
|---|---|---|
| 0 | Session `STATUS.md`, `TESTS.md`, `SPEC_SYNC.md` | scaffolded |
| 1 | None (behavior only) | — |
| 2 | `src/i18n/he.json`, `src/i18n/en.json` (if OQ-N7) | "Clear all" / "נקה הכל" |
| 3 | `BUFF_FEATURE_AUDIT.md` (bell = unread-only queue); `INTEGRATION_LEARNINGS.md` (auto-mark-on-open removed); `docs/RELEASE_QUEUE.md` (Queued row); `STATUS.md` closeout | per row |

---

## Risks

- **Dashboard SOS regression (highest).** OQ-N4 keeps the base hook returning read rows precisely to protect `useParentNotifications`. Phase 0 verifies the dashboard SOS surface reads read+unread; Phase 3 re-runs the SOS smoke test. If the base query were ever narrowed to `is_read=false`, the dot breaks.
- **Unread outside the 50-row window (OQ-N9).** Low probability at current volume; logged, not fixed in v1. v1.1 fallback: dedicated `is_read=false` feed query.
- **Badge/feed divergence (OQ-N6).** If the badge and the feed compute visibility differently, the parent sees "3" with a shorter list. Mitigation: a **single** `isVisibleInFeed` predicate in `notificationClass.ts` drives both. Never duplicate the rule.
- **Misclassified type (OQ-N5a).** If an ACTION type is mislabeled INFO, a request needing the parent could silently expire in 7 days. Mitigation: default unknown/borderline types to **ACTION** (fail safe = persist, never auto-drop something that might need a response). Adi confirms the map at Phase 0.
- **New types added later.** Any future notification type must be assigned a class in `notificationClass.ts` or it defaults to ACTION (persist). Add a PR-template/CONTRIBUTING note at Phase 3.
- **"Clear all" feels destructive.** It isn't (rows kept; reversible), so no confirmation dialog. If Fork 1 ever flips to hard-delete, add a confirm gate.
- **Copy drift (OQ-N7).** If "Mark all as read" → "Clear all" lands, ensure both he/en update and any a11y label matches. Phase 2 parity check.
- **Pillar-3 vigilance.** Unchanged hard rule: no kid exposure of `is_read`/feed. Re-verified at Phase 3.

---

## Brief for the receiving session

Paste this as the first message when you spin up a new CC session for this package:

```
Plan Mode. You are picking up pkg/notification-bell-show-new.

Read FIRST:
- CLAUDE.md
- docs/WORKFLOW.md
- docs/BUFF_VALUES.md (Pillar 3 = surveillance / "ההורה ראה" risk — same
  as the parent package; this change is net-positive on it)
- docs/sessions/parent-notification-feed/SPEC.md (the package this builds
  on — read the Behavior Contract + OQ-B14/B18 for the read-state model)
- docs/sessions/notification-bell-show-new/SPEC.md (this SPEC — all
  OQ-N1..N10 defaults; may override after Adi sign-off)
- docs/sessions/daily-vibe-check — EX-3 (the SOS dot is decoupled from
  is_read; do NOT couple them)
- src/screens/parent/NotificationFeedScreen.tsx (remove auto-mark effect;
  filter feed to unread + recency)
- src/hooks/useNotificationsFeed.ts (base hook — keep returning read rows)
- src/hooks/useParentNotifications.ts (dashboard SOS selector — regression
  target; do NOT touch)
- src/screens/parent/ParentDashboardScreen.tsx (SOS-dot regression target;
  do NOT touch)

Before proposing chunks:
- Confirm useParentNotifications reads today's parent_sos regardless of
  is_read (so filtering unread at the SCREEN, not the base query, is safe).
- Confirm the dashboard SOS dot is driven by child_vibes.parent_sos_sent,
  not by is_read.

Branch off main as pkg/notification-bell-show-new. No code until Adi
approves Phase 0. Chunk-by-chunk per CLAUDE.md.

Hard product principles (NEVER PROPOSE):
- Hard-deleting notification rows (hide-from-feed only)
- Coupling the dashboard SOS dot to is_read
- Exposing is_read / the feed to the kid UI
- Auto-marking on open (the whole point is to remove that)
- Auto-expiring an ACTION-class item (SOS / redemption request /
  child suggestion must persist until the parent handles them)
- Red/alarm badge styling

Class model (Adi-decided 2026-06-05): ACTION items persist until handled;
INFO items (task-performance FYI) auto-expire after 7 days. Single
`isVisibleInFeed` predicate drives BOTH the feed and the badge. Unknown
/ borderline types default to ACTION (fail safe = persist).
```

---

## Decisions added during execution

(Empty; populated by CC during implementation.)
