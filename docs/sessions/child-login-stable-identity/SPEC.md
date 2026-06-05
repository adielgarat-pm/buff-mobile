# SPEC — child-login-stable-identity

> **Status:** DRAFT v2 for Adi review. Target state only — no implementation. CC resolves the "how" in Plan Mode.
> **v3 changes:** identity model RESOLVED to own-auth (Noa's sign-in test); Liah relink CONFIRMED kept; bug refocused on credential retrieval / new-device; idempotent find-or-create + constraint in core fix; RLS workstream; blast-radius; Values Check reclassified.

---

## Liah fix — CONFIRMED (keep the relink)

Noa's live test (2026-06-04 05:30) signed **into** the existing auth user `b1b98417` (`last_sign_in_at` advanced — a sign-in, not a signup), reached profile `74638016` with all 14 tasks, no new rows. **The relink is correct and is kept.** This also resolves the identity-model question: it is **own-auth** (a child has their own `auth.users` row that login signs into), NOT shared-session.

**Remaining risk (the actual bug):** Noa's test ran on a device that already held the account's session/credentials, so it signed in. The original duplicate almost certainly occurs when credentials are **not retrievable** — a new device, a cleared session, or first-ever entry — where the flow fails to find the existing account and falls back to **signup**. The 60 `user_id = NULL` child profiles fit this: children created but never carried through login on a device. The decisive repro is therefore the **new-device case**, not re-login.

---

## Capabilities & Bottlenecks

- **Claude.ai can:** read/write production DB via Supabase MCP (used to diagnose, repair Liah — since confirmed, and delete test leftovers). **Cannot** read the buff-mobile repo code.
- **CC will:** inspect the actual login/auth code + Supabase config + RLS, confirm the identity model, implement the fix in `pkg/` branch under Plan Mode.
- **Adi must:** commit this folder, decide the identity-model question with CC's input, approve plans, run emulator tests, merge.
- **Bottleneck:** the intended child-access model is unknown from outside the code. Phase 0 must settle it before any fix.

---

## Evidence (buff-production, 2026-06-04)

1. Child logins use **synthetic emails** `{random}@buff.app`. On Liah's login a fresh auth user + fresh profile were created instead of reusing hers.
2. **60 of 97 child profiles have `user_id = NULL`** — i.e. most children have no own auth identity. This is the key signal about the intended model.
3. `families.short_code` is **unique per family** (201/201, no dupes) — but it identifies the FAMILY, not the child. **16 families have >1 child**, so family code alone cannot resolve which child logs in.
4. True same-display-name duplicate children exist in only **1 family** (was Adi's test family; now cleaned). So duplicate-children is NOT a widespread production problem — the recurring-new-user behavior is the real risk.
5. Liah's real profile held the data (14 tasks / 5 rewards / credit); the rename debris (`ליה2`,`ליהT`) was deleted with Noa's approval.

**Root-cause hypothesis (CC to confirm):** a login/entry flow performs a *signup* with a freshly generated credential instead of resolving to the existing child under the existing session.

---

## THE central question — RESOLVED: own-auth. Now: credential retrieval

The identity model is **own-auth** (login signs into the child's existing `auth.users` row — confirmed by Noa's sign-in test). Child profiles keep their own `user_id`; Liah's relink stays.

The real defect is **credential retrieval on a device that doesn't already hold the session.** When the flow can't reconstruct/look up the child's existing credentials, it signs up a new account instead of signing into the existing one.

- Fix direction: make the child's credentials **deterministically derivable or server-resolvable** from a stable selector (family code + child-level id), so any device signs **into** the existing account.
- CC confirms in code: how credentials are generated/stored today, and why a fresh device can't retrieve them.

---

## Goals

1. A child entering the app **never** spawns a duplicate auth user or duplicate profile, on any device, on re-entry.
2. The child reliably reaches the **same** profile (tasks/rewards/BUDDY) every time.
3. Resolution keys off a **stable selector** (family code + a child-level identifier), never a freshly generated value.
4. Existing already-split accounts are **not made worse** by the new logic.

## Non-goals

- Parent auth, OAuth, magic-link flows.
- Mass cleanup of the 60 orphan profiles (likely children who never completed login on a device, not duplicates — see Data note).
- Any BUDDY / rewards / tasks behavior change.

---

## Behavior contract (model-agnostic)

- **Entry as a child** resolves to the *specific existing* child profile via {family code → child-level selector}, then attaches to whatever auth context the chosen model dictates. No new `auth.users` row and no new `profiles` row for an already-existing child.
- **Re-entry (same or new device)** → same profile. Idempotent: repeating the entry path is a no-op on row counts.
- **First-ever entry for a freshly created child** → at most ONE identity/link is established, then reused. Never re-minted.
- **Already-split child (legacy duplicates)** → new logic must pick deterministically and not create yet another; merge/cleanup is a separate data task.

---

## Schema / integrity (now in-scope for the core fix, not an afterthought)

App-logic alone is insufficient — a check-then-create has a race window (TOCTOU). NOTE (from RLS_FINDINGS): `profiles.user_id` is ALREADY unique-enforced, so the gap is preventing a duplicate **`auth.users`** at signup — not profile-link uniqueness. CC evaluates, in Plan Mode:
- A **child-level stable identifier** so the same (family, child) resolves to the existing account instead of signing up a new one.
- Whether resolution belongs in a DB function / server endpoint that signs into the existing account, rather than client-side find-then-signup.
- Any constraint must be scoped per-family (names repeat across families), never global on display_name.

No migrations written here; CC produces them in plan phase.

## RLS (explicit workstream) — investigated, see RLS_FINDINGS.md

- **Liah relink verified healthy:** her auth resolves via `get_my_family_id()` + the child subquery to profile `74638016` / family `a29f83d9` (her 14 tasks); exactly one profile maps to her uid. No broken access, no leak.
- **Resolution keys on `user_id = auth.uid()` → profile → family.** Child-scoped policies require the child to have their own auth row — consistent with own-auth; the 60 orphans can't self-serve until login works.
- **`profiles.user_id` is already unique-enforced** (and 0 auth users map to >1 profile). So Phase 1 integrity must target **not creating a duplicate `auth.users` at signup** — profile-link uniqueness already exists; don't re-solve it.
- **Separate security findings (OUT OF SCOPE, surface to Adi):** several policies are wide-open (`profiles` SELECT `true`; `families` UPDATE `true`; `buddy_relationships` SELECT `true`) — cross-family read + any-user family modification. Higher severity than this bug; recommend a separate `rls-tighten` package. Do not fold in or fix unilaterally.

## UI changes

If the correct model needs a child-selection / code-entry step that doesn't exist, that is an **open question for Adi**, not an assumption.

---

## Values Check (BUFF_VALUES.md) — RECLASSIFIED

Earlier draft scored this a clean neutral PASS. That was wrong.

**Pillar 2 — Positive Coaching, Q6 ("is there a BUDDY suffers/leaves mechanic?"):** when a child is dropped onto a new empty profile, they **lose their BUDDY relationship level and accumulated BUFFs**. That is the exact "BUDDY leaves / progress wiped" anti-pattern the values forbid — happening *by accident, in production*. So this package is **fixing an active values violation**, not neutral infra.

- Pillar 1 (Intrinsic Motivation): protects earned rewards/progress → **strongly supports**. ✅
- Pillar 2 (Positive Coaching): **removes an accidental punishing mechanic.** ✅ (this is the point of the package)
- Pillar 3 (Independence): neutral/permanent infra. ✅

**Result: PASS, and elevated priority** — restoring affected children's data is part of the goal, not optional. CC re-verifies against implemented behavior at phase exit.

---

## Blast radius (for prioritization)

- 97 child profiles; 60 with no linked auth; 6 synthetic `@buff.app` auth users; 1 family with same-name child duplicates (cleaned).
- Interpretation: widespread *duplication* is not yet happening, but the *mechanism* that caused Liah will hit any child who uses the affected entry path. Treat as a real fix, not cosmetic. Add lightweight **observability** (log/alert when a child entry creates an auth user or profile) so recurrence is caught without waiting for a Noa report.

---

## Open questions (for CC plan phase — do NOT pre-resolve)

1. How are the child's synthetic credentials generated and **stored/retrieved** today? Why can't a fresh device reconstruct them? (grep `@buff.app`, `signUp`, `signInWith`, credential storage.)
2. Can credentials be made **deterministic from a stable selector** (family code + child id) or resolved server-side, so any device signs in? Trade-offs/security?
3. What child-level selector exists below family code (PIN / avatar pick / stored binding)? Cite code.
4. RLS impact of the resolution path; confirm Liah's relink didn't break access or leak data.
5. Where should idempotency live (DB function / unique constraint) to close the signup-race window?

## Out of scope (explicit)

- Mass orphan cleanup / user deletion beyond approved test leftovers (data task, separate, with Adi/Noa sign-off).
- Parent auth and non-auth features.
