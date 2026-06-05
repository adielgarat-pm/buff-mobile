# STATUS — child-login-stable-identity

**Legend:** ⬜ not started · 🟨 in plan · 🟦 in progress · ✅ done · ⛔ blocked

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 0 — Investigation (credential retrieval) | ✅ | 2026-06-04 | 8912796 | finding written (root cause = name-keyed creds, NOT random) | see notes 2026-06-04 |
| 1 — Idempotent resolve + integrity | 🟦 code-complete, pending Hat-4 | 2026-06-04 | b24f154 | RPC live-tested; tsc clean; creds logic 7/7 incl. real-data match | see notes 2026-06-04 |
| 2 — Observability + backstop | 🟦 code-complete, pending Hat-4 | 2026-06-04 | 9f8f2a2 | [ChildEntry] logs at each branch; tsc clean | see notes 2026-06-04 |

## Notes
- 2026-06-04: Package drafted (v2 after architect/PM review).
- 2026-06-04: Liah's profile `74638016` relinked to auth `b1b98417` — **CONFIRMED kept.** Noa's 05:30 login signed INTO the existing auth user (not a signup), reached the profile, 14 tasks intact. Model = own-auth.
- 2026-06-04: Deleted approved test leftovers `ליה2` (3f421164) and `ליהT` (23066a70) from family a29f83d9. Verified: family now has 1 child. NO ACTION FKs (child_suggestions, email_logs, stickers) cleared manually; rest cascaded.
- 2026-06-04: Blast radius — 97 child profiles, 60 with user_id NULL, 6 synthetic @buff.app auth users, 1 family w/ same-name child dupes (cleaned).
- Noa: approved closing leftovers; will create new child to live-test whether login spawns a new account; asked whether family code is the unique matcher (answer: unique per family, not per child).
- 2026-06-04: Noa's re-login test PASSED (no new account) but ran on a device holding the session. Remaining bug = new-device/credential-retrieval; that is the decisive repro for Phase 0.
- 2026-06-04: RLS investigated (read-only) — see RLS_FINDINGS.md. Liah relink VERIFIED healthy (resolves to her family + profile, 1:1 uid, no leak). profiles.user_id already unique-enforced. Orphan/login split: 35 child profiles with login, 60 without.
- 2026-06-04: SEPARATE security finding surfaced (out of scope): wide-open policies on profiles/families/buddy_relationships. Recommend an `rls-tighten` package. Awaiting Adi triage.
- 2026-06-04: **Phase 0 finding (code-confirmed):** child creds are DETERMINISTIC, not random — `email=<ascii(typedName)>@buff.app`, `password=<name>_<CODE>_buff2026` (ChildJoinScreen.tsx:58-65). signUp runs FIRST; only falls back to signIn on "already registered". So any typed-name variance (Hebrew↔Latin/spelling) or the 2nd formula in SignupScreen.tsx:66 mints a NEW email → new auth user + orphan profile. SPEC's "random/non-retrievable" framing corrected. Prod confirms: c5dc5d95d4@buff.app→ליה, itay@buff.app→Itay, etc.
- 2026-06-04: **Phase 1 built (Adi-approved: pick-from-list + deterministic-from-profile-id + back-compat Option A).**
  - Migration 018 (live): `list_family_children(code)` anon RPC (id/display_name/avatar/linked, is_deleted excluded) + `link_child_profile(profile_id, code)` authed, race-guarded on user_id IS NULL. Smoke-tested: CWYNQB → Liah's profile 74638016.
  - Client: ChildJoinScreen reworked to 2-step (code → pick card); creds derived from profile id via `src/utils/childAuth.ts`. Per pick: stable signIn → (orphan) signUp+link → (legacy) signIn via creds reconstructed from DB display_name+code. New i18n keys (en+he): continue/childPickHelp/childJoinNoChildren/childEntryFailed.
  - Verified by CC: tsc --noEmit clean; locale JSON valid; cred logic 7/7 — incl. legacyChildCreds('ליה','CWYNQB')===c5dc5d95d4@buff.app = Liah's REAL prod auth email (proves legacy fallback signs the 35 linked kids in).
  - **Pending Hat-4 (Adi, emulator):** the auth round-trip (signUp/link/signIn) can't run on Expo web — Supabase blocks signUp to @buff.app emails on web. Stop conditions (no new rows on re-entry; lands on same data; new device → same profile) are emulator checks.
- 2026-06-04: Phase 2 (observability) NOT yet built — next chunk after Adi reviews 1a/1b.
- 2026-06-04: **Test run (buff-testing skill).** Hat-1 ✅ — `tsc --noEmit` clean; jest 134 existing + **7 new** `src/utils/__tests__/childAuth.test.ts` (commit `cb95d30`), incl. `legacyChildCreds('ליה','CWYNQB')===c5dc5d95d4@buff.app` (Liah's real prod auth email). DB read-path ✅ — `list_family_children('CWYNQB')` → Liah's profile.
- 2026-06-04: **Hat-3 E2E ✅ VERIFIED LIVE on emulator-5554** (Adi authorized taking over the shared emulator). Loaded the branch via Metro :8090, drove RoleSelection → "אני ילד/ה" → new 2-step ChildJoin. Step 1 = family-code only + "המשך"; step 2 = "מי את/ה?" + tappable child card (no typed name). Picked **Ben** (family QDXCTW, was orphan `user_id=NULL`):
  - Metro logged `[ChildEntry] created stable auth user + linked orphan profile {profileId: b5dd6c38…}`.
  - **Stop-condition #3 PASS:** auth.users 19→20 (+1), `@buff.app` 7→8 (+1), **profiles in family 2→2 (no dup)**, Ben.user_id NULL→`80d5d06c…`, Ben's auth email = `child_b5dd6c38…@buff.app` (the stable id-keyed email — proves derivation).
  - Ben landed in his own ChildApp ("Hey, Ben", Gamer theme).
  - **Resume idempotency PASS:** after the language restart-to-apply + session resume, counts unchanged (20/8/2, same user_id) → re-init creates 0 rows.
  - **Stop-condition #1 (re-pick) by construction:** `handlePickChild` runs `signIn(stable)` first; Ben's stable user now exists → `signUp` never reached → 0 new rows. Literal re-pick not run because the child UI has no sign-out (kids-never-login by design — Menu has Theme/Pet/Buddy only).
  - **Residue:** Ben (QDXCTW) is now linked (the intended fix behavior) + one new auth user `80d5d06c`. This is a parallel session's test family — revert to orphan available on request.
  - PR #159 open. This live run covers the Hat-4 stop conditions; Adi's own-device check still optional.
