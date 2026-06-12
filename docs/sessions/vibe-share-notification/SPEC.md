# `pkg/vibe-share-notification` SPEC — refreshed for the push era

**Status:** `Phase 1a applied (migration 025) · D1–D8 locked · push unblocked (epic in main) · Phases 2–3 next`
**Slug:** `pkg/vibe-share-notification`
**Branch:** `pkg/vibe-share-notification` (rebuilt on current `origin/main` 2026-06-09 — the 2026-06-05 lineage was 133 behind)
**Drafted:** 2026-06-05 · **Refreshed:** 2026-06-09 (push decision + current-foundation reality)
**Source request (Adi, verbatim HE):** "רוצה להוסיף ארוע INFO על מצב הרוח של הילד שאינו SOS, כלומר שלא ירוד." + consent: **ביוזמת הילד (כמו SOS)**. Delivery decided 2026-06-09: **gentle push**.

---

## Context — why this exists, and why now

Today the **only** mood signal that reaches a parent is the **down/SOS** path: a child in Low
Power Mode taps SOS → `child_vibes.parent_sos_sent` flips → trigger `011` inserts a `parent_sos`
notification. Everything else about the daily Vibe Check is **private** by design.

Adi wants the **positive counterpart**: when a child is *not* down, they can **choose** to tell
their parent "I feel ___". It is the not-down sibling of SOS, **kid-initiated**, mirroring SOS's
consent model exactly.

