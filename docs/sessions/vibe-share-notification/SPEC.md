# `pkg/vibe-share-notification` SPEC

**Status:** `draft — awaiting Adi review; schema + kid UI NOT yet applied`
**Slug:** `pkg/vibe-share-notification`
**Branch:** `pkg/vibe-share-notification` (off `pkg/notification-bell-show-new`)
**Parent package:** `pkg/notification-bell-show-new` (must merge first — provides the `child_vibe_shared → INFO` classification + feed lifecycle)
**Target release:** TBD (after bell package)
**Drafted:** 2026-06-05 by Claude Code (acting PM)
**Source request (Adi, verbatim HE):** "רוצה להוסיף ארוע INFO על מצב הרוח של הילד שאינו SOS, כלומר שלא ירוד. הילד שלך אמר שמרגיש...משהו כזה." + consent model decided: **ביוזמת הילד (כמו SOS)**.

---

## Why this exists

Today the only mood signal that reaches the parent is the **down / SOS** path: when the child is in Low Power Mode they may tap the SOS button, which flips `child_vibes.parent_sos_sent` and (via trigger `011`) inserts a `parent_sos` notification. Everything else about the daily Vibe Check is **private** — the child picks a mood (1–5), it's recorded, and the parent never sees it.

Adi wants a **positive/neutral counterpart**: when the child is *not* down, they can **choose** to share "I feel ___" with their parent — "your child said they feel…". This is the not-down sibling of SOS.

**The whole value depends on it being kid-initiated** (Adi-decided). It mirrors SOS's consent model exactly: the child opts in per-share. No opt-in = stays private. This is what keeps the Vibe Check a trusted, private body-double moment (Pillar 3) rather than a surveillance feed.

---

## How it mirrors the existing SOS pattern (the design is a copy)

| Concern | SOS (exists) | Vibe-share (this package) |
|---|---|---|
| Column on `child_vibes` | `parent_sos_sent boolean` | **`vibe_shared_with_parent boolean`** (new) |
| Kid action | `sendSos()` flips the flag | **`shareVibe()`** flips the new flag |
| Kid UI | `SosButton` (low-power only) + confirm Alert | **share affordance** (non-low only) + confirm |
| DB → notification | trigger `011` inserts `parent_sos` | **trigger `019`** inserts `child_vibe_shared` |
| Trigger safety | SECURITY DEFINER + NOT EXISTS dedup | same (copied) |
| Parent surface | `parent_sos` row (ACTION) | `child_vibe_shared` row (**INFO**) |

Because it's a structural copy of a shipped, tested pattern, the implementation risk is low. The **product** decisions (where the kid taps, what the copy says) are the real work — flagged below.

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| `pkg/notification-bell-show-new` | ✅ committed (this session) | Provides `notificationClass.ts` with `child_vibe_shared → INFO` + the feed lifecycle. **Merge bell first.** |
| `child_vibes` table | ✅ shipped | Schema: `id, family_id, child_id, date (TEXT), vibe_level (1-5), vibe_type, low_power_mode, parent_sos_sent`. This package adds one nullable boolean column. |
| `useDailyVibe` hook | ✅ shipped | Add a `shareVibe()` action (mirrors `sendSos()`). |
| `VibeCheckScreen` | ✅ shipped | The kid mood picker modal — candidate host for the share affordance (OQ-V1). |
| trigger `011` pattern | ✅ shipped | Template for trigger `019` (SECURITY DEFINER, NOT EXISTS dedup). |
| `notifications` table | ✅ shipped | No schema change; new row `type='child_vibe_shared'`, mood carried in `entity_name`. |
| `notificationRouter` / `NotificationRow` | ✅ shipped | Add `child_vibe_shared` case (icon + row copy + route). |

---

## Goal

After this merges:
- A child who completes a Vibe Check at a **non-low** level (3–5, OQ-V2) sees an optional "share with my parent" affordance. Tapping it (with a light confirm) flips `vibe_shared_with_parent` on today's row.
- Trigger `019` inserts one `child_vibe_shared` notification per parent, carrying the mood.
- The parent's bell shows an **INFO** row: "{name} shared how they feel: {mood}" — which ages out after 7 days (bell package lifecycle).
- No share = nothing leaves the child's device. The Vibe Check stays private by default.
- Kid never sees `is_read` / whether the parent saw it (Pillar 3, unchanged).

---

## Values Check

