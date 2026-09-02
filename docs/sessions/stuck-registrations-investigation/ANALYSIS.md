# Stuck Registrations — Investigation 2026-09-02

> Read-only investigation. Source: Supabase `buff-production` (`gfrongfnyigxsexuofrg`) via MCP + code cross-check on `main` @ `d0e0119`.
> No code or schema was changed in this session. Every fix below is a proposal for Adi's approval (CLAUDE.md § Plan Mode, § Schema).
> Numbers are anchored to a query or a `file:line`. Emails/names deliberately not listed here (Pillar 2) — cohorts are identified by `families.id` prefix only where needed.

---

## TL;DR

1. **Signups are still arriving (8 in the week of Aug 31), but almost nobody comes back.** In the last 90 days, 52 families are older than 24h: **14** never created a child (T1), **26** created a child but the child never completed a single task (T2), **10** had some progress then went silent 7d+ (T3), **2** active.
2. **Three production bugs are silently killing every automated "bring them back" path:**
   - **A.** The daily disengagement push scan (`scan_disengaged_users_daily`) has **failed every day since 2026-08-01** (33 failures). Zero `kid_engagement` / `parent_engagement` notifications were created in August.
   - **B.** On **Web**, the app-open heartbeat is **rejected by a CHECK constraint** on every open. `last_seen_at` / `last_platform` / `last_country` for web parents are frozen at signup. This corrupts every retention metric, the admin board, and the engagement scan's eligibility.
   - **C.** `smart_insight_feedback` SELECT is denied for `authenticated` (~26–30 errors/day). Not a retention blocker, but it is the noisiest error in the logs and the vote UI never reflects a saved vote.
3. **There is no working email channel.** `pkg/lifecycle-emails` is stuck at Phase 0 (Resend + DNS, Adi). The last row in `email_logs` is 2026-02-24. Push reaches ~12 live tokens total, all Android. **15 of the 26 T2 families are Web → email is the only way to reach them.**
4. **The audience has shifted to English.** 0 of the 52 stuck parents have `preferred_language='he'` (countries: US, GB, JM, PK, IL). The approved lifecycle templates are Hebrew-only.
5. **"I'll send it tonight" does nothing.** `ChildAccessStep.sendTonight` only records `own_phone`; the day-1 reminder (Chunk 4) was deferred. A parent who taps it is promised a nudge that never comes.

---

## 1. Volume and return rate

Query: `auth.users` grouped by week (`created_at`), `returned_after_day1 = last_sign_in_at > created_at + 1d`.

| Week of | Signups | Google | Email/pw | Returned after day 1 (auth) |
|---|---|---|---|---|
| 2026-08-31 | 8 | 1 | 7 | 0 |
| 2026-08-24 | 2 | 0 | 2 | 0 |
| 2026-08-17 | 3 | 0 | 3 | 0 |
| 2026-08-03 | 5 | 1 | 4 | 0 |
| 2026-07-27 | 10 | 4 | 6 | 1 |
| 2026-07-06 → 07-20 | 14 | 3 | 11 | 0 |
| 2026-06-29 | 12 | 11 | 1 | 3 |
| 2026-06-01 → 06-22 | 29 | 10 | 19 | 8 |

**Caveat:** `last_sign_in_at` only moves on a fresh sign-in (not on session refresh), and `profiles.last_seen_at` is frozen for web users by Bug B. A safer proxy — *any* row in `onboarding_events`, `daily_progress`, or `profiles.last_seen_at` later than signup + 2 days — for families ≥3 days old in the last 90 days:

| Signup platform | Families | Any activity after day 2 |
|---|---|---|
| android | 16 | 3 |
| web | 25 | 6 |
| ios | 1 | 0 |

Either way: **~20% return, ~80% are one-session users.** Monthly, by family creation (`families.created_at`):

| Month | Families | With child | Any `daily_progress` | Progress after day 2 |
|---|---|---|---|---|
| 2026-06 | 20 | 15 | 4 | 4 |
| 2026-07 | 18 | 15 | 6 | 1 |
| 2026-08 | 16 | 10 | 3 | **0** |

August is the worst month on record: 16 families, 0 with progress after day 2.

---

## 2. Where exactly they are stuck (90 days, families >24h old)

| Cohort | Families | Marketing consent = true | Live push token (30d) | Google signup | Web signup |
|---|---|---|---|---|---|
| **T1** signed up, no child | 14 | 2 | 2 | 6 | 8 |
| **T2** child created, zero completed tasks | 26 | 9 | 0 | 8 | 15 |
| **T3** had progress, silent 7d+ | 10 | 3 | 0 | 5 | 4 |
| active | 2 | 2 | 0 | 1 | 0 |

