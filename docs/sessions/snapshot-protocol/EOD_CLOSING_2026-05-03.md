# BUFF Docs — End-of-Day Closing (2026-05-03)

## חלק 1 — מה הושלם היום

### Improvement Package: snapshot-protocol

**מטרה:** מניעת snapshot fabrication ו-cascade ב-recommendations (תקרית 2026-05-03 בה CC ייצר טענה לא מעוגנת על RevenueCat ו-Claude.ai בנתה pushback מטעה על בסיסה).

**הוטמע ב-`main` (commit `50ad665`):**

| קובץ | מה נוסף |
|---|---|
| `CLAUDE.md` | סעיף `Read-only Snapshot Protocol` — 5 כללים |
| `docs/WORKFLOW.md` | `Snapshot Prompt Template` + `Verification Gate` |
| `docs/INTEGRATION_LEARNINGS.md` | `## Lessons` חדש + `Lesson 2026-05-03` |
| `docs/sessions/snapshot-protocol/` | session folder מלא |

**Commits:** 5. **שינויי קוד:** 0.

---

## חלק 2 — פתוח למחר

### החלטה אסטרטגית: סדר עבודה השתנה

**הסדר המקורי:** Wolf STORMY skin בודד → Pet Skin Picker.

**הסדר החדש:**
1. בחירת תוכנה ליצירת Pet assets עקביים (Stitch / Midjourney / DALL-E / אחר)
2. סשן יצירת קולקציה ראשונה (Gaming — Wolf, Dragon, +)
3. Package A מוחלף ל-`gaming-collection-add` — הוספת כל הקולקציה יחד
4. Package B (`pet-skin-picker`) — UI לבחירה ב-onboarding

**הסיבה:** Adi הצביעה על שתי משפחות עיצוב נדרשות (Pastel + Gaming) עם דרישה לעקביות ויזואלית בתוך כל קולקציה.

### FLAGs לפתיחה מחר (CC יוסיף ל-INTEGRATION_LEARNINGS)

**F-2026-05-03-01: שתי קולקציות עיצוב Buddy מקבילות**
- Pastel/Cute (capybara, panda, unicorn — קיימים, צריכים שיפוץ)
- Gaming/Edgy (Wolf, Dragon, חדשים)
- כל קולקציה — אותה תוכנה, אותו פרומפט, ניטרלית מגדרית

**F-2026-05-03-02: סשן Stitch ל-Pastel UI alternative**
- חלק מהילדים יעדיפו פסטל על neon
- מתחבר ל-F-01

### שאלות פתוחות

1. **תוכנה ליצירת assets** — Stitch / Midjourney / DALL-E / Recraft / Leonardo / Firefly
2. **Gaming Collection** — Wolf STORMY + Dragon + מי עוד?
3. **Pastel Collection** — שיפוץ של הקיימים, או החלפה? עוד דמויות?
4. **ניטרליות מגדרית** — איך מוודאים שאף דמות לא נקלטת כ"לבנים בלבד" או "לבנות בלבד"?

---

## חלק 3 — איך לפתוח מחר

**אפשרות A:** להמשיך באותה שיחה ב-Claude.ai (context נשמר).

**אפשרות B:** שיחה חדשה עם starter קצר:

```
היי קלוד, ממשיכה את BUFF מאתמול (3.5).
אתמול סגרנו snapshot-protocol package והחלטנו לעבור ליצירת assets לקולקציות Buddy.

תקראי docs/sessions/snapshot-protocol/EOD_CLOSING_2026-05-03.md.

המשימה היום: דיון על בחירת תוכנה ליצירת Pet assets, ואז תחילת gaming-collection-add.
```

---

## הערות מהיום

**תהליכי:**
- snapshot-protocol = הניסוי הראשון של workflow foundation על package אמיתי. עבר בהצלחה.
- Adi הביעה תסכול בצדק על "3 ימים של meta". מוסכם: לא עוד שינויי workflow עד שיש פיצ'ר אחד אמיתי בקוד.

**מוצרי:**
- Pet skins הופכים מ-hardcoded skins לשתי קולקציות מבוססות-קהל-יעד
- Wolf STORMY = anchor של Gaming collection (לא skin בודד)

---

**סוף סשן 2026-05-03.**
**לילה טוב, Adi.** 🌙
