# `pkg/notifications-hardening` — SPEC

**Status:** `draft — awaiting Adi review`
**Slug:** `pkg/notifications-hardening`
**Branch:** `pkg/notifications-hardening` (off `main`)
**Source:** 2026-06-08 architecture session with Adi (notifications UX/architecture review)
**Builds on / partially supersedes:** `pkg/anchor-recovery` (shipped Phase 1), `pkg/fcm-push-notifications` (shipped), `pkg/child-suggest` (shipped)
**Sibling (do not overlap):** `pkg/parent-notification-feed` — renders the bell feed. THIS package owns *push policy + scheduling*, NOT bell rendering.
**Drafted:** 2026-06-08 by Claude Code (CC), from a live DB audit + code read.

---

## Why this exists

A live audit on 2026-06-08 found FCM push is now delivering to real devices (6 tokens, first real pushes landed), but the notification **architecture and UX have gaps beyond bugs**:

1. **Deny once = dark forever.** The permission pre-prompt shows only when permission is `unknown`. Once a user denies the OS dialog, `permission='denied'` and the app never asks again — and there is **no in-app path to Settings**. (`src/components/NotificationGate.tsx` L48-57.)
2. **Push routing assumes one-profile-per-device**, but BUFF's core model is one-device-many-profiles (shared device + View-as-Child). The token re-points to whichever profile foregrounded last (`usePushRegistration.ts` keys on `profileId`; `upsertDeviceToken` `onConflict:'token'`). On a shared device, parent-targeted pushes can land on a token currently owned by a kid profile, or vice versa.
3. **No "push = action-required" discipline.** INFO-level events (`parent_engagement`, `family_joined`) push to the parent like alarms. The mentally-overloaded-parent model wants push reserved for things that need a response.
4. **`anchor_recovery` conflates two cohorts.** Its only activity check is "no `daily_progress` in last 5 days" — which is true for both *churned* kids (had a habit, lost it) AND *never-activated* families (onboarded, connected a kid, never used it). The latter get a "took a pause / reopen the door" message for a door they never opened.
5. **`child_suggestion` push is silently dropped.** It is in neither recipient set in the Edge Function, so `getRecipientProfileId()` returns null → suppressed as `unknown_type` (11 real attempts, latest 2026-06-08).
6. **Cron timing is fixed Israel-clock and fires to the whole table** (incl. ~280 Lovable-copy ghosts). Harmless today (no token) but wrong for the English-first market and pollutes metrics.

### Live-data grounding (real testers, 2026-06-08)
- **שלי / Shelly H** (shellypick@gmail.com): 14 completions, active today → correctly gets nothing.
- **יונתן / Jonathan D** (jondamail@gmail.com): onboarded 2d ago, **0 activity** → `activation_nudge`.
- **יהודית / judith Galili** (jgalili@gmail.com): onboarded 7d ago, **0 activity** → `activation_nudge`.
- **מאיה / Maya** (mayas293@gmail.com, registered as "אמא"): onboarded **today**, 0 activity → none yet (too new).
- **Shani Yitbark**: 12 completions but idle 3d → would fire `anchor_recovery` under a flat 3-day rule. *This is why the threshold is graduated (see Decision L2).*
- **Finding:** 2 of 4 named testers onboarded-but-never-started. None of the 4 has a registered parent device token → none receives an actual push until the permission model (Goal 1) ships.

---

## Capabilities & Bottlenecks

### What Claude Code (CC) will do
- Schema: add a parent-owned notification-preferences store (columns or small table) — applied via Supabase MCP `apply_migration`.
- Edit the Edge Function `push-notification-fanout`: action-required vs INFO gate, `child_suggestion` recipient + copy, preference checks.
- Modify the two pg_cron functions: `scan_for_anchor_recovery` (ever-active gate + graduated threshold) and add a new `scan_for_activation_nudge`. Scope both away from never-installed cohort.
- Client: denial-recovery banner + deep-link to system settings; a one-time parent prompt with two toggles; a Settings notifications screen; age-gated kid registration.
- Update canonical docs per SPEC_SYNC.

### What Adi must do herself
- Approve user-facing copy (this SPEC proposes it; final call is hers — CLAUDE.md).
- Hat-4 device verification (grant on a real device, confirm routing on a shared device).
- Confirm the few remaining product micro-decisions in "Open Questions".

