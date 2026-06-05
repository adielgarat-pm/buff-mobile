# TESTS — child-login-stable-identity

Mostly manual emulator tests (Adi runs on Android emulator), plus DB count checks via Supabase. Use a dedicated **test family**, not real users.

---

## Phase 0 — Investigation
- [ ] CC's plan names the exact file/line generating the synthetic `@buff.app` email. (pass = file:line cited, grep-verified)
- [ ] CC's plan describes how the device identifies the child. (pass = concrete answer, not a guess)
- [ ] Adi approved the fix approach in writing.

## Phase 1 — Fix login resolution
- [ ] **No-duplicate-on-relogin:** log in as test child → note `auth.users` count + `profiles` count for the family → log out → log in again as same child → counts **unchanged**. (pass/fail)
- [ ] **Lands on right data:** after second login, the child sees the same tasks/rewards/BUDDY as the first. (pass/fail)
- [ ] **New device:** logging in as the same child on a second emulator/profile resolves to the same profile (no new rows). (pass/fail)
- [ ] **First-time link:** a child profile with `user_id = NULL` gets exactly one auth user linked on first login; second login reuses it. (pass/fail)

## Phase 2 — Guardrail
- [ ] **Repro is dead:** re-running the original duplicate-producing path creates **0** new `auth.users` and **0** new `profiles` rows. (pass/fail)
- [ ] **No crash:** if a guard/constraint blocks a duplicate, the app handles it gracefully (no white screen / unhandled error). (pass/fail)

## Every phase (exit)
- [ ] STATUS.md updated (state, date, commit, tests, learnings link)
- [ ] Canonical docs synced per SPEC_SYNC.md
- [ ] Values Check still passes against implemented behavior
- [ ] Anything surprising appended to INTEGRATION_LEARNINGS.md

---

## v2 additions

### Phase 0 gates
- [ ] Identity model decided (own-auth vs shared-session), with code evidence cited.
- [ ] Recommendation on keeping vs reverting Liah's relink.
- [ ] RLS impact enumerated, incl. sanity-check that Liah's relink didn't break access / leak data.

### Live test (Noa, in progress)
- [ ] Noa creates/enters as a child → confirm **no** new `auth.users` row and **no** new `profiles` row appears. (This is the real-world repro check.)

### Phase 1 integrity
- [ ] Forced double/concurrent entry creates 0 second rows (constraint rejects cleanly, no crash) — proves the fix isn't just a client-side check with a race window.
