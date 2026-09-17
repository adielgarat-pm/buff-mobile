# Track A — Churn interview (parent set up BUFF, child never really used it)

**Who:** parents in segments `A_churned_at_handoff`, `A0_no_child`, `A2_activated_then_stopped`.
**Format:** 15-minute call, or 5 WhatsApp voice-note questions. One question at a time. No pitch, no demo, no "did you know that…".
**Incentive:** none (Adi, 2026-09-17). The 60-second survey is the low-friction path; the call is offered plainly. Gemini's recipient review: a free year of a product that didn't work for you reads as a chore, not a gift.
**Low-effort path (added 2026-09-17):** a 60-second, 5-question survey with a hidden family code, see `docs/research/CHURN_SURVEY_2026-09.md`. Every outreach offers both: the survey link for the busy, the call for the willing.
**Goal:** find out which hypothesis is true for *this* family: H1 handoff broken / H2 pain not urgent / H4 the child didn't want it.
**Values guard:** the parent did nothing wrong by stopping. Never "why didn't you…". Always "what happened".

---

## Outreach message (personal, from Adi)

**EN**
> Hi [Name], I'm Adi, founder of BUFF. I saw you tried BUFF briefly in [month]. I know how hard it is to bring a new tool into a family's routine, and I'm trying to understand where the app loses families in the first week, before I write more code. Two ways, your pick: a 60-second survey ([link]), or a 10-minute call. Or just reply with one line on what happened.

**HE**
> היי [שם], אני עדי, המייסדת של BUFF. ראיתי שניסית את BUFF לזמן קצר ב[חודש]. אני יודעת כמה קשה להכניס כלי חדש לשגרה של משפחה, ואני מנסה להבין איפה האפליקציה מאבדת משפחות בשבוע הראשון, לפני שאני כותבת עוד קוד. שתי דרכים, לבחירתך: סקר של 60 שניות ([לינק]), או שיחה של 10 דקות. או פשוט שורה אחת בתשובה על מה קרה.

---

## The 5 questions (in this order, don't skip ahead)

| # | EN | HE | What we listen for |
|---|---|---|---|
| 1 | What was going on at home the week you installed BUFF? What made you look for something? | מה קרה בבית בשבוע שהתקנת את BUFF? מה גרם לך לחפש משהו? | Pain and its intensity. Is it a specific moment (mornings, homework, bag) or a general worry? |
| 2 | What did you expect BUFF would do for you? | מה ציפית ש-BUFF תעשה בשבילך? | Expectation gap. Did they think it's a parent tool? A game for the kid? |
| 3 | You got as far as the task list, or wherever you stopped. What happened right after that? | הגעת עד רשימת המשימות, או עד איפה שעצרת. מה קרה מיד אחרי זה? | **The key question.** Let silence do the work. H1: "I tried to get him on it and…". H2: "honestly, I never got around to it". H4: "she looked at it once and…". |
| 4 | Did your child see it? What did they say or do? | הילד/ה ראו את זה? מה אמרו או עשו? | Child's reaction verbatim. Age. Which device they would have used. |
| 5 | What are you doing about [the pain from Q1] now? | מה את/ה עושה עם [הכאב משאלה 1] היום? | Alternative solutions, spend, resignation. "Nothing" = pain not urgent enough to act on. |

**Closing:** "If BUFF did one thing differently, what would have made you show it to your child that same evening?" / "אם BUFF הייתה עושה דבר אחד אחרת, מה היה גורם לך להראות אותה לילד/ה באותו ערב?"

---

## Coding sheet (fill right after each call)

```
Family: ____   Segment: ____   Child age: ____   Device child would use: own phone / shared / home PC / none
Pain named (Q1): ____________________   Intensity: low / medium / high (unprompted words like "every morning", "fights", "crying")
Expectation (Q2): parent tool / kid game / both / unclear
What happened after setup (Q3): never showed kid / tried, login failed / kid tried once, dropped / kid used, parent dropped / other: ____
Child reaction (Q4): ____________________
Doing now (Q5): nothing / paper chart / other app: ____ / therapist / medication change
Hypothesis this family supports: H1 handoff / H2 not urgent / H4 kid rejected / H3 needed Adi / other
Quote worth keeping (verbatim, consent asked? y/n): ____________________
```

**Aggregate rule (revised 2026-09-14):** read for saturation, not counts. A hypothesis is supported when at least three parents tell the same story unprompted for Q3 and no interview contradicts it with equal specificity. A split with no dominant story → no build; extend Track C.
