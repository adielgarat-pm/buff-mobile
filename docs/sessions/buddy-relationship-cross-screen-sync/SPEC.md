# buddy-relationship-cross-screen-sync — SPEC

> Surgical bug fix. Found during MVP review session 2026-05-23/24 (Buddy modal flow).
> Authoritative until merged.

---

## Capabilities & Bottlenecks

### מה Claude Code (CC) יעשה
- מוסיף `useFocusEffect(() => refetch())` ב-4 המסכים שצורכים את `useBuddyRelationship`
- מריץ typecheck + jest, מקמיט, פותח PR

### מה Adi חייבת לעשות בעצמה
- merge ה-PR אחרי קריאה
- אימות יד-על-אנדרואיד שהסנכרון Settings ↔ Dashboard עובד אחרי שינוי (CC לא יכול להריץ את האפליקציה כילד מחובר)

---

## Values Check

באג טכני שאינו פיצ'ר חדש מול המשתמש; אין copy חדש, אין מנגנון, אין מודעות חדשה. הסנכרון משקף את המצב האמיתי של ה-DB מהר יותר — תואם Pillar 3 (Independence-Building) כי הילד רואה את ההגדרות שלו בלי לסגור את האפליקציה.

**Values Check Pass:** [x] כן

---

## Goals
- שינוי ב-`buddy_visible` או `buddy_name` ממסך אחד משתקף מיד כשעוברים למסך אחר שצורך את אותו `child_profile_id`
- אין רגרסיה ב-mocks הקיימים של ה-hook

## Non-goals
- לא מחליפים למקור-אמת גלובלי (Context / Zustand) — overkill בשביל שדה אחד
- לא מוסיפים Realtime subscription — מתועד כ-FUTURE ב-hook עצמו, חבילה אחרת
- לא משנים את חתימת ה-hook (`refetch` כבר מיוצא)

---

## Behavior Contract

נכון להיום: שינוי `buddy_visible` ב-`ChildSettingsScreen` קורא ל-`setBuddyVisible` שמעדכן את ה-state המקומי של ה-instance שלו ואת ה-DB. ה-instance של אותו hook ב-`GamerDashboardScreen` (שמרכיב את ה-Buddy modal) ממשיך להחזיק את ה-state הקודם עד remount.

אחרי החבילה: כל מעבר ניווט שמכניס לפוקוס מסך שצורך את ה-hook מפעיל `refetch()`. ב-React Navigation, `useFocusEffect` יורה בכל פעם שהמסך נכנס לפוקוס (כולל back-navigation מ-stack-pushed screen) — כך ש-Dashboard "תופס" את ה-mutation שעשה Settings ברגע שחוזרים אליו.

## API / Route Changes
אין.

## UI Changes
אין.

## Schema Changes
אין.

## Affected Files
- `src/screens/child/GamerDashboardScreen.tsx` — read + setBuddyVisible
- `src/screens/child/ChildSettingsScreen.tsx` — read + setBuddyVisible + setBuddyName
- `src/screens/child/GamerMyStatsScreen.tsx` — read-only
- `src/screens/child/GamerMeAndBuddyScreen.tsx` — read-only

## Tests
- All 154 existing tests pass
- 3 screen test files updated to mock `useFocusEffect: jest.fn()`
- Hook test suite unchanged (refetch already exported and covered)

## Out of Scope
- Realtime subscription (פתורה ב-FUTURE comment ב-hook)
- כל קריאה אחרת ל-`useBuddyRelationship` שתתווסף בעתיד — האחריות על המתחבר החדש
