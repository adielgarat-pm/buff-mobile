# Track 8 — `pkg/daily-vibe-check` SPEC

**Status:** `draft — awaiting Adi review; ready to spawn a CC session once approved`
**Slug:** `pkg/daily-vibe-check`
**Branch:** `pkg/daily-vibe-check` (off `main`)
**Unblocks regression flow:** #9 (Vibe Check + Low Power Mode)
**Source spec:** `BUFF_PRD.md §7.1` (S-07), `BUFF_GAP_ANALYSIS.md §חלק ו'` row S-07
**Drafted:** 2026-05-16 by CC on `claude/busy-euclid-e43458`

---

## Why this exists

Vibe Check is **MVP critical** per PRD §7.1 and GAP S-07 — but it's not yet implemented in code. It's the daily emotional pulse mechanism that gates Low Power Mode, which is the daily-disruption pressure-release valve. Without it, ADHD kids on bad days face the same overwhelming task list as good days — exactly the failure mode the PRD is built to prevent.

This is also the most distinctive non-Joon mechanic alongside Pause Mode. It directly serves Pillar 2 (Positive Coaching — meet the kid where they are).

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| `child_vibes` table | ✅ exists in DB (per PRD §9.2 preserved schema) | Need to verify exact columns via Supabase MCP at Phase 0 |
| `useChildData` / dashboard load path | ✅ shipped | Vibe Check gate inserts at app-open / start-of-day |
| `useAppSettings` (for Pause check) | ✅ shipped | Vibe Check should NOT fire if Pause is on |
| Low Power Mode logic | 🟡 partial | "Reduced task list" concept exists in spec; need to verify if any code path already gates by vibe score |

---

## Goal

Implement the once-per-day Vibe Check prompt + Low Power Mode gating.

After this merges:
- First app open of a calendar day → Vibe Check prompt fires before showing the dashboard
- Pastel mode: 5 emoji faces (😴 😔 😐 🙂 ⚡); Gamer mode: 5 energy bars
- Selection saves to `child_vibes`
- Score ≤2 → Low Power Mode activates for the day: reduced task list, SOS button, Instant Buff option
- Score ≥3 → normal flow continues
- Pause Mode active → Vibe Check is skipped entirely

---

## Values Check

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1 — child wants this? | ✅ Vibe Check *honors* the kid's state. The kid rating "low energy" causes the app to show *less*, not push more. This is the opposite of extrinsic pressure. |
| Intrinsic Motivation | 2 — closer to a real reward? | ✅ Instant Buff (+5 BUFFs for self-care) is small but real currency toward the kid's chosen real-world reward. |
| Intrinsic Motivation | 3 — "I want to" not "I have to"? | 🟡 The prompt fires unprompted. Mitigation: kid can dismiss without rating (defaults to "no rating" → normal flow). See OQ3. |
| Positive Coaching | 1 — no shame / failure framing? | ✅ "Low energy" is acknowledged, never penalized. No "you missed yesterday's check" guilt. |
| Positive Coaching | 2 — empathy if child fails? | ✅ The whole feature IS empathy. Low score → less load. |
| Positive Coaching | 3 — no suffering mechanic? | ✅ BUDDY doesn't react to vibe score. No sad-buddy on low-energy days. |
| Independence-Building | 1 — more capable without app? | ✅ Teaches metacognition: "How am I feeling? What can I realistically do today?" — durable skill. |
| Independence-Building | 2 — child has voice? | ✅ The Vibe Check IS the voice. The kid tells the app what kind of day this is. |
| Independence-Building | 3 — in 6 months still needed? | 🟡 Possibly graduates to less-frequent (weekly) prompt for older teens. Not blocking. |

**Values Check: ✅ all 9 pass.**

---

## Goals

1. **Detect first-open-of-day** for a child user — fire Vibe Check prompt before dashboard render
2. **Prompt UI** — emoji faces (Pastel) or energy bars (Gamer); 5 levels; tap to select
3. **Save selection** to `child_vibes` (`child_id`, `vibe_score`, `recorded_at`)
4. **Low Power Mode** activation logic — `vibe_score ≤ 2` → reduce task list for the day + show SOS + show Instant Buff
5. **SOS button** — sends a notification to the parent: "[Kid] is having a tough morning"
6. **Instant Buff** — single-tap +5 BUFFs, tied to a self-care prompt (drink water / take 5 deep breaths)
7. **Pause Mode interaction** — Vibe Check is skipped when Pause is active
8. **Hebrew + English** i18n for all new strings, brand-voice from `BUFF_BRAND.md` (no failure framing)

