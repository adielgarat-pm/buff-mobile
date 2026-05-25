# pkg/pending-lifetime-grants — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Branch + scaffold | _passed_ | 2026-05-25 | 700755a | n/a | — |
| 1 — Migration 015 (table+trigger+seed+backfill) | _passed_ | 2026-05-25 | 07fa10c | P1.1–P1.7 + smoke pass | (Phase 3) |
| 2 — Cohort CSV + idempotency tests | _passed_ | 2026-05-25 | ebf9225 | T1–T6 all PASS + leak check clean | (Phase 3) |
| 3 — Exit deliverables + PR | _blocked_ | 2026-05-25 | eb0657a | n/a | IN-2026-05-25-01 added |

## Legend
- `_pending_` — לא התחיל
- `_in_progress_` — CC באמצע פאזה
- `_passed_` — פאזה הושלמה, tests עברו
- `_failed_` — tests נכשלו, צריך rework לפני להמשיך
- `_blocked_` — מחכה לחיצוני

## Closeout

- [x] כל הפאזות עברו (0,1,2 done; 3 mid-commit)
- [x] INTEGRATION_LEARNINGS.md עודכן (IN-2026-05-25-01)
- [x] Canonical docs מסונכרנים לפי SPEC_SYNC.md (only INTEGRATION_LEARNINGS + TRACK_5 closing note; no PRD/BUDDY/GAP changes by design)
- [x] Branch pushed to origin (`pkg/pending-lifetime-grants`)
- [ ] **Adi opens PR** at https://github.com/adielgarat-pm/buff-mobile/pull/new/pkg/pending-lifetime-grants (gh CLI not auth'd locally on this session). Body draft is ready below.
- [ ] Decision draft הועתק ע"י Adi ל-BUFF_DECISIONS_LOG.md
- [ ] PR merged + Verify-Before-Delete Protocol + branch deleted
- [ ] Adi verified Hat-3 on Android emulator (deferred to 2026-05-30+ for the in-window positive case)
- [ ] הסשן מסומן closed (after PR merge)

---

## PR body (paste into GitHub when opening the PR)

**Title:** `feat(pending-lifetime-grants): auto-grant lifetime for Lovable migrants + beta window`

**Body:**

````markdown
## Summary

- Adds `public.pending_lifetime_grants` table + AFTER INSERT trigger on `public.profiles` that auto-flips `is_lifetime_access=true` for two cohorts: (a) Lovable migrants whose email is on the seeded list (16 emails from `email_logs` cohort), (b) any parent signup during the beta window **2026-05-30 → 2026-06-30** (covers WhatsApp newcomers + 8 cohort members without recoverable email).
- DB-side mechanism; **zero client changes**. Existing paywall gate at `useSubscription.ts:87` reads the same `is_lifetime_access` flag.
- One-time backfill inside the migration for any existing matched profile; idempotent on re-run.

## Test plan

- [x] Migration applied to live mobile DB (gfrongfnyigxsexuofrg) — success
- [x] Table + RLS verified (RLS=true, deny-all)
- [x] 3 SECURITY DEFINER functions exist, `EXECUTE` REVOKED from PUBLIC
- [x] AFTER INSERT trigger registered on `public.profiles`
- [x] 16 emails seeded with `source='mailing_list_49'`
- [x] Backfill: 0 eligible profiles in current state; Adi's `is_lifetime_access=true` untouched
- [x] Supabase advisors clean (only intentional INFO `rls_enabled_no_policy`)
- [x] 6/6 idempotency SQL tests PASS (T1–T6 in TESTS.md)
- [x] Smoke test verified REVOKE PUBLIC did not break trigger firing
- [x] Zero test data leakage post-suite
- [ ] **Adi: Hat-3 emulator verification** — Google signup with seeded email; verify `is_lifetime_access=true` after onboarding
- [ ] **Adi: in-window positive case** — deferred to 2026-05-30+
- [ ] **Adi: copy decision draft from STATUS.md into BUFF_DECISIONS_LOG.md**

## Decisions (approved 2026-05-25)

- D1 — Open beta window 2026-05-30 → 2026-06-30 auto-grants ALL new parent signups
- D2 — Migration backfills any existing matched profile (idempotent)
- D3 — Trigger on `public.profiles` (not `auth.users`, not client-side)

## Files

