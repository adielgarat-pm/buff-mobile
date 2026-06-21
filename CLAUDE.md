# CLAUDE.md — Project Rules for Claude Code

> **This file is read FIRST by Claude Code in every session, before any task.**
> If a conflict arises between this file and a session's SPEC.md, surface it to Adi — don't resolve silently.

---

## Project: BUFF

ADHD support app for kids and teens (ages 6-18). React Native (Expo) on Android, with iOS planned for later. Team: Adi (PM/founder), Itay (15, Teen UI co-creator), Emi (9, future Children Mode persona).

**Current phase:** MVP. Pre-Play-Store. Active onboarding work.

**Repo:** github.com/adielgarat-pm/buff-mobile
**Local path:** `C:\Users\adiel\buff-mobile`

---

## Required Reading at Session Start

### Always — every session, in order

1. **`CLAUDE.md`** (this file)
2. **`docs/WORKFLOW.md`** — three-party loop, Plan Mode rules, exit deliverables
3. **`docs/BUFF_VALUES.md`** — three product pillars + Values Check (mandatory before any feature work)
4. **`docs/sessions/{slug}/SPEC.md`** — target state for the active package (if a session is active)
5. **`docs/sessions/{slug}/SPEC_SYNC.md`** — which canonical docs to update per phase (if a session is active)
6. **`docs/BUFF_DECISIONS_LOG.md`** — recent decisions that may affect this work

### Conditionally — based on session intent

7. **Feature / code sessions** — also load:
   - **`docs/BUFF_PRD.md`** — what the product is
   - **`docs/BUFF_BUDDY_SYSTEM.md`** — BUDDY mechanics (when touching BUDDY/Teen flows)
   - **`docs/BUFF_GAP_ANALYSIS.md`** — PRD ↔ code gaps
   - **`docs/INTEGRATION_LEARNINGS.md`** — long-term memory, open FLAGs

8. **Marketing / brand / copy / pitch / forum-reply sessions** — also load the **brand family**:
   - **`docs/BUFF_BRAND.md`** — identity, tagline hierarchy, tone of voice, visual identity
   - **`docs/BUFF_PERSONAS.md`** — 9 personas + emotional jobs mapping
   - **`docs/BUFF_MESSAGING.md`** — pitch library, hooks, forum replies, Reels & AI video prompts, Play Store copy
   - **`docs/BUFF_COMPETITORS.md`** — landscape map + forum reply ammunition
   - **`docs/BUFF_FAQ.md`** — canonical answers across all channels (when created)
   - **`docs/BUFF_FOUNDER_STORY.md`** — Adi/Itay/Emi origin (when created)
   - **`docs/BUFF_TESTIMONIALS.md`** — curated testimonial board (when created)

### How to recognize session intent (heuristic)

- **Marketing/brand session:** prompt mentions ads, social, Play Store, Reels, copy, persona, hooks, pitch, taglines, forum/Reddit/Facebook reply, brand, voice, founder story, testimonials, competitors. Load tier 8.
- **Feature/code session:** prompt mentions a feature name, a file path, a bug, a SPEC, a Phase, BUDDY, Onboarding, Vibe Check, etc. Load tier 7.
- **Hybrid (rare):** if both, load both. Loading is cheap; assumption errors aren't.

### Conflict rule (unchanged)

If a conflict arises between this file and a session's SPEC.md, surface it to Adi — don't resolve silently.

---

## Operating Rules — Non-negotiable

### Plan Mode

- **Always start in Plan Mode.** No code changes until Adi explicitly says `approved, proceed`.
- **No self-approved decisions.** Surface ambiguity, wait for clarification.
- **Inspect actual code AND platform configs** (`app.json`, `eas.json`, `package.json`, `metro.config.js`) before proposing. Specs may be stale.
- **No architecture beyond scope.** If you spot refactor opportunities, flag them and stop. Don't pull threads.
- **Plan ships chunk by chunk.** After each chunk: show diff, wait for approval, then continue.

### Exit Deliverables (every phase, same commit as code)

1. Update relevant canonical docs per the phase's row in `SPEC_SYNC.md`
2. Add row to `STATUS.md` with: state, date, commit hash, tests result, learnings link
3. If anything surprised you: append entry to `docs/INTEGRATION_LEARNINGS.md`
4. Verify Values Check still passes against the implemented behavior (not just the SPEC text)

### Values Check

- Every feature must pass the 9 questions in `docs/BUFF_VALUES.md` (3 questions × 3 pillars).
- The questions are answered in the SPEC at design time AND verified in TESTS at exit.
- **Failed any question → stop, don't proceed.** Surface to Adi.

