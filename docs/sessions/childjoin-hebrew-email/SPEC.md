# childjoin-hebrew-email — SPEC

> Fix: ChildJoin fails with "Unable to validate email address: invalid format"
> whenever the child's name contains non-ASCII (e.g. Hebrew) characters.
> Authoritative for this package. Updates canonical docs at close per SPEC_SYNC.md.

---

## Problem (verified 2026-06-02)

`ChildJoinScreen` builds a *synthetic* login email from the typed name:

```ts
// src/screens/auth/ChildJoinScreen.tsx (pre-fix)
const username = name.trim().toLowerCase().replace(/\s+/g, '_');
const email    = `${username}@buff.app`;
```

A Hebrew name (e.g. "ליה") yields `ליה@buff.app`. Supabase Auth rejects a
non-ASCII local part → `signUp` errors with *"Unable to validate email address:
invalid format"* → falls through to the generic `auth.signupFailed` alert
("ההרשמה נכשלה"). **Every Hebrew name fails deterministically.**

Real-world hit: Noa Morag (family `CWYNQB`) trying to connect "ליה". DB shows
3 unclaimed Hebrew orphan child profiles in that family (`ליה`, `ליה2`, `ליהT`),
all `user_id = null` — none ever succeeded, consistent with this bug.

---

## Values Check

Internal auth-plumbing fix, no child-facing copy or mechanic change.

- **Pillar 1 — Intrinsic Motivation:** N/A — no reward/motivation surface touched.
- **Pillar 2 — Positive Coaching:** N/A — no child-facing language; fix removes a
  failure state (child currently can't join at all with a Hebrew name).
- **Pillar 3 — Independence-Building:** N/A — onboarding plumbing only.

**Values Check Pass:** [x] yes — no pillar surface affected; net positive
(unblocks Hebrew-named children).

---

## Goals

- ChildJoin succeeds when the name contains Hebrew / non-ASCII characters.
- The derived email + password stay **deterministic** (returning child on another
  device signs in with the same name + code).
- **Zero regression** for existing successfully-joined (ASCII-named) children:
  their derived `username`/email/password must remain byte-identical.

## Non-goals

- Cleaning up the 3 existing Hebrew orphan profiles (Adi: **leave them** — 2026-06-02).
- Reworking the orphan-claim / preflight logic (owned by `childjoin-claim-orphans`).
- Switching kids off synthetic-email auth entirely.

## Behavior Contract

After this package:
- Name → `username` derivation:
  1. `rawUsername = name.trim().toLowerCase().replace(/\s+/g, '_')`
  2. `asciiUsername = rawUsername.replace(/[^a-z0-9_]/g, '')`
  3. `username = asciiUsername.length >= 2 ? asciiUsername : 'c' + <hex of rawUsername char codes>`
- Email = `${username}@buff.app` (now always RFC-valid ASCII).
- Password = `${username}_${code}_buff2026` (unchanged formula, new username feeds it).
- ASCII-only names: `asciiUsername === rawUsername`, so `username` is unchanged → no regression.
- Hebrew name "ליה": deterministic ASCII slug `c5dc5d95d4` → valid email, reproducible sign-in.

## Implementation

Single file: `src/screens/auth/ChildJoinScreen.tsx` — replaced the 2-line
`username`/`email` derivation with the ASCII-safe version above. The `signUp` /
`signIn` calls and `AuthContext` are untouched.

## Verification (2026-06-02)

- Logic table (node): `ליה`→`c5dc5d95d4@buff.app`, `Leia`/`leia`→`leia@buff.app`
  (unchanged), `Noa Morag`→`noa_morag@buff.app`, `דני`→`c5d35e05d9@buff.app`
  (distinct from ליה) — all match `/^[a-z0-9_]+@buff\.app$/`.
- `tsc --noEmit`: no errors in ChildJoinScreen.tsx.
- Pending: Hat-4 on-device join with a Hebrew name (Noa, evening 2026-06-02).

## Out of Scope

- Orphan profile cleanup.
- Accented-Latin names (e.g. "émilie"→"milie") lose the accent; acceptable —
  previously failed entirely, now valid; collision risk negligible for the market.
- Migrating any existing data.