### Bottlenecks / expected stop points
- **Shared-device routing is the hard part.** Needs a real two-profile-on-one-device test, not just code review (confidence is medium until then).
- **Existing copy drift:** `pkg/anchor-recovery` SPEC locked the approved HE copy as *"כולנו צריכים התחלה חדשה לפעמים…"*, but the **deployed** Edge Function copy is *"{name} לקח/ה הפסקה / יש שתי הצעות עדינות לפתיחה מחדש"*. These disagree — Adi to pick the canonical one (Open Q4).

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this without virtual reward?** ✅ Notifications are parent-facing or gentle kid presence-nudges; no virtual currency attached. activation/anchor nudges go to the parent.
2. **Closer to a reward the child chose?** ✅ Neutral — no new currency, no lock-in. Nudges aim at re-entry, not at app-internal rewards.
3. **Felt as "I want" not "I must"?** ✅ Kid-side nudges use body-doubling presence voice ("here, when you're ready"), never demands. Parent can disable.

### Pillar 2 — Positive Coaching
1. **Does any copy demean / compare / show failure?** 🟡 **CRITICAL.** All recovery/activation copy must avoid "missed", "behind", "X days", "didn't". Banned-string grep gate carried over from anchor-recovery. activation_nudge copy must read as an invitation, not a scold.
2. **On failure — empathy or pressure?** ✅ The whole design is empathy: action-required-only push removes nagging; nudges are weekly-capped, Pause-respecting, and dismissible.
3. **Suffering / loss / anger mechanic in BUDDY?** ✅ None. All internal (cron → notification → optional push). BUDDY is never "sad you left".

### Pillar 3 — Independence-Building
1. **More capable *without* the app?** ✅ Parent-owned controls teach the parent to steward attention deliberately; nudges aim to restore self-driven routine, then go quiet.
2. **Does the child have a voice?** ✅ 13-18 own-device kids decide their own notifications (Decision L4). 6-12 parent decides (age-appropriate scaffold).
3. **Still necessary in 6 months?** ✅ Nudges are scaffolding that fades — a re-engaged kid stops triggering them; an engaged kid never sees them.

**Values Check Pass:** [ ] yes / [ ] no — **conditional on Adi approving copy (Pillar 2 Q1).** Otherwise ✅.

---

## Goals

1. **Parent-owned permission model.** One-time prompt (two toggles: "alerts to me" / "reminders for my child"), never nag again, always reachable + fixable from Settings, with a deep-link to system settings when OS permission is denied.
2. **"Push = action-required" taxonomy.** Reclassify every notification type into PUSH (needs response) vs SILENT (INFO, bell-only).
3. **Fix `child_suggestion`.** Assign parent recipient + add copy.
4. **Split `anchor_recovery` into two correct cohorts:** churned (ever-active, then silent) vs never-activated (new `activation_nudge`), each with correct timing and copy.
5. **Graduated inactivity threshold** so previously-established kids aren't nagged on a normal short gap.
6. **Age-gated kid notifications** for own-device kids: 6-12 parent decides (default OFF), 13-18 kid decides.
7. **Scope crons away from the never-installed cohort** (no device token / Lovable-copy ghosts) and prepare per-timezone scheduling for the English-first market.

## Non-goals
- ❌ Bell-feed rendering — owned by `pkg/parent-notification-feed`.
- ❌ iOS / Web push specifics — `pkg/ios-testflight` and Expo-Web Phase 2.
- ❌ Per-type granular opt-out beyond the two toggles + the anchor sub-toggle (v1.1).
- ❌ Rewriting onboarding flow — the one-time prompt attaches to the existing dashboard/onboarding seam (anchor-recovery "onboarding is sacred" constraint respected).
- ❌ Changing the bell badge / in-app toast behavior (already works).

---

## Behavior Contract (target state)

### A. Permission — ask once, never nag, always fixable
1. Parent completes onboarding → a **single** prompt offers two toggles: **"Alerts to me"** (default ON) and **"Reminders for my child"** (default per age, see C).
2. Accepting "Alerts to me" triggers the OS permission dialog (pre-prompt-before-system pattern preserved).
3. If the parent declines or the OS dialog is denied → **no automatic re-ask**. Instead, a quiet, dismissible banner appears in Settings (and once on the dashboard) with a **deep-link to system notification settings**.
4. Settings → Notifications screen always shows both toggles + current OS permission state + the deep-link. This is the only place we "ask again".