- `migrations/015_pending_lifetime_grants.sql` (new — repo source of truth)
- `docs/sessions/pending-lifetime-grants/` (new — README, SPEC, ROADMAP, TESTS, STATUS, SPEC_SYNC)
- `docs/sessions/pending-lifetime-grants/cohort_emails.csv` (gitignored — local PII reference)
- `.gitignore` (added pattern for cohort CSV)
- `docs/INTEGRATION_LEARNINGS.md` (new entry IN-2026-05-25-01)
- `docs/sessions/beta-2026-06-01/TRACK_5_findings.md` (closing note)

## Out of scope (explicit)

- ChildJoin claim-orphan logic (already shipped)
- Sentry / EAS / push (separate paused package)
- Lovable family/task/reward data migration
- Email comms to cohort (separate Track 5+ work)
- Revocation mechanism (lifetime is permanent; manual UPDATE available if needed)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

---

## Decision Draft for `BUFF_DECISIONS_LOG.md`

> CC מציע. **Adi בלבד מעתיקה/עורכת ל-`docs/BUFF_DECISIONS_LOG.md`.** CC לא נוגע ב-DECISIONS_LOG.
> מספר ההחלטה (D-2026-05-25-XX) — Adi קובעת לפי הסידור בקובץ.

---

**D-2026-05-25-XX — Pending lifetime grants for Lovable migrants + open beta window**

**הקשר:**
ב-2026-05-30/06-01 BUFF משיק beta APK לקבוצת WhatsApp של משתמשי Lovable + הצטרפויות חדשות מהאתר. אין Lovable→mobile auth migration; משתמשים נרשמים מחדש דרך Google OAuth. צריך מנגנון שמעניק `is_lifetime_access=true` אוטומטית בלי דגלים ידניים.

**החלטות:**

1. **טבלת `pending_lifetime_grants`** ב-public schema, PK על email (lower+trim enforced via CHECK), source enum, SECURITY DEFINER trigger AFTER INSERT על `public.profiles` שצורך את הרשימה.

2. **חלון beta פתוח 2026-05-30 → 2026-06-30** — כל signup חדש בחלון הזה מקבל lifetime, גם בלי email match. מכסה WhatsApp newcomers + 8 cohort members בלי email recoverable. Tradeoff מקובל: Google signups אקראיים בחלון יקבלו lifetime — נמדד post-launch, מתוקן ידנית אם חורג.

3. **Trigger על `public.profiles` AFTER INSERT** (לא על auth.users; לא client-side). הסיבה: בזמן profile insert גם user_id וגם profile קיימים, ה-join ל-auth.users.email נקי, ה-trigger יעבוד עבור כל auth provider (Google OAuth, email/password, עתידי).

4. **Backfill בתוך ה-migration** — UPDATE על כל profile קיים ש-auth.users.email שלו תואם seed, ומחיקת השורה המתאימה מ-pending.

5. **Seed ראשוני**: 16 emails מ-cohort qualifying (24 parents — consent=true + ≥1 child — של אלה 16 עם email ב-`email_logs.email_to`). 8 הנותרים יטופלו ע"י חלון ה-beta אם ייכנסו, אחרת ידנית.

6. **Migration #015** ב-repo (013 + 014 נתפסו ע"י engagement_scheduler + service_role_grants).

7. **ZERO client changes.** `AuthContext.tsx`, `useSubscription.ts`, paywall — נשארים כמו שהם. כל המנגנון DB-side.

**Implications:**
- `useSubscription.ts:87` ממשיך לקרוא `is_lifetime_access` — הסמיכות שלו לקוד מבטיחה שכל path subscription משתמש בדגל הזה (no bypass needed)
- Adi יכולה להוסיף emails ידנית ל-pending דרך Supabase MCP (`INSERT INTO pending_lifetime_grants ...`) אם מתחילה לקבל בקשות
- אחרי 6/30, החלון נסגר אוטומטית (קוד hard-coded); אם Adi רוצה להאריך — תיקון migration נפרד
- אין mechanism לrevoke — אם דרוש: `UPDATE profiles SET is_lifetime_access=false WHERE id=...` דרך SQL

**מקורות:**
- `docs/sessions/pending-lifetime-grants/SPEC.md`
- `docs/sessions/beta-2026-06-01/TRACK_5_findings.md` (Option B recommendation that originated this package)
- INTEGRATION_LEARNINGS IN-2026-05-25-01
- Migration `migrations/015_pending_lifetime_grants.sql`