### Platform Parity (Android + Web) — Non-negotiable

BUFF ships on **both Android (native) and Web (Expo Web PWA)**. **Every change must be valid for both platforms.** Never design or merge something that works on one side and silently breaks or skips the other.

- Where a platform API differs (updates, storage, notifications, files/camera, deep links), use a **platform-split file** (`x.android.ts` / `x.web.ts` / `x.ios.ts`) behind one logical contract — unify the *signal*, split the *action*.
- Native-only modules must never be imported into the web bundle (rely on Metro platform resolution / lazy import). This also guards launch-crash blind spots (IN-2026-06-17 / expo-audio).
- A change is not "done" until verified on **both** sides: Android (emulator/Hat-3) **and** Web (`npm run web` + preview tools).
- If a change genuinely cannot apply to one platform, state it explicitly and log why — never leave the other side undefined.
- _(Source: Adi standing rule, 2026-06-17.)_

### What You Don't Do

- ❌ Push to `main` directly. All work happens on a branch (suggested: `pkg/{slug}` or `eod-{date}` for non-package work).
- ❌ Force-push, rebase shared branches, or rewrite history.
- ❌ Update `BUFF_DECISIONS_LOG.md`, `BUFF_GAP_ANALYSIS.md`, or `BUFF_VALUES.md` unilaterally. These are Adi's docs. If you think they need an update, propose it and wait.
- ❌ Install npm packages without explicit approval (each new dependency is an Improvement Package, not a direct fix).
- ❌ Modify Supabase schema (RLS, tables, functions) without explicit approval.
- ❌ Make decisions about user-facing copy without checking BUFF_VALUES.md and surfacing to Adi.

---

## Read-only Snapshot Protocol

When asked for a snapshot, summary, status report, or read-only digest:

### Rule 1 — No synthesis without anchor
Every claim must have a source anchor:
- **Verbatim:** `> "exact text"` — `file.md §X` or line range
- **Citation only:** `file.md §X` (paraphrasing structure, not content)
- **Unanchorable:** under `UNVERIFIED CLAIMS` with reason

### Rule 2 — Volume warning
If asked for N items and produced < N/2, prepend:
`VOLUME WARNING: produced X of Y requested. Reasons: [...]`

### Rule 3 — Conflicts not resolved
Two sources contradict → list both verbatim under `CONFLICTS`. Do not resolve, pick, or interpret. Resolution is Adi's call.

### Rule 4 — No interpretive framing
No "urgently", "critical", "blocker", "needed", "expired", "behind schedule" unless the source uses those words verbatim. "Deadline May 1, today is May 3" is fine. "Deadline missed" is not.

### Rule 5 — Header inventory
Every snapshot opens with:
```
SNAPSHOT — [date]
Files read: [list + line counts]
Files requested but not read: [list + reason]
```

### Applies to
Any task with "snapshot", "summary", "status of", "where are we", "what's done", "what's left", or any digest of >1 file.

### Does NOT apply to
Direct factual questions with anchored answers, or phase execution under an existing plan.

---

## Verify-Before-Delete Protocol

Before deleting any branch (local or origin), CC must verify that the branch's content is present in `main`. This protocol is binding regardless of any verbal "merged" confirmation.

### Rule 1 — Verbal "merged" is not sufficient
A verbal confirmation from Adi (e.g., "merged", "done", "you can clean up") triggers the verification protocol. It does NOT directly authorize deletion.

### Rule 2 — Required verification before deletion
Before running any branch deletion command, CC must run and report:

```
git checkout main
git pull origin main
git log --all --oneline | grep "<branch-name>" | head -5
```

CC must then run a content verification specific to the package:
- For docs-only packages: `grep` for at least one unique string from each modified canonical file
- For code packages: verify file exists at expected path

If any verification fails: STOP. Do not delete. Report to Adi.

### Rule 3 — Both verifications must pass
Both the merge commit AND the content presence must be confirmed in `main` before deletion. A merge commit with no content (e.g., empty merge) still requires content verification.

### Rule 4 — Order of operations
The correct sequence after a "merged" confirmation:
1. `git checkout main && git pull origin main`
2. Run verifications (Rule 2)
3. Report results to Adi
4. Wait for explicit "verified, clean up" instruction
5. Only then run `git branch -d` and `git push origin --delete`

### Rule 5 — Force delete (`-D`) is forbidden
Never use `git branch -D` (force delete) without explicit approval from Adi for that specific deletion. The capital `-D` bypasses git's built-in merge protection and contributed to the 2026-05-04 incident.

