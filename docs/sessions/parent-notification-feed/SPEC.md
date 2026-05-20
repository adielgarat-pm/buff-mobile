# `pkg/parent-notification-feed` SPEC

**Status:** `draft — awaiting Adi review; ready to spawn a CC session once approved`
**Slug:** `pkg/parent-notification-feed`
**Branch:** `pkg/parent-notification-feed` (off `main`)
**Sibling package:** `pkg/fcm-push-notifications` (independent; either can ship first)
**Target release:** `beta-2026-06-01`
**Source spec:** unified-codebase migration target (the in-app surface for the ~396 existing `notifications` rows; not currently in PRD — Phase 7 surfaces to Adi); `INTEGRATION_LEARNINGS.md IN-2026-05-17-03`
**Drafted:** 2026-05-19 by CC on `pkg/notification-spec` planning branch
**Plan file:** `C:\Users\adiel\.claude\plans\refactored-mixing-lamport.md`

---

## Why this exists

Today the parent sees only **Vibe-SOS** notifications, and only as a soft amber dot + inline text on the dashboard child card, and only today's (the Phase 4b surface from `pkg/daily-vibe-check`). The other ~396 existing notifications in `public.notifications` (`reward_redeemed`, `task_completed`, `quest_milestone`, and future types) are invisible in the mobile app — they live in the DB but have no read surface yet. (These rows are buff-mobile's own Lovable-era data snapshot, **not** migrated content from the live Lovable Supabase project — see `project_lovable` memory 2026-05-19.)

This package adds a **bell icon in the parent navigator header** and a **dedicated `NotificationFeedScreen`** that surfaces all relevant types chronologically.

**End-state framing (unified codebase migration):** When Expo Web Phase 2 ships and `buffadhd.com` (Lovable web POC) is retired, this `NotificationFeedScreen` is the canonical notification surface for every BUFF user across Android, Web, and (later) iOS. It's not "infill" for a parallel system — it's the unified-codebase target's notification center. Sister package `pkg/fcm-push-notifications` pushes from the outside; this package reads from the inside; both run against the same `public.notifications`.

Pillar-3 risk is the highest in this package: a notification center can easily become a "kid surveillance dashboard" ("here's everything my kid did today, ranked"). Every design choice in this SPEC is justified against the Pillar-3 questions explicitly.

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| `public.notifications` table | ✅ exists in live DB; ❌ no repo migration | If `pkg/fcm-push-notifications` shipped first, the repo migration is already there. If this ships first, Phase 1 emits the idempotent `CREATE TABLE IF NOT EXISTS`. |
| ~396 existing notification rows | ✅ in DB | buff-mobile's own Lovable-era data snapshot — NOT migrated content from the live Lovable Supabase project. Treat as native buff-mobile data. Phase 3 renders as info; no special "legacy" styling; no type-specific styling for `task_completed`. |
| `useParentNotifications` hook | ✅ shipped (pkg/daily-vibe-check Phase 4b) | Phase 1 refactors it into a thin selector on the new `useNotificationsFeed`. Hook's return shape preserved for the dashboard SOS consumer. |
| `ParentDashboardScreen` SOS surface | ✅ shipped 2026-05-17 | MUST NOT regress. Snapshot test in Phase 1. |
| `ParentTabs.tsx` navigator | ✅ shipped | Phase 2 wires `headerRight` with the bell. |
| react-navigation stack header | ✅ Phase 2-ready | Adding a header element across all 5 tabs uses RN-Nav's `screenOptions.headerRight` at the tab navigator level. |

---

## Goal

A parent on any of the 5 parent tabs sees a bell icon with an unread count badge in the header. Tapping the bell opens a full-screen feed of all their `public.notifications` rows, grouped chronologically (Today / Yesterday / This week / Older), with per-type tap-to-route to the relevant screen.

