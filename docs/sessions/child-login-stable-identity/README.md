# Session: child-login-stable-identity

> **Status:** Ready to run — SPEC v3 (model resolved: own-auth)
> **Type:** Bug fix (auth / child-login identity)
> **Branch:** `pkg/child-login-stable-identity`
> **Triggered by:** Noa reported that logging in as a child (Liah) created a NEW user instead of connecting to the existing one (2026-06-04).

## What this package fixes

The child-login flow mints a **fresh synthetic email** (`{random}@buff.app`) and a **new profile** on every login, instead of resolving to the child's existing profile and reusing the already-linked auth user. Result: duplicate auth users + duplicate orphaned child profiles, and the child loses access to their accumulated tasks/rewards/BUDDY progress.

This was confirmed live in `buff-production` on 2026-06-04 (see SPEC.md → Evidence). The specific Liah instance was repaired manually via relink; **this package fixes the cause so it stops recurring.**

## Out of this package (handled elsewhere)

- Cleanup / deletion of existing orphaned child profiles (`ליה2`, `ליהT`, etc.) — **on hold pending Noa's data decision.** Not a code change.

## Execute sequence

1. Adi commits this folder to `docs/sessions/child-login-stable-identity/` via CC.
2. Run **Phase 0 (Investigation)** prompt → CC reports root cause in Plan Mode. Adi approves approach.
3. Run **Phase 1 (Fix login resolution)**.
4. Run **Phase 2 (Guardrail)**.

See `STATUS.md` for live state. Phase prompts are in `PHASE_PROMPTS.md`.

## Also in this folder
- `DECISION_DRAFT.md` — copy-ready proposed entries for BUFF_DECISIONS_LOG.md (your file; not auto-edited).
