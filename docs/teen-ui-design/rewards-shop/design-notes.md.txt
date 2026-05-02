# 06 — Rewards Shop (FROM PARENT + FROM BUDDY)

**סטטוס:** ✅ Approved (2.5.2026)

## בחירות עיצוב
- **Tab switcher** — segmented underline-style, default tab "FROM PARENT"
- **Buff balance pill** — תמיד מוצג בפינה ימנית עליונה
- **Grid 2x2** ל-Parent rewards (visual, real-world emojis)
- **Vertical list** ל-Buddy boosters (more text per item, action-oriented)
- **States ברורים:** Locked / Available / Used

## התאמה למצב no-buddy (Itay)
כש-buddy_relationships.buddy_visible = false:
- Tab title: "FROM BUDDY" → "EARNED" או "YOUR BOOSTERS"
- Header: "Boosters from Buddy" → "Your Boosters"
- Description text: "from Buddy" → "you earned"
- אין שינוי במבנה — רק טקסט

## נקודות לשיפור במימוש
- [ ] Reward cards locked — בדוק אם ה-progress bar באמת מציג buffs current/total
- [ ] "USE NOW" button — לאן זה מנווט? לדאוג ל-success modal

## קישור ל-decisions
- D-2026-05-02-08: Boosters system
- D-2026-05-02-13 (revised): Teen choice → text variants