**What changed since the original draft:** real push notifications shipped (now in `origin/main`
via PR #207 — `push-notification-fanout` + per-family preference toggles). The 2026-06-05 SPEC was
written for a feed-only world. **Adi's decision (2026-06-09): gentle push** — the value is the
real-time connection moment. A kid-initiated share that only surfaces in the bell two days later
(or ages out after 7) leaves the child's act of reaching out unanswered. A push here is **delivery
of a gift the child chose to give — not surveillance** (surveillance would be auto-reporting; this
is opt-in per share).

**Intended outcome:** a child who logs a good mood gets a gentle in-flow "tell {parent}?" step;
on opt-in, the parent gets a warm push *and* a bell row — the same emotional channel as SOS.

---

## Decisions locked (2026-06-09)

| # | Decision | Value |
|---|---|---|
| D1 | Consent model | **Kid-initiated**, per-share (mirrors SOS). Never auto. |
| D2 | Delivery | **Gentle push + in-app bell row.** |
| D3 | Push gate | Reuse the existing **"Alerts to me"** toggle (`notif_parent_alerts`) — same channel as SOS. Dedicated toggle = v1.1 option. |
| D4 | Placement | **Inside the Vibe Check flow** — a post-select step before the modal closes. |
| D5 | Which moods shareable | **Non-low only (`vibe_level ≥ 3`).** Low moods belong to the SOS path. |
| D6 | Reward for sharing | **None.** A BUFF would corrupt the intrinsic signal. |
| D7 | Frequency | **Once per day** — one flag per daily `child_vibes` row, idempotent like SOS. |
| D8 | Read receipts to kid | **None.** Kid never learns whether the parent saw it (Pillar 3 hard rule). |

**Still open — copy gate (Adi/Itay own, does not block Phase 1–3):**
- OQ-A: final kid-facing copy (body-double voice — drafts below).
- OQ-B: final parent push + bell copy (declarative, Pillar-2 — drafts below).
- OQ-C: INFO TTL — inherit bell's 7 days, or longer? Default: inherit 7d.

---

## Dependency & sequencing (current as of 2026-06-09)

| Dependency | State on `origin/main` | Implication |
|---|---|---|
| `notificationClass.ts` → `child_vibe_shared = INFO` | ✅ in main (`src/lib/notificationClass.ts:36`) | Feed classifies it correctly. No change. |
| Notification feed hook `useNotificationsFeed.ts` | ✅ generic in main | Renders new rows once schema + UI exist. No change. |
| `notifications` + `child_vibes` tables | ✅ shipped | Schema verified live; only a new boolean column on `child_vibes`. |
| **Push system** (`push-notification-fanout`, `notif_parent_alerts`, device tokens) | ✅ **in main (PR #207)** | **Phase 1b unblocked.** |
| Router / NotificationRow / i18n for `child_vibe_shared` | ❌ missing in main | This package wires them (Phase 3). |

**Build order:** 1a schema (✅ done) → 1b push wiring → 2 kid UI → 3 parent feed → 4 i18n/tests/PR.
The push dependency that previously blocked 1b is satisfied (epic already in main).

---

## The design is a structural copy of SOS

| Concern | SOS (exists) | Vibe-share (this package) |
|---|---|---|
| Column on `child_vibes` | `parent_sos_sent boolean` | **`vibe_shared_with_parent boolean`** (added by 025) |
| Kid action in `useDailyVibe` | `sendSos()` flips the flag | **`shareVibe()`** flips the new flag (exact mirror) |
| Kid UI | `SosButton` (low-power only) + confirm Alert | **in-flow affordance** in `VibeCheckScreen` (non-low only) + confirm |
| DB → notification | trigger `011` inserts `parent_sos` | **trigger `025`** (`handle_vibe_shared`) inserts `child_vibe_shared` |
| Trigger safety | SECURITY DEFINER + `NOT EXISTS` dedup | same (copied verbatim) |
| Parent in-app | `parent_sos` row (ACTION) | `child_vibe_shared` row (**INFO**) |
| Parent push | `parent_sos` → `notif_parent_alerts` | **`child_vibe_shared` → `notif_parent_alerts`** (same gate) |

---

## Phase 1a — schema + trigger (migration 025) ✅ APPLIED 2026-06-09

Canonical SQL: `migrations/025_vibe_shared_notification.sql` (verbatim copy of `011` + `entity_name`).

1. `ALTER TABLE public.child_vibes ADD COLUMN IF NOT EXISTS vibe_shared_with_parent boolean NOT NULL DEFAULT false;`
2. `handle_vibe_shared()` — `AFTER UPDATE OF vibe_shared_with_parent`, fires only on `false→true`.
   Inserts one `child_vibe_shared` row per parent, `entity_name = vibe_level::text`,
   `entity_id = child_vibes.id` (dedup key). SECURITY DEFINER + `NOT EXISTS` dedup.

**Verified (probe in a rolled-back transaction, vibe `f8a308ed`, level 5):** 3 flip events
(true→false→true) produced exactly **1** notification (dedup), `entity_name='5'`, 1 row per parent,
`child_name` resolved. Post-rollback: 0 persisted notifications, 0 rows left flagged, trigger live.
No existing-user impact (additive column, default false).

---

## Phase 1b — push wiring (in `push-notification-fanout/index.ts`)

Three edits in the Edge Function (per the live vc39 taxonomy):

```ts
// 1) recipient = parent → add to PARENT_RECIPIENT_TYPES
'child_vibe_shared',

// 2) gate it on the existing "Alerts to me" toggle → TYPE_TO_PREF_COLUMN
child_vibe_shared: 'notif_parent_alerts',

// 3) copyForType (HE + EN) — declarative, Pillar-2, warm not performative
case 'child_vibe_shared':
  return { title: t.vibeShareTitle(name), body: t.vibeShareBody(mood) };
```

Not in `SKIP_PUSH_TYPES`, so once recognized as a parent type it pushes by default — suppressed
only if `notif_parent_alerts = false` (or activity-suppression: recipient active < 5 min ago).
No new preference column (D3). **Deploy gated on Adi** (Edge Function change).

---

## Kid UX — the in-flow share affordance (D4)

`VibeCheckScreen` currently: kid taps a level → 180 ms feedback delay → `onSelect(level, type)` →
modal closes. Insert an **optional step between select and close**, only when `level ≥ 3` (D5):

- Gentle prompt → **[Share] / [Keep to myself]**.
- [Share] → `shareVibe()` (new action in `useDailyVibe`, mirroring `sendSos()`: optimistic flag
  flip → `UPDATE child_vibes SET vibe_shared_with_parent = true` → refetch on error).
- [Keep to myself] → modal closes, nothing leaves the device (private-by-default preserved).
- Idempotent: once shared today, the step doesn't re-offer (gate on `vibe_shared_with_parent`).

### Kid-facing copy — body-double voice (OQ-A, Adi/Itay refine — proposals only)
- Prompt: **"רוצה לספר ל{הורה} שאתה מרגיש ככה?"** / "Want to let {parent} know you're feeling this way?"
- Share: **"לשתף"** / "Share" · Keep private: **"להשאיר לעצמי"** / "Keep to myself"
- After share (calm): **"סיפרנו ל{הורה} 💛"** / "Told {parent} 💛"

---

## Parent-side rendering (feed)

- `src/lib/notificationRouter.ts` — add `child_vibe_shared` → `parent_dashboard` + scroll to child
  card (currently falls to `noop`).
- `src/components/parent/NotificationRow.tsx` — add icon (`happy-outline` / `heart-outline`,
  neutral color — Pillar 2) + body case.
- `entity_name` carries `vibe_level` as text; client maps level→word via a new i18n map
  (`vibeMood.3/4/5`) → row reads "{name} shared how they feel: {mood}".
- `src/i18n/en.json` + `he.json` — add `notificationFeed.row.child_vibe_shared`, `vibeMood.*`,
  the kid-flow strings, and the push copy. **Both languages or the row falls back ugly.**

### Parent-facing copy (OQ-B, declarative — proposals only)
- Bell row: **"{name} שיתף איך הוא מרגיש: {mood}"** / "{name} shared how they feel: {mood}"
- Push: **"{name} רצה לשתף אותך 💛"** / "{name} wanted to share with you 💛" + body = the mood word.

---

## Values Check — re-run for the **push** model

| Pillar | Q | Verdict |
|---|---|---|
| Intrinsic Motivation | want it w/o reward? | ✅ Connection, not a reward mechanic. **No BUFFs** (D6). |
| Intrinsic Motivation | "want to" vs "have to"? | ✅ Opt-in per share, never a duty. |
| Positive Coaching | no shame framing? | ✅ Non-low only (D5); never asked to broadcast a bad day. |
| Positive Coaching | no amplification/pressure? | ✅ Single gentle delivery, once/day cap (D7), warm copy, mutable via "Alerts to me" (D3). Not a streak, not a nag. |
| Independence-Building | kid has voice? | ✅ **Core.** Kid decides per-share whether the parent sees it. |
| Independence-Building | not surveillance? | ✅ Kid-initiated = delivering the kid's own message. No history/trends to parent. |

**Verdict: ✅ passes — contingent on D1/D5/D6/D7 + warm copy.** Copy is Adi's gate before ship.

---

## Non-goals (hard)

- ❌ Auto-sharing any vibe. ❌ Sharing low/SOS moods via this path. ❌ Any BUFF/reward.
- ❌ Parent reply / two-way thread (v1.1+). ❌ Read receipts to the kid. ❌ Mood history/trends to parent.
- ❌ Changing the SOS path or trigger `011`. ❌ A second push per day (once/day cap).

---

## Phased chunks

| # | Phase | Scope | State |
|---|---|---|---|
| **0** | Decisions | D1–D8 locked (2026-06-09) | ✅ passed |
| **1a** | Schema + trigger (migration 025) | column + `handle_vibe_shared` trigger; probe-verified | ✅ applied 2026-06-09 |
| **1b** | Push wiring | 3 edits in `push-notification-fanout`; deploy gated on Adi | _pending_ |
| **2** | Kid action + in-flow UI | `shareVibe()` + post-select step (≥3 only) + copy | _pending_ |
| **3** | Parent rendering | router + `NotificationRow` + `vibeMood` i18n (he/en) | _pending_ |
| **4** | i18n + Values + tests + PR | parity; Values re-verified; STATUS + RELEASE_QUEUE row; PR | _pending_ |

---

## Critical files

- **Schema:** `migrations/025_vibe_shared_notification.sql` (applied) · **template:** `migrations/011_parent_sos_notification_trigger.sql`
- **Kid action:** `src/hooks/useDailyVibe.ts` (`sendSos` → add `shareVibe`)
- **Kid UI:** `src/screens/child/VibeCheckScreen.tsx`; threshold `src/utils/vibeUtils.ts` (`computeLowPowerForLevel`, `level ≤ 2` = low)
- **Push:** `supabase/functions/push-notification-fanout/index.ts` (`PARENT_RECIPIENT_TYPES`, `TYPE_TO_PREF_COLUMN`, `copyForType`)
- **Parent feed:** `src/lib/notificationRouter.ts`, `src/components/parent/NotificationRow.tsx`
- **i18n:** `src/i18n/en.json`, `src/i18n/he.json`
- **Already correct (no change):** `src/lib/notificationClass.ts:36`, `src/hooks/useNotificationsFeed.ts`

---

## Verification

- **Trigger (1a):** ✅ done — see Phase 1a above (probe in rolled-back txn).
- **Push (1b):** insert a `child_vibe_shared` row → fanout logs show dispatch (not `pref_off` / `unknown_type`); `notif_parent_alerts=false` → `suppressed_reason=pref_off`. Real device confirms push (Hat-4 — emulator/web have no FCM).
- **Kid flow (2):** Expo web + emulator — level 5 → "tell parent?" appears; [Share] flips flag (verify DB); level 2 → step does NOT appear; re-open after sharing → step gone.
- **Parent feed (3):** bell shows "{name} shared how they feel: {mood}", correct icon, ages out at 7 days; tap routes to child card + marks read.
- **Values (4):** against *built* behavior — no read receipt; no BUFF; copy warm/declarative.
- **Hat-4 (Adi, real device):** push arrives + reads warmly; kid flow feels optional, not a duty.

---

## Risks

- **Pillar-2 drift** — any later default-on / nagging / streaks breaks the Values Check. Guard in PR template.
- **Copy gate** — don't ship placeholder kid or push copy; Adi (ideally Itay/Emi) signs off.
- **i18n parity** — missing `vibeMood.*` / row key in either language = ugly fallback. Phase-4 parity check.
- **Double-emit** — trigger `025` keeps `011`'s `NOT EXISTS` dedup (verified in 1a probe).
- **Parallel-branch hygiene** — migration numbers collide across the many parallel packages; 025 took the next free slot above main's max (024). Re-check at PR time.

---

## Decisions added during execution

- **2026-06-09:** migration renumbered 019 → **025** (main max 024; 019/021 already collided). Branch rebuilt on current `origin/main` (old lineage 133 behind). Push dependency found already satisfied (notifications epic in main via PR #207) → Phase 1b unblocked.
