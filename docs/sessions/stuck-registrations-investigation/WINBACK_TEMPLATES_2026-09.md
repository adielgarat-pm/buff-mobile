# Win-back batch — 2026-09 — templates per stuck stage (HE + EN)

> Decision (Adi, 2026-09-02): send a manual email to **every** stuck parent, each according to the stage they stopped at. Not consent-gated (manual batch from Adi's address, same as the 2026-07-14 batch).
> Voice = the approved v2 lifecycle voice (`docs/sessions/lifecycle-emails/EMAIL_TEMPLATES.md`): founder-personal, honest, zero pressure, the kid's real data first, "reply to this email" as the ask.
> The merge list (42 parents, PII) was delivered to Adi as a CSV outside the repo. Columns: `segment, lang_hint, email, parent_name, child_first, first_3_tasks, task_count, completions, last_done, family_code, ...`.

## Batch composition

| Segment | HE | EN | Template |
|---|---|---|---|
| T1 — signed up, no child | 0 | 11 | T1 |
| T2 — child + plan, nothing done, no access mode chosen (pre 08-05) | 13 | 5 | T2 |
| T2 — shared_device | 1 | 1 | T2-S |
| T2 — own_phone | 0 | 1 | T2-P |
| T2 — home_device | 0 | 1 | T2-H |
| T3 — started, then silent | 6 | 3 | T3 |
| **Total** | **20** | **22** | 42 |

`lang_hint` is derived from the script of the child name / task titles (`profiles.preferred_language` is `'en'` for everyone, it is a default, not a choice). Two T3 rows are the same family (two parents) — send once or to both, Adi's call.

Excluded from the 45 candidates: 3 test accounts. Flagged for Adi: one T1 row that looks like family (`FAMILY?` in the CSV).

## Merge fields

`{parent}` parent first name · `{child}` child first name · `{task_1..3}` first 3 tasks from the generated plan · `{completions}` completed tasks · `{code}` family code · `{app_url}` = https://www.buffadhd.com · `{play_url}` = https://play.google.com/store/apps/details?id=com.buffapp.mobile

Links: use the **Play Store link + family code** for anything on the child's device. Do **not** use `buffadhd.com/join/CODE` — on web it still redirects to the parent wizard (#301, verified broken 2026-08-05).

---

## T1 — signed up, never set up a child

**EN · Subject:** You signed up for BUFF — the next step takes 2 minutes

Hi {parent},

I'm Adi, a mom of kids with ADHD and the founder of BUFF.

I saw you signed up and stopped right before setting up your child. That happens to a lot of parents, usually because life just happened in the middle, and that's completely fine.

I only wanted to say the next step really does take two minutes: a few short questions, and BUFF builds a personal task plan that fits your child.

{app_url} — you'll land exactly where you left off.

If you stopped because something was unclear or didn't work, I'd genuinely love to hear it. I answer every email myself.

Adi

**HE · נושא:** נרשמת ל-BUFF — הצעד הבא לוקח 2 דקות

היי {parent},

אני עדי, אמא לילדים עם ADHD והמייסדת של BUFF.

ראיתי שנרשמת ועצרת רגע לפני הגדרת הילד/ה. זה קורה להמון הורים, בדרך כלל כי החיים פשוט קרו באמצע, וזה לגמרי מובן.

רציתי רק להגיד שהשלב הבא לוקח בדיוק שתי דקות: עונים על כמה שאלות קצרות, ו-BUFF בונה תוכנית משימות אישית שמתאימה בדיוק לילד/ה שלך.

{app_url} — תגיעו בדיוק לנקודה שבה עצרתם.

אם עצרת כי משהו לא היה ברור או לא עבד, אשמח מאוד לשמוע. אני עונה אישית לכל מייל.

עדי

---

## T2 — child set up, plan built, no task done yet (no access mode chosen)

**EN · Subject:** {child}'s plan is ready — here's what's waiting

Hi {parent},

I'm Adi, the founder of BUFF (and a mom of kids with ADHD).

{child}'s personal plan is already built and waiting. A taste of what's in it:

- {task_1}
- {task_2}
- {task_3}

All it takes now is opening BUFF together with {child} and letting them complete one task. From what we've seen, that first task is the moment it "clicks" for them: they see someone built something just for them, not another grown-up chore list.

Easiest way: open {app_url} on your phone, tap {child}'s card, and hand the phone over for five minutes.

If something stopped you, technical or otherwise, just reply to this email. I read everything.

Adi

**HE · נושא:** התוכנית של {child} מוכנה — הנה מה שמחכה לו/לה

היי {parent},

אני עדי, המייסדת של BUFF (ואמא לילדים עם ADHD).

התוכנית האישית של {child} כבר בנויה ומחכה. הנה טעימה ממה שיש בה:

- {task_1}
- {task_2}
- {task_3}

כל מה שצריך עכשיו זה לפתוח את האפליקציה יחד עם {child} ולתת לו/לה להשלים משימה אחת. מהניסיון שלנו, המשימה הראשונה היא הרגע שבו זה "נדלק" אצלם: הם רואים שמישהו בנה משהו במיוחד בשבילם, ולא עוד רשימת מטלות של מבוגרים.

הכי פשוט: פותחים {app_url} בטלפון, לוחצים על הכרטיס של {child}, ומוסרים את הטלפון לחמש דקות.

אם משהו עצר אותך, טכני או אחר, פשוט תשיבו למייל הזה. אני קוראת הכל.

עדי

---

## T2-S — chose "on my device" (shared_device), never re-entered the child's moment

**EN · Subject:** {child}'s first task is waiting on your phone

Hi {parent},

Adi from BUFF here. When you set up {child} you chose to run BUFF on your own phone, which is honestly the easiest way to start.

{child}'s plan is ready:

- {task_1}
- {task_2}
- {task_3}

Open BUFF, tap "{child}'s moment" on the home screen, and hand over the phone for five minutes. That's the whole thing. One task done by {child} is what makes the rest of it work.

If it didn't feel right, or something got in the way, tell me. I reply to every email.

Adi

**HE · נושא:** המשימה הראשונה של {child} מחכה בטלפון שלך

היי {parent},

עדי מ-BUFF כאן. כשהגדרת את {child} בחרת שהאפליקציה תרוץ על הטלפון שלך, וזו באמת הדרך הכי פשוטה להתחיל.

התוכנית של {child} מוכנה:

- {task_1}
- {task_2}
- {task_3}

פותחים את BUFF, לוחצים על "הרגע של {child}" במסך הבית, ומוסרים את הטלפון לחמש דקות. זה הכל. משימה אחת ש{child} משלים/ה בעצמו/ה היא מה שמניע את כל השאר.

אם זה לא הרגיש נכון, או שמשהו הפריע, ספרו לי. אני עונה לכל מייל.

עדי

---

## T2-P — chose "their own phone" (own_phone), child never showed up

**EN · Subject:** {child} hasn't opened BUFF yet — here's the link again

Hi {parent},

Adi from BUFF. {child}'s plan is ready, but it looks like the app never made it onto their phone. Totally normal, links get lost between kids and parents all the time.

Here it is again, the simplest way:

1. On {child}'s phone, install BUFF: {play_url}
2. Tap "I'm a kid", enter the family code **{code}**, pick their name.

That's it. Their first tasks are already inside:

- {task_1}
- {task_2}
- {task_3}

If {child} doesn't have their own phone after all, you can just run it on yours: open BUFF and tap {child}'s card. Either way works.

Anything unclear, reply and I'll help.

Adi

---

## T2-H — chose "home computer / tablet" (home_device)

**EN · Subject:** Getting {child} started on the home tablet — 1 minute

Hi {parent},

Adi from BUFF. {child}'s plan is ready and waiting; it just needs to be opened once on the device {child} will use.

On the home computer or tablet:

1. Open {app_url}
2. Tap "I'm a kid", enter the family code **{code}**, pick {child}'s name.

Their first tasks:

- {task_1}
- {task_2}
- {task_3}

If it's easier, you can also just open BUFF on your own phone and tap {child}'s card, no code needed.

Stuck anywhere? Reply to this email, I'll sort it out with you.

Adi

---

## T3 — started, then went quiet (weeks, not days — adapted from the approved T3)

**EN · Subject (by `{completions}`):**
- if `{completions} >= 5`: {child} already has {completions} tasks behind them — want to pick it back up?
- else: {child} already started (and there's a task waiting today)

Hi {parent},

Adi from BUFF here. {child} completed {completions} tasks — a real start, and not something to take for granted. I noticed it's been quiet for a while.

That's a completely natural stage. Sometimes one small task today is enough to get the momentum back, and everything is saved exactly where {child} left it.

And if something got in the way, or the app just wasn't the right fit, tell me honestly. Every reply, including the critical ones, helps me build BUFF better.

Adi

**HE · נושא (לפי `{completions}`):**
- אם `{completions} >= 5`: {child} כבר עם {completions} משימות מאחוריו/ה — ממשיכים?
- אחרת: {child} כבר התחיל/ה (ומחכה לו/לה משימה להיום)

היי {parent},

עדי מ-BUFF כאן. {child} כבר השלים/ה {completions} משימות, התחלה מעולה, וממש לא מובנת מאליה. ראיתי שכבר תקופה נהיה שקט.

זה שלב טבעי לגמרי. לפעמים מספיקה משימה אחת קטנה היום כדי להחזיר את התנופה, והכל שמור בדיוק איפה ש{child} השאיר/ה.

ואם משהו הפריע או שהאפליקציה לא התאימה, תגידו לי בכנות. כל תשובה, גם ביקורתית, עוזרת לי לבנות את BUFF טוב יותר.

עדי

---

## Footer (manual batch)

EN: BUFF — buffadhd.com · You're getting this because you signed up for BUFF. Reply "stop" and I'll never email you again.
HE: BUFF — buffadhd.com · קיבלת את המייל הזה כי נרשמת ל-BUFF. השיבו "הסירו" ולא אשלח שוב.

## Guardrails (unchanged)
- Parents only. Child data limited to first name + task titles + counts.
- No subscription wording.
- Log the send date per family so the automated system (lifecycle-emails Phase 3) can skip families already emailed in this batch (≥72h rule).

## Measure (2 weeks after send)
Re-run the cohort query from `ANALYSIS.md` §2: any `daily_progress` / `child_created` / `onboarding_events` row after the send date per family. Baseline from the 2026-07-14 batch: 3/18 returned within 48h.
