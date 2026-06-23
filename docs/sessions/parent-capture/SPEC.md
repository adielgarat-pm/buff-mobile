# `pkg/parent-capture` — SPEC

**Status:** `draft — strategy locked (see DECISION.md); build NOT approved. Blocked on (a) Adi's now-vs-V-next call, (b) Gemini-dependency approval.`
**Slug:** `pkg/parent-capture`
**Branch:** `pkg/parent-capture` (off `main`)
**Target release:** TBD (NOT scheduled — see DECISION §7)
**Strategy source:** `docs/sessions/parent-capture/DECISION.md`
**Drafted:** 2026-06-05 by CC during PM brainstorm with Adi.
**Builds on:** `pkg/parent-notification-feed` (parent navigator header + `notifications` table + parent surface), `pkg/child-suggest` (propose/approve pattern precedent).

> Target state for this package. Authoritative until superseded. Wins over canonical docs during the package; canonical docs update at exit per `SPEC_SYNC.md`.
> **This is a Plan-Mode artifact. No code, no migrations, no new deps until Adi says `approved, proceed`.**

---

## Why this exists

Today BUFF helps the **child**. The **parent's** own mental load — the stream of teacher/activity messages, emails, and photos of handouts they must hold in their head and never drop — is unaddressed. This package adds a parent-facing **capture → confirm → transfer** pipeline: the parent shares a message/photo into BUFF, AI structures it, the parent confirms, and items are routed either to the parent's own calm "This Week" surface or **transferred to a child** (becoming a normal item in the child's existing BUFF loop).

The product's defensible core is the **transfer** (capture-in-order-to-graduate-to-the-child), not the AI parse (commodity). See DECISION §1, §5, §6.

**Highest-risk surfaces in this package (justify every decision against these):**
1. **Pillar 3** — parent dependence on capture contradicts "until they don't need us." Resolution: capture is the parent's *fading* training wheels; the goal is transfer to the child.
2. **Privacy / Pillar 2** — sending family messages + photos to a third-party LLM is a new PII surface in a children's app. See §Privacy.
3. **New dependency** — Gemini API (vendor, key, cost). Requires explicit Adi approval (CLAUDE.md).

---

## Scope at a glance (the disciplined cut — DECISION §7)

| In v1 | Explicitly deferred |
|---|---|
| **Share-to-parse**: one manual share (text or any file — PDF/Word/Excel/image) from Android share sheet → BUFF | Always-on inbox / WhatsApp / email **monitoring** (this is what killed Milo + is the commodity) |
| In-app **paste/upload** capture entry | Auto channel→child mapping ("this WhatsApp group = Emi's class") |
| Server-side **Gemini parse** with family-roster context | Collective / network ("all class parents get it") |
| **Confirm card** (review/edit/discard, owner toggle) | A full **calendar grid** view |
| Items land in parent **"This Week"** surface (to-do + to-know) | **Default notifications** (opt-in per item only) |
| **Transfer to child** → existing child task/event loop | **iOS** share extension (Android first) |
| **Recency filter** (past-dated → archived) | Recurrence expansion engine (capture the rule; don't materialize N rows yet) |

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| **Gemini API (Flash, multimodal)** | ⚠️ **NOT approved — new vendor + new PII surface** | Server-side only (Edge Function), never on-device. Needs Adi sign-off as an Improvement Package. Validated working on Hebrew text + image 2026-06-05. |
| `public.notifications` + parent navigator header | ✅ if `pkg/parent-notification-feed` shipped | The "This Week" surface reuses the parent header/bell pattern and parent-only RLS conventions. Phase 0 checks whether the feed package has merged. |
| `tasks` / child task loop | ✅ exists (schema unverified here) | Transferred child items become normal child tasks/events. **Phase 0 must read the real schema** — column names, owner/assignee model, day-filtering (see `project_task_day_filtering`). |
| Family roster (children: name, age, grade) | 🟡 partially exists | Profiles have children; **grade/שכבה may not be a stored field today.** Phase 0 verifies; if absent, §Schema adds `profiles.grade_level` (additive). The roster is what powers auto-assign — without it the value drops (DECISION §4). |
| Android share intent registration | ❌ new | Expo config plugin / `intentFilters` in `app.json` for `text/plain` + files (`*/*`: PDF/Word/Excel/image). Verify managed-workflow support in Phase 0. |
| Gemini API key secret | ❌ new | EAS secret + Supabase Edge Function env. Never in client bundle. |

---

## Values Check

> 9 questions from `docs/BUFF_VALUES.md`. Must pass before any code. This is a **parent-surface** package, so Pillar 1 (kid-motivation) questions are partly N/A — answered honestly below, not hand-waved.

| Pillar | Q | Answer |
|---|---|---|
| 1 — Intrinsic Motivation | 1 — would the kid want this without virtual reward? | ⚪ **N/A on the parent surface** (parent-only). For **transferred** items: the child receives them through the *existing* task loop, which already passes Values Check. A transferred item must be a plain, inviting action in the child's voice (`feedback_kid_task_copy_simple`), never "your parent assigned you a chore." |
| 1 | 2 — closer to a real reward the kid chose? | ✅ Transferred items flow into the same real-reward economy the child already opted into. No new virtual currency. |
| 1 | 3 — feels like "I want to" not "I have to"? | ✅ **RESOLVED (Phase 5).** Transferred item enters the child loop as a normal task with a **plain kid-voice title** (no "parent assigned", no badge); same neutral treatment as any task, **no shame if not done**. |
| 2 — Positive Coaching | 1 — any shaming / comparison / failure framing? | ✅ Parent surface is declarative ("This week: …"), no "you missed N." If a transferred item lapses, **no red/alarm, no "your child failed to bring X."** |
| 2 | 2 — empathy not pressure on failure? | ✅ A forgotten transferred item is neutral; no nag to parent or child. The parent surface never says "your kid dropped this." |
| 2 | 3 — any BUDDY suffering/loss mechanic? | ✅ None. No buddy face on the parent surface; transferred items don't trigger sad-buddy states. |
| 3 — Independence-Building | 1 — does it make the child more capable *without* the app? | ✅ **This is the core thesis.** Transfer moves "remembering" from parent to child = executive-function reps. The explicit goal is the child carrying it themselves. |
| 3 | 2 — does the child have a voice? | ✅ **RESOLVED (Phase 5).** Balanced by `pkg/child-suggest` (child→parent). Parent sees only a muted "handed to {child}" — **no seen/done surveillance receipt** from the child. |
| 3 | 3 — in 6 months, still needed or did its job? | ✅ Capture is the **parent's** training wheels; success = the parent eventually *doesn't* need to capture because the child owns the routine. The parent surface is low-volume by design (calm pull, not a feed). |

**Values Check Pass:** [x] yes — **PASS (2026-06-07, Phase 5).** Both ambers resolved in the transfer design (plain kid-voice task, no shame, no surveillance receipt; child-suggest balances voice). Re-verify against built behavior at package exit.

---

## Goal (end-state after this package merges)

A parent, mid-stream in WhatsApp/email/photos, can:
1. **Share** a message or photo into BUFF (Android share sheet), OR paste/upload it inside BUFF.
2. See a **confirm card**: AI-extracted items, each typed (task / event / schedule / reference), pre-assigned to the right child by grade where possible, with confidence + "what's missing" prompts.
3. **Edit / confirm / discard** each item; for each, choose owner = **me** or **transfer to a child**.
4. Confirmed **parent** items appear in a calm **"This Week"** surface inside BUFF (to-do + to-know, grouped by time, past items auto-archived).
5. Confirmed **child** items appear in that child's normal BUFF experience (existing task/event loop), in the child's voice.
6. Nothing pushes a notification unless the parent opted that item in.

---

## Behavior Contract

**Scenario A — Share from another app (Android)**
1. Parent long-presses a WhatsApp message / photo → Share → **BUFF**.
2. BUFF opens to a Capture screen with the shared payload (text or any file) pre-loaded.
3. Parent taps "Read it" → request goes to the `parse-capture` Edge Function (text or base64 image + roster + today's date + best-effort message-sent-date).
4. Confirm card renders the extracted items (Scenario C).

**Scenario B — In-app capture**
1. Parent opens Capture from the parent nav (entry point per OQ-C2) → pastes text or picks an image.
2. Same parse → confirm flow.

**Scenario C — Confirm card**
1. Each extracted item shows: title, type chip, assigned child (or "which child?" if `unknown`), date/time, location, bring-list, confidence indicator (subtle, not alarpaming), and a `missing` hint where present.
2. Parent can edit any field, change owner (me / child picker), or discard the item.
3. Low-confidence items are visually flagged for review **without** blocking (calibration proven 2026-06-05).
4. `no_match` items (no child in the family fits the grade) are **hidden by default**, shown under a collapsed "not for your kids" group (noise filtering = a feature).
5. Parent taps **Confirm** → items persist (Scenario D).

**Scenario D — Persistence & routing**
1. **Parent-owned** items → `parent_items` (to-do/to-know) → surface in "This Week."
2. **Child-transferred** items → existing child task/event tables, attributed to that child, in kid-voice copy. (Phase 0 confirms exact target tables + insert path.)
3. Raw input (the original message/photo) is **not stored** beyond the parse round-trip (see §Privacy). Only the structured, parent-confirmed result is saved.

**Scenario E — "This Week" surface (calm pull)**
1. Parent opens "This Week" (card on dashboard or a tab — OQ-C3).
2. Items grouped by time bucket (Today / This week / Later) and by object type (to-do vs to-know).
3. **No notification fired** by default; an item can be opted into a reminder individually.
4. Past-dated items are auto-moved to an "Archive/Done" bucket (recency filter), never cluttering "This Week."

**Scenario F — Transfer reliability (the safety net)**
1. A transferred child item is visible to the parent in a muted "handed to {child}" state.
2. **No surveillance loop** — the parent does NOT get "your child has/hasn't seen it" (Pillar 3, consistent with `parent-notification-feed` OQ-B8).
3. If it lapses, it lapses quietly. OQ-C9 decides whether the parent gets *any* gentle visibility without it becoming a nag/monitor.

**Scenario G — Kid view (P-08 View-as-Child)**
- The Capture entry, confirm card, and "This Week" surface are **parent-only** — never rendered in the child shell.
- The child only ever sees the *transferred item itself*, as a normal task/event, with no "your parent captured this" metadata.

---

## Extraction Contract (validated 2026-06-05)

The `parse-capture` Edge Function calls Gemini with this contract. **Proven** on Hebrew text + WhatsApp image with roster + date anchors. Embedded here so the schema survives.

**Context injected server-side:** child roster (name, age, grade), today's date, best-effort message-sent-date (from share metadata / filename / user), language = Hebrew-first.

**Output JSON** (per item):
```
{
  "title": string,                  // short, action-oriented, in the owner's voice
  "type": "task" | "event" | "schedule" | "reference",
  "owner": "parent" | "child",
  "child_name": string | null,      // auto-filled by roster (grade→child)
  "relevance": "matched" | "no_match" | "unknown",
  "due_date": "YYYY-MM-DD" | null,  // relative dates resolved vs MESSAGE-SENT date
  "due_time": "HH:MM" | null,
  "recurrence": string | null,      // e.g. "every Sunday and Thursday"
  "dates": ["YYYY-MM-DD", ...],     // for schedules
  "date_source": string,            // raw text the date came from (audit)
  "location": string | null,
  "bring": [string],
  "event_type": "performance" | "test" | "homework" | "activity" | "errand" | "payment" | "form" | "other",
  "for_child_to_remember": boolean,
  "linked_event": string | null,    // parent/child split of one event
  "confidence": "high" | "medium" | "low",
  "missing": string | null          // what needs parent confirmation
}
```

**Proven rules:** noise → empty array (no ghost items); grade→child auto-assign; `no_match` filtering for non-family grades; parent/child split of a single event via `linked_event`; relative dates anchored to **message-sent** date (not today) to avoid stale-date bugs; `confidence:low` flags items needing review.

**Remaining refinements (not blockers):** channel→child mapping (deferred); recurrence materialization (capture rule only in v1); messy/handwritten image robustness (Phase test set).

---

## Schema Changes (proposed — verify & migrate in-package, additive only)

> SQL-like notation, NOT a migration. CC writes real migrations via `apply_migration` only after approval. Mobile DB has no prod users, but the Lovable snapshot (283 profiles) lives here — all changes are **additive** (`project_subscription_family_scoping_gap`, `feedback_schema_change_gate`).

```sql
-- Parent-owned captured items (the "This Week" store)
CREATE TABLE parent_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     uuid NOT NULL REFERENCES families(id),
  created_by    uuid NOT NULL,              -- parent profile
  title         text NOT NULL,
  type          text NOT NULL,             -- task|event|schedule|reference
  child_id      uuid NULL REFERENCES profiles(id),  -- if about a specific child
  due_date      date NULL,
  due_time      time NULL,
  recurrence    text NULL,
  location      text NULL,
  bring         jsonb DEFAULT '[]',
  event_type    text NULL,
  status        text DEFAULT 'active',     -- active|archived|done
  reminder_opt_in boolean DEFAULT false,   -- notifications are OPT-IN
  source        text DEFAULT 'capture',
  confidence    text NULL,
  created_at    timestamptz DEFAULT now()
);

-- Optional audit of capture runs (NO raw input stored — privacy)
CREATE TABLE capture_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   uuid NOT NULL,
  created_by  uuid NOT NULL,
  input_kind  text NOT NULL,               -- text|image
  item_count  int  NOT NULL,
  model       text NOT NULL,               -- e.g. gemini-flash
  created_at  timestamptz DEFAULT now()
  -- deliberately NO raw_text / raw_image column
);

-- Roster grade, only if profiles lacks it (Phase 0 verifies)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade_level text NULL;
```

**RLS:** `parent_items` + `capture_runs` are family-scoped, parent-only read/write; **never** exposed to a child session. Mirror the parent-only policies from `pkg/parent-notification-feed`.
**Transferred child items** reuse the **existing** child task/event tables and their existing RLS — Phase 0 confirms the insert path and whether day-filtering (`project_task_day_filtering`) affects visibility.

---

## Parse service (Edge Function `parse-capture`)

- **Server-side only.** Holds the Gemini key; client never sees it.
- Input: `{ kind: "text"|"image", payload, family_id, message_sent_at? }`.
- Loads roster from `profiles` for `family_id`; injects roster + dates into the prompt (Extraction Contract).
- Calls Gemini Flash (multimodal for image); validates JSON against the schema; returns items.
- Writes a `capture_runs` audit row (counts only, no raw input).
- **Does not persist** raw payload. Logs scrub content (consistent with Sentry PII policy in CLAUDE.md).
- Cost control: per-call Flash (cheap), 1 call per manual share. No background fan-out. Add a per-family daily cap (OQ-C10).

---

## Entry points

1. **Android share target** — `app.json` `intentFilters` for `text/plain` and files (`*/*`) → deep link into Capture screen. Phase 0 verifies Expo managed-workflow feasibility; if it needs a config plugin, that's in-scope (no new npm runtime dep, just build config) — but flag to Adi.
2. **In-app capture** — a "+ Capture" affordance in the parent nav (location = OQ-C2): paste text / **pick any file** (PDF/Word/Excel/image) via `expo-document-picker` (already installed — zero new dep).

---

## UI Changes

- **CaptureScreen** — receives share payload or in-app input; "Read it" CTA; loading state (calm, no spinner anxiety).
- **ConfirmCard** — per-item review (edit / owner toggle / discard); confidence + `missing` hints; `no_match` collapsed group; bulk Confirm.
- **ThisWeekSurface** — calm pull destination: time + type grouping; per-item reminder opt-in; archived/past bucket. No buddy face, no alarm colors (consistent with `parent-notification-feed` empty-state voice).
- **Copy** — Hebrew-first; declarative, coach-not-secretary, no surveillance language. **All user-facing strings are draft → Adi approval** (CLAUDE.md; `feedback_marketing_why_what`, `feedback_kid_task_copy_simple`).

---

## CC defaults (Adi may override at any phase plan review)

| ID | Question | CC default | Confidence / rationale |
|---|---|---|---|
| OQ-C1 | Where does the Gemini key live? | **Supabase Edge Function env secret; client calls the function** | HIGH — key must never ship in the app bundle. |
| OQ-C2 | In-app capture entry location | **"+ Capture" in parent nav header, near the bell** | MED — reuses parent-notification-feed header real estate. |
| OQ-C3 | "This Week" surface shape | **A card on the Parent Dashboard that expands to a full screen** (not a new tab in v1) | MED — keeps nav simple; promote to a tab if usage proves it. |
| OQ-C4 | Default language of parse | **Hebrew-first**, model handles mixed | HIGH — Adi's data is Hebrew; English-first is a later market concern (`project_english_first_market`). |
| OQ-C5 | Store raw shared input? | **No — parse round-trip only, structured result persisted** | HIGH — children's-app privacy; minimize PII at rest. |
| OQ-C6 | Notifications on captured items | **Opt-in per item, OFF by default** | HIGH — calm-pull principle (DECISION §3.2); default-push is the anti-pattern BUFF rejects. |
| OQ-C7 | Recurrence (e.g. "every Sun & Thu") | **Capture the rule as text; do NOT materialize N rows in v1** | MED — materialization is a later engine; rule-as-reference is enough for "know." |
| OQ-C8 | Stale/past items | **Auto-archive past-dated; never in "This Week"** | HIGH — recency was a real failure mode in testing. |
| OQ-C9 | Parent visibility of a transferred item's status | **Muted "handed to {child}" state; NO seen/done receipt from the kid** | MED-HIGH — Pillar 3; mirrors `parent-notification-feed` OQ-B8 (no surveillance). |
| OQ-C10 | Cost guardrail | **Per-family daily capture cap (e.g. 30/day) + Flash model** | MED — prevents runaway spend / abuse; tune after real usage. |
| OQ-C11 | File handling | **Any file (PDF/Word/Excel/image) via `expo-document-picker`; send to multimodal Flash server-side, branch on mimeType; downscale images before upload** | MED — bandwidth + cost; Phase test on messy/handwritten + multi-page docs. |
| OQ-C12 | Child-item insert path | **Reuse existing child task/event creation path, not a parallel one** | HIGH — avoid a second source of truth; respects existing day-filter logic. |
| OQ-C13 | `grade_level` source | **Ask once at child setup / infer from age; store on profile** | MED — roster auto-assign needs it; additive column. |
| OQ-C14 | Confirm-card friction | **Show all items; one bulk Confirm; low-confidence flagged but not blocking** | HIGH — avoid moving "remember" load into "review a queue" fatigue (DECISION risk). |

---

## Privacy & PII (first-class — children's app)

- **New PII surface:** parent messages + photos of school handouts (may name children, schools, times) sent to **Google (Gemini)**. This must be a conscious, disclosed choice.
- **Mitigations:** server-side proxy (no key on device); **no raw input stored** (OQ-C5); content-scrubbed logs (CLAUDE.md Sentry policy); parent-only data, never child-readable; explicit in-app consent on first capture; a plain-language note on what's sent and that it isn't retained.
- **Brand inversion:** "your data stays yours / not stored / not used to train" is a **trust hook** vs. Milo's trust-death (DECISION §5–6) — IF we actually honor it.
- **DPA / ToS:** review Google Gemini API data-use terms (does input train models? region? retention?) before approval. **Adi decision.**

---

## Proposed Phased Chunks

| # | Phase | Exit criteria |
|---|---|---|
| 0 | Foundation & verification | Confirm: parent-notification-feed merge status; real child task/event schema + insert path; whether `profiles.grade_level` exists; Android share-intent feasibility in Expo managed; Gemini data-use terms summarized for Adi. Scaffold STATUS/TESTS/SPEC_SYNC. **No code beyond scaffolding.** |
| 1 | `parse-capture` Edge Function + Extraction Contract | Function deployed (dev); given text/image + family_id returns validated items; roster auto-assign + `no_match` filtering working on a real Hebrew test set; key server-side; `capture_runs` audit (no raw input). |
| 2 | Schema + RLS | `parent_items`, `capture_runs`, optional `grade_level` migrated (additive); parent-only RLS verified; kid session cannot read. |
| 3 | CaptureScreen + in-app entry | Paste/upload → parse → items returned in UI; loading/error states. |
| 4 | ConfirmCard | Per-item edit / owner-toggle / discard; confidence + missing hints; `no_match` collapsed; bulk Confirm persists parent items. |
| 5 | Transfer-to-child | Confirmed child items insert via existing child task/event path, kid-voice copy; appear in that child's BUFF; no surveillance metadata. |
| 6 | "This Week" surface | Calm pull view; time+type grouping; per-item reminder opt-in; recency auto-archive. |
| 7 | Android share target | `intentFilters` registered; share from WhatsApp/Gallery opens Capture pre-loaded. |
| 8 | Privacy/consent + i18n + copy review | First-capture consent; HE/EN strings (draft→Adi); declarative/coach-not-secretary checklist; no surveillance language. |
| 9 | Spec sync + tests + STATUS + PR | SPEC_SYNC docs updated; Values Check re-verified against built behavior (esp. Q1.3, Q3.2 ambers); INTEGRATION_LEARNINGS for surprises; PR. |

---

## SPEC_SYNC matrix (moves to SPEC_SYNC.md at Phase 0)

| Phase | Canonical doc | Change |
|---|---|---|
| 9 | `BUFF_PRD.md` | New §: parent-capture as the parent-half / family pipeline (or explicit "out-of-PRD" decision — Adi). |
| 9 | `BUFF_FEATURE_AUDIT.md` | New row. |
| 9 | `BUFF_GAP_ANALYSIS.md` | New row. |
| 9 | `BUFF_COMPETITORS.md` | Add the parent-mental-load camp (Ohai/Maple/Sense/Milo) + the white-space finding. |
| 9 | `BUFF_BRAND.md` / `BUFF_MESSAGING.md` | If positioning/hooks adopted — Adi-owned, propose only. |
| 8 | `src/i18n/he.json`, `en.json` | All new strings. |
| 9 | `INTEGRATION_LEARNINGS.md` | Surprises + the Gemini integration learnings. |

---

## Risks

> Risk ratings refined 2026-06-05 after an architect-hat review with Adi (the teen/Itai deepening). See §"v2 — Teen / operator-based capture" for the design resolutions.

- **Dependency approval gate** — no Gemini, no product. Adi sign-off on vendor + privacy is a hard precondition (not CC's call).
- **🟠 Identity gravity (resolved-by-design, hold the line)** — capture is *logistics* value, which is stickier than BUFF's *development* value and can pull the product toward Camp B (the Milo graveyard). **Resolution:** the parent surface is an **offer-help / awareness feed, NOT a task list**, and capture is always **subordinate to transfer**. The moment it becomes "stay on top of logistics forever," the identity is lost. This is a standing design constraint, not a one-time check.
- **🟡 Third-party PII (bounded by evidence)** — Adi reviewed a year of her teacher/activity group messages (2026-06-05): broadcast text is general, **no child names**. Residual vectors are narrow: **photos** containing class rosters / sign-up lists / invitations, and **forwarded other-parent messages**. Mitigation: redaction on images + a legal sanity-check of Gemini terms. Downgraded from model-killer to manageable.
- **🟠 Scaffold-vs-replace (the teen knife-edge)** — the capture *is* the executive-function exercise (reviewing N groups, dropping nothing, structuring). If the AI does the whole cognitive job and the teen just taps Confirm, the EF rep is *removed* → dependency, and the teen never outgrows it (re-opens the "never fades" risk). **The tool must reduce overwhelm while keeping the teen doing the review — body-double, not butler.** THE design decision for the teen flow.
- **Privacy posture** — children's app + LLM ingestion. Mishandled disclosure could damage the trust that is BUFF's *advantage*. Treat §Privacy as load-bearing, not boilerplate.
- **Confirmation fatigue** — if too much needs manual confirmation, load shifts rather than reduces (OQ-C14). The roster auto-assign + confidence are the mitigations; measure.
- **Pillar-3 ambers — RESOLVED in design** — Q3.2 (kid voice) is resolved by the teen operating capture himself (child→parent flow); Q1.3 (transfer can feel imposed) by the offer-help framing + kid-voice copy. Re-verify against built behavior at exit.
- **Two-masters governance** — a parent-utility surface gives every future scope-creep a "but it helps the parent" escape hatch, eroding the Values Check as a forcing function. Guardrail: parent features still must pass "does this ultimately serve the child's independence?"
- **AI-error blast radius** — a wrong parse in a *trust* product ("BUFF told my kid the wrong test date") is costlier than in a standalone calendar. The confirm-gate is existential, not cosmetic; never auto-act on AI output; AI-only items never drive reward/penalty without human confirmation.
- **Focus / scope creep** — the moment v1 reaches for inbox monitoring, it becomes a quarter-eating bet (DECISION §7). The cut *is* the discipline.
- **Existing-schema unknowns** — child task insert path + day-filtering (`project_task_day_filtering`) may complicate transfer. Phase 0 de-risks.
- **Android share intent in managed Expo** — may need a config plugin; verify Phase 0 before promising.
- **Image robustness** — clean images proven; messy/handwritten not yet. Phase 1 test set.
- **Stale data** — recency filter (OQ-C8) is mandatory; without it the surface fills with past noise (seen in testing).

---

## Brief for the receiving session

```
Plan Mode. You are picking up pkg/parent-capture. This is a NEW parent-facing
product direction — strategy is locked, build is NOT yet approved.

Read FIRST:
- docs/sessions/parent-capture/DECISION.md  (strategy + market — read fully)
- docs/sessions/parent-capture/SPEC.md       (this file)
- CLAUDE.md  (Plan Mode; new-dependency + schema gates; no user-facing copy decided solo)
- docs/WORKFLOW.md
- docs/BUFF_VALUES.md  (Pillar 3 = the thesis AND the risk; Pillar 2 privacy)
- docs/sessions/parent-notification-feed/SPEC.md  (the parent surface this builds on; parent-only RLS, no-surveillance patterns, calm empty-state voice)
- docs/sessions/child-suggest/SPEC.md  (propose/approve precedent; the child-voice balance to transfer)
- memory: project_smart_capture_idea, project_task_day_filtering,
  feedback_schema_change_gate, feedback_marketing_why_what,
  feedback_kid_task_copy_simple, feedback_kids_never_login

Before proposing chunks (Phase 0), VERIFY:
- Has pkg/parent-notification-feed merged? (reuse its parent header + RLS patterns)
- The REAL child task/event schema + insert path + day-filtering behavior.
- Does profiles store grade/שכבה? If not, plan the additive column.
- Android share-intent feasibility in Expo managed workflow.
- Google Gemini API data-use terms (training? retention? region?) — summarize for Adi.

HARD GATES (do NOT proceed past these without Adi):
- Gemini API adoption (new vendor + PII surface) — explicit approval required.
- Any schema change — additive only, via apply_migration, after approval.
- The now-vs-V-next call — this package may be deferred entirely.

HARD PRODUCT PRINCIPLES (never propose):
- Always-on inbox/WhatsApp monitoring (out of scope; commodity; killed Milo).
- Storing raw shared input (privacy).
- Default-on notifications (calm pull only; opt-in per item).
- Any "your child saw/did this" surveillance receipt to the parent.
- Capture/confirm/This-Week surfaces visible in the child shell.
- Finalizing user-facing copy without Adi.

Branch off main as pkg/parent-capture. No code until Adi approves Phase 0.
```

---

## v2 — Teen / operator-based capture (design refinements 2026-06-05)

> The same engine, routed by **who operates it**. v1 builds parent-capture only; this section locks the architecture so v1's data model anticipates it (cheap now, expensive to retrofit). **Build = v2, after v1 parent-flow is proven.**

**One engine, family graph routes by (operator × owner × needs-help):**

| Operator | Item kind | Routes to |
|---|---|---|
| Parent | parent's / child's | parent "This Week" / transfer to child |
| **Child (teen)** | **own task** | proposal → **existing parent-approval flow** (F-015/F-036) |
| **Child (teen)** | **needs parent help** | parent's offer-help surface: "I need you for this" |

**Operator detection** is already known from session identity (ChildJoin = child; parent session = parent). Residual edge case: **View-as-Child** (parent in the child shell) — OQ for v2.

**The real-world shape (Itai, 15 — grounding):**
- **Webtop = outcomes** (grades, behavior, school→parent messages). Parents already have sanctioned access. **BUFF does NOT touch this** — it is *not* a grade-surveillance channel.
- **Per-subject WhatsApp teacher groups = obligations** (homework, test material, deadlines). This info lives **only with the teen**; at 15, the parent can't ask for the phone. **This is the gap BUFF fills.**
- The "review my groups and extract the tasks" job is one Adi *already* assigns Itai manually (broken into per-subject because it's hard for him). The tool scaffolds exactly that.

**Why this resolves surveillance:** the capture is the teen's **own rewarded task** (he earns BUFFs for doing the EF review); parent visibility is the **normal task-visibility that already exists for every BUFF task**, not a new monitoring feed. "If I see a task he's not meeting, like any other task, I come to him." Capture **obligations, not outcomes**; the teen sees what the parent sees (no secret feed).

**The knife-edge (see Risks → Scaffold-vs-replace):** the tool must reduce the *overwhelm* of facing N noisy groups while keeping the teen doing the cognitive review. Body-double, not butler. If the AI does it all, the EF rep is removed and dependency is created.

**Interaction shape differs from the parent flow:** parent = ad-hoc single share. Teen = **periodic sweep of N noisy subject groups** (heavier; more friction — forward each group? screenshot each?). So the teen flow is **not** "just a new input to the existing approve-flow" — it is a larger build. Reinforces teen = v2.

**Future structured source (note, not scope):** Webtop is structured and parent-accessible — a far cleaner ingestion target than noisy WhatsApp — but it carries outcomes; revisit deliberately.

---

## Implementation plan, estimates & timing

See **`IMPLEMENTATION_PLAN.md`** (same folder) — phase-by-phase effort + token estimates, the de-risked-vs-gated split (what can be built **without** the Gemini/privacy decision), the 14-day tester-window analysis, and the timing recommendation.

---

## The open gate (restated)

This package is **drafted, not greenlit.** Two doors must open first, both Adi's:
1. **Now or V-next?** (focus call — DECISION §7; see IMPLEMENTATION_PLAN § Timing).
2. **Gemini dependency + privacy posture** approval.

Until both, this stays a Plan-Mode artifact.