After this merges:
- Bell visible across all 5 ParentTabs tabs, top-right header
- Unread count badge (theme-accent color, never alarm-red) shows `count(is_read=false)`
- Tap bell → `NotificationFeedScreen` pushed onto stack
- List shows 50 most recent items with sticky section headers by time bucket
- Realtime: new INSERT → badge increments + new row appears at top without pull
- Tap row → marks read (optimistic UI) + navigates to per-type destination
- "Mark all as read" in screen header
- Empty state: gentle, no buddy face, "All caught up — quiet for now"
- Dashboard SOS dot continues to work identically (no regression)
- Kid view: **no exposure** of `is_read`, the feed, or any read-receipt loop

---

## Values Check

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1 — would the kid want this without virtual reward? | ✅ Feed is parent-only. Kid never sees it. No virtual-reward dynamic. |
| Intrinsic Motivation | 2 — closer to kid's chosen real reward? | ✅ `reward_redeemed` rows in the feed reinforce the kid's **real** reward earning. The parent sees the moment the kid claimed their chosen reward — intrinsic loop reinforced, not gamified. |
| Intrinsic Motivation | 3 — "I want to" vs "I have to"? | ✅ Parent voluntarily checks the bell. No nag. Badge is informational, not urgent. |
| Positive Coaching | 1 — no shame / failure framing? | ✅ No "X notifications you missed", no streak counter, no red dot. Empty state is gentle ("שקט כרגע" / "quiet for now"). |
| Positive Coaching | 2 — empathy if child fails? | ✅ Failure events (if any future type) would be rendered with same neutral row component, no special icon, no alarm framing. Currently no failure types push to this table. |
| Positive Coaching | 3 — no suffering mechanic? | ✅ Empty state shows no buddy face, no character — purely calm. No "your buddy misses you" copy. |
| Independence-Building | 1 — more capable without app? | ✅ The feed shows kid-initiated signals (SOS, reward redemption). It does not log kid behavior; it surfaces kid voice. Parent reading the feed = listening, not surveilling. |
| Independence-Building | 2 — kid has voice? | ✅ Feed is parent-only. Kid does **not** see if/when parent read. No "ההורה ראה" indicator. `is_read` is parent-private. |
| Independence-Building | 3 — in 6 months still needed? | ✅ Low-volume feed (typical: 1-3 items/week) is sustainable long-term. High volume would be a sign we're surfacing the wrong things; the v1.1 opt-out + the deliberate exclusion of `task_completed` push prevent that drift. |

**Values Check: ✅ all 9 pass.**

---

## Goals

1. **Generalized hook** `useNotificationsFeed(familyId)` — fetches all types for the parent's family, paginated (initial 50), realtime-subscribed. Returns ordered list + unread count + mark-read mutations.
2. **Preserve dashboard surface** — `useParentNotifications` becomes a thin selector on the new hook, filtering type='parent_sos' + today-only. Same return shape; dashboard code untouched.
3. **Header bell across all parent tabs** — `<ParentNotificationBell />` rendered via `screenOptions.headerRight` at the ParentTabs navigator level. Accessibility labeled.
4. **Unread count badge** — numeric, max "99+", theme-accent color (not red). Hidden when count = 0.
5. **`NotificationFeedScreen`** — full-screen, pushed onto stack on bell tap. Sticky time-bucket section headers. Realtime list updates.
6. **Per-row interaction** — tap → optimistic `is_read=true` + navigate via `notificationRouteMap` (shared with sibling package).
7. **"Mark all as read"** header action — bulk mutation; UI clears badge + section unread states.
8. **Empty state** — calm, declarative copy, no character.
9. **Hebrew + English i18n** for all strings.
10. **Realtime consolidation** — one Supabase Realtime channel per family per session (vs. two if both hooks subscribed independently).
11. **Per-type tap-route map** — `notificationRouteMap.ts`:
    - `parent_sos` → ParentDashboard tab + scroll to child card
    - `reward_redeemed` → ParentRewards tab
    - `task_completed` → ParentTasks tab (filtered by child if filter exists; else unfiltered)
    - `quest_milestone` → ParentDashboard + child card (fallback until quest screen exists)
