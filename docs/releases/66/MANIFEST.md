# Release MANIFEST — 1.7.10 (versionCode 66)

> Prepared 2026-07-09. Content = the 2026-07-08 UX-fix train (#332–#339) + the QA-sweep follow-up (#341).
> Cut/build: EAS production app-bundle via the `EAS Build (Android)` GitHub workflow (autoIncrement → vc66). Prior release: 1.7.9 (vc65, base `55a243b`).
> Theme: **polish the daily loop on both sides** — the child's success bar, the gamer loop, the parent's web controls — after the count-goal decision (D-2026-06-14) and the web-activation findings.
> QA: full autonomous sweep 2026-07-08 (Android emulator + Expo Web) — see `docs/MASTER_TEST_PLAYBOOK.md` § Run 2026-07-08. Every row below was individually verified there unless noted.

## Content

| PR / Commit | Type | Change | User-facing? | Gate 2 evidence |
|---|---|---|---|---|
| #332 `f4c1b48` | fix | **"I'm a Parent" goes to Signup (role preselected), not Login** — removes the new-parent dead-end. | yes | Sweep: web RoleSelection → Signup ✅ |
| #333 `cf7ea67` | fix | **No late-shame** — neutral done row instead of alert-icon + hardcoded EN "outside window" for late-completed tasks (Pillar 2). | yes | Sweep: device, morning task completed 15:10 → neutral ✅ |
| #334 `bf3d57b` | fix | **Rewards fetch error is a distinct retryable state** in Child+Gamer shops (was masquerading as "no rewards yet" — IL flaky-network trust killer). | yes | Sweep: healthy path device ✅; error path via 2 Jest suites |
| #335 `10aee59` | fix | **Gamer daily loop** — successful-days now server-sourced (same number everywhere), 0-streak hidden behind "Start one today", full-row task tap, tappable preview-exit banner. | yes | Sweep: device — DB 6 = UI 6; tap toggles 140↔175 Buffs; banner exit ✅ |
| #336 `a665a7b` | fix | **Child success re-anchored to absolute count** (D-2026-06-14) — Focus Fuel 0/goal, egg hatch, ignition copy "{{goal}} done = Ignition!". | yes | Sweep: Mint + Gamer device ✅ |
| #337 `8b98b29` | fix | **Purchase screens out of the child stack + role guard + Paywall legal links wired** (`buff://founding-100` on a child device → ChildApp; Privacy/Terms open — Play compliance). | yes | 7 Jest tests; parent deep-link device ✅ |
| #338 `aa23f25` | fix | **Dashboard invite card uses cross-platform `shareInvite`** — web was a silent no-op (the web-activation villain). | yes | Sweep: Android share sheet ✅; web clipboard + "הועתק" toast ✅ |
| #339 `ec440dd` | fix | **Web dead controls → real pickers** — platform-split time/date fields in ParentTasks, EditChild, Activities, MedReminder. | yes | Sweep: web `input[type=time]` 08:00→08:30 saved+persisted ✅; 4 Jest picker suites |
| #341 `f2001ef` | fix | **Parent surfaces aligned to the count rule** — dashboard child cards (`isActiveDay`/`successGoal`, "{{goal}} done = an active day") + Philosophy pillar copy; dead 70% key removed; ThemeContext suite fixed + preview-theme test un-quarantined. | yes | Sweep findings 1–4; verified Android + Web ✅ |
| #328/#329 | ci | GitHub workflows: EAS Build (workflow_dispatch) + EAS Submit to Play; `eas.json` submit profile. Rides the train, no runtime content. | no | — |

**Landing-only (ships via Vercel, NOT this build):** #331 `/summer` guide, #340 self-destroying service worker, #343 `/guides/summer` + no-www `/download` redirect.

## Gates
- **Gate 1 (on the merged tree):** tsc 0 · **jest 666/666, 0 skipped** (ThemeContext env-crash fixed in #341) · `check:no-raw-alert` clean.
- **Gate 2:** MASTER_TEST_PLAYBOOK § Run 2026-07-08 — all in-scope verdicts ✅ on Android emulator + Expo Web; fresh web signup → 7-step onboarding → dashboard E2E with 0 console errors.
- No schema changes, no new dependencies, no edge-function changes in this train.

## Hat-4 (Adi, real device, after install)
1. Gamer (Itay's device): HQ "Successful days" equals MyStats; streak card shows "Start one today" (not 0); tapping anywhere on a quest row completes it.
2. Child completes a task late in the evening → done row looks identical to any other (no warning icon/English text).
3. Dashboard child card reads "3 done = an active day 🎯" and matches the child's Focus Fuel 0/3.
4. Invite card → Share opens the app chooser with the Play link + family code in the message.
5. (Web, phone browser) Parent Tasks → edit a task → time field opens the OS time control and saves.

## Rollout
- [ ] Merge release PR (version bump + this manifest).
- [ ] Trigger `EAS Build (Android)` workflow (profile `production`) → autoIncrement assigns vc66.
- [ ] Adi: promote in Play Console (or run `EAS Submit` workflow) once the build finishes.
- [ ] After promote + "verified, tag it": move the #331–#341 rows to **Shipped (66)** in RELEASE_QUEUE.md.