### Applies to
All branch deletion operations, including:
- Package cleanup after merge
- Removing recovery branches
- Removing experimental branches
- Any `git branch -d`, `git branch -D`, or `git push origin --delete` command

### Does NOT apply to
- Reading branch state (`git branch -a`, `git log <branch>`)
- Creating branches (`git checkout -b`)
- Pushing to existing branches

### Reference
Incident 2026-05-04 (see `docs/INTEGRATION_LEARNINGS.md` § Lesson 2026-05-04).

---

## Delegation: CC-First Investigation

Adi's time is the bottleneck, not CC's. Default to giving CC autonomous tasks rather than walking Adi through manual steps.

### Route through CC (don't ask Adi):
- Reading files, running commands (`npm`, `git`, `build`, `grep`, `ps`, `kill`)
- Editing code, applying fixes, committing
- Killing/restarting dev servers, finding zombie processes
- Searching `node_modules`, configs, logs, env vars
- SQL via Supabase MCP (when connected)
- Adding/removing diagnostic logs

### Ask Adi only for things only she can do:
- Browser interactions and UI screenshots (final verification only)
- GitHub UI (merge button, PR review when no `gh` CLI)
- Supabase Dashboard manual SQL (when MCP unavailable)
- Strategic / product decisions
- Account-bound operations (email, payments, etc.)

### Anti-pattern detector
If Claude.ai is about to send Adi a 3+ step procedure involving terminals, file viewers, or DevTools — STOP. Write a CC prompt instead.

### CC prompt template

### Origin
2026-05-08 Phase 3 debug session. Claude.ai over-routed through Adi for ~3 hours during the supabase-js deadlock investigation (running SQL queries, F12 navigation, screenshots, manual button clicks) instead of delegating to CC. Adi explicitly redirected: "תמיד דרך CC לכל דבר שהוא יכול מבלי לשאול אותי קודם". Rule extracted same session.

---

## Environment

- **OS:** Windows 11
- **Editor:** VS Code with Claude Code Extension (Anthropic, verified)
- **Shell:** PowerShell / CMD (not bash). Use `type` instead of `cat` to read files in terminal.
- **Working directory:** `C:\Users\adiel\buff-mobile`
- **Path style:** Forward slashes in code (`src/screens/...`), backslashes in shell commands when Windows-native (`C:\Users\adiel\...`).

---

## Tech Stack

