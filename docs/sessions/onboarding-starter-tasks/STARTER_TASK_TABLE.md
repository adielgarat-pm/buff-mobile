# Starter Task Table — v1 (DRAFT for Adi review)

> **Status:** v1.1 draft by CC, 2026-05-29. NOT approved. NOT implemented.
> **v1.1 changelog** (CC precision pass per Adi's correction principles — *time-matches-meaning · concrete wording · age-appropriate · meds-aware*): §2 sharpened the vague "review material" → "go over today's material — 10 min" (evening), de-jargoned "30-min session", and added two concrete 6-8/9-11 homework tasks (the 6-8 challenge thinned when "read" moved to §4); §4 kept "read" simple ("לקרוא 15 דקות") — child copy must be simple + inviting, category rationale is parent-facing (see Conventions); §6 fixed "priorities for the day" wording + simplified the end-of-day review. All other rows reviewed and kept.
> **Purpose:** the design artifact that fixes IN-2026-05-29-02/04/05/06 — maps each
> parent-selectable challenge → age group → **time of day** → task. Replaces the
> positional `TASK_TIMES[index]` assignment in `UStep5_Preview.tsx`.
> **Source data improved from:** `src/screens/onboarding/unified/onboardingData.ts`
> `STARTER_TASKS_BY_CHALLENGE`. **Real-world input:** `docs/sessions/anchor-recovery/SPEC.md:348-350`
> (standalone-meds = the strongest surviving morning anchor in our completion data).

## Conventions

- **Time of day:** `morning` (~07–09) · `afternoon` (~14–18, after school) · `evening` (~19–21, wind-down). App buckets also include `school` (09–14) — used rarely for starters.
- **Key principle Adi flagged:** a task's time must match its *meaning*, not its position in the list. Prep tasks ("pack bag", "lay out clothes") are **evening**; wind-down ("screens off before bed") is **evening**; after-school work is **afternoon**.
- **Age columns:** 6-8 · 9-11 · 12-14 · 15-18. A task with all four ticked is shared; otherwise it's age-scoped.
- **Each task ships as `{ id, title:{he,en}, buff_value, timeOfDay }`** — new field `timeOfDay` is the only structural change to `StarterTask`.
- **Child-facing copy = simple + inviting (Adi, 2026-05-29).** The text the *child* sees must be a plain, doable, inviting action. **Never** explain *why* a task is in its category — the child doesn't care (e.g. "לקרוא 15 דקות", not "לקרוא 15 דקות במקום מסך"). Any rationale / explanation is **parent-facing** and deferred to a later iteration.

---

## 1. Morning routine / getting ready
*(challenge IDs: `calm_mornings` 6-8 · `morning_routine` 9-11 · `getting_ready` 6-8)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| morning | לצחצח שיניים ולשטוף פנים | Brush teeth & wash face | ✅ | ✅ | | |
| morning | ארוחת בוקר לפני כדור | Breakfast before meds | ✅ | ✅ | ✅ | |
| morning | לקום עם הצלצול הראשון | Up on the first alarm | | ✅ | ✅ | ✅ |
| morning | להתארגן ולצאת בזמן | Get ready & leave on time | ✅ | ✅ | | |
| **evening** | להכין בגדים לבוקר | Lay out tomorrow's clothes | ✅ | ✅ | ✅ | |

> **Notes (Adi, 2026-05-29):**
> - **"ארוחת בוקר לפני כדור"** (not "...לפני מסך") — eat breakfast *before* morning meds
>   (stimulants suppress appetite). Assumes the child is medicated; ties to open question #4
>   (meds anchor). For non-medicated kids, decide whether to fall back to a screen-framed task.
> - **"להכין בגדים לבוקר" is an EVENING task** — preparing the morning's clothes happens the
>   night before, so it's bucketed `evening`, never `morning`.

## 2. Homework / focus
*(`homework_reading` 6-8 · `homework_focus` 9-11 · `homework_focus_adv` 12-14 · `academic_perf` 15-18)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| afternoon | שיעורי בית לפני מסך | Homework before screens | ✅ | ✅ | | |
| afternoon | לעשות שיעורים באותו זמן כל יום | Do homework at the same time each day | ✅ | ✅ | | |
| afternoon | להתחיל מהמטלה הקלה | Start with the easiest task | ✅ | ✅ | | |
| afternoon | ספרינט שיעורים של 15 דקות | 15-min focused homework sprint | | ✅ | ✅ | |
| afternoon | בלי טלפון בזמן שיעורים | No phone during homework | | ✅ | ✅ | ✅ |
| afternoon | מקצוע אחד בכל פעם | One subject at a time | | | ✅ | ✅ |
| afternoon | 30 דקות לימוד ממוקד | 30 min of focused studying | | | | ✅ |
| evening | לעבור על מה שלמדת היום — 10 דקות | Go over today's material — 10 min | | | | ✅ |

## 3. Organisation
*(`organisation` 9-11/12-14 · part of `getting_ready`)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| **evening** | לסדר תיק לבד לפי המערכת | Pack your own bag per the timetable | ✅ | ✅ | ✅ | ✅ |
| **evening** | להכין בגדים לבוקר | Lay out tomorrow's clothes | ✅ | ✅ | ✅ | |
| morning | לבדוק את מערכת השעות בבוקר | Check the timetable in the morning | | ✅ | ✅ | ✅ |
| evening | לכתוב את משימות מחר לפני השינה | Write tomorrow's tasks before bed | | ✅ | ✅ | ✅ |

> **Note (Adi item 6.2):** "לסדר תיק לבד לפי המערכת" is the new task — relevant for **all ages 6+** (Adi 2026-05-29), so it's ticked across all four age groups (appears in both §3 and §7). **Open question:**
> static text, or does it *integrate* with the imported timetable (`TimetableScreen`)?
> v1 ships it **static**; timetable-integration = a separate package.

## 4. Screen balance / limits
*(`screen_time` 6-8 · `screen_balance` 9-11 · `screen_limits` 12-14 · `social_media` 15-18)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| afternoon | לקרוא 15 דקות | Read for 15 minutes | ✅ | | | |
| afternoon | בלי טלפון בזמן ארוחות | No phone during meals | ✅ | ✅ | ✅ | |
| **evening** | מסכים כבויים 30 דקות לפני שינה | Screens off 30 min before bed | ✅ | ✅ | ✅ | ✅ |
| afternoon | זמן מסך רק אחרי משימות | Screen time only after tasks | ✅ | ✅ | | |
| morning | בלי רשתות חברתיות לפני בית ספר | No social media before school | | | ✅ | ✅ |
| **evening** | שעה ללא טלפון לפני שינה | Phone-free hour before sleep | | | ✅ | ✅ |

> **Fix Adi flagged (item 5):** "screens off before bed" was getting `16:00` (afternoon) by
> position. It is **evening** here.

## 5. Confidence / social
*(`confidence` 6-8 · `confidence_friends` 9-11 · `social_friendships`)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| morning | לתת לעצמי מחמאה | Give myself a compliment | ✅ | ✅ | | |
| afternoon | לעשות מעשה טוב לחבר/ה | Do something kind for a friend | ✅ | ✅ | ✅ | |
| afternoon | להגיד שלום למישהו חדש | Say hi to someone new | | ✅ | ✅ | |
| **evening** | לכתוב הצלחה אחת מהיום | Write one win from today | ✅ | ✅ | ✅ | ✅ |

## 6. Time / self-management
*(`time_management` 12-14 · `self_management` 15-18)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| morning | לכתוב 3 עדיפויות להיום | Write today's 3 priorities | | | ✅ | ✅ |
| afternoon | טיימר של 25 דקות למשימה | 25-min timer for a task | | | ✅ | ✅ |
| **evening** | לתכנן את מחר הערב | Plan tomorrow tonight | | | ✅ | ✅ |
| evening | לסכם את היום במשפט אחד | Sum up the day in one sentence | | | | ✅ |

## 7. Independence / life skills
*(`independence` 12-14 · `life_independence` 15-18)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| morning | להכין ארוחת בוקר לבד | Make your own breakfast | | | | ✅ |
| afternoon | לפתור בעיה קטנה לבד | Solve a small problem yourself | | | ✅ | ✅ |
| morning | להתעורר לבד | Wake up on your own | | | ✅ | ✅ |
| **evening** | לסדר תיק לבד לפי המערכת | Pack your own bag per the timetable | ✅ | ✅ | ✅ | ✅ |
| evening | לבשל ארוחה פעם בשבוע | Cook one meal a week | | | | ✅ |
| afternoon | לנהל דמי כיס שבועיים | Manage your weekly allowance | | | | ✅ |

> **Note (Adi, 2026-05-29):** "להכין ארוחת בוקר לבד / Make your own breakfast" — removed for younger ages, **kept for 15-18 only** (a real teen independence skill). Note the tension with §1's "ארוחת בוקר לפני כדור" for medicated teens — a 15-18 kid could get both; the onboarding cap (3-5 tasks) + challenge choice usually prevents collision, but flag if a medicated teen picks `life_independence`.

## 8. Planning / focus-planning
*(`planning_org` 15-18 · `focus_planning`)*

| Time | Title (HE) | Title (EN) | 6-8 | 9-11 | 12-14 | 15-18 |
|---|---|---|:--:|:--:|:--:|:--:|
| **evening** | לרוקן את הראש — לכתוב מה שמטריד | Brain dump — write down what's on your mind | | | ✅ | ✅ |
| morning | רשימת 3 הדברים החשובים להיום | Today's top-3 list | | | ✅ | ✅ |
| afternoon | לפרק משימה גדולה לצעדים | Break a big task into steps | | | ✅ | ✅ |

---

## Open questions for Adi

1. **Focus-area list** — is the current challenge set (the ~5 options per age in `OPTIONS_BY_AGE`) final, or do you want to add/rename any before we wire the table?
2. **Bag-per-timetable (§3/§7)** — static task now, or integrate with the imported timetable (bigger, separate package)?
3. **Tasks per challenge at onboarding** — today the flow inserts up to 3 main + 2 bonus (cap 5). Keep 3 per challenge? The table offers >3 for some themes so age-scoping picks the right 3.
4. **Meds anchor** — `anchor-recovery` already injects a standalone-meds morning task for inactive kids. Should onboarding *also* offer a "medication" starter for families who want it from day 0? (Pillar-aligned per our data; separate from this table if yes.)
5. **HE wording** — review the Hebrew strings; they're user-facing and yours to sign off.
