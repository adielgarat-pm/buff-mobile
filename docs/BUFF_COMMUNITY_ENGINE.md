# BUFF — Community Engine

> המנגנון שמציף פוסטים רלוונטיים מכל הקבוצות שלנו ומציע תגובות **בקול של Adi** — עם compliance מלא לחוקי כל קבוצה.
> Human-in-the-loop: המנוע מנסח, **Adi מאשרת ומפרסמת.** אין auto-post.

**עודכן:** 2026-08-31 · **מודל:** Operator + cadence log · **סטטוס:** v1.
**מסמכי קלט:** [BUFF_VOICE.md](BUFF_VOICE.md) · [BUFF_COMMUNITY_GROUP_RULES.md](BUFF_COMMUNITY_GROUP_RULES.md) · [BUFF_MESSAGING.md §3/§8](BUFF_MESSAGING.md) · [BUFF_PERSONAS.md](BUFF_PERSONAS.md)

---

## 1. הארכיטקטורה — 3 שכבות

```
┌─ שכבה 1: הידע (בריפו — Claude מתחזק) ────────────────────┐
│  • BUFF_COMMUNITY_GROUP_RULES.md  — רישום קבוצות + חוקים + compliance │
│  • BUFF_VOICE.md                  — הקול של Adi                       │
│  • BUFF_MESSAGING.md §3           — טמפלטים T1–T10                    │
│  • BUFF_PERSONAS.md               — פרסונות הורה                      │
└──────────────────────────────────────────────────────────┘
                          │  (מודבק כ-Operator Brief)
                          ▼
┌─ שכבה 2: המנוע (Claude for Chrome — בדפדפן של Adi) ───────┐
│  1. גולל בכל קבוצה מ-Registry (§4)                         │
│  2. מציף פוסטים לפי Triage Rubric (§5)                     │
│  3. מנסח טיוטת תגובה בקול (VOICE) + compliance (RULES)     │
│  4. מחזיר: פוסט + ציון רלוונטיות + טיוטה + דגלי compliance │
└──────────────────────────────────────────────────────────┘
                          │  (מציג ל-Adi)
                          ▼
┌─ שכבה 3: הבקרה (Adi) ────────────────────────────────────┐
│  • מאשרת / עורכת / דוחה                                    │
│  • מפרסמת ידנית                                            │
│  • מתעדת ב-Cadence Log (§6) — לכבד מקס' 2-3/שבוע/קבוצה     │
└──────────────────────────────────────────────────────────┘
```

**למה human-in-the-loop:** אין API רשמי לפיד של קבוצה פרטית, ו-auto-post לקבוצה מנוהלת של 120K = ban מיידי + נזק אמון. המנוע חוסך 95% מהעבודה (סריקה + ניסוח); Adi מחזיקה את ה-10% שדורש שיפוט אנושי (אישור + פרסום).

---

## 2. איך מריצים סבב (Adi, ~10 דק')

1. פותחת ב-Chrome את הקבוצות מה-Registry (§4), טאב לכל אחת. מחוברת + חברה.
2. מפעילה Claude for Chrome ומדביקה את **Operator Brief (§3)** — פעם אחת בתחילת הסבב.
3. לכל טאב: "scan this group now". המנוע מחזיר candidates + טיוטות.
4. עוברת על הטיוטות, מאשרת/עורכת, מפרסמת.
5. מתעדת שורה ב-Cadence Log (§6).

**תדירות מומלצת:** סבב 2-3× בשבוע. לא כל יום (spam signal).

---

## 3. Operator Brief — להעתיק ל-Claude for Chrome

> העתק-הדבק את כל הבלוק פעם אחת בתחילת כל סבב. עדכן את חלק ה-RULES אם נכנסת לקבוצה חדשה.