### B. Push = action-required; INFO = silent in bell
| Type | Channel | Push? |
|---|---|---|
| `parent_sos` | parent | **PUSH** (needs response) |
| `child_suggestion` | parent | **PUSH** (needs approval) |
| `reward_redemption_requested` | parent | **PUSH** (needs approval) |
| `anchor_recovery` | parent | **PUSH**, gated by its own sub-toggle (Decision L3) |
| `activation_nudge` (new) | parent | **PUSH**, gated by its own sub-toggle |
| `kid_engagement` | kid | **PUSH** only if "Reminders for my child" ON + age gate passes |
| `reward_approved` | kid | **PUSH** (positive, kid asked for it) |
| `parent_engagement` | parent | **SILENT** (INFO) — *behavior change* |
| `reward_redeemed` | parent | **SILENT** (INFO) |
| `family_joined` | parent | **SILENT** (INFO) — *behavior change* |
| `task_completed` | parent | **SILENT** (already off) |
| `quest_milestone` | parent | **SILENT** (already off) |

> ⚠️ `parent_engagement` and `family_joined` **stop pushing** under this model. They remain in the bell. Adi blessed this in-session.

### C. Own-device kid notifications — age-gated
- **6-12:** parent decides via "Reminders for my child". **Default OFF.**
- **13-18:** the kid decides on their own device (their own one-time prompt, framed "your parent set BUFF up — want reminders?"). Parent toggle does not override a teen's choice.
- The kid's physical device still needs its own OS grant regardless; the toggle is the *policy*, the OS grant is the *capability*.

### D. anchor_recovery — churned only, graduated threshold
Fires to the parent when ALL hold:
- Child **has at least one `daily_progress` ever** (NEW gate — excludes never-activated).
- No `daily_progress` within the graduated window:
  - kid with **< N established completions** → **3 days**;
  - kid **established (≥ N completions)** → **5 days**. (N defined in Open Q1.)
- Family ≥ 7 days old, not in Pause Mode, no `anchor_recovery` for this kid in last 7 days.
- New guard: stop after **2-3 consecutive nudges** with no return (Open Q3) — don't nag a truly-churned family forever.