## Non-goals

- ❌ Adult / parent-facing Vibe Check — kids only
- ❌ Weekly Vibe Check summary for parent — Phase 2
- ❌ ML / pattern detection on vibe history — out of scope
- ❌ "Pre-fill yesterday's vibe" suggestion — too presumptive
- ❌ Anything ML / sentiment / AI — pure direct rating
- ❌ Animation polish — static UI first
- ❌ Custom emojis / brand-specific icons — system emojis are fine for v1

---

## Behavior Contract

**Scenario A: Kid opens app first time today**
1. App detects: `last_vibe_check.recorded_at` is before today's local midnight
2. Pre-dashboard modal renders — full-screen takeover (NOT a small banner)
3. Kid taps a face/bar (1-5) → saves to `child_vibes`, modal dismisses
4. Score ≥3: normal dashboard renders with full task list
5. Score ≤2: dashboard renders in Low Power Mode

**Scenario B: Kid already did Vibe Check today**
- No prompt. Normal dashboard.

**Scenario C: Pause Mode is active**
- No prompt. Normal Pause UI flow (banner + resting buddy if applicable).

**Scenario D: Kid dismisses without rating** (see OQ3)
- Treat as `score = null` → normal flow proceeds. **Do not** keep re-prompting.

**Scenario E: Low Power Mode active**
- Task list trims to: highest-priority pain-target task + 1 self-care task max (instead of 3-5 normal)
- "SOS" button visible in header — tap → confirmation → notification to parent
- "Instant Buff" floating button visible — tap → small self-care card ("Drink water!" / "Take 3 deep breaths") + +5 BUFFs awarded
- Visual: subtle softer treatment (less saturation? smaller font? — see OQ2)

---

## Schema Changes

**Existing table `child_vibes`** — need to verify columns at Phase 0 via Supabase MCP. Expected:
- `id` (uuid pk)
- `child_id` (fk to profiles)
- `vibe_score` (int 1-5)
- `recorded_at` (timestamptz)
- Possibly: `feeling_label` (text — emoji or word — TBD if exists)

**Potential additions (if not already present):**
- Index on `(child_id, recorded_at DESC)` for fast "last vibe today" check — receiving session decides
- No new tables, no new columns expected (existing table is sufficient if schema matches)

**RLS:** verify child can INSERT their own vibe, parent can SELECT family kids' vibes. Should be in place from prior schema; receiving session verifies.

---

## Files Likely Touched

- `src/screens/child/VibeCheckScreen.tsx` — **new file** (full-screen prompt)
- `src/components/VibeFaces.tsx` (Pastel) and `src/components/VibeBars.tsx` (Gamer) — **new components**
- `src/hooks/useDailyVibe.ts` — **new hook** (check + insert + low-power computation)
- `src/contexts/LowPowerContext.tsx` — **new context** (whether the day is in Low Power)
- `src/screens/child/ChildDashboardScreen.tsx` AND `GamerDashboardScreen.tsx` — modified to:
  - Check `useDailyVibe.shouldPrompt` at mount → present VibeCheckScreen modally
  - Read `useLowPowerMode().isActive` for task list trimming + SOS + Instant Buff buttons
- `src/hooks/useChildTasks.ts` (or equivalent) — extended to support Low Power filtering
- New i18n keys: `vibeCheck.*`, `lowPower.*` (EN + HE)

---

## Open Questions for Adi

### OQ1 — When does "today's vibe" reset?