12. **No regression** on dashboard SOS surface (Phase 4b deliverable).

---

## Non-goals

- ❌ **Per-type filter chips.** v1.1.
- ❌ **Notification deletion / archive.** v1.1 — risk of accidental loss; the table is the source of truth.
- ❌ **Pagination beyond initial 50.** v1.1 if real volume grows.
- ❌ **Long-press menu (mark unread, copy text, etc.).** v1.1.
- ❌ **Swipe actions (iOS native pattern).** v1.1.
- ❌ **Kid-side feed.** **Hard non-goal per Pillar 3** — kid never sees this surface, never sees `is_read`, never has a "what my parent has seen" pattern.
- ❌ **Push integration.** Sister package owns push. This package only consumes the read side.
- ❌ **Notification settings (which types to receive).** v1.1; sister package owns push opt-out.
- ❌ **Search across notifications.** v1.1+.
- ❌ **Group by child instead of by time.** v1.1; current time-bucket grouping is the right default.
- ❌ **Custom illustrations per type.** v1 uses simple type-keyed icons (existing icon set / emoji); illustration set is post-MVP polish.

---

## Event × Channel Matrix (parent bell subset)

Locked 2026-05-19 with sister package. This SPEC owns the **Parent bell** column only; the full matrix lives in `pkg/fcm-push-notifications` SPEC § Event × Channel Matrix.

| # | Event | Source | Renders in feed? | Notes |
|---|---|---|---|---|
| E1 | Kid SOS in Low Power | trigger `011` → `parent_sos` row | ✅ | Already renders today on dashboard; feed adds chronological surface |
| E2 | Kid redeemed reward | `reward_redeemed` row | ✅ | Lovable-era rows + new rows render the same |
| E3 | Kid completed a task | `task_completed` row | ✅ silent | Neutral icon, no special highlight (OQ-B12, OQ-B13) |
| ~~E4~~ | ~~quest_milestone~~ | stale — no live emitter (verified 2026-05-19) | 🟡 if rows appear | Defensive render only; never push |
| E5 | Kid disengagement (server push to kid) | not a row insert | ❌ | Kid-side only — not in parent feed |
| E6 | Parent disengagement reminder | scheduler may insert a `parent_engagement` row OR push without row | 🤔 — Phase 1 decides | Open: does this insert a row or push directly? If row → feed renders; if push-only → no feed entry. **Adi may pick at Phase 1 plan review.** |
| E7 | Per-phase kid reminder | client-side local schedule | ❌ | No DB row; kid local only |
| E8 | Parent assigned task | parent action; no notification row | ❌ | Action visible in ParentTasks |
| E9 | Parent approved reward redemption | parent action; no separate notification row for parent (kid-side push only) | ❌ for parent | Kid-side server push only |
| E10 | Parent toggled Pause | parent action | ❌ | No notification |
| E11 | BUDDY local nudge | kid local schedule | ❌ | Kid-side only |
| E12 | Subscription / payment | RevenueCat | 🟡 v1.1 | Separate transactional surface |
| E13 | Family member joined | invite flow insert | ✅ | New row type `family_joined` |
| E14 | Vibe Check completed | not an event | ❌ | Observation only |

**Feed renders rows of type:** `parent_sos`, `reward_redeemed`, `task_completed` (silent), `quest_milestone` (legacy render), `family_joined`, possibly `parent_engagement`.

**Feed does NOT render:** kid-side events that don't produce a row at all (E5, E7, E11), kid-side rows scoped to `child_id` only (none in v1), parent-action events that don't produce rows (E8, E10).

### Voice rules in the feed

Parent-facing — declarative + connection-not-rescue (IN-2026-05-17-01). Same i18n keys as the push tray surfaces (consistency across in-app feed row body ↔ push body). The feed surface MAY have a slightly longer body (no system tray truncation) but **must not add any framing the push doesn't have** — kid privacy / Pillar-2 boundary holds in both surfaces equally.

