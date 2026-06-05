# Notification Bell — Show New Only — Tests

> קריטריוני pass/fail לכל פאזה. רוב הבדיקות ידניות באמולטור (Adi); חלק אוטומטי (CC).
> ה-Sentry pre/post-deploy health check (convention 2026-05-16) חל — ראי SPEC_SYNC + ROADMAP פאזה 3.

## נתוני בדיקה נדרשים

משפחת בדיקה עם:
- לפחות פריט **ACTION** אחד לא-נקרא (קל ליצור `parent_sos` ע"י SOS מ-Vibe Check, או `reward_redemption_requested` ע"י בקשת מימוש מהילד).
- לפחות פריט **INFO** אחד לא-נקרא (`task_completed` / `reward_redeemed` — שורות Lovable-era קיימות ב-DB, או הזרקה ידנית עם `created_at` בעבר לבדיקת תפוגה).
- פריט INFO לא-נקרא עם `created_at` בן **>N ימים** (לבדיקת auto-expire).

---

## פאזה 0 — Foundation + class lock

### בדיקות מתודולוגיות
- [ ] אומת בקוד: `useParentNotifications` מחזיר היום שורות גם נקראו וגם לא-נקראו (לא מסנן is_read) → OQ-N4 בטוח.
- [ ] אומת בקוד: ה-SOS dot בדאשבורד מונע ע"י `child_vibes.parent_sos_sent` (לא ע"י `is_read`).
- [ ] Adi אישרה את ה-Type→class map (8 שורות) + שני הגבוליים + מספר ימי INFO.
- [ ] STATUS.md row phase 0 = passed.

---

## פאזה 1 — Class map + show-new feed

### בדיקות אוטומטיות (CC מריץ)
- [ ] Unit: `isVisibleInFeed` — ACTION לא-נקרא בן 100 יום → visible=true; INFO לא-נקרא בן N+1 ימים → visible=false; כל פריט נקרא → visible=false; סוג לא-מוכר → מטופל כ-ACTION (visible אם לא-נקרא).
- [ ] typecheck + lint עוברים.

### בדיקות ידניות באמולטור (Adi)
- [ ] פתיחת הפעמון מציגה **רק** פריטים לא-נקראו. פריט נקרא מאותו יום **לא** מופיע.
- [ ] פתיחת הפעמון **לא** מאפסת את ה-badge (הצצה לא מנקה).
- [ ] tap על שורת ACTION → מנתב למסך הרלוונטי + הפריט נעלם מהפעמון בחזרה.
- [ ] "Clear all" → הפיד מתרוקן ל-empty state, badge → 0.
- [ ] **regression:** אחרי "Clear all", ה-SOS dot בדאשבורד **עדיין מופיע** (לא התנקה).
- [ ] **regression:** משטח anchor-recovery בדאשבורד ללא שינוי.
- [ ] פריט INFO לא-נקרא בן >N ימים **לא** מופיע בפיד.
- [ ] פריט ACTION לא-נקרא ישן (גם בן שבועות) **כן** מופיע בפיד.
- [ ] rollback: ניתוק רשת באמצע "Clear all" → השורות חוזרות ל-unread + toast שגיאה.

### בדיקות מתודולוגיות
- [ ] STATUS.md row phase 1 = passed.
- [ ] INTEGRATION_LEARNINGS.md מתעד הסרת auto-mark-on-open + מודל המחלקות.
- [ ] Values Check עדיין עובר אחרי implementation.

---

## פאזה 2 — Badge/feed sync + copy

### בדיקות ידניות באמולטור (Adi)
- [ ] **badge == מספר השורות בפיד** בכל תרחיש שנבדק (כולל אחרי שפריט INFO פג תוקף).
- [ ] אם OQ-N7 אושר: הכפתור אומר "נקה הכל" / "Clear all" ב-he/en; a11y label תואם.
- [ ] (אם נעשה) אנימציית fade/collapse על mark-read נראית חלקה.

### בדיקות מתודולוגיות
- [ ] i18n parity check נקי (he/en זהים במפתחות).
- [ ] **Pillar 3:** ב-View-as-Child (P-08) הפעמון לא מרונדר; `is_read` לא נחשף בשום מקום ב-UI הילד; אין "ההורה ראה".
- [ ] STATUS.md row phase 2 = passed.
- [ ] **Sentry pre-deploy baseline נרשם** (פאזה אחרונה לפני merge).

---

## פאזה 3 — Spec sync + tests + PR

### בדיקות מתודולוגיות
- [ ] canonical docs מעודכנים לפי SPEC_SYNC.md.
- [ ] `docs/RELEASE_QUEUE.md` — שורת Queued נוספה.
- [ ] STATUS.md closeout checklist הושלם.

---

## Closeout
- [ ] כל בדיקות הפאזות עוברות.
- [ ] בדיקת end-to-end ידנית: ACTION נשאר עד טיפול, INFO פג אחרי N ימים, הצצה לא מנקה, "Clear all" מנקה, SOS dot מנותק — הכל עובד.
- [ ] Git tag נוצר.
- [ ] **Sentry post-deploy regression check עבר** — מינ' 15 דק' אחרי merge; `new_issues_count = 0` או רק unrelated.
