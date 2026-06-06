# Parent Capture — PHASE 0 FINDINGS (verification)

**Date:** 2026-06-05 · **By:** CC (read-only verification, no code, no schema changes)
**Purpose:** replace the ±50% estimate guesses with verified facts before any build commitment.

> All three Phase-0 unknowns are now answered. Net: **two estimates improve, one new dependency is confirmed for the OS share-target, and the privacy gate has a clear compliant path.**

---

## 1. Existing schema (verified via Supabase `list_tables`) — Phase 5 risk DROPS

The real production schema (mobile project `gfrongfnyigxsexuofrg`). Key tables for this feature:

### `tasks` (1032 rows) — the transfer-to-child target
`id, family_id, title, time(text), category, credits(int, default 10), description, icon, assigned_to(→profiles.id), strategy_id, schedule_days(int[] 0-6, default {0..5}), is_system_generated, proposed_by_child, hide_on_weekend`
- **`category` is a CHECK enum:** `learning | organization | self-care | responsibility | movement`. **Captured items MUST map to one of these 5** (homework→`learning`, bring-X / forms→`organization` or `responsibility`, etc.). This mapping is a concrete parser/confirm responsibility — not a blocker, but a defined task.
- **Transfer = INSERT into `tasks`** with `family_id, title, assigned_to=childProfileId, category, credits, schedule_days`. The path is clear and existing. ✅
- `schedule_days` + `hide_on_weekend` confirm the day-filtering surface (`project_task_day_filtering`) — a transferred dated item must set `schedule_days` correctly or it shows wrong.

### `child_suggestions` (7 rows) — the EXISTING child→parent approval rail (huge for v2)
`id, family_id, child_id, kind(task|reward), title, emoji, status(pending|discussing|approved|withdrawn), resolved_by, created_entity_id`
- **This is exactly the rail the v2 teen-capture flow plugs into:** teen captures → INSERT `child_suggestions` row `kind='task'` → parent approves → becomes a `tasks` row (linked via `created_entity_id`).
- It even has **`status='discussing'`** — matching the "let's have a conversation" Adi described. The v2 flow is a **new input to a fully-existing pipeline**, confirming the SPEC. ✅

### `profiles` (298 rows) — roster context
- Has `birth_date(date)`, `role(parent|child)`, `display_name`, `child_preferences(jsonb, incl. age_mode)`.
- **NO `grade_level` column.** → roster auto-assign by grade needs either (a) infer grade from `birth_date`/age, or (b) add additive `grade_level` column (OQ-C13). Name + age are already available, so partial roster context works day-1.

### Other relevant existing tables
- `notifications` (1103) — parent feed exists (`parent_id, type, child_id, child_name, entity_id, is_read`). The "This Week"/reminder surface reuses this pattern.
- `timetables` (133) — `data(jsonb), assigned_to`. A schedule/timetable concept already exists; "schedule"-type captures may relate.
- `app_settings` — family-level config (could hold family feature config).
- `child_vibes`, `credit_vault`, `store_rewards`, `daily_progress`, `buddy_*` — the reward/loop tables; transfer feeds these indirectly via `tasks`→`daily_progress`.
- **All tables RLS-enabled.** New `parent_items`/`capture_runs` mirror the family-scoped parent-only pattern.

**Impact:** Phase 5 (transfer-to-child) risk **MED → LOW-MED**. The insert path is known; the only real work is the `category` enum + `schedule_days` mapping. The `child_suggestions` rail makes v2 cheaper than estimated.

---

## 2. Android share target — confirmed feasible, but needs a NEW dependency

- **Library:** `expo-share-intent` (achorein) — a maintained Expo config-plugin + native module; supports Android/iOS, text/URL/image/files. Standard solution for "receive a share into an Expo app."
- **Workflow fit:** BUFF already uses `expo-dev-client` + EAS prebuild (CNG), so a config plugin is compatible. **But it is a NEW npm dependency + config plugin + a rebuild** → **requires Adi approval** (CLAUDE.md new-dependency gate). SDK 54 compat needs a version check (docs cite SDK 49/50 explicitly; lib is active — verify latest version supports SDK 54 before committing).
- **KEY de-risk:** the **in-app capture path needs ZERO new dependencies.** `expo-clipboard` (paste text) and `expo-image-picker` + `expo-image-manipulator` (pick + downscale image) are **already installed**. So:
  - **v1 in-app capture** (paste / pick image inside BUFF) = buildable **now, no new dep, no rebuild, no production risk.**
  - **OS share-target** ("share from WhatsApp → BUFF") = a **fast-follow** that adds `expo-share-intent` (new dep + rebuild + Adi approval).

**Impact:** Phase 7 splits. The magic-but-heavier OS share-target is deferred behind a dependency gate; the in-app path proves the full loop with existing tooling. Lowers v1 risk; isolates the new-dep decision.

---

## 3. Gemini privacy — a clear compliant path for a children's app (gate de-risked)

Verified Google's current (2026) data-use terms:
- **Paid Gemini API / Vertex AI:** Google **does NOT train** on prompts/responses; data logged only briefly for safety/abuse, under the Google Cloud DPA. Vertex offers near-zero-retention terms for eligible enterprise via DPA amendment.
- **Free AI Studio tier:** Google **DOES use** submitted content to improve products; human reviewers may annotate. **Free tier explicitly warns against submitting personal/sensitive data.**
- EEA/Switzerland/UK get paid-tier policy even on free.

**Decisive for BUFF (children's app):** **use the PAID tier only, NEVER the free tier.** That gives a defensible posture: *not used for training, brief safety-logging only, under the Cloud DPA* — which is exactly the "your data stays yours" trust hook (vs. Milo's trust-death). Cost impact is minimal (Flash paid is still cents-scale); it just means a billed API key, not the free key.

**Impact:** the privacy gate now has a concrete compliant answer. Adi's decision narrows to: approve a **paid** Gemini API key + accept the posture (paid-tier-only, documented in-app consent, image redaction of third-party names). Legal can sanity-check the Cloud DPA, but the path exists.

---

## Net effect on the plan

| Item | Before | After Phase 0 |
|---|---|---|
| Phase 5 transfer-to-child | Med (schema unknown) | **Low-Med** — `tasks` insert path known; `category`+`schedule_days` mapping defined |
| Phase 7 share-target | Low confidence (managed-Expo unknown) | **Confirmed feasible**, but **new dep `expo-share-intent` + rebuild** → gated. **In-app path needs zero new deps** |
| `grade_level` | unknown | **Not present** — infer from `birth_date` or add additive column |
| v2 teen rail | assumed | **Confirmed** — `child_suggestions` table is the ready-made approve rail |
| Gemini privacy | open question | **Compliant path = paid tier only**; defensible children's-app posture |

**Revised buildable-now (zero production risk, zero new deps) set:** in-app CaptureScreen + ConfirmCard + This-Week surface behind a **stub parser**, plus the additive schema. The two gated pieces are unchanged (Gemini paid key; privacy consent) and now have a clear path. The OS share-target carries its own new-dep gate.

**No code or schema was changed in Phase 0.** Branch `pkg/parent-capture` is the isolated dev home; `main` untouched.