- **Framework:** React Native via **Expo** (managed workflow)
- **Backend:** Supabase (PostgreSQL + RLS + Auth)
- **Auth:** Google OAuth (D-2026-04-28 — configured and signed)
- **Distribution:** Internal testing on Google Play Console; first production AAB v10 shipped 2026-05-25 (`pkg/sentry-eas-resumption` PR #85). EAS Build production profile is live; EAS Submit (Google Play service account JSON) deferred to a future package.
- **Dev server / emulator:** ONE shared emulator (`Pixel_7`) → one Metro on canonical port 8083, guarded by a lease lock. Any session needing the emulator goes through the **buff-emulator skill**: `source .claude/skills/buff-testing/helpers.sh && metro_acquire` (reuses a healthy Metro, or reports `⛔ EMULATOR BUSY` if another session holds it). `metro_release` when done. Never hand-run `npx expo start` on a random port. See `docs/DEV_SERVER_LIFECYCLE.md`.
- **Language:** TypeScript
- **State management:** [verify in code — likely Zustand or Context]
- **Navigation:** React Navigation
- **Observability:** Sentry (`@sentry/react-native@~7.2.0`, project `buffadhd/react-native`) — crash monitoring with source-map symbolicated stack traces, aggressive PII scrubbing (`beforeSend` strips user.email/username/ip_address, `beforeBreadcrumb` regex-redacts emails to `[email]`) per Pillar 2 children's-app requirement. Dev profile DSN-less (init no-op, zero free-tier quota burn). See `App.tsx` + `eas.json`. EAS secret `SENTRY_AUTH_TOKEN` is Secret-type (build-only, not accessible via `eas env:exec`).
- **Future:** RevenueCat (subscriptions), FCM (notifications)

---

## Documentation Discipline

The repo maintains a strict **canonical docs** philosophy. See `docs/WORKFLOW.md` § "Canonical Docs" for the full list.

**The hierarchy when there's a conflict:**

1. **Active session SPEC.md** wins during the package
2. **Canonical docs** (PRD, BUFF_VALUES, BUDDY_SYSTEM, etc.) are authoritative once the package closes
3. **Code** is ground truth when canonical docs and code disagree (then trigger Spec Sync)
4. **DECISIONS_LOG** is the historical record — never overwritten, only appended to

**Spec drift policy:** If you notice the code does X and the canonical doc says Y, do not silently pick one. Flag it to Adi as a possible Spec Sync need.

---

## Language and Communication

- **Code, comments, commit messages:** English
- **Documentation:** Mixed Hebrew/English as already established (PRD English, DECISIONS_LOG Hebrew, etc.)
- **Plans and explanations to Adi (in Claude Code chat):** English (Adi reads English fluently; clipboard issues with Hebrew are why we moved to VS Code)
- **User-facing app strings:** English-first (BUFF goes to market in English-speaking countries first; Hebrew is a secondary locale). Current code still ships Hebrew strings — the default-language flip to English is a future change.

---

## Commit Message Format

```
{type}({slug}): {description}

{body if needed}
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

**Examples:**
- `feat(devex): add EAS Build profiles for internal testing`
- `fix(onboarding): replace text input with native date picker`
- `docs: add D-2026-05-03-30 — DevEx session decisions`

---

## Files Never Committed

These are in `.gitignore` (or should be):

- `node_modules/`
- `.expo/`
- `*.log`
- `.env` and `.env.local`
- `.claude/settings.local.json` — local Claude Code settings, changes per session
- `android/app/build/` and `ios/build/`
- `*.keystore` (signing keys — CRITICAL)

If any of these show up in `git status` as untracked, **add them to `.gitignore` immediately**, don't commit them.

---

## Open FLAGs (last updated: 2026-05-25)

These are unresolved items tracked in `docs/INTEGRATION_LEARNINGS.md`. CC should be aware of them but not act on them without an Improvement Package:

- 🚩 **Onboarding fixes** in Claude.ai's memory (not yet in GAP_ANALYSIS): date picker, "Homework & focus" rename, Section B in Step 3, ScrollView, duplicate options between Steps 2-3
- 🚩 **Invite Link Option B** (deep link `buff://join/:code`, post-RevenueCat)
- 🚩 **Code still uses age range 13-15** for Teen Mode auto-detection. Update to 13-17 pending in dedicated session — flag F-2026-05-03-03 currently marked CLOSED-STALE pending Teen Mode UI start (which is happening now via Gamer mode rollout — needs revisit)
- 🚩 **buffadhd.com (public site)** — title still references Executive Function. Marketing alignment session pending.
- 🚩 **BUFF_BUDDY_SYSTEM.md** is target-spec V0.5; current code implements an earlier, simpler version. **`pkg/buddy-v05-backend` is the proposed unblock package** — see INTEGRATION_LEARNINGS IN-2026-05-14-01.
- 🚩 **ChildJoin creates duplicate profiles** when an orphan profile already exists for the same name + family. See IN-2026-05-14-03. Proposed package: `pkg/childjoin-claim-orphans`.
- 🚩 **`pkg/fix-runtime-theme-switch` (PR #41) verified via code only** — web preview was unreliable; Adi to verify on Android emulator the Mint↔Gamer toggle works without blanking the tab bar.

**Resolved since last update:**
- ✅ **Sentry crash monitoring + first production AAB v10** → `pkg/sentry-eas-resumption` (PR #85, merge `20fa598`, 2026-05-25). Recovered the 2026-05-16 work that was lost when `pkg/expo-health-and-eas-android` + `pkg/sentry-crash-monitoring` branches were deleted without merge. See D-2026-05-25-01, D-2026-05-25-02, IN-2026-05-25-02.
- ✅ **expo-doctor 4 failures resolved** (F-2026-05-05-01) → same package, Phase 1 (commit `8e78ba1`).
- ✅ Paywall CTAs visible to children (IN-2026-05-14-02) → `pkg/hide-paywall-from-child` (PR #40)
- ✅ Pause Mode (was a critical-MVP open item) → shipped via pkg/pause-mode PRs #22-25
- ✅ Pet Skin picker UI + Wolf as Gamer day-0 default → PR #27

---

## When in Doubt

Ask Adi. The cost of asking is 30 seconds; the cost of guessing wrong is hours of rework or worse — silent drift from product values.

**Specifically ask when:**
- A SPEC item could be interpreted multiple ways
- You see code that contradicts the SPEC and you're not sure which is right
- A "small fix" you're tempted to make is outside the package's stated scope
- You're about to install a dependency, modify schema, or change auth flow
- A user-facing string feels off but you can't articulate why

---

**Last reviewed:** 2026-05-14
**Maintained by:** Adi + Claude.ai (web)
**Read by:** Claude Code (CC) at every session start
