# pkg/parent-notification-feed

> In-app bell + chronological feed of all notification types from `public.notifications` for the parent. Lovable parity infill. Pillar-3 hard-line: no surveillance loop, no "ההורה ראה" pattern.

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
- **Sibling package:** `pkg/fcm-push-notifications` (push outside the app). שתי החבילות עצמאיות; שתיהן קוראות מאותה טבלת `public.notifications`.
- **Existing surface (do NOT regress):** `useParentNotifications` + `ParentDashboardScreen` SOS dot + inline text — נוצר ב-`pkg/daily-vibe-check` Phase 4b (2026-05-17). חבילה זו מרחיבה את ה-hook לכל הסוגים, ושומרת על ה-API הצר עבור הדאשבורד.
- **Unified-codebase context:** ה-end state הוא codebase אחד (buff-mobile) שרץ על Android (עכשיו), Expo Web (Phase 2, מחליף את buffadhd.com / Lovable web POC), ו-iOS (בהמשך). חבילה זו מספקת את ה-notification surface האחיד של ה-codebase האחיד. הסיכון "kid surveillance dashboard" עולה דווקא בגלל שהפיצ'ר הופך לסטנדרט-יחיד — Pillar-3 vigilance חיוני.
- **Existing rows in DB:** ~396 רשומות `notifications` קיימות במסד (reward_redeemed, task_completed, וכו'). אלה רשומות **של buff-mobile עצמה מתקופת Lovable-era development snapshot** — לא תוכן שהובא מ-Lovable Supabase project. אף אחת מהן לא נראית למשתמש במובייל היום. Phase 3 משאיר אותן מוצגות כ-info ניטרלי.
- **NOT in PRD:** הפיצ'ר הזה לא רשום ב-PRD כשורה ייחודית. Phase 7 spec sync מסמן את זה ל-Adi (האם להוסיף ל-PRD §7 כ-"Unified Notification Feed", או לסמן explicit "out of PRD scope").

## רצף ביצוע

לכל פאזה: CC מציג plan → Adi מאשרת `approved, proceed` → CC מבצע chunk → diff review → tests מ-TESTS.md → STATUS.md row → קומיט.

## כללי המתודולוגיה (קבועים — מ-CLAUDE.md + WORKFLOW.md)

- Plan Mode בכל פאזה
- אין self-approved decisions — אי-בהירות עולה ל-Adi
- Inspect actual code לפני הצעות (במיוחד `ParentTabs.tsx`, `useParentNotifications.ts`, `ParentDashboardScreen.tsx`)
- Chunk-by-chunk; sequencing מ-`SPEC.md § Proposed Phased Chunks`
- STATUS.md + canonical docs באותו commit כמו הקוד
- Values Check עובר לפני שעוברים פאזה (Pillar 3 = highest risk surface כאן — surveillance loop)
- אין push ל-main בלי PR + merge אישור Adi
- אין מודולים חיצוניים חדשים (RN built-ins + react-navigation מספיק)

## תלויות חיצוניות (יקבעו ב-Phase 0 verification)

| Dependency | Status | בלוקר? |
|---|---|---|
| `public.notifications` table | ✅ exists in live DB | לא — sibling pkg/fcm-push-notifications מטפל ב-backfill repo migration אם רץ קודם; אחרת חבילה זו מטפלת ב-Phase 1 |
| `useParentNotifications` hook | ✅ shipped (pkg/daily-vibe-check Phase 4b) | לא — Phase 1 משחזר אותו כ-thin selector על-גבי `useNotificationsFeed` החדש |
| `ParentTabs.tsx` navigator | ✅ shipped | לא — Phase 2 מוסיף `headerRight` |
| `ParentDashboardScreen.tsx` SOS surface | ✅ shipped 2026-05-17 | חבילה זו לא נוגעת; חייב לעבור regression בלי שינוי visual |
| ~396 existing rows (buff-mobile Lovable-era snapshot) | ✅ קיימים | לא חוסם — Phase 3 פשוט מציג אותם כ-info; אין styling מיוחד ל-task_completed |
