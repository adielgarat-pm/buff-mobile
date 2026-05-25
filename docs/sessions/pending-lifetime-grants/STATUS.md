# pkg/pending-lifetime-grants — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Branch + scaffold | _passed_ | 2026-05-25 | 700755a | n/a | — |
| 1 — Migration 015 (table+trigger+seed+backfill) | _passed_ | 2026-05-25 | 07fa10c | P1.1–P1.7 + smoke pass | (Phase 3) |
| 2 — Cohort CSV + idempotency tests | _passed_ | 2026-05-25 | ebf9225 | T1–T6 all PASS + leak check clean | (Phase 3) |
| 3 — Exit deliverables + PR | _in_progress_ | 2026-05-25 | (this commit) | n/a | IN-2026-05-25-01 added |

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
- [ ] Decision draft הועתק ע"י Adi ל-BUFF_DECISIONS_LOG.md
- [ ] PR ל-main, fast-forward merge, branch נמחק (Verify-Before-Delete Protocol)
- [ ] Adi verified Hat-3 on Android emulator (deferred to 2026-05-30+ for the in-window positive case)
- [ ] הסשן מסומן closed (after PR merge)

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
