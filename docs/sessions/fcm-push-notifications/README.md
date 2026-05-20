# pkg/fcm-push-notifications

> Cross-platform push notifications via FCM HTTP v1, driven by `public.notifications` INSERTs. Android (MVP), Expo Web stub (Phase 2-ready), iOS (design-only, deferred). Single backend pipeline; per-platform client registration. Pillar-2 hard-line: no alarm-design copy.

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות (נוצר ע"י session הביצוע, לא קיים עדיין).

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו. כולל Values Check, OQ defaults (CC), phased chunks, brief לסשן הבא |
| `STATUS.md` | מעקב פאזות — ייווצר ע"י session הביצוע ב-Phase 0 |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה — ייווצר ע"י session הביצוע ב-Phase 0 |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה — ייווצר ע"י session הביצוע ב-Phase 0 |

**אין `PRINCIPLES.md` או `ROADMAP.md`** — נשענים על `BUFF_VALUES.md` הגלובלי + הפאזות המוצעות ב-`SPEC.md`.

## רקע

- **תכנון:** `pkg/notification-spec` (planning-only branch, 2026-05-19). תוכנית מלאה ב-`C:\Users\adiel\.claude\plans\refactored-mixing-lamport.md`.
- **Sibling package:** `pkg/parent-notification-feed` (bell + פיד בתוך האפליקציה). שתי החבילות עצמאיות; שתיהן קוראות מאותה טבלת `public.notifications`.
- **Source-of-truth pattern:** `public.notifications` הוקמה ע"י `migrations/011_parent_sos_notification_trigger.sql` ב-`pkg/daily-vibe-check`. כל push בחבילה זו נגזר מ-INSERT לטבלה — אין כתיבה חדשה.
- **Cross-platform constraint (unified codebase target):** Adi הבהירה ב-2026-05-19 שהמנגנון חייב לתמוך באנדרואיד (עכשיו), Expo Web (Phase 2 לפי F-073), ו-iOS (בהמשך) — **end state הוא codebase אחד שמחליף את buffadhd.com (Lovable web POC)**. פתרון: FCM HTTP v1 כצנרת שרת-יחידה; לקוח-פר-פלטפורמה. החבילה הזו היא חלק מעבודת ה-unification — בלעדיה אי-אפשר להוציא את Lovable מהאוויר בלי לאבד את ה-push loop ב-web.
- **MVP priority:** F-039 (push reminders, Child, Must Have MVP) + F-063 (FCM, System, Must Have MVP) + AUDIT S-01 (Keep + Expand).
- **Lovable churn lesson:** הסיבה ה-#1 שמשתמשים נטשו את Lovable היתה שהם לא חזרו לאפליקציה. ללא push, פותחים את האפליקציה פעם אחת ושוכחים. זה ה-MVP gating risk.

## רצף ביצוע

לכל פאזה: CC מציג plan → Adi מאשרת `approved, proceed` → CC מבצע chunk → diff review → tests מ-TESTS.md → STATUS.md row → קומיט.

## כללי המתודולוגיה (קבועים — מ-CLAUDE.md + WORKFLOW.md)

- Plan Mode בכל פאזה
- אין self-approved decisions — אי-בהירות עולה ל-Adi
- Inspect actual code לפני הצעות (כולל `app.json`, `eas.json`, `package.json`)
- Chunk-by-chunk; sequencing מ-`SPEC.md § Proposed Phased Chunks`
- STATUS.md + canonical docs באותו commit כמו הקוד
- Values Check עובר לפני שעוברים פאזה (Pillar 2 = highest risk surface כאן)
- אין push ל-main בלי PR + merge אישור Adi
- npm install של תלות חדשה = improvement package נפרד, לא inline (`expo-notifications` ידוע ומאושר מראש ב-SPEC; הוספה אחרת = stop + ask)

## תלויות חיצוניות (יקבעו ב-Phase 0 verification)

| Dependency | Status | בלוקר? |
|---|---|---|
| `public.notifications` table | ✅ exists ב-live DB; חסר migration ב-repo | לא — Phase 1 backfills idempotent CREATE IF NOT EXISTS |
| `profiles.fcm_token` column | ✅ exists, unused | לא — Phase 1 migrates-and-drops |
| Firebase project + service account | ❓ צריך לוודא עם Adi | כן — בלי זה Phase 3 (Edge Function) לא יכול לקרוא ל-FCM |
| Apple Developer account (iOS) | ❌ לא פעיל | לא חוסם MVP — iOS = Phase 7 design-only |
| EAS Build setup | ❓ pending DevEx session | לא חוסם, אבל מקל על Android internal testing |
