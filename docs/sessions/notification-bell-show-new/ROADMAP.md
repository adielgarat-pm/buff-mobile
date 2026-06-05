# Notification Bell — Show New Only — Roadmap

> 3 פאזות עם תנאי עצירה מפורשים. כל גבול פאזה הוא שער שניתן לבדוק.
> פירוט מלא של ההחלטות: SPEC.md § "CC defaults applied" (OQ-N1..N10).

## פאזה 0 — Foundation + class lock

**Scope:** אימות הנחות + נעילת הסיווג מול Adi. אין שינוי קוד runtime.

- אמת ש-`useParentNotifications` (דאשבורד SOS) קורא היום read+unread → מאשר ש-OQ-N4 (סינון בשכבת המסך, לא בשאילתת הבסיס) בטוח.
- אמת ש-ה-SOS dot מונע ע"י `child_vibes.parent_sos_sent`, לא ע"י `is_read`.
- **Adi מאשרת את ה-Type → class map** (8 שורות ב-SPEC.md), כולל שני הגבוליים `parent_engagement` ו-`family_joined`, ואת מספר ימי ה-INFO (ברירת מחדל 7).
- scaffold STATUS / TESTS / SPEC_SYNC.

**תנאי עצירה:** OQ-N1..N10 confirmed/overridden; class map חתום; חוזה ה-regression של דאשבורד SOS כתוב ב-TESTS.

**Exit Deliverables:**
- [ ] STATUS.md row (phase 0)
- [ ] class map חתום ב-SPEC.md (סעיף "Decisions added during execution")
- [ ] אין שינוי קוד; אין canonical doc update בפאזה זו

---

## פאזה 1 — Class map + show-new feed

**Scope:** הליבה. סוג חדש `notificationClass.ts` + שינוי ההתנהגות של מסך הפיד.

- `src/lib/notificationClass.ts` חדש: מפת Type→class + predicate `isVisibleInFeed(notification, now)` = `!is_read && (class === ACTION || ageDays ≤ N)`.
- הסר את אפקט ה-auto-mark-on-open (`didAutoMark`) ב-`NotificationFeedScreen.tsx` (OQ-N3).
- סנן את ה-feed דרך `isVisibleInFeed` (OQ-N4, N5).
- חבר "Clear all" ל-`markAllRead` (optimistic + rollback).

**תנאי עצירה (concrete, measurable):**
- הפיד מציג אך ורק פריטים visible: unread ACTION (ללא תפוגה) + unread INFO בני ≤N ימים.
- פתיחת הפעמון לא מסמנת כלום כנקרא (badge לא משתנה בפתיחה).
- tap על שורה + "Clear all" מסירים פריטים מהפיד מיידית.
- דאשבורד SOS dot ו-anchor-recovery prompts ללא שינוי.

**Exit Deliverables:**
- [ ] שינוי קוד (notificationClass.ts + NotificationFeedScreen.tsx)
- [ ] STATUS.md row (phase 1)
- [ ] INTEGRATION_LEARNINGS.md — תיעוד הסרת auto-mark-on-open + מודל המחלקות
- [ ] Values Check passed אחרי implementation

---

## פאזה 2 — Badge/feed sync + copy

**Scope:** מספר הפעמון מתאים בדיוק לרשימה + עדכון copy.

- `useNotificationsFeed.unreadCount` משתמש באותו `isVisibleInFeed` predicate (OQ-N6) → badge == מספר שורות הפיד תמיד.
- OQ-N7 (אם Adi מאשרת): copy "Mark all as read" → "Clear all" / "נקה הכל" ב-he/en.
- OQ-N10 polish: fade/collapse על mark-read אם זול.

**תנאי עצירה:**
- בכל מצב (כולל INFO שפג): badge count == מספר השורות הנראות בפיד.
- i18n parity נקי; אין חשיפה כלשהי של is_read/feed ל-UI של הילד.

**Exit Deliverables:**
- [ ] שינוי קוד (hook count + i18n)
- [ ] עדכון `src/i18n/he.json`, `src/i18n/en.json` (אם OQ-N7)
- [ ] STATUS.md row (phase 2)
- [ ] Values Check passed

---

## פאזה 3 — Spec sync + tests + PR

**Scope:** סגירה.

- `BUFF_FEATURE_AUDIT.md` — הערה שהפעמון = תור unread-only עם מחלקות ACTION/INFO.
- `INTEGRATION_LEARNINGS.md` — entry סופי.
- `docs/RELEASE_QUEUE.md` — שורת Queued לרכבת הבאה.
- PR ל-main; build ירוק; smoke של דאשבורד SOS עובר; UI ילד נקי.

**תנאי עצירה:** PR פתוח, build ירוק, אין regression, queue row נוסף.

**Exit Deliverables:**
- [ ] canonical docs לפי SPEC_SYNC.md
- [ ] STATUS.md closeout
- [ ] RELEASE_QUEUE.md row

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] כל canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (מוצע: `pkg/notification-bell-show-new/v1`)
- [ ] PR ל-main, merge, branch נמחק לפי Verify-Before-Delete
