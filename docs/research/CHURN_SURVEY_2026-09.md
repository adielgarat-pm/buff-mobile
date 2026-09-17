# BUFF — Churn survey (Track A, low-effort path)

> **Purpose:** a 60-second, 5-question survey for parents who signed up and stopped. Complements the 10-minute call; never replaces it. Responses are joined to the DB funnel by a hidden family code, so we can compare *what they say* with *what they did*.
> **Tool:** Tally, free plan ($0: unlimited forms/responses, hidden URL fields, RTL Hebrew, one question per page, CSV/Sheets export). Two forms, HE and EN, identical structure.
> **Approved:** Adi, 2026-09-17. No app code, no schema, no PII in the repo.

---

## 1. Design rules and why (research, 2026-09-17)

| Rule | Why | Source |
|---|---|---|
| 5 questions, ~60 seconds | churn surveys are answered by people who already left; length kills completion | [VWO](https://vwo.com/blog/churn-survey/), [Userpilot](https://userpilot.com/blog/churn-surveys-saas/), [Olvy](https://olvy.co/blog/churn-survey-best-practices/) |
| Open question **first**, closed list second | a list shown first anchors people to our categories; self-generated answers are the discovery signal. We have zero interviews yet, so our list is a hypothesis list | [Maze](https://maze.co/guides/ux-surveys/questions/), [CleverX](https://cleverx.com/blog/multiple-choice-questions-design-best-practices-for-surveys/) |
| Shuffle the closed options; keep "Other" fixed last | primacy/recency bias in option order | [CleverX](https://cleverx.com/blog/multiple-choice-questions-design-best-practices-for-surveys/), [Formfacade](https://formfacade.com/embed/google-forms-shuffle-answer-choices.html) |
| Ask about a specific moment ("after you set it up", "the last time it was open") | recall bias; people remember recent, frequent, emotional moments | [NN/G survey challenges](https://www.nngroup.com/articles/10-survey-challenges/), [Lensym](https://lensym.com/blog/recall-bias-survey/) |
| No incentive anywhere (Adi, 2026-09-17: "whoever wants a product that works for their kids will invest without one") | a 60-second ask needs none; a free year of a product that didn't work reads as a chore (Gemini recipient review) | [Singer & Ye meta-analysis via SurveyMonkey](https://www.surveymonkey.com/curiosity/academic-research-on-incentives/), [46-RCT meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9844858/) |
| Parent-report only; no child names or fields; hidden code instead of name | minors' data; COPPA-style notice principle; Pillar 2 | [Online pediatric research: consent models](https://journals.sagepub.com/doi/full/10.1177/1073110520917038) |
| Tally over Google Forms | hidden fields, RTL, per-page questions, free | [Tally features](https://tally.so/features), [Tally hidden fields](https://tally.so/help/hidden-fields), [Google Forms vs Tally](https://www.softr.io/blog/google-forms-vs-tally-forms) |

---

## 2. The form — English (paste into Tally, one block per page)

**Title:** You tried BUFF and stopped. 60 seconds, 5 questions.
**Intro (small text):** This is about your experience, not your child. Answers are linked to a family code, not your name. Leave your email only if you want Adi to call.

**Q1 · short text · required**
In one or two sentences: what happened after you set BUFF up?

**Q2 · single choice · required · shuffle ON · "Other" fixed last**
Which of these is closest to the main reason it didn't stick?
- I finished setting it up and never got back to it
- I didn't understand what to do next after creating the tasks
- Getting my child onto their own login or device was too hard
- I wasn't comfortable creating a profile for my child
- My child tried it and didn't want to continue
- Life got in the way that week; nothing to do with the app
- Something didn't work or crashed
- It wasn't what I thought it was
- I ran into a paywall before I could see what it does
- Other: ______

**Q3 · single choice · required**
Did your child ever open BUFF?
- Never
- Once
- A few days
- More than a week

**Q4 · single choice + text on "Other"**
The thing that made you look for BUFF in the first place: what are you doing about it today?
- Nothing has changed
- A paper chart or a routine we made ourselves
- Another app (which?): ______
- A therapist, coach or the school
- A medication change
- It got better on its own

**Q5 · single choice · optional · email field appears on "Yes"**
Would you take a 10-minute call with Adi? No pitch, just questions.
- Yes, here's my email: ______
- No, this is enough

**Thank-you page:** Thank you. If you'd rather just write, reply to Adi's email.

---

## 3. הטופס — עברית (להדביק ב-Tally, RTL מופעל, בלוק לכל עמוד)

**כותרת:** ניסית את BUFF ועצרת. 60 שניות, 5 שאלות.
**שורת פתיחה (טקסט קטן):** זה על החוויה שלך, לא על הילד/ה. התשובות מקושרות לקוד משפחה, לא לשם. מייל משאירים רק אם רוצים שעדי תתקשר.

**ש1 · טקסט קצר · חובה**
במשפט או שניים: מה קרה אחרי שהגדרת את BUFF?

**ש2 · בחירה אחת · חובה · ערבוב מופעל · "אחר" קבוע אחרון**
מה הכי קרוב לסיבה העיקרית שזה לא נתפס?
- סיימתי להגדיר ולא חזרתי לזה
- לא הבנתי מה לעשות אחרי שיצרתי את המשימות
- להכניס את הילד/ה ללוגין או למכשיר משלו היה מסובך מדי
- לא הרגשתי בנוח ליצור פרופיל לילד/ה
- הילד/ה ניסה/תה ולא רצה/תה להמשיך
- החיים השתלטו באותו שבוע, לא קשור לאפליקציה
- משהו לא עבד או קרס
- זה לא היה מה שחשבתי שזה
- נתקלתי בפייוול לפני שהספקתי לראות מה זה עושה
- אחר: ______

**ש3 · בחירה אחת · חובה**
הילד/ה פתח/ה פעם את BUFF?
- אף פעם
- פעם אחת
- כמה ימים
- יותר משבוע

**ש4 · בחירה אחת + טקסט על "אחר"**
הדבר שגרם לך לחפש את BUFF מלכתחילה: מה את/ה עושה איתו היום?
- שום דבר לא השתנה
- טבלה על הנייר או שגרה שבנינו לבד
- אפליקציה אחרת (איזו?): ______
- מטפל/ת, מאמן/ת או בית הספר
- שינוי בתרופות
- זה השתפר מעצמו

**ש5 · בחירה אחת · לא חובה · שדה מייל נפתח על "כן"**
שיחה של 10 דקות עם עדי? בלי מכירה, רק שאלות.
- כן, הנה המייל שלי: ______
- לא, זה מספיק

**עמוד תודה:** תודה. אם נוח יותר פשוט לכתוב, אפשר להשיב למייל של עדי.

---

## 4. Hidden fields and links

Add three **hidden fields** to each form: `fam`, `seg`, `lang`.
Per-recipient link: `https://tally.so/r/<FORM_ID>?fam=<4-char family code>&seg=<A0|A|A2|B>&lang=<he|en>`
CC generates the links into the mail-merge CSV (scratchpad, never the repo). The 4-char code is the first four characters of `families.id`; it identifies a family only when joined to the DB, so it is pseudonymous for anyone else.

## 5. Tally setup (Adi, ~15 minutes)

1. tally.so → sign up (free) → New form → blank.
2. Paste §2 (EN form). Set each question as its own page (`/page` block between questions). Q2: options → "Shuffle options" ON; drag "Other" to the end and mark it fixed if available, else accept it may shuffle.
3. Q5: add conditional logic "show email field if answer = Yes".
4. Settings → Hidden fields → add `fam`, `seg`, `lang`.
5. Duplicate the form → replace with §3 (HE). Settings → Language/Direction → RTL. Same hidden fields.
6. Publish both. Send CC the two `tally.so/r/…` URLs.
7. Test: open each link with `?fam=test&seg=A0&lang=en`, submit, then Responses → export CSV and check `fam`, `seg`, `lang` columns are filled.

## 6. Analysis plan (CC)

- Export → CSV → join on `fam` to the funnel query (signup date, platform, child login, active days). Target: 100% join.
- Q1 verbatims → coding sheet in `INTERVIEW_LOG_2026-09.md` under "סקר נטישה". Read for saturation, same rule as the interviews.
- Q2 option → hypothesis map (below). Check for a primacy artefact: distribution across first-shown position should be roughly flat.
- Q3 vs DB: if a parent says "a few days" and the DB shows zero child login, that gap is itself a finding (shared-device use we don't see, or memory).
- Q5 "Yes" → Track A call list.

| Q2 option | Hypothesis |
|---|---|
| finished setting up, never got back | H2 not urgent / H5 parent EF |
| didn't understand what to do next | H6 blank-slate dead end |
| child login/device too hard | H1 handoff mechanics |
| not comfortable creating a child profile | H7 privacy/trust |
| child tried and didn't want to continue | H4 child rejected |
| life got in the way | H2 |
| something didn't work | bug (check Sentry for that family's window) |
| not what I thought | expectation gap (listing / messaging) |
| ran into a paywall before seeing value | **H8 paywall-before-value** (leading hypothesis after Noa, 2026-09-17) |

## 7. Not in scope
No in-app survey, no code, no schema. If the survey performs, an in-app version at the day-3 drop is a separate package after the study.