Highest-risk pillar here is **Pillar 3** (kid voice / no surveillance). The kid-initiated model is what passes it.

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1 — kid want it without virtual reward? | ✅ Sharing a good mood with a parent is intrinsically motivated connection. **No BUFFs / reward attached** (OQ-V5 — deliberately no currency, or it becomes "perform happiness for points"). |
| Intrinsic Motivation | 2 — closer to kid's chosen real reward? | ➖ Neutral. Not a reward mechanic. |
| Intrinsic Motivation | 3 — "I want to" vs "I have to"? | ✅ Purely opt-in, per-share. Never prompted as a duty. |
| Positive Coaching | 1 — no shame / failure framing? | ✅ Only non-low moods can be shared (OQ-V2); the kid is never asked to broadcast a bad day. Copy is warm, not performative. |
| Positive Coaching | 2 — empathy if child fails? | ✅ N/A — there is no failure path; not sharing is a first-class, silent choice. |
| Positive Coaching | 3 — no suffering mechanic? | ✅ No buddy reaction tied to sharing/not-sharing. |
| Independence-Building | 1 — more capable without app? | ✅ Practices a real-world skill: naming a feeling and choosing to share it. |
| Independence-Building | 2 — kid has voice? | ✅ **This is the core.** The kid decides, per-share, whether the parent sees their mood. Mirrors SOS consent. No auto-report. |
| Independence-Building | 3 — in 6 months still needed? | ✅ Low-frequency, opt-in. If it ever feels like a chore, kids simply stop tapping it — self-limiting. |

**Values Check: ✅ all 9 pass — contingent on kid-initiated + non-low-only + no-reward (OQ-V1/V2/V5).** Flip any of those and re-run.

---

## Non-goals

- ❌ **Auto-sharing any vibe.** Kid-initiated only (Adi-decided). Hard non-goal.
- ❌ **Sharing low / SOS moods through this path.** That's the SOS path's job; this is the not-down counterpart.
- ❌ **Any BUFF / reward for sharing.** Would corrupt the intrinsic signal (OQ-V5).
- ❌ **Parent reply / two-way thread.** INFO is one-way FYI; a reply thread is a much bigger feature. v1.1+.
- ❌ **Read receipts to the kid** ("your parent saw it"). Pillar-3 hard rule.
- ❌ **Mood history / trends for the parent.** Surveillance risk. Out of scope.
- ❌ **Changing the SOS path** or trigger `011`.

---

## Schema Change (proposed — NOT applied)

Full SQL in [`migration.sql`](./migration.sql). Summary:

1. **`ALTER TABLE child_vibes ADD COLUMN vibe_shared_with_parent boolean NOT NULL DEFAULT false;`**
   - Nullable-safe via `DEFAULT false`. **Existing-user impact: none** — every existing row gets `false` (not shared), which is the correct historical default. No backfill, no behavior change for old rows.
2. **Trigger `019`** `handle_vibe_shared()` — fires `AFTER UPDATE OF vibe_shared_with_parent ON child_vibes`, only on `false→true`. Inserts one `child_vibe_shared` notification per parent in the family, `entity_name = vibe_level::text` (the mood, mapped to a word client-side), `is_read=false`. SECURITY DEFINER + NOT EXISTS dedup — **direct copy of trigger `011`**.

