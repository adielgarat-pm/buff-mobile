# BUFF — Testimonials Library

> מערכת הניהול של עדויות משתמשים — איסוף, אישור, תיוג, ושימוש.
> בלי המסמך הזה: 183 משפחות beta כעדויות פוטנציאליות לא מנוצלות. עם המסמך: רשת ציטוטים שתעבוד בכל ערוץ.

**עודכן:** 11 במאי 2026
**מקור:** Landing.tsx ב-buff-main pulls `<TestimonialsSection />` מ-DB, PRD §2.2 (Noa Morag AHA quote), BUFF_PERSONAS (מיפוי לפרסונה)
**שפה:** עדויות במקור — אם הן באנגלית, נשמר באנגלית; אם בעברית, נשמר בעברית. הסברים בעברית.

---

## למה המסמך הזה קיים

עדויות הן **הנכס הכי ממיר** בקטגוריה של behavioral apps. הורה שואל "האם זה עובד?" — תשובה הכי טובה היא הורה אחר שאמר "כן, ככה". פה מתחיל הקושי:

1. **183 משפחות beta** השתמשו ב-BUFF. רובן לא נשאלו אם הן מוכנות להעיד.
2. **הציטוט הקריטי כבר קיים** ב-PRD: AHA moment של Noa Morag — אבל אין מקום לשמור אותו ולתייג.
3. **Landing.tsx מושך עדויות מ-DB** — אבל אין framework לקבל החלטה אילו לבחור.
4. **בלי curation** — עדויות יוצאות גנריות ("Great app!") במקום ספציפיות ("Saved my Tuesday mornings — my 9yo packs his own bag now").

המסמך הזה הוא ה-control panel.

---

## 1. The Schema — איך כל עדות נרשמת

כל עדות במסמך הזה (וב-DB) חייבת לכלול:

```
ID: T### (running number)
Quote (in original language):
Translation (if not original EN):
Speaker:
  - First name (or initial)
  - Role (parent of X-year-old / parent of teen / teen-user / etc.)
  - Geo (US/UK/IL/etc.)
Date collected:
Consent status:
  - Public use (with first name): yes/no/conditional
  - Anonymized public use: yes/no
  - Internal only (no public use): yes
Persona tag (from BUFF_PERSONAS):
  - P1 / P2 / P3 / P4 / P5 / C1 / C2 / C3 / C4
Pillar tag (from BUFF_VALUES):
  - Intrinsic Motivation / Positive Coaching / Independence-Building
Pain it speaks to:
  - From the pain-mapping in BUFF_MESSAGING §4
Where it's used:
  - Landing / Play Store / FB ad / Reel / press / unused
Strength rating (1-5):
  - How "killer" is this quote on a scale of 1-5
```

---

## 2. The Canonical First Testimonial

### T001 — Noa Morag (AHA moment)

```
ID: T001
Quote (EN, original or translated): "The day I didn't need to remind things multiple times — maybe just asked if it was done."
Quote (HE, if Hebrew): "היום שלא הייתי צריכה להזכיר דברים פעמיים — אולי רק שאלתי אם זה נעשה."
Speaker:
  - First name: Noa
  - Last name: Morag (per PRD §2.2)
  - Role: parent of an ADHD child (age unspecified)
  - Geo: IL
Date collected: pre-MVP user research
Consent status:
  - ⚠ VERIFY: PRD says "top user" — assume consent for public attribution but VERIFY with Noa before using in paid ads or Play Store.
Persona tag: P1 (Exhausted Morning Parent) — matches the daily-friction pain
Pillar tag: Positive Coaching (the moment when nagging stops)
Pain it speaks to: "I'm tired of repeating myself" (BUFF_MESSAGING §4)
Where it's used:
  - Currently: PRD §2.2 (as AHA moment definition)
  - Recommended: Hero of About page; opener of pitch decks; intro of Reels Format 4 (Parent Confession)
Strength rating: 5/5
  - This is THE canonical BUFF moment. Every campaign should orbit it.
```

**Why this quote is canonical:**

זה ה-AHA moment של כל BUFF. שאלת ה-acid test לכל ad חדש: *"is this moving the parent toward Noa's moment?"* בלעדיה ה-product hangs in air.

---

## 3. Slots to Fill — חיפוש פעיל לעדויות חסרות