---

## Behavior Contract

**Scenario A: Parent opens app on any of the 5 tabs**
1. ParentTabs renders → header bell visible top-right
2. `useNotificationsFeed` realtime subscription active (one channel for the family)
3. Badge shows count of `is_read=false` rows; 0 → no badge

**Scenario B: Parent taps bell**
1. Navigation pushes `NotificationFeedScreen` onto stack
2. Screen mounts with the same hook (selector pattern; no duplicate fetch)
3. List renders top 50 ordered DESC by `created_at`
4. Sticky section headers: "Today" / "Yesterday" / "This week" / "Older" (computed from `created_at`)
5. Each row shows: type icon, child name, declarative body text, relative time, unread visual (subtle dot until tap)

**Scenario C: New notification arrives in realtime**
1. Edge channel emits INSERT for the family
2. List inserts the new row at the top (within current section)
3. Bell badge increments (across all tabs)
4. No toast in the feed screen (already visible); the toast surface belongs to sister push package

**Scenario D: Parent taps a row**
1. Optimistic: `is_read` flips to true in local store; row visual updates; badge decrements
2. Async: `UPDATE notifications SET is_read = true WHERE id = $1` (RLS allows parent to update own family's rows)
3. Navigation fires per `notificationRouteMap[row.type]`:
   - `parent_sos` → pop to ParentDashboard tab, programmatic scroll to that child card
   - `reward_redeemed` → switch to ParentRewards tab
   - `task_completed` → switch to ParentTasks tab (filter by child_id if supported)
   - `quest_milestone` → ParentDashboard + child card (until quest screen exists)
   - Unknown type → no-op route (stay on feed), still mark read
4. Stack pops back to the destination

**Scenario E: Parent taps "Mark all as read"**
1. Optimistic: all rows flip `is_read=true` locally; badge → 0
2. Async: bulk update `UPDATE notifications SET is_read = true WHERE family_id = $1 AND is_read = false`
3. Dashboard SOS dot **does not clear** by this action (intentional: the dot is "SOS today" not "unread"; locked by EX-3 in pkg/daily-vibe-check)

**Scenario F: Empty state (no rows)**
1. List shows centered illustration (simple SVG, no buddy) + headline "All caught up — quiet for now" / "אין הודעות חדשות — שקט כרגע"
2. No CTA; no "compose"; pure passive

**Scenario G: Realtime arrives while parent is on a non-Parent tab section of the app (e.g., kid view via P-08 View-as-Child)**
- The bell is part of ParentTabs only. View-as-Child renders the child shell. Notifications still update via the realtime channel; when parent exits view-as-child, the bell badge reflects the latest count.

**Scenario H: Parent navigates from feed → dashboard child card → back to bell**
1. `parent_sos` row was marked read on tap (Scenario D)
2. Dashboard SOS dot ON THAT child remains visible (`parent_sos_sent=true` independent of `is_read`)
3. Bell badge does not show that row anymore (it's read)
- Two surfaces are intentionally decoupled: the dot is "kid is having a tough day"; the read state is "parent processed this notification".

**Scenario I: Kid view (P-08 View-as-Child)**
- Bell is **not rendered** in child-shell screens
- `is_read` state is **never** exposed to kid UI in any way
- No "your parent read your SOS" message
- (Verified at Phase 7 spec sync)

---

## Schema Changes

**None.** This package is pure read + the existing `is_read` write.

**Possible defensive addition** — if `pkg/fcm-push-notifications` did not run first, this package's Phase 1 emits the idempotent `CREATE TABLE IF NOT EXISTS notifications (...)` to capture the live schema in repo migrations. If FCM package ran first, this is already done — Phase 1 detects and skips.

**RLS verification** — parent must be able to `UPDATE notifications SET is_read = true WHERE family_id = $auth.family_id`. Phase 0 confirms the policy via Supabase MCP.

---

## Files Likely Touched

- `src/hooks/useNotificationsFeed.ts` — **new** (Phase 1)
- `src/hooks/useParentNotifications.ts` — **edit** (Phase 1; becomes thin selector on new hook)
- `src/components/parent/ParentNotificationBell.tsx` — **new** (Phase 2)
- `src/navigation/ParentTabs.tsx` — **edit** (Phase 2; add `headerRight: () => <ParentNotificationBell />` to navigator-level `screenOptions`)
- `src/screens/parent/NotificationFeedScreen.tsx` — **new** (Phase 3)
- `src/components/parent/NotificationRow.tsx` — **new** (Phase 3; reusable row)
- `src/components/parent/NotificationEmptyState.tsx` — **new** (Phase 3)
- `src/lib/notificationRouteMap.ts` — **new** (Phase 4; shared with sibling package if it lands first, else this one creates it)
- `src/lib/notificationTimeBuckets.ts` — **new** (Phase 3; date → bucket label helper)
- `src/i18n/he.json`, `src/i18n/en.json` — **edit** (Phase 6; section headers, empty state, mark-all-read, a11y labels, per-type row titles/bodies)
- `src/screens/parent/ParentDashboardScreen.tsx` — **NOT touched** (regression target)

---

## CC defaults applied (Adi may override at any phase plan review)

| ID | Question | CC default | Rationale (confidence) |
|---|---|---|---|
| **OQ-B1** | Bell location | **Header of ParentTabs (right side), visible across all 5 tabs** via navigator-level `screenOptions.headerRight` | HIGH. Reachable wherever parent is. Matches Lovable parity. Dashboard-only bell would defeat the Lovable-churn fix. |
| **OQ-B2** | Surface shape on tap | **Full-screen `NotificationFeedScreen` pushed onto stack** with back button | HIGH. Dropdown/popover is awkward on small screens. Bottom sheet is heavy for a list with sticky sections + bulk actions. Full screen matches OS expectation. |
| **OQ-B3** | Time grouping | **Sticky section headers: Today / Yesterday / This week / Older** computed from `created_at` | HIGH. Scannable; matches Gmail / Linear / iOS Mail patterns parents already know. |
| **OQ-B4** | Filter by type | **No filter in v1 — chronological only** | MEDIUM. Filter chips are YAGNI at expected volume. v1.1 if volume grows. |
| **OQ-B5** | Mark-as-read pattern | **Tap row → marks read + navigates** (optimistic). **"Mark all as read" button in header**. **No long-press delete in v1** | HIGH. Standard pattern. No-delete protects against accidental loss. |
| **OQ-B6** | Empty state copy | **HE: "אין הודעות חדשות — שקט כרגע" · EN: "All caught up — quiet for now"** with a small calm illustration (no buddy face) | MEDIUM. Phrasing surfaced for Adi's marketing-copy review (per memory `feedback_marketing_why_what`). Lead with state, not absence-of-activity. |
| **OQ-B7** | Per-type tap-to-route map | `parent_sos` → ParentDashboard + scroll to child card · `reward_redeemed` → ParentRewards · `task_completed` → ParentTasks (filter-by-child if supported) · `quest_milestone` → ParentDashboard + child card (fallback) | MEDIUM-HIGH. Reuses existing screens. Open: ParentTasks may not support filter-by-child query param today — Phase 4 verifies; if not, falls back to unfiltered ParentTasks. |
| **OQ-B8** | Kid exposure to feed / `is_read` | **NONE. Feed is parent-only. No "ההורה ראה" indicator anywhere in kid UI** | HIGH. Pillar 3 hard rule (memory `feedback_kids_never_login` + BUFF_VALUES Q3.2). |
| **OQ-B9** | Initial fetch volume | **50 most recent items**; no pagination UI in v1 | HIGH. Lovable history is ~396 rows total; 50 covers recent quarter. v1.1 adds infinite scroll if needed. |
| **OQ-B10** | Badge style | **Numeric unread count, max "99+". Subtle theme-accent color (not red)** | MEDIUM-HIGH. Red dot = alarm-design (Pillar 2 risk). Theme-accent count = informational. |
| **OQ-B11** | Realtime channel sharing | **Refactor: `useParentNotifications` becomes a thin selector on top of new `useNotificationsFeed`** → one Realtime subscription per family per session | MEDIUM. Cheaper, avoids two channels racing on the same family. Risk: regression on dashboard SOS surface. Mitigated by snapshot test of the SOS hook return shape in Phase 1. |
| **OQ-B12** | Rendering existing `task_completed` rows (Lovable-era buff-mobile snapshot, likely high volume) | **Show them but un-styled as "info"** — same row component, neutral icon, no special highlight | MEDIUM. Don't break the feed for users with rows from before active mobile development. Don't push these (per sister package OQ-A8). Just render. |
| **OQ-B13** | Row visual differentiation by type | **Minimal — type-keyed leading icon only; same typography, same colors** | HIGH. Pillar-2 risk: visually amplifying SOS (e.g., red border) trains parent into alarm-mode. Equal-weight rows = informational, not urgent. |
| **OQ-B14** | What clears the bell badge | **`is_read=true` on the row** (via tap or mark-all). Dashboard SOS dot operates independently per EX-3 (pkg/daily-vibe-check) | HIGH. Two surfaces, two read-states. Coupling them would conflate "I processed this notification" with "today's SOS still matters". |
| **OQ-B15** | Bell visibility for parents with 0 children | **Hidden** | MEDIUM. Edge case; reduces noise during onboarding. Re-evaluate when child added. |
| **OQ-B16** | Bell visibility in View-as-Child (P-08) | **Hidden** while in view-as-child shell | HIGH. View-as-child renders kid UI; bell is parent-surface. |
| **OQ-B17** | Pagination strategy beyond 50 | **None in v1**. If user scrolls to bottom of 50, no "load more". v1.1 adds infinite scroll | MEDIUM. Acceptable for parents reviewing recent activity. |
| **OQ-B18** | What happens to unread rows older than 30 days | **Stay unread; rendered in "Older" bucket** | HIGH. No auto-mark-read; parent owns the state. |
| **OQ-B19** | Realtime channel name | **`parent-feed-${familyId}`** (shared with sibling hook's selector reuse) | MEDIUM. Stable name = easier debugging. |
| **OQ-B20** | Optimistic update rollback on mutation failure | **Yes — local state reverts on Supabase error; toast surfaces failure** | MEDIUM. Rare case (RLS denial / network) but should not silently lie to user about read state. |

---

## Decisions added during execution

(Empty; populated by CC during implementation.)

---

## Proposed Phased Chunks

| # | Phase | Chunks | Exit criteria |
|---|---|---|---|
| **0** | Foundation | Verify `notifications` live schema + RLS for parent UPDATE `is_read`; scaffold STATUS/TESTS/SPEC_SYNC | SPEC + folder verified; RLS confirmed |
| **1** | Generalized hook — `useNotificationsFeed` + refactor existing hook | `src/hooks/useNotificationsFeed.ts`; `useParentNotifications` becomes thin selector; snapshot test for SOS hook return shape; tests | Dashboard SOS surface visually identical (snapshot pass); new hook returns paginated realtime list |
| **2** | Header bell + badge — `ParentNotificationBell.tsx` + `ParentTabs.tsx` wiring | New component; navigator `headerRight` integration; unread count from hook; accessibility | Bell visible on all 5 parent tabs; badge updates realtime; tap navigates (route stub OK) |
| **3** | `NotificationFeedScreen` — list with sticky sections, empty state, row component | New screen + new route in ParentNav stack; `NotificationRow.tsx`; `NotificationEmptyState.tsx`; `notificationTimeBuckets.ts` | Tap bell → screen opens; rows render with correct time-bucket grouping; empty state renders correctly |
| **4** | Per-type tap-to-route — `notificationRouteMap.ts` | Map module shared with sister package (create if absent); integration with row's tap handler; ParentTasks filter-by-child verified or fallback applied | Each in-scope type taps to correct screen; verified manually + via test |
| **5** | Mark-as-read interactions — single-row optimistic + "Mark all as read" header action | Mutation hook with optimistic update + rollback; header right button on screen | Tap row → row visual + badge update immediately; mark-all clears all; rollback works on RLS denial |
| **6** | i18n + copy review against IN-2026-05-17-01 | HE + EN keys for section headers, empty state, mark-all, a11y, per-type row titles/bodies; declarative-convention checklist | i18n parity check clean; declarative checklist passes for every key |
| **7** | Spec sync + tests + STATUS + INTEGRATION_LEARNINGS + PR | STATUS row per phase; `BUFF_FEATURE_AUDIT.md` adds new row for parent notification feed; `BUFF_GAP_ANALYSIS.md` row; surface PRD question to Adi (add a §X.X for the feed, OR mark "out of PRD scope"); INTEGRATION_LEARNINGS for surprises | PR opened, build green, regression on dashboard SOS surface passes, kid UI verified clean of feed |

---

## Exit Deliverables — SPEC_SYNC matrix

(Will move into `SPEC_SYNC.md` at Phase 0.)

| Phase | Canonical doc update | What changes |
|---|---|---|
| 0 | Session `STATUS.md`, `TESTS.md`, `SPEC_SYNC.md` | scaffolded |
| 1 | None (refactor only) | — |
| 2 | None (component + nav edit) | — |
| 3 | None (new screen + route) | — |
| 4 | None (new module) | — |
| 5 | None (mutation only) | — |
| 6 | `src/i18n/he.json`, `src/i18n/en.json` | section headers + per-type rows + empty state + a11y |
| 7 | `BUFF_FEATURE_AUDIT.md` (new row for parent notification feed) → ✅; `BUFF_GAP_ANALYSIS.md` corresponding row; **PRD decision surfaced to Adi**: add a §X.X (likely under §7 Features) for the unified notification feed, OR explicitly mark "out of PRD scope"; `STATUS.md` closeout; `INTEGRATION_LEARNINGS.md` if surprises | per row |

---

## Risks

- **Dashboard SOS surface regression** — the existing `useParentNotifications` consumer in `ParentDashboardScreen.tsx` is sensitive. Mitigation: Phase 1 includes a snapshot test of the hook's return shape; Phase 7 verification explicitly re-runs the dashboard SOS smoke test.
- **Existing-row volume** — ~396 rows exist in the buff-mobile DB (Lovable-era snapshot of buff-mobile's own data, not Lovable-Supabase content); some families may have hundreds. With 50-row initial fetch, that's only the recent slice. If a user reports "old notifications missing", v1.1 adds pagination. Mitigation: README + Phase 7 STATUS notes the constraint.
- **ParentTasks filter-by-child unsupported** — Phase 4 might find the existing ParentTasks screen doesn't accept a child_id filter param. Fallback: route to unfiltered ParentTasks. Adi-acceptable.
- **Quest screen doesn't exist** — `quest_milestone` route falls back to ParentDashboard. Re-evaluate when quest UI ships.
- **Realtime channel collision** — if both this hook and the sibling push Edge Function open Realtime channels for the same family, no conflict, but if a future refactor coalesces them, ensure the channel name stays stable (`parent-feed-${familyId}`).
- **i18n drift** — every new push type's copy must exist in BOTH the Edge Function's `copy.ts` (sister package) AND `src/i18n/he.json` here (for in-app row rendering). Phase 6 includes a parity check.
- **PRD spec drift** — this feature is NOT in PRD. Phase 7 forces Adi to decide: add a PRD section (likely under §7 Features as "Notification Feed — parent-side, unified-codebase surface"), or explicitly mark out-of-PRD. Either is fine; silent drift is not.
- **Pillar 3 vigilance** — every future row-component change must re-justify Pillar 3. Add a CONTRIBUTING note or PR template item for this in Phase 7.
- **`useParentNotifications` selector refactor risk** — if the dashboard's import surface changes (e.g., `getSosForChild` Map shape), every consumer breaks. Mitigation: keep the exact same return shape; only the internals change.

---

## Brief for the receiving session

Paste this as the first message when you spin up a new CC session for this package:

```
Plan Mode. You are picking up pkg/parent-notification-feed.

Read FIRST:
- CLAUDE.md
- docs/WORKFLOW.md
- docs/BUFF_VALUES.md (the 3 pillars + Values Check — Pillar 3 = highest
  risk surface in this package, surveillance / "ההורה ראה" patterns)
- docs/BUFF_PRD.md §2.2 (65% shared device — kid never logs in)
- docs/BUFF_FEATURE_AUDIT.md (P-08 View-as-Child is adjacent surface)
- docs/INTEGRATION_LEARNINGS.md IN-2026-05-17-01 (declarative copy
  convention), IN-2026-05-17-03 (3-package sequencing),
  **IN-2026-05-19-01** (FCM HTTP v1 as single backend — sibling
  package's work; informational), **IN-2026-05-19-02** (activity-based
  gating — sibling owns this, but feed renders ALL rows regardless)
- docs/sessions/parent-notification-feed/SPEC.md (this SPEC — read all,
  including all OQ-B1..B20 defaults; may override after Adi sign-off)
- docs/sessions/daily-vibe-check/SPEC.md § "Decisions Locked" (the
  template + the EX-1..EX-5 pattern for "Decisions added during execution")
- docs/sessions/daily-vibe-check/STATUS.md Phase 4b (the existing SOS
  surface you must NOT regress)
- src/hooks/useParentNotifications.ts (the existing hook — Phase 1 wraps
  this with a new generalized hook; preserve return shape)
- src/screens/parent/ParentDashboardScreen.tsx (the regression target —
  do NOT touch)
- src/navigation/ParentTabs.tsx (the navigator — Phase 2 adds headerRight)

Before proposing chunks:
- Verify `public.notifications` live schema (Supabase MCP list_tables)
  and confirm parent can UPDATE is_read via RLS policy (write a probe
  query as a test family parent).
- Verify whether ParentTasks supports filter-by-child param (Phase 4
  routing); if not, fall back to unfiltered routing.
- Check whether sister pkg/fcm-push-notifications has already shipped
  (it would have created migrations/012_device_tokens.sql AND the
  idempotent CREATE TABLE IF NOT EXISTS notifications migration). If
  yes, Phase 1 skips the table backfill. If no, Phase 1 includes it.

Branch off main as pkg/parent-notification-feed. No code until Adi
approves Phase 0. Chunk-by-chunk discipline per CLAUDE.md.

No new npm deps expected. If you find you need one, surface to Adi
(separate improvement package).

Hard product principles (NEVER PROPOSE):
- Anything that exposes is_read or feed state to the kid UI
- "ההורה ראה" / "Parent saw your SOS" indicators
- Login UX for child users
- Red badge / alarm-design styling on the bell
- Push notification integration (sister package owns push)
- Visually amplifying parent_sos rows beyond the type icon (Pillar 2)
- task_completed special icon / styling (deliberately equal-weight)

The sibling package pkg/fcm-push-notifications reads the SAME table.
DO NOT modify the Edge Function or trigger 011. If you find the
notifications table is missing from repo migrations and sister package
hasn't run, your Phase 1 emits the idempotent CREATE TABLE IF NOT
EXISTS — coordinate at Phase 0 plan to avoid double-emit if sister
ships in parallel.
```