**Apply gate:** per the schema-change protocol this is raised to Adi as a proactive decision before `apply_migration` runs (even though buff-mobile's DB has no production users and the impact is nil). Migration is written and ready; **not yet executed.**

---

## Kid UX — the share affordance (NEEDS ADI)

Mirrors `SosButton`'s consent shape (tap → confirm → flip). Two placement options:

- **OQ-V1a (recommended): inside the Vibe Check flow.** After the kid picks a non-low level, before the modal closes, show a gentle "Want to tell [parent] you're feeling good?" with [Share] / [Keep private]. Ties the choice to the moment of reflection; one clean flow. Requires a small change to `VibeCheckScreen`'s post-select step.
- **OQ-V1b: a dashboard button** (like SosButton but for non-low states), shown after vibing. More symmetric with SOS, but adds a persistent UI element to the kid dashboard.

**Recommendation: V1a** — contextual, lighter, doesn't add standing dashboard chrome. MEDIUM confidence; this is a UX call for Adi (and possibly Itay/Emi as persona testers).

### Kid-facing copy — body-double voice (NEEDS ADI, copy gate)

Per `feedback_kid_microcopy_pillar1`, kid copy must be warm, never transactional. Draft proposals (Adi/Itay to refine):
- Prompt: **"רוצה לספר ל{הורה} שאתה מרגיש ככה?"** / "Want to let {parent} know you're feeling this way?"
- Share button: **"לשתף"** / "Share"
- Keep-private: **"להשאיר לעצמי"** / "Keep to myself"
- After share (confirmation, calm): **"סיפרנו ל{הורה} 💛"** / "Told {parent} 💛"

These are **proposals only** — user-facing copy is Adi's gate.

---

## Parent-side rendering (low-risk, in scope)

- `NotificationRow`: add `child_vibe_shared` case → icon `happy-outline` (or `heart-outline`), neutral color (no amplification, Pillar 2).
- Row copy (parent-facing): **"{name} shared how they feel: {mood}"** — already proposed; `{mood}` resolved client-side from `entity_name` (the vibe_level) via a level→word i18n map (OQ-V3).
- `notificationRouter`: `child_vibe_shared` → `parent_dashboard` + child card (consistent with other kid-signal types). Tapping marks read (INFO → disappears).
- `notificationClass.ts`: already lists `child_vibe_shared → INFO` (shipped in bell package). No change.

---

## CC defaults / open decisions (Adi reviews)

| ID | Question | CC proposal | Confidence |
|---|---|---|---|
| **OQ-V1** | Where the kid shares | **V1a — inside the Vibe Check flow** (post-select step) | MEDIUM — UX call for Adi/Itay |
| **OQ-V2** | Which levels can be shared | **Non-low only (vibe_level ≥ 3)** | MEDIUM-HIGH — low moods belong to the SOS path, not a "broadcast" |
| **OQ-V3** | How the mood reaches the parent row | Trigger writes `entity_name = vibe_level::text`; client maps level→word via i18n (`vibeMood.3/4/5`) | MEDIUM — keeps mood words translatable client-side |
| **OQ-V4** | INFO TTL for this type | Inherit bell's 7 days. **Consider longer/none** since it's a kid-initiated connection moment a parent shouldn't miss | MEDIUM — flagged in bell package too |
| **OQ-V5** | Any BUFF/reward for sharing | **None** — would corrupt intrinsic motivation (Values Check depends on this) | HIGH |
| **OQ-V6** | Kid copy (body-double voice) | Drafts above — Adi/Itay refine | LOW — copy gate, Adi owns |
| **OQ-V7** | Once-per-day or re-shareable | **Once per day** (one flag per daily row; idempotent like SOS) | MEDIUM-HIGH |
| **OQ-V8** | Apply the migration now or after bell merges | **After bell merges** (dependency order) + explicit apply gate | HIGH |

---

## Proposed Phased Chunks

| # | Phase | Scope | Exit criteria |
|---|---|---|---|
| **0** | Foundation + decisions | Adi locks OQ-V1..V8 (esp. UX placement + kid copy). No code | Decisions locked; migration reviewed |
| **1** | Schema + trigger | Apply `migration.sql` (column + trigger `019`) to mobile DB after explicit gate; verify with a probe UPDATE | Column exists; flip false→true inserts one `child_vibe_shared` row per parent; dedup holds |
| **2** | Kid action + UI | `useDailyVibe.shareVibe()`; share affordance (OQ-V1) + kid copy; confirm + idempotent + optimistic | Kid can share a non-low vibe; flag flips; cannot double-share; private-by-default preserved |
| **3** | Parent rendering | `NotificationRow` + `notificationRouter` + level→mood i18n; parent sees INFO row, mood shown, ages out per bell lifecycle | Parent bell renders "{name} shared how they feel: {mood}"; INFO 7-day expiry works |
| **4** | i18n + Values + tests + PR | he/en for kid + parent copy; Values Check re-verified; STATUS + INTEGRATION_LEARNINGS + RELEASE_QUEUE; PR | Build green; kid private-by-default verified; no read-receipt leak to kid |

---

## Risks

- **Pillar-3 drift** — any future change that makes sharing default-on or adds nagging breaks the Values Check. Guard in PR template.
- **Copy gate** — kid-facing copy must pass Adi (and ideally Itay/Emi). Don't ship placeholder copy.
- **Mood label i18n** — level→word mapping must exist in both he/en; missing key = ugly fallback. Phase 4 parity check.
- **Schema apply order** — bell package must merge first (provides the INFO classification). Applying the migration before bell merges would emit rows the feed doesn't yet classify correctly. OQ-V8 gates this.
- **Double-emit** — trigger `019` must copy `011`'s NOT EXISTS dedup, or a re-flip inserts duplicates.

---

## Brief for the receiving session

```
Plan Mode. You are picking up pkg/vibe-share-notification.
DEPENDS ON pkg/notification-bell-show-new (merge that first).

Read FIRST:
- CLAUDE.md, docs/WORKFLOW.md, docs/BUFF_VALUES.md (Pillar 3 = the gate)
- docs/sessions/vibe-share-notification/SPEC.md (this — OQ-V1..V8)
- docs/sessions/vibe-share-notification/migration.sql (proposed, not applied)
- docs/sessions/notification-bell-show-new/SPEC.md (the INFO lifecycle)
- migrations/011_parent_sos_notification_trigger.sql (the trigger template to copy)
- src/hooks/useDailyVibe.ts (add shareVibe(), mirror sendSos())
- src/components/SosButton.tsx (the kid-initiated consent pattern)
- src/screens/child/VibeCheckScreen.tsx (host for the share affordance)
- src/lib/notificationClass.ts (already classifies child_vibe_shared=INFO)

Hard product principles (NEVER PROPOSE):
- Auto-sharing any vibe (kid-initiated only)
- Sharing low/SOS moods through this path
- Any BUFF/reward for sharing
- Read receipts to the kid
- Mood history/trends for the parent

Schema: apply migration.sql ONLY after an explicit gate with Adi AND
after bell package merges. Trigger 019 must copy 011's SECURITY DEFINER
+ NOT EXISTS dedup. No code until Adi locks OQ-V1..V8.
```

---

## Decisions added during execution

(Empty; populated during implementation.)
