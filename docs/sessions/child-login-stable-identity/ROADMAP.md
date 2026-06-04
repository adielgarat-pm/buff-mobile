# ROADMAP — child-login-stable-identity (v2)

Ships chunk by chunk under Plan Mode. Stop conditions are concrete and measurable.

---

## Phase 0 — Investigation (plan only, no code)

Model is settled (own-auth). CC reads the login/auth code + Supabase config + RLS and explains
**why a device without a cached session creates a new account instead of signing in** — i.e. how
credentials are generated/stored and why they can't be retrieved on a fresh device.

**Reproduce first:** confirm the bug on a NEW device / cleared session (not re-login). This is the
decisive repro.

**Deliverable:** finding citing file:line for the credential generation + auth call; root cause of
the failed retrieval; proposed deterministic/server-resolvable credential approach; RLS impact.

**Stop condition:** Adi approved the fix approach. No code yet.

---

## Phase 1 — Idempotent resolve + integrity (core fix)

Implement entry-as-child to **resolve the existing profile** under the chosen model, with an
**idempotency guarantee** (DB function/upsert + scoped unique constraint as CC proposes — NOT
client-side check-then-insert, to close the TOCTOU window). Includes the matching RLS changes.

**Stop condition (measurable):**
- On emulator, enter as the same test child **twice** (incl. once on a fresh device/session).
- `count(*) from auth.users` and `count(*) from profiles` for the test family are **unchanged**.
- The child lands on the same data both times.
- A forced concurrent/double entry does not create a second row (constraint rejects cleanly, no crash).

---

## Phase 2 — Observability + backstop

Add a log/alert when an entry-as-child path creates an `auth.users` or `profiles` row (should be
rare/never post-fix), so recurrence is caught without a user report.

**Stop condition:** triggering the (now-fixed) path emits the signal in logs; re-running the
original repro creates 0 new rows.

---

## Not a phase (data tasks, separate, with sign-off)

- **Revert Liah** to `user_id = NULL` if Phase 0 picks shared-session.
- **Orphan/duplicate review:** 60 child profiles with null user_id are likely normal under
  shared-session — do NOT mass-delete. Only true same-(family,name) duplicates get merged, per
  Adi/Noa decision. Handle via Supabase MCP with per-step approval.