### E. activation_nudge (NEW) — never-activated only
Fires to the parent when ALL hold:
- Child has **zero `daily_progress` ever**.
- Family is **2-14 days old** (Decision L5: warm window; don't resurrect long-dead onboards).
- Not in Pause Mode; one nudge per family (dedup across duplicate child profiles — see Risk R2); no prior `activation_nudge`.
- Copy = first-step invitation (Open Q2 copy).

### F. child_suggestion — fixed
- Added to the parent recipient set in the Edge Function (recipient = `parent_id`).
- Copy (HE): **`{child_name} רוצה להציע משהו 💡`**, body = the suggestion title (`entity_name`). EN: **`{child_name} has a suggestion 💡`**.

### G. Cohort scoping
- Both crons skip profiles whose family has **no installed device** (no `device_tokens` row anywhere in the family) — optional, reduces ghost rows; OR at minimum the dispatcher already suppresses as `no_tokens` (status quo safety net).
- Timezone: store a per-family/per-profile tz; cron fans out per local 09:00. **Deferred trigger** — only activate when the English-first market goes live (Open Q5). v1 keeps fixed Israel clock but the column lands now.

---

## Schema Changes (proposed — CC verifies in Plan Mode)

- **Notification preferences** (parent-owned). Minimal: add to `app_settings` (family-scoped) —
  - `notif_parent_alerts boolean default true`
  - `notif_child_reminders boolean default false`
  - `notif_anchor_nudges boolean default true`
  - `notif_activation_nudges boolean default true`
  - For 13-18 own-device kids, a per-profile `notif_self_optin boolean` on `profiles` (kid-owned).
- **`notifications.type`** — plain text, no enum (verified in anchor-recovery SPEC). `'activation_nudge'` insertable with no migration.
- **Timezone column** (deferred use): `families.tz text` or `profiles.tz text`.
- **anchor_recovery nudge counter** (for the stop-after-N guard): reuse a count over existing `notifications` rows rather than a new column, if possible.

No new tables expected. CC confirms exact shapes via `list_tables` before Phase 1.

---

## Open Questions for Adi (most decisions already locked below)

- **OQ1 — "established" threshold N:** how many lifetime completions makes a kid "established" (→ 5-day window instead of 3)? CC rec: **N = 5 completions.**
- **OQ2 — activation_nudge copy:** CC draft (HE): *"{child_name} עוד לא התחיל/ה — בואו ננסה צעד ראשון קטן ביחד."* Needs Adi voice-check (Pillar 2).
- **OQ3 — anchor stop-after-N:** stop nudging after **2** or **3** consecutive no-return nudges? CC rec: **3**.
- **OQ4 — canonical anchor copy:** keep deployed *"לקח/ה הפסקה…"* or restore SPEC-approved *"כולנו צריכים התחלה חדשה…"*? CC rec: **restore the SPEC-approved line** (it was the Pillar-2-vetted one).
- **OQ5 — per-timezone scheduling:** land the column now, activate at English-market launch? CC rec: **yes**.

## Decisions Locked (2026-06-08, in-session with Adi)

| ID | Decision |
|---|---|
| **L1** | Parent-owned model: one-time two-toggle prompt; never auto-nag; always fixable from Settings + deep-link when OS-denied. |
| **L2** | Graduated inactivity: 3 days for barely-established, 5 days for established kids. |
| **L3** | `anchor_recovery` stays PUSH but under its **own** parent sub-toggle (not forced onto the main "alerts to me" channel). |
| **L4** | Own-device kids: **6-12 parent decides (default OFF); 13-18 kid decides.** |
| **L5** | `activation_nudge` window = **family 2-14 days old**; fires day 2 of zero-activity. |
| **L6** | Push = action-required only. `parent_engagement` + `family_joined` become **silent/bell-only**. |
| **L7** | `child_suggestion` copy approved: `{name} רוצה להציע משהו 💡` + suggestion title in body. |
| **L8** | Split churned (`anchor_recovery`, ever-active gate) from never-activated (`activation_nudge`). |

**Banned user-facing strings (grep gate):** `פספסת` · `החמצת` · `לא הצליח` · `כבר X ימים` · `מאחור` · `missed` · `failed` · `inactive` · `behind`.

---

## Proposed Phased Chunks

- **Phase 0** — This SPEC + supporting files; schema verification via MCP; confirm exact column shapes + the `child_suggestion` / `parent_engagement` / `family_joined` live behavior. No code.
- **Phase 1** — Edge Function: `child_suggestion` recipient + copy (L7); action-required vs INFO gate (L6). Pure server; testable via row-insert + log.
- **Phase 2** — Crons: `scan_for_anchor_recovery` ever-active gate + graduated threshold (L2, L8); new `scan_for_activation_nudge` (L5, L8). Test via SQL simulation against the real testers above.
- **Phase 3** — Preferences schema + Edge Function preference checks (L1 server side; L3 sub-toggles).
- **Phase 4** — Client: denial-recovery banner + deep-link; one-time two-toggle prompt; Settings → Notifications screen (L1).
- **Phase 5** — Age-gated kid registration (L4) + shared-device routing fix (the hard part; needs Hat-4 two-profile test).
- **Phase 6** — i18n (EN+HE), Values Check verification, banned-string grep gate, tests, canonical doc sync, close.

---

## Risks

- **R1 — Shared-device routing (Phase 5)** is the highest-uncertainty item; must be verified on a real device with parent+kid profiles, not by code review.
- **R2 — Duplicate child profiles** (known ChildJoin orphan-dup bug) → double activation nudges (seen live: Buff Demo "Test Child" ×2). Dedup at cron level by (family_id, child_name) or ride the existing dup-guard fix.
- **R3 — Behavior change visibility:** silencing `parent_engagement` / `family_joined` changes what parents currently get. Document in release notes.
- **R4 — Copy drift** between deployed anchor copy and the anchor-recovery SPEC (Open Q4) must be resolved or it re-drifts.

---

## Brief for the receiving CC session

```
Plan Mode. Picking up pkg/notifications-hardening.
Read FIRST: CLAUDE.md · docs/WORKFLOW.md · docs/BUFF_VALUES.md ·
  docs/sessions/notifications-hardening/SPEC.md (this file) ·
  docs/sessions/anchor-recovery/SPEC.md (shipped; this package modifies its cron) ·
  docs/sessions/child-suggest/migration.sql (child_suggestion trigger) ·
  supabase/functions/push-notification-fanout/index.ts ·
  src/components/NotificationGate.tsx · src/hooks/usePushRegistration.ts · src/lib/pushTokens.ts
Then via Supabase MCP: list_tables (app_settings, profiles, notifications, device_tokens,
  daily_progress); read scan_for_anchor_recovery + scan_disengaged_users bodies.
Resolve OQ1-5 with Adi. All copy = Pillar-2 critical. Chunk-by-chunk; no code until Phase 0 approved.
Do NOT touch bell-feed rendering (pkg/parent-notification-feed owns it).
```

---

**End of SPEC.**
