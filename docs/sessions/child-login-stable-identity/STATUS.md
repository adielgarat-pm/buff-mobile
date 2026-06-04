# STATUS — child-login-stable-identity

**Legend:** ⬜ not started · 🟨 in plan · 🟦 in progress · ✅ done · ⛔ blocked

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 0 — Investigation (credential retrieval) | ⬜ | | | | |
| 1 — Idempotent resolve + integrity | ⬜ | | | | |
| 2 — Observability + backstop | ⬜ | | | | |

## Notes
- 2026-06-04: Package drafted (v2 after architect/PM review).
- 2026-06-04: Liah's profile `74638016` relinked to auth `b1b98417` — **CONFIRMED kept.** Noa's 05:30 login signed INTO the existing auth user (not a signup), reached the profile, 14 tasks intact. Model = own-auth.
- 2026-06-04: Deleted approved test leftovers `ליה2` (3f421164) and `ליהT` (23066a70) from family a29f83d9. Verified: family now has 1 child. NO ACTION FKs (child_suggestions, email_logs, stickers) cleared manually; rest cascaded.
- 2026-06-04: Blast radius — 97 child profiles, 60 with user_id NULL, 6 synthetic @buff.app auth users, 1 family w/ same-name child dupes (cleaned).
- Noa: approved closing leftovers; will create new child to live-test whether login spawns a new account; asked whether family code is the unique matcher (answer: unique per family, not per child).
- 2026-06-04: Noa's re-login test PASSED (no new account) but ran on a device holding the session. Remaining bug = new-device/credential-retrieval; that is the decisive repro for Phase 0.
- 2026-06-04: RLS investigated (read-only) — see RLS_FINDINGS.md. Liah relink VERIFIED healthy (resolves to her family + profile, 1:1 uid, no leak). profiles.user_id already unique-enforced. Orphan/login split: 35 child profiles with login, 60 without.
- 2026-06-04: SEPARATE security finding surfaced (out of scope): wide-open policies on profiles/families/buddy_relationships. Recommend an `rls-tighten` package. Awaiting Adi triage.
