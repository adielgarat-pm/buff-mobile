# 02 — Dashboard without Buddy

**סטטוס:** ✅ Approved (2.5.2026)

## בחירות עיצוב
- **Stats hierarchy:** "32" successful days בלבן (cumulative), "7" current streak בירוק (live metric)
- **Next-up indicator:** המסגרת הירוקה סביב "Pack School Bag" מסמנת את המשימה הבאה
- **Current stage progress:** "AFTERNOON: 1 OF 3 TASKS DONE" מראה התקדמות בחלק היום הנוכחי

## נקודות לשיפור במימוש (לא חוסמות)
- [ ] "SUCCESSFULDAYS" → לתקן ל-"SUCCESSFUL DAYS" (היה bug ב-Stitch)
- [ ] FAB position — לוודא שלא מסתיר את progress text ב-implementation

## איך להגיע למסך הזה
- מתוך מסך 1 (Dashboard with Buddy) → tap על "X" → confirm "Hide Buddy"
- buddy_relationships.buddy_visible = false
- ההעדפה נשמרת — refresh/relaunch לא משחזר את ה-buddy

## פרומפט שהשתמשתי
[הפרומפט המעודכן עם stats hierarchy + current stage]