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

In this order, every time:

1. **`CLAUDE.md`** (this file)
2. **`docs/WORKFLOW.md`** — three-party loop, Plan Mode rules, exit deliverables
3. **`docs/BUFF_VALUES.md`** — three product pillars + Values Check (mandatory before any feature work)
4. **`docs/sessions/{slug}/SPEC.md`** — target state for the active package
5. **`docs/sessions/{slug}/SPEC_SYNC.md`** — which canonical docs to update per phase
6. **`docs/BUFF_DECISIONS_LOG.md`** — recent decisions that may affect this work
7. Relevant docs for the task (BUFF_BUDDY_SYSTEM.md, BUFF_GAP_ANALYSIS.md, etc.)

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
- **Distribution:** Internal testing on Google Play Console (currently). EAS Build / Submit decision pending DevEx session.
- **Language:** TypeScript
- **State management:** [verify in code — likely Zustand or Context]
- **Navigation:** React Navigation
- **Future:** RevenueCat (subscriptions), Sentry/Crashlytics (observability), FCM (notifications)

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
- **User-facing app strings:** Hebrew (BUFF is Israel-first MVP)

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

## Open FLAGs (last updated: 2026-05-03)

These are unresolved items tracked in `docs/INTEGRATION_LEARNINGS.md`. CC should be aware of them but not act on them without an Improvement Package:

- 🚩 **Onboarding fixes** in Claude.ai's memory (not yet in GAP_ANALYSIS): date picker, "Homework & focus" rename, Section B in Step 3, ScrollView, duplicate options between Steps 2-3
- 🚩 **Invite Link Option B** (deep link `buff://join/:code`, post-RevenueCat)
- 🚩 **Code still uses age range 13-15** for Teen Mode auto-detection. Update to 13-18 pending in dedicated session ("Age Range Update")
- 🚩 **buffadhd.com (public site)** — title still references Executive Function. Marketing alignment session pending.
- 🚩 **BUFF_BUDDY_SYSTEM.md** is target-spec V0.5; current code implements an earlier, simpler version. Reconciliation deferred to BUDDY implementation session.

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

**Last reviewed:** 2026-05-03
**Maintained by:** Adi + Claude.ai (web)
**Read by:** Claude Code (CC) at every session start