- **(a)** Local midnight (kid's device timezone) — feels right but DST edge cases
- **(b)** Fixed 04:00 local (so a kid up at 23:55 doesn't get prompted twice in 5 min)
- **(c)** "First app open after >12 hours from last check" — sliding window

**CC recommendation:** (a) — simplest, most predictable. DST is once a year and the kid will just get an off-by-one check that day. Acceptable.

### OQ2 — Low Power visual treatment

What should "Low Power Mode" look like beyond fewer tasks + extra buttons?

- **(a)** Same UI, just fewer tasks — minimal disruption
- **(b)** Softer color treatment (lower saturation), smaller heading — telegraphs "low energy day"
- **(c)** A header banner: "Today's a low-power day. We've got you." — explicit

**CC recommendation:** (a) + (c) — keep the UI feel intact (no shame implication from "broken" look), but explicitly acknowledge with a calm banner.

### OQ3 — Dismiss-without-rating behavior

What happens if kid taps outside the modal or hits back without selecting?

- **(a)** Dismiss, treat as `score = null`, no re-prompt today (normal flow proceeds)
- **(b)** Re-prompt on next screen change until rated
- **(c)** Force selection — can't dismiss without choosing

**CC recommendation:** (a) — respects kid autonomy (Pillar 3). Kids who hate the prompt one day can just dismiss; data is missing for that day, not a problem.

### OQ4 — SOS notification copy

Parent gets: "[Kid name] is having a tough morning" — does the parent know it was triggered by Vibe Check, or kept abstract?

- **(a)** Abstract: "[Kid] needs a moment" — doesn't reveal the mechanic, lets parent investigate. **(LATER REFINED 2026-05-17, see EX-1 below: replaced by declarative "wanted to share — low energy today" after research review.)**
- **(b)** Specific: "[Kid] rated their morning a 1/5 and pressed SOS" — informative
- **(c)** Per parent preference setting

**CC recommendation:** (a) for v1 — preserves kid's autonomy / dignity. Parent investigation is the value (not the data).

### OQ5 — Instant Buff prompt content

What does the self-care card actually say?

- **CC defaults (EN):** "Drink water 🚰" / "5 deep breaths 🌬️" / "Stretch for 30 seconds 🤸"
- **CC defaults (HE):** "תשתה/תשתי מים 🚰" / "5 נשימות עמוקות 🌬️" / "תתמתח/י 30 שניות 🤸"

Are these correct in voice? Should there be more variety?

**CC recommendation:** Start with 3 rotating. Add more in a Phase 2 polish.

### OQ6 — Pastel emoji selection

The faces — emoji unicode or custom icons?

- **(a)** System emoji: 😴 😔 😐 🙂 ⚡ — free, RTL-safe, no asset work
- **(b)** Custom illustration set — design work + bundling

**CC recommendation:** (a) — system emojis ship faster, look fine, scale with device. Custom illustrations are post-MVP polish.

### OQ7 — Gamer energy bar interaction

Bars 1-5 vertical or horizontal?

- **(a)** Horizontal row of 5 bars, tap any to select (1=leftmost, 5=rightmost). Lime-bolt color for selected.
- **(b)** Vertical (like a battery meter) — tap fills up to that level
- **(c)** Slider — drag from 1 to 5

**CC recommendation:** (a) — 5 discrete bars, single-tap, no drag accuracy issues for kids.

---

## Proposed Phased Chunks

The receiving CC session will refine, but rough shape:

- **Phase 0** — Session folder + SPEC, Values Check, Supabase MCP schema verification of `child_vibes` table
- **Phase 1** — `useDailyVibe` hook + first-open-of-day detection + `child_vibes` insert path (no UI yet, verify via dev menu)
- **Phase 2** — `VibeCheckScreen` UI for both Pastel + Gamer themes; modal presentation logic
- **Phase 3** — Low Power Mode: `LowPowerContext` + task list filtering + SOS button + Instant Buff button
- **Phase 4** — SOS notification to parent (uses existing notification path)
- **Phase 5** — i18n + regression: re-run TRACK_6 flow #9

---

## Exit Deliverables — SPEC_SYNC matrix

| Phase | Canonical doc update | What changes |
|---|---|---|
| 0 | Session `STATUS.md` | open + chunk plan |
| 1 | Session `SPEC.md` | Confirmed schema columns |
| 2 | `BUFF_GAP_ANALYSIS.md` | Row S-07 `Daily Vibe Check` → 🟡 partial |
| 3 | `BUFF_GAP_ANALYSIS.md` | Row S-07 → ✅ |
| 4 | `BUFF_PRD.md §8.1` | Note: Low Power Mode = Days 1-3 retention mechanic (link added) |
| 5 | `STATUS.md` + `INTEGRATION_LEARNINGS.md` | Closeout + any surprises |

---

## Risks

- **First-open-of-day detection edge cases:**
  - Kid loaded app overnight → counted as "yesterday's open" or "today's"? Resolved by OQ1 answer
  - Device offline at midnight transition → vibe save fails silently? Receiving session must add retry / queue logic
- **Modal vs full-screen tradeoff:** A full-screen prompt is heavier than a small banner. Kid may dismiss perceived friction. Mitigation: OQ3 (a) lets them dismiss without rating.
- **Low Power Mode = task list shrinks:** Parent might be confused why their kid sees fewer tasks today. Mitigation: SOS notification (OQ4 (a)) gives parent enough signal without exposing the mechanic.
- **No native push (yet):** SOS goes through whatever notification path currently exists. If push is missing for v1, parent only sees SOS next time they open the app — acceptable.

---

## Brief for the receiving session

Paste this as the first message when you spin up a new CC session for this package:

```
Plan Mode. You are picking up pkg/daily-vibe-check.

Read FIRST:
- CLAUDE.md
- docs/WORKFLOW.md
- docs/BUFF_VALUES.md (the 3 pillars + Values Check)
- docs/BUFF_PRD.md §7.1 (S-07 spec — emoji faces Pastel, energy bars Gamer)
- docs/BUFF_GAP_ANALYSIS.md §חלק ו' (S-07 row + dependencies)
- docs/sessions/beta-2026-06-01/TRACK_8_daily_vibe_check_SPEC.md
  (this is your SPEC source — read all of it including 7 Open Questions)
- src/screens/child/ChildDashboardScreen.tsx + GamerDashboardScreen.tsx
  (where the prompt insertion point lives)
- src/hooks/useAppSettings.ts (Pause mode pattern — mirror it)

Before proposing chunks:
- Use Supabase MCP list_tables / get table schema to verify the exact
  child_vibes columns. The PRD says it's preserved but verify before
  building INSERT path.
- Surface OQ1-7 to Adi for her decisions.

Branch off main as pkg/daily-vibe-check. No code until Adi approves
Phase 0. Chunk-by-chunk discipline per CLAUDE.md. No new native deps
expected — pure JS/RN. If you find you need one, run the web compat
check per F-2026-05-14-01 before installing.
```

---

## Schema Verified (2026-05-16 via Supabase MCP `list_tables`)

The original "Schema Changes" section above predicted columns `vibe_score`, `recorded_at`. Verification against `public.child_vibes` (4 rows, RLS enabled) found different and richer columns. **The receiving session must use the actual schema below, not the predicted one.**

| Column | Type | Default / Check | Notes |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | |
| `child_id` | `uuid` | fk → `profiles.id` | Not nullable |
| `family_id` | `uuid` | fk → `families.id` | Not nullable — must be supplied on insert |
| `date` | **`text`** | — | Matches existing `daily_progress.date` convention: `YYYY-MM-DD` from `new Date().toISOString().split('T')[0]` (see `useChildProgress.ts:25`) |
| `vibe_level` | `int4` | `CHECK (vibe_level BETWEEN 1 AND 5)` | **Named `vibe_level`, not `vibe_score`.** |
| `vibe_type` | `text` | default `'emoji'` | Use `'emoji'` for Pastel, `'bars'` for Gamer |
| `low_power_mode` | `bool` | default `false` | **Persisted column** — set on insert based on level |
| `parent_sos_sent` | `bool` | default `false` | **Persisted SOS flag** — UPDATE to true when child taps SOS |
| `created_at` | `timestamptz` | default `now()` | **No `recorded_at` column.** Use `created_at` for audit only; "first open today" check uses the `date` text column. |

**RLS:** in place (`rls_enabled: true`). Receiving session verifies child can INSERT own vibe and parent can SELECT family kids' vibes before relying on it.

**No schema migration is required.** Phase 0 closed this question definitively.

---

## Decisions Locked (Phase 0 commit, 2026-05-16)

These supersede the "Open Questions for Adi" section above. Open Questions remain in the SPEC as historical record of what was considered.

### CC defaults applied (Adi may override at any phase plan review)

| Q | Decision | Rationale |
|---|---|---|
| **NEW-1** | Spec-sync PRD §7.1 line 215 at Phase 5 closeout. | PRD currently says Vibe Check is "Already fully implemented in current codebase" — grep proves false. Same-commit fix avoids leaving drift behind. INTEGRATION_LEARNINGS gets a drift entry. |
| **NEW-2** | Persist `low_power_mode` on INSERT (= `vibe_level <= 2`); UPDATE `parent_sos_sent = true` when SOS pressed. | Row is source of truth. Parent dashboard can query `WHERE date = today AND parent_sos_sent = true` trivially. Avoids re-deriving on every read. Legacy 4 rows left as-is (no back-population). |
| **OQ1** | "Today" = `date` text column, computed via existing `getTodayKey()` = UTC `YYYY-MM-DD`. | Matches existing `daily_progress.date` convention. No timezone math. DST edge once a year is acceptable. (Existing UTC convention logged as a follow-up risk in INTEGRATION_LEARNINGS, but not fixed in this package.) |
| **OQ2** | Low Power Mode: same UI + fewer tasks + calm banner "Today's a low-power day. We've got you." | No saturation/style downgrade — avoids shame-by-design ("broken" look). Banner explicitly acknowledges. |
| **OQ3** | Dismiss-without-rating: no row, no re-prompt today, normal flow proceeds. | Pillar 3 (Independence-Building) — kid has voice, including the voice to skip. |
| **OQ4** | SOS parent copy: declarative + connection-not-rescue — *"{{name}} wanted to share — low energy today"* (i18n keyed). HE: *"{{name}} רצה/רצתה לשתף — יום של אנרגיה נמוכה"*. **Refined 2026-05-17** after ADHD therapist research (declarative "I noticed" framing > directive; connection-not-rescue). Original *"[Kid] needs a moment"* dropped — too directive, pushed parent into rescuer mode. | Preserves kid emotional privacy + agency (kid CHOSE to share). Parent absorbs info, doesn't get scripted into action. |
| **OQ5** | Instant Buff: 3 rotating cards. EN: "Drink water 🚰" / "5 deep breaths 🌬️" / "Stretch 30 sec 🤸". HE equivalents. +5 BUFFs to `credit_vault.total_balance`. | Concrete, doable, kid-friendly. More variety = Phase 2 polish. |
| **OQ6** | Pastel: system emoji — 😴 😔 😐 🙂 ⚡. | Ships fastest, RTL-safe, scales with device. Custom illustration set = post-MVP. |
| **OQ7** | Gamer: 5 horizontal discrete bars, single-tap selection, lime fill. | Discrete > slider for kid touch accuracy. |

**If Adi disagrees with any default during a phase plan review, the SPEC row gets updated in the same commit that implements the alternative — no silent drift.**

### Decisions added during execution (2026-05-17)

| ID | Decision | Rationale |
|---|---|---|
| **EX-1** | DB type name is `parent_sos` (not `vibe_sos` as originally written above). | Lovable already used `parent_sos` in production (1 row from 2026-03-20). Cross-platform consistency wins over local SPEC text. |
| **EX-2** | Parent SOS surface is **inline-only on the child card** (soft amber dot + italic muted-text row). NO global banner. | Pillar 2 — a banner is alarm-design; event volume is ~1-3 per family per month; banner would mis-frame BUFF as a "watch for distress" tool. |
| **EX-3** | NO mark-as-read action in v1 (option A). The text + dot persist until midnight via the `created_at::date = today` filter. | UX research (PatternFly, NN/G, Toptal): auto-mark on tap is anti-pattern; manual mark-as-read adds friction without clear value at this volume. |
| **EX-4** | NO child-side SOS indicator beyond the existing button "Sent" label (already in Phase 3). | Pillar 3 — kid expresses, doesn't surveil parent's response. Read-receipt loop would create unhealthy dependency. |
| **EX-5** | Push notifications scoped to a **separate parallel MVP package** `pkg/fcm-push-notifications`. Same `notifications` table is the trigger source — no rework. | FCM requires native build + signing + certs; not the right scope for this package. Also enables `pkg/parent-notification-feed` (bell + generic feed) without coupling. |

---

## Phase 0 close-out note

- Branch `pkg/daily-vibe-check` created off `origin/main`.
- SPEC pulled from `origin/claude/busy-euclid-e43458` into `docs/sessions/beta-2026-06-01/TRACK_8_daily_vibe_check_SPEC.md` (preserved as planning artifact).
- Working SPEC copy + verified schema + locked decisions: this file.
- No `src/` code touched. Awaiting Phase 1 approval.