המסמך מקיף **9 פרסונות** ו-**3 פילרים**, אבל יש לנו עדות אחת. הטבלה למטה היא רשימת ה-gaps. כל gap הוא קמפיין שיווקי חסר נשק.

| Persona | Pillar — Intrinsic | Pillar — Positive Coaching | Pillar — Independence |
|---|---|---|---|
| P1 Exhausted Morning | — | T001 ✅ | — |
| P2 Post-Diagnosis | `[NEED]` | `[NEED]` | `[NEED]` |
| P3 Tried Everything | `[NEED]` | `[NEED]` | `[NEED]` |
| P4 Teen-Lost-Control | `[NEED]` | `[NEED]` | `[NEED]` |
| P5 Coach-Curious | `[NEED]` | `[NEED]` | `[NEED]` |
| C1 Emi-type (6-9 kid) | `[NEED]` | `[NEED]` | `[NEED]` |
| C2 Mid-Range (10-12) | `[NEED]` | `[NEED]` | `[NEED]` |
| C3 Itay-type (13-15) | `[NEED]` | `[NEED]` | `[NEED]` |
| C4 Late Teen (16-18) | `[NEED]` | `[NEED]` | `[NEED]` |

**מטרה ל-MVP launch:** לפחות 1 עדות מאומתת לכל פרסונה + פילר עם strength 4+. זה 9-12 עדויות מאומתות.

---

## 4. Collection Workflow — איך לאסוף עדויות חדשות

### 4.1 Who to ask

מתוך 183 beta families, יעדים ב-priority:
1. **Long-term users** — מעל 30 ימים פעילות, completion rate מעל 70%
2. **AHA moment expressers** — משתמשים שכבר אמרו משהו ספציפי ("BUFF saved my morning")
3. **Cross-persona representatives** — כיסוי על כל הפרסונות בטבלה למעלה
4. **Geo diversity** — לא רק ישראלים. 96% מהבטא ישראלים אבל קהל היעד הוא US/UK.

### 4.2 How to ask

**Email/message template (EN):**
> *"Hi [Name], you've been using BUFF for [X weeks/months]. Would you be willing to share one sentence about what changed at home since you started? Quotes from real parents are how we help others find BUFF. You can use first name only, full anonymous, or include more — your call."*

**HE:** *"היי [שם], השתמשת ב-BUFF כבר [X שבועות/חודשים]. מה השתנה בבית מאז שהתחלת? משפט אחד מספיק. ציטוטים מהורים אמיתיים זה איך שמשפחות אחרות מוצאות אותנו. אפשר שם פרטי בלבד, אפשר אנונימי, אפשר עם פרטים נוספים — את מחליטה."*

### 4.3 What to ask for

Open-ended question to ask:
> *"What's one thing that's different at home since you started using BUFF?"*

**הימנעי משאלות מובילות:** *"Are you happy with BUFF?"* → תשובות גנריות. הספציפיות חשובה.

### 4.4 What consent to record

לכל עדות:
- **Use in landing page / Play Store / public web:** yes / no / conditional
- **Use in paid ads:** yes / no / conditional
- **Use with first name:** yes / first initial only / fully anonymous
- **Use with age of kid:** yes / no
- **Use with photo:** yes / no (mostly: no)
- **Use in video format (audio quote / on-camera):** yes / no

קודיפיקציה של הנתונים האלה ב-DB schema — verify ש-`<TestimonialsSection />` מכבד אותם.

---

## 5. Curation Rules — איזו עדות ל-where

### 5.1 Landing page testimonials section
- **Quantity:** 3-6 עדויות, מסתובבות
- **Coverage:** מינימום 2 שונות-פרסונה
- **Strength:** רק 4-5 strength
- **Format:** ציטוט + first name + child age + geo (אם יש consent)
- **Anti-pattern:** *"This app is great!"* (generic, low strength)

### 5.2 Play Store description
- **Quantity:** 2-3 ציטוטים קצרים בתוך description
- **Format:** ציטוט בלבד, attribution קצר ("— Sarah, mom of 9yo, US")
- **Strength:** רק 5/5

### 5.3 Facebook / Reddit reply (in-thread)
- **Use case:** הורה שואל ספציפית "האם זה עובד עבור X?"
- **Format:** "Another beta mom said it this way: [quote]" — לא דוחפים, מציעים
- **Anti-pattern:** העתקה של אותו ציטוט בכל reply (spammer flag)