```
ROLE: You are my community-engagement operator for BUFF, an ADHD support app
for kids/teens (positive coaching, real rewards, independence — NOT medication,
supplements, or medical/diagnostic advice). I am Adi: founder, but first a
parent of a teen with ADHD.

TASK per group I point you at:
1. Scroll the feed and find posts where a genuine reply from a parent like me
   would add value. Prioritise (relevance rubric):
   - Parent describing a kid who feels they "always do something wrong" / low
     self-esteem / constant correction.
   - Task/homework/chore battles, nagging fatigue, "I repeat myself 100x".
   - Lost interest in reward apps / sticker charts collapsed.
   - Teen won't engage with "babyish" ADHD apps.
   - "Just diagnosed, where do I start" (non-medical).
   - "I want to support not control" / positive-discipline aligned.
   - Independence worries ("will they ever manage alone?").
2. For each candidate return:
   - 1-line summary + permalink
   - Relevance score 1-5 (5 = perfect fit)
   - A DRAFT reply in my VOICE (below)
   - COMPLIANCE flags: list any group rule it might touch (below)
3. DO NOT post anything. Draft only. I approve and post manually.

MY VOICE:
- Parent first, founder second. Founder disclosure only if honest and natural,
  never as the opener.
- Structure: Acknowledge the specific pain -> reframe (positive coaching / real
  rewards / outgrow the app) -> share what worked for us -> stop. No hard CTA,
  no "DM me", no link unless they asked.
- Empathetic + direct. Specific example beats generic empathy. 2-5 sentences.
- Say: coach, mission, BUFFs, real rewards, Pause, outgrow, independence,
  co-designed with a 15yo with ADHD.
- Never say: lazy/naughty/defiant, "try harder"/"don't give up", streaks,
  behavior/behavioral, disorder, surveillance/monitoring, special needs.

HARD COMPLIANCE RULES (never break — flag and skip if a post pulls me toward these):
- No medications talk of any kind (brands, dosage, side effects, cost, funding,
  "instead of meds").
- No supplements/vitamins/CBD/caffeine/melatonin/natural alternatives.
- No sleep advice. No benefits (DWP/PIP/DLA/UC/Blue Badge/Motability).
- No diagnostic help, no interpreting assessments/questionnaires/school reports.
- No medical/symptom advice or causes of ADHD. No injury photos.
- No food/diet/weight/eating advice. No child photos. NO videos. NO hashtags.
- Never quote BUFF prices (needs verification first).
- Tone always kind/peer-support; never judging or belittling.

OUTPUT: a ranked list, best candidates first. Nothing posted.
```

---

## 4. Group Registry

טבלת כל הקבוצות שאנחנו פעילים בהן. חוקים מפורטים לכל קבוצה → [BUFF_COMMUNITY_GROUP_RULES.md](BUFF_COMMUNITY_GROUP_RULES.md).

| ID | קבוצה | פלטפורמה | גודל | קהל | חוקים |
|----|-------|----------|------|-----|-------|
| G1 | ADHD/AuDHD/ASD COMMUNITY SUPPORT GROUP - UK ONLY 🇬🇧 | Facebook (private) | 120.7K | הורים UK | [RULES §2](BUFF_COMMUNITY_GROUP_RULES.md) — 10 rules, קשוח |
| G2 | _(להוסיף)_ | | | | |
| G3 | _(להוסיף)_ | | | | |

> **להוספת קבוצה:** הדבק את החוקים שלה ל-Claude → נוסיף שורה כאן + section ב-RULES + נעדכן את חלק ה-RULES ב-Operator Brief.

---

## 5. Triage Rubric — מה "רלוונטי" (ציון 1-5)

| ציון | סימן | דוגמה |
|------|------|-------|
| **5** | כאב ליבה של BUFF, שאלה פתוחה, בטוח מבחינת compliance | "My son thinks he's always the bad kid, how do I help his confidence?" |
| **4** | כאב רלוונטי אבל צריך זהירות במסגור | "Homework is a daily battle, nothing works" |
| **3** | רלוונטי חלקית / כבר יש 50+ תגובות | "Any app recommendations?" (רווי) |
| **2** | נוגע בקצה, סיכון compliance גבוה | פוסט שמתחיל על routines אבל גולש לשינה/תרופות |
| **1** | לא רלוונטי או compliance-blocked | כל פוסט על meds/benefits/sleep/food/diagnosis |

**כלל:** מגיבים רק על 4-5. פוסט עם דגל compliation אדום — skip, גם אם מפתה.

---

## 6. Cadence Log — לכבד תדירות, למנוע spam-flag

מגבלה: **מקס' 2-3 תגובות/שבוע/קבוצה** (MESSAGING §8.1). תעד כל פרסום:

| תאריך | קבוצה | סיכום הפוסט | ציון | פורסם? | קישור/הערה |
|-------|-------|------------|------|--------|------------|
| _(דוגמה)_ 2026-09-01 | G1 | "sticker charts stopped working" | 5 | ✅ | reframe + Pause Mode |
| | | | | | |

> אם קבוצה כבר עברה 3 השבוע — דלג עליה בסבב הבא, גם אם יש פוסט מושלם.

---

## 7. מתי המסמך מתעדכן

| תרחיש | פעולה |
|-------|-------|
| נכנסים לקבוצה חדשה | הוסף שורה §4 + section ב-RULES + עדכן Operator Brief §3 |
| Adi מכווננת את הקול | עדכן VOICE, ואז חלק ה-VOICE ב-Operator Brief |
| מחיר/מנגנון משתנה | עדכן guard ב-§3 + VOICE §7 |
| תגובה נמחקה ע"י admin | תעד איזה חוק, חדד RULES §3 + Triage |
| Claude for Chrome זמין ומורשה על facebook.com | Adi מריצה סבב פיילוט (§2), מדווחת מה עבד |

---

**נוצר:** 2026-08-31 · **מודל:** Operator + cadence log · **תחזוקה:** Adi + Claude.
**צעד הבא ל-Adi:** (1) לאשר/לכוונן VOICE. (2) להדביק חוקים של קבוצות G2/G3. (3) לוודא Claude for Chrome מורשה על facebook.com ולהריץ סבב פיילוט.
