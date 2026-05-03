# {Package name} — Tests

> קריטריוני pass/fail לכל פאזה. **קונקרטי וניתן לאימות.**

## איך מריצים בדיקות

ב-BUFF, רוב הבדיקות הן **בדיקות ידניות באמולטור Android** (Adi). חלק יכול להיות אוטומטי (Jest unit tests, אם יש). CC יכול להריץ tests אוטומטיים; Adi מריצה בדיקות UI.

---

## פאזה 1

### בדיקות אוטומטיות (CC מריץ)
- [ ] {קריטריון בדיקתי, אם יש tests אוטומטיים}

### בדיקות ידניות באמולטור (Adi)
- [ ] {מה לבדוק במסך X}
- [ ] {האם הזרימה עובדת}
- [ ] {האם הUI נראה נכון לפי Stitch / DESIGN.md}

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=1, state=passed
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md נוכחים באותו commit
- [ ] Values Check עדיין עובר אחרי implementation (לא רק בSPEC)
- [ ] INTEGRATION_LEARNINGS.md עודכן אם היו הפתעות

---

## פאזה 2
...

## פאזה N
...

---

## Closeout
- [ ] כל בדיקות הפאזות עוברות
- [ ] STATUS.md closeout checklist הושלם
- [ ] Git tag נוצר
- [ ] אין drift בין canonical docs לבין המערכת החיה
- [ ] בדיקת end-to-end ידנית באמולטור — כל הflow של החבילה עובד