### 5.4 Reels / Video ads
- **Use case:** ציטוט נקרא ב-voiceover או מופיע כ-text-on-screen
- **Format:** ציטוט קצר (max 12 words), ע"ב text-on-screen בלבד אלא אם יש audio consent
- **Strength:** 5/5 בלבד — סרטון חי ע"י עדות חזקה

### 5.5 Press / podcast / investor
- **Use case:** Long-form interviews, pitch decks
- **Format:** Full quote + full context (kid age, time using, geo, specific change)
- **Strength:** 4+, ייחודיים — לא העתקה של מה שיש בלנדינג

---

## 6. Anti-Patterns — מה NOT לעשות

❌ **Fabricate quotes.** Ever. גם לא ב-mockups. גם לא ב-internal pitch deck.
❌ **Edit quotes for clarity** beyond fixing typos. אם הציטוט לא חזק — מחפשים אחר, לא משפרים את הקיים.
❌ **Use quotes without verified consent** (PR damage rich).
❌ **Identify kids by photo + name** in any public material, including in podcasts.
❌ **Use the same 3 quotes everywhere** — מסמן עוני, מציע שאין יותר.
❌ **Translate quotes between EN/HE** without flagging it as translation. עדות הבריאה התרגום מקפח את האותנטיות.

---

## 7. Database Integration

`<TestimonialsSection />` ב-Landing.tsx מושך עדויות מ-Supabase. נדרש לוודא:

`[NEEDS VERIFICATION: schema check via Supabase MCP or direct query]`

**שאלות פתוחות:**
1. איזה table מחזיק עדויות?
2. אילו עמודות יש?
3. האם consent flags כבר מקודדים?
4. איך נשלף לעדויות `is_approved_for_public_use`?

יש לבצע query הזה לפני שמוסיפים עדות חדשה ל-DB, או לפני שמשתמשים בעדות קיימת. Per CLAUDE.md "CC-First Investigation" — אם Supabase MCP מחובר, אני יכול לעשות את ה-query הזה ולעדכן את המסמך אוטומטית.

---

## 8. Open Action Items

מה שדורש פעולה לפני שהמסמך הזה הופך לפעיל:

- [ ] לבדוק consent מ-Noa Morag לציטוט הספציפי (`[VERIFY]`)
- [ ] לעשות query על testimonials table ב-Supabase ולמלא את §7
- [ ] לאסוף 8-11 עדויות נוספות, אחת לכל cell בטבלת §3
- [ ] לקבוע ב-CLAUDE.md / WORKFLOW.md מתי לאסוף עדויות חדשות (אחרי X שימוש?)
- [ ] לעדכן את `<TestimonialsSection />` consent logic אם חסר

---

## 9. מתי המסמך הזה מתעדכן

**שבועית בפאזת ה-launch.** כל עדות חדשה שמתקבלת — לרשום כאן עם schema מלא. אחרי launch — חודשית.

| תרחיש | פעולה |
|---|---|
| משתמש שלח עדות | להוסיף T### חדש לפי schema §1 |
| Consent התעדכן | לעדכן באותה רשומה + עדכון b-DB |
| עדות עוברת ל-landing | סמן ב-`Where it's used` §1 |
| עדות נמחקת (consent revoked) | move to archive section + remove from DB |

---

## 10. שימוש במסמך

### עבור Adi
לפני בקשה של עדות חדשה — לראות איזה gap בטבלת §3 הכי לוחץ. עדות לפרסונה שכבר מכוסה = ערך נמוך.

### עבור Claude.ai (web)
כשמועבר prompt של "כתבי ad / landing variant / Reel" — לבחור עדות מהמסמך לפי persona + pillar שתואמים ל-brief.

### עבור Claude Code (אני)
לא לפרסם user-facing copy שכולל עדות בלי לוודא ב-§1 שיש consent. אם יש Supabase MCP — לרוץ query על testimonials table לאימות.

### עבור anyone doing outreach
תבנית בקשה ב-§4.2. consent capture ב-§4.4.

---

**סוף מסמך.**

**Pending input from Adi (כדי לסגור את `[NEEDS VERIFICATION]`):**
1. אישור Consent מ-Noa Morag לציטוט T001
2. Supabase access ל-testimonials schema (או אישור שאני יכול לרוץ query דרך MCP)
3. עדות נוספות שכבר נאספו ב-research (במסמכים אחרים) שלא הועברו פה