Cohort names match the `pkg/lifecycle-emails` SPEC triggers (T1/T2/T3), so the same batch logic applies.

### 2a. T1 — inside the wizard

`onboarding_step_reached` only exists since 2026-08-31 (PR #454), so the drop step is known for 5 families only:

| Deepest step | Families | Platform |
|---|---|---|
| `1_child_profile` | 1 | android (JM) |
| `4_motivator` | 2 | web (IL/he Google, GB/en email) |
| `5_preview` → child created | 2 | — |

Both web drops stop **after Step 4 and before Step 5 mounts**. Between them sits `ULoadingScreen` (a fixed `setTimeout` → `navigate('UStep5_Preview')`, `ULoadingScreen.tsx:35`). We cannot yet tell "quit on the motivator screen" from "loading screen never advanced / refresh on web". → Instrument (see §5.6).

Older T1 families (9) have no step telemetry at all. All 14 have `onboarding_data = '{}'` — the draft is never populated, so Resume (Shape A) restores the *route* from the local snapshot only; on a new device/browser there is nothing to resume.

### 2b. T2 — child exists, child never acted

Per-family funnel (60 days): `child_created` 29 · `tasks_generated` 29 · `invite_shown` 61 events · `invite_sent` 12 · `access_mode_selected` 8 · `first_task_complete` 7 (all before Aug 10).

Access mode chosen (families since 2026-08-05, when the step shipped): `shared_device` 4 · `home_device` 3 · `own_phone` 3 · not chosen 4.

- **shared_device (4):** the child's "moment" lives on the parent's phone. `daily_progress` = 0 for all 4 → the parent never re-entered View-as-Child after Step 8. There is a dashboard "🌱 {child}'s moment" card, but nothing brings the parent back to the app to see it (no push, no email).
- **own_phone (3):** 2 tapped share, 1 tapped "send tonight". None of the 3 children ever appeared. We can't see whether the child opened the link: `join_page_viewed` and `child_first_open` are declared in `onboardingFunnel.ts` but **never fired anywhere in `src/`** (grep: 0 call sites). `buffadhd.com/join/CODE` was verified BROKEN on web on 2026-08-05 (`child-access-paths/STATUS.md` Chunk 4 — redirects to parent Step 1) and depends on #301.
- **home_device (3):** the parent must type the family code on another device. No follow-up exists.

### 2c. T3 — started, then silent

10 families (mostly June/July). These are the ones the failed `scan_disengaged_users` job was supposed to nudge.

---

## 3. Production bugs found (evidence)

### Bug A — `scan_disengaged_users_daily` fails every day since 2026-08-01

`cron.job_run_details` for job `scan_disengaged_users_daily`: **succeeded 72× (2026-05-21 → 07-31), failed 33× (2026-08-01 → 09-02)**, every failure:

```
ERROR:  null value in column "family_id" of relation "notifications" violates not-null constraint
```

Root cause (function source via `pg_get_functiondef`): the `eligible_kids` CTE filters `role='child' AND last_seen_at <= now()-5d` but — unlike the `eligible_parents` CTE — **does not require `p.family_id IS NOT NULL`**. There are exactly **3 child profiles with `family_id IS NULL`** (orphans; all 3 currently match the filter). The INSERT into `notifications` fails, the whole function aborts, and **both** the kid and parent engagement passes produce nothing. Last `kid_engagement`/`parent_engagement` notification: 2026-07-31.

**Proposed fix (schema — needs Adi approval):** add `AND p.family_id IS NOT NULL` to `eligible_kids` (mirrors the parent branch). Optionally also `is_deleted IS NOT TRUE`. One-line `CREATE OR REPLACE FUNCTION`. Independently, the 3 orphan children should be reviewed by the `childjoin-claim-orphans` FLAG.

### Bug B — Web heartbeat rejected by `profiles_last_platform_check`

`pg_get_constraintdef`: `CHECK (last_platform = ANY (ARRAY['web','android','ios']))`.
Client (`src/lib/pushTokens.ts:143-149`, `currentPlatform()`) writes `'desktop-web' | 'android-web' | 'ios-web'` on web — exactly what `web-to-native-cta/SPEC.md:385` and the comment in migration `045_profiles_last_country_admin_geo.sql:14-15` specify. The constraint was never widened.

Evidence: postgres logs 2026-08-31 show 9× `new row for relation "profiles" violates check constraint "profiles_last_platform_check"`; **28 web-signup parents (90d) have `last_platform IS NULL`**; every web family in §1 shows `parent_seen = signup date`. `bumpLastSeenAt` is the single UPDATE that carries `last_seen_at`, `last_platform`, `last_platform_at`, `last_country` — all four are lost on web on every open.

Consequences: admin board "last seen"/platform/country wrong for all web users; engagement scan (`last_seen_at <= now()-5d`) treats every web parent as disengaged from day 5 regardless of use; any retention analysis on `last_seen_at` under-counts web.

**Proposed fix (schema — needs Adi approval):** `ALTER TABLE profiles DROP CONSTRAINT profiles_last_platform_check; ADD CONSTRAINT ... CHECK (last_platform IN ('web','android','ios','android-web','ios-web','desktop-web'))`. Alternative without schema change: map to `'web'` in `currentPlatform()` — but that discards the mobile-web vs desktop-web split the SPEC wanted. Recommend the constraint widening.

### Bug C — `smart_insight_feedback` SELECT denied for `authenticated`

`role_table_grants`: `authenticated` has **INSERT, UPDATE only**; policies exist for INSERT/UPDATE/SELECT but there is no table-level SELECT grant. `src/hooks/useSmartInsights.ts:124-131` and `:146-151` run `.select('explicit_vote')` on every dashboard render with an insight → `permission denied for table smart_insight_feedback` 26–30×/day (postgres logs 08-31, 09-01/02). Non-fatal (hook swallows it), but the saved vote never shows.

**Proposed fix (schema — needs Adi approval):** `GRANT SELECT ON public.smart_insight_feedback TO authenticated;` and confirm the SELECT policy is family-scoped (currently `service_read_all` for `public`; review before granting).

### Bug D — "I'll send it tonight" is a no-op

`src/screens/onboarding/unified/ChildAccessStep.tsx:116`: `const sendTonight = () => { void choose('own_phone'); };` — the day-1 reminder (Chunk 4, `child-access-paths/STATUS.md`) is deferred, `day1_push_scheduled/sent/opened` are never fired. The button copy promises a reminder that never arrives. Either schedule the local notification (native) / an email (web), or change the copy until it exists.

### Telemetry gaps (not bugs, but they blind us)

- `join_page_viewed`, `child_first_open`, `onboarding_resumed`, `day1_push_*` — declared in `onboardingFunnel.ts`, **0 call sites**. The child side of the funnel is invisible.
- `profiles.is_activated` is set nowhere in `src/` or `supabase/` (1 family has it true). Not a usable activation flag; use `daily_progress` instead.
- `profiles.onboarding_step` is 0 and `onboarding_data` is `{}` for all 60-day parents — the draft columns are unused.
- `pkg/lifecycle-emails/STATUS.md` says Phase 2 (OAuth consent ask) "not started", but `useMarketingConsentAsk` + `MarketingConsentSheet` exist and are wired into `ParentDashboardScreen` → STATUS is stale (Spec Sync needed).

---

## 4. Why nobody gets brought back today (channel audit)

| Channel | State | Reach for the 50 stuck families |
|---|---|---|
| **Email (automated)** | `lifecycle-emails` Phase 0 pending Adi (Resend + SPF/DKIM/DMARC) since 2026-07-17; Phases 2–4 not built. `email_logs` last row 2026-02-24. | 0 |
| **Email (manual win-back)** | Proven: 3/18 returned within 48h (2026-07-14 batch). Not run since. | 14 consented (T1 2 + T2 9 + T3 3) |
| **Push — engagement scan** | Broken since 08-01 (Bug A) | 0 |
| **Push — activation_nudge / anchor_recovery** | Running (5 + 48 notifications / 30d) but **29 suppressed `all_dead` vs 24 pushed** | ~12 live tokens total, all `fcm-android`; 0 in T2/T3 |
| **Web push** | Stub (`webPushRegistration.ts` → `not_implemented`) | 0 |
| **In-app** | Dashboard "moment" card (shared_device), View-as-Child, Add child. Only works if the parent opens the app. | — |
| **WhatsApp community** | `community_link_clicked` 2× since 09-02 | tiny |

Bottom line: **for 15 of 26 T2 families (web) and 8 of 14 T1 (web), email is the only reachable channel, and it does not exist yet.**

---

## 5. Ways to bring them back — recommendation, ranked

### 5.1 This week — manual win-back batch (Adi, ~1h), no code
Proven format (2026-07-14: 3/18 back within 48h). Segment by stage, English copy (0 Hebrew parents in the cohort):

| Segment | N | Hook (one line, kid's real data first — approved voice) | CTA |
|---|---|---|---|
| T2 · shared_device | 4 | "{child}'s first 3 tasks are waiting on *your* phone" | open app → 🌱 {child}'s moment |
| T2 · own_phone | 3 | "{child} hasn't opened BUFF yet — here's the link again" | join link + code (only after #301 is verified on web) |
| T2 · home_device | 3 | "Open buffadhd.com on the home tablet, code {code}" | code |
| T2 · no access mode (pre-08-05) | 16 | T2 template: "{child}'s plan is ready — 2 minutes left" | resume |
| T1 | 14 | T1 template: "setup takes 2 minutes" | resume link |
| T3 | 10 | T3 template (gentle Day-3), conditional on `{completions}` | open app |

Consent: the SPEC's hard consent gate is for the *automated* system; the July batch went out manually from Adi's address. 14 of 50 have `marketing_consent=true` — Adi's call whether the manual batch stays consent-only (14) or includes the transactional-style "your setup is incomplete" to all 50.
CC can produce the merge list (family id, parent first name, child first name, first 3 task titles, access mode, code, language) via SQL on request.

### 5.2 This week — fix Bug A (1-line function), restore engagement pushes
Restores `kid_engagement`/`parent_engagement` for the ~12 live Android tokens. Cheap, and stops a month-long silent failure. Also cleans the cron log.

### 5.3 This week — fix Bug B (widen constraint)
Prerequisite for *any* honest retention number on web, and for the engagement scan to stop treating web parents as day-5 disengaged. One migration. Then re-run this analysis's §1 in two weeks with real `last_seen_at`.

### 5.4 Next 2 weeks — unblock `lifecycle-emails` (Phase 0 = Adi 30 min; Phase 3 = CC)
The single biggest lever: automates §5.1 forever, consent-gated, with unsubscribe. Order: Phase 0 (Resend + DNS) → Phase 3 T2 only in dry-run → arm → Phase 4 (T1/T3/T4 + pg_cron). **Add EN variants of T1–T4 first** — the approved templates are Hebrew and the audience is now English. Mark Phase 2 done in STATUS (consent sheet already shipped) after verifying it fires for existing Google users.

### 5.5 Next 2 weeks — make "send tonight" real (Bug D)
Native: schedule a local notification at 19:00 same day with the invite share sheet deep-link. Web: fold into lifecycle T2 (email that evening). Until then, change the button copy so it does not promise a reminder.

### 5.6 Instrument the blind spots (small, additive, no schema)
- Fire `join_page_viewed` on `ChildJoinScreen` mount (with `code` prefilled = came via link) and `child_first_open` on first child dashboard mount per child.
- Log `onboarding_step_reached` variant `loading` on `ULoadingScreen` mount, and log `saveAll` failures in `UStep5_Preview` (there is `first_task_write_failed` for tasks; add the RPC failure case). This splits "quit on motivator" from "stuck on loading" for the two web T1 drops.
- Verify #301 (`/join/:code` on web) end-to-end before sending any own_phone link in §5.1.

### 5.7 Product: reduce the T2 gap at the source (SPEC-level, needs Values Check)
- **shared_device** is the largest and cheapest win: the child is one tap away on the parent's phone. Consider making Step 8 land *directly* in the child's first task with the parent present (it already does: "Let's start with {child}") — the data says parents skip it. A Day-0 evening push/email "5 minutes tonight with {child}" is the missing beat.
- **own_phone**: today the link is a dead end on web (#301). Until fixed, the card should steer to shared_device on web.

---

## 6. Open questions for Adi

1. Manual batch now (5.1): consent-only (14) or all 50?
2. Approve the three schema fixes (A, B, C) as one small `fix/prod-signals` package?
3. Phase 0 of lifecycle-emails (Resend account + DNS): can it happen this week? It gates everything automated.
4. English templates for T1–T4: Gemini-refine the Hebrew v2, or write EN from scratch in the same voice?

---

## Appendix — queries

- Weekly signups: `auth.users` by `date_trunc('week', created_at)`.
- Per-family funnel: `families` × `profiles` × `onboarding_events` (bool_or per event_type) × `tasks` × `daily_progress`, `created_at > now()-60d`.
- Cohorts: families 90d old >24h; T1 = no child profile; T2 = child, no `daily_progress`; T3 = progress but parent `last_seen_at < now()-7d`.
- Cron: `cron.job_run_details` join `cron.job` where `jobname='scan_disengaged_users_daily'`.
- Constraint: `pg_get_constraintdef(oid)` for `profiles_last_platform_check`.
- Grants: `information_schema.role_table_grants` + `pg_policies` for `smart_insight_feedback`.
- Logs: `query_logs` windows 2026-08-31 and 2026-09-01T12:00→09-02T12:00, `source in ('postgres_logs','auth_logs','function_edge_logs')`.
- Existing funnel script: `scripts/onboarding-funnel.sql`.
