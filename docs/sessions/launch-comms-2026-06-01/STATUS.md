# Launch Comms 2026-06-01 — STATUS

> מתעדכן ע"י CC בכל phase exit.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 1 | _in_progress_ | 2026-05-25 | TBD on commit | awaiting Adi review per TESTS.md | none yet |

## Legend

- `_pending_` — לא התחיל
- `_in_progress_` — CC באמצע פאזה, plan מאושר
- `_passed_` — פאזה הושלמה, tests עברו
- `_failed_` — tests נכשלו, צריך rework לפני להמשיך
- `_blocked_` — מחכה לחיצוני

## Closeout checklist

- [ ] Adi עברה על שלושת הדליברבלס
- [ ] Adi מילאה את ה-placeholders (ראי "Placeholders ל-Adi" למטה)
- [ ] PR נוצר ל-main
- [ ] Code review approved
- [ ] fast-forward merge
- [ ] cleanup: Verify-Before-Delete של הענף לפני מחיקה
- [ ] **Lovable Publish reminder:** לא חל — חבילה ב-buff-mobile repo בלבד

---

## Placeholders ל-Adi למלא לפני שליחה

| ב- | Placeholder | מה למלא |
|---|---|---|
| migration-email-he.md (Body §3 + §6) | `[APK_OR_PLAY_STORE_URL]` | URL להורדה. ברירת מחדל מומלצת: Play Store internal testing track URL. |
| migration-email-he.md (Body §6) | `[PLAY_STORE_RATING_URL]` | URL לעמוד הדירוג של BUFF ב-Play Store (לאחר שהאפליקציה ב-public/closed testing). אם עדיין לא public ב-1.6 — להסיר את שורת הדירוג. |
| whatsapp-messages-he.md (short + longer) | `[APK_OR_PLAY_STORE_URL]` | אותו URL כמו במייל. |
| whatsapp-messages-he.md (longer בלבד) | `[PLAY_STORE_RATING_URL]` | אותו URL כמו במייל (אופציונלי). |
| admin-playbook-lifetime.md §2 | 49 ערכי email | להדביק בפנים `cohort(email)` או לשמור בקובץ gitignored מקומי. |

## Operations checklist for Adi

לפני 2026-06-01:
- [ ] APK / Play Store build זמין + URL מוכן
- [ ] 49 מיילים מ-MailerLite ב-clipboard / קובץ gitignored
- [ ] צילום מסך-בדיקה אישי שהמייל נראה טוב במובייל + ב-Gmail web
- [ ] Test grant על account dev שלי (אדי) כדי לוודא שה-playbook עובד

ב-2026-06-01:
- [ ] שליחת מייל ב-MailerLite ל-49
- [ ] פרסום WhatsApp short ב-קבוצה ה-HE (`JUCsJ7yrNWQC4E25vqNIK5`)
- [ ] ניטור Supabase auth.users סביב 1-2 שעות אחרי השליחה — שמות לזיהוי
- [ ] הרצת playbook §1 (daily check) פעם-פעמיים ביום ב-3 הימים הראשונים
- [ ] grant ידני לכל מי שמייל אליי (target: <24h response SLA)

לאחר 1-2 שבועות:
- [ ] רשימת "מי קיבל Lifetime אבל עוד לא נתן משוב"
- [ ] שיחת follow-up עם כל אחד (לפי החלטה מ-2026-05-25)
- [ ] revoke (אם חל) דרך playbook §4

---

## Decision Draft for `BUFF_DECISIONS_LOG.md` (אופציונלי)

> CC מציע. **Adi בלבד מעתיקה/עורכת ל-`docs/BUFF_DECISIONS_LOG.md`.**

**D-2026-05-25-XX — Lovable Sunset Comms + Manual Lifetime Grant Model**

**הקשר:**
שיחת תכנון 2026-05-25 בין Adi ל-CC לקראת beta launch של אפליקציית האנדרואיד
ב-1.6.2026. אדי החליטה (1) להוציא תקשורת ל-49 משתמשי mailing list של Lovable,
(2) ה-Lifetime ינתן ידנית בהרשמה ולא דרך אוטומציה כפי שהוצע ב-TRACK_5_findings
Option B, (3) המשכיות ה-Lifetime תהיה תלויה במשוב מהמשתמש לאחר תקופת שימוש.

**החלטות:**

1. **Manual Lifetime grant model:** Adi מריצה SQL UPDATEs ידנית כשמשתמש cohort
   נרשם ופונה אליה במייל. נגדע פיתוח של pending-grants automation.
2. **Conditional continuation:** ה-Lifetime ניתן בעת הרשמה אך נשמר רק אם
   המשתמש מספק משוב לאחר תקופת שימוש (מספר שבועות). Revoke הוא שיחה (לא
   טריגר אוטומטי).
3. **Founding member numbering:** כל cohort grantee מקבל `founding_member_number`
   סדרתי (1..49) דרך `is_lifetime_founding = true`. שומר אופציה להכרת תודה
   עתידית.
4. **Cohort = 49 (`marketing_consent = true`)** ולא 24 (מ-TRACK_5_findings).
   ה-8 בלי email recoverable יישלחו דרך MailerLite חיצוני.
5. **WhatsApp: רק HE.** הקהילה האנגלית (5 משתתפים) קטנה מכדי להצדיק תרגום
   בחבילה הזו.

**Implications:**
- F-074 (Static Marketing Landing) — תוספת AC: שני קישורי WhatsApp חייבים לעבור
  ל-Expo Web Phase 2 landing.
- TRACK_5_findings Option B (`pkg/pending-lifetime-grants`) — דחוי ל-Phase 2,
  trigger לפתיחה = 10+ grants/week באופן עקבי.
- `lifetime_audit_log` table — דחוי, trigger לפתיחה = >5 revokes או שאלה
  משפטית/חוזית.

**מקורות:**
- `docs/sessions/launch-comms-2026-06-01/` (כל הקבצים)
- `docs/sessions/beta-2026-06-01/TRACK_5_findings.md` (REQ-1)
- שיחת Plan Mode עם CC, 2026-05-25
