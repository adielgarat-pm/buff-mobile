# Starter-Task Domain Research — Age × Gender Tuning (RECOMMENDATION)

> **Status:** DRAFT for Adi review, 2026-06-01 (CC). NOT approved. NOT implemented.
> **Purpose:** Deepen the evidence behind each parent-selectable *challenge area*, and refine the generated micro-tasks by **age band** and by **clinical sex-difference** in ADHD presentation. Plan → approve → then code.
> **Builds on:** `STARTER_TASK_TABLE.md` v1.1 (time-of-day + age columns). This doc **adds two layers** that table lacks: (1) per-domain evidence with source anchors, (2) a gender dimension.
> **Decision recorded before research (Adi, 2026-06-01):** gender is handled **by clinical presentation only** (evidence-based), **not** interest stereotypes; scope = the **7 existing domains**.
> **Source discipline:** every proposed task carries a source tag; full URLs in §9. Authoritative sources (CHADD, ADDitude, Understood, CDC, AAP, PubMed/Frontiers, Barkley, Dawson & Guare) + lived-experience/clinical-practice sources.

---

## 0. Clinical backbone — sex-differences in pediatric ADHD (the spine)

**Overview.** At the *population* level ADHD presents differently by sex. Boys/AMAB more often: hyperactive-impulsive / combined presentation, externalizing (squirming, blurting, impulsivity) — visible, so diagnosed earlier. Girls/AFAB more often: inattentive presentation, internalizing (anxiety, low self-esteem, perfectionism), masking/camouflaging, heavier social-emotional load, later diagnosis (~8% of females dx'd in childhood vs ~41% of males; childhood ratio ~2:1). Comorbid anxiety (36% F vs 26% M) and depression (29% F vs 18% M) are higher in girls and *rise* through adolescence.

**Overlap caveat — read before tuning anything.** These are population tendencies with very large overlap, not categories. Boys can be inattentive; girls can be hyperactive. The split is partly diagnostic/teacher-report bias, not pure biology. **Individual presentation always overrides the population pattern.** In product terms: *sex biases a default, the parent's described behavior should win.*

### 0.1 Presentation by age band → design implication

| Age | Girls/AFAB tendency | Boys/AMAB tendency | Design implication |
|---|---|---|---|
| **6-8** | Quiet/"daydreamy"; impairment under-reported; early perfectionism/worry. Differences **smallest** here. | Overt hyperactivity/impulsivity; higher measured impulsivity. | Keep tasks **largely unified**. Light bias only: movement-break framing (boys), "okay not to be perfect" (girls). |
| **9-11** | Puberty may begin; inattention can rise; masking + "good-girl" compensation; after-school restraint collapse. | Peak childhood hyperactivity; rising risk-taking; externalizing friction. | Begin **mild tuning**: girls → emotion-naming/decompression; boys → impulse-pause/movement. |
| **12-14** | **Sharpest divergence**: internalizing rises (anxiety, low self-esteem), RSD, masking peaks; hyperactivity goes internal. | Impulsivity/risk-taking + peer-driven behavior rise. | **Strongest tuning window** — esp. Domain 5. Girls → self-esteem/anti-perfectionism/social-emotional; boys → impulse-pause/consequence-preview. |
| **15-18** | Internalizing entrenched; self-worth shaped by years of struggle; help-seeking shame. | Risk-taking/impulsivity in real-world stakes (time, money, safety). | Tune toward **self-management ownership**; girls → protect self-worth, normalize asking for help; boys → impulse-delay around real stakes. |

### 0.2 Which domains actually warrant tuning (honest evidence read)

| # | Domain | Tuning? | Rationale |
|---|---|---|---|
| 1 | Morning routine / getting ready | **Unified** | Executive-sequencing problem common to both. |
| 2 | Homework / focus / academics | **Mild** | Girls' inattention masked + perfectionism stalls; boys need on-task impulse control. |
| 3 | Organisation / planning / working memory | **Unified** (mild after 12) | Working-memory deficit shared; no robust task-level split. |
| 4 | Screen time / social media | **Mild** | Boys → gaming/reward-loop; girls → social-comparison/anxiety. Same limits, different framing. |
| 5 | Confidence / social-emotional / friendships | **Strong** | The clearest split: girls internalize (RSD, low self-esteem, masking); boys externalize (impulsive peer-conflict). |
| 6 | Time management / self-management | **Mild** | Core EF deficit shared; light lean (girls mask hidden deadline-stress; boys need shorter chunks). |
| 7 | Independence / life skills | **Unified** (mild in teens) | Autonomy-building applies to both; only late-teen risk (boys) / shame (girls) framing diverges. **Never gender the chore.** |

> **Bottom line:** Only **Domain 5** has *strong* sex-difference evidence. Domains 2, 4, 6 warrant *framing* tweaks, not different tasks. Domains 1, 3, 7 stay essentially unified. Tuning beyond this over-reaches the evidence.

### 0.3 Guardrails — tuning without stereotyping

**Do:** where internalizing/masking shows (skews girls) add emotion-naming, anti-perfectionism ("good enough is done"), self-worth reinforcement, permission to ask for help. Where hyperactivity/impulsivity shows (skews boys) add impulse-pause / movement-break / shorter-burst / consequence-preview. **Trigger on observed behavior first, sex second.**

**Red lines:** ❌ no interest/activity stereotypes ("boys→sports, girls→art"); ❌ never gender-lock content — every scaffold available to any child; ❌ don't pathologize girls' quiet or boys' energy; ❌ don't heavily tune the 6-8 band (weak evidence); ❌ don't expose cycle/puberty logic as a default feature (sensitive, opt-in, parent-mediated only).

### 0.4 Wording principles (Adi review, 2026-06-01)

These three rules were applied to **every** task table below:

- **Concrete, never vague.** Name the actual objects — "your bag and shoes by the door," not "everything on the launch pad." No "everything / stuff / the launch pad" without naming what it is.
- **No race / pressure framing.** A self-care task is never beat-the-clock. Removed *"get dressed before the timer runs out."* Anchor to a natural moment ("before breakfast") instead of a deadline. ⚠️ **Open Q for Adi:** keep timers only as an *optional focus tool* for homework/focus (reworded to "short focus round"), or drop timers entirely? — see §8.
- **Real-world actions only — never "check the BUFF list/board."** BUFF *is* the morning board, so "check your morning list" is circular. Removed all app-meta tasks. (Teen planner/calendar tasks refer to the child's *own* phone calendar / school timetable — a real independence skill — kept and reworded to make that explicit.)
- **No undefined props.** Removed "wins jar" / "calm card" that assume a physical setup the family may not have.

> **Hebrew note:** because onboarding already collects the child's gender, gendered HE verb forms (`בחר`/`בחרי`) can be conjugated correctly **per child** at render time — the slashed forms below are placeholders for Adi's sign-off.

---

## 1. Morning routine / getting ready — **Unified**
*(challenge IDs: `calm_mornings`, `morning_routine`, `getting_ready`)*

**Why hard:** Mornings stack ADHD's two weakest skills — *transitions* and *time estimation* — at the most tired hour. Time blindness is neurological ("believes they have 20 min when they have 4"). A multi-step morning overloads working memory; a **visible checklist** offloads it. **Decision fatigue** (clothes) stalls kids → "borrow executive function from your evening self" by prepping the night before. Cheapest reliable win = **externalize** (laid-out clothes, packed bag, fixed "launch pad" spot). [TimeBlind, VisualSched, EveningPrep, LaunchPad]

**Dev notes:** 6-8 picture-list + adult body-double; 9-11 follows 4-6 item list, night-before habit forms; 12-14 owns list but transitions still fail (externalized time > nagging); 15-18 self-run launch pad + fixed wake anchor.

**Sex tuning:** 6-8 unified. Mild later: girls-lean = "ready beats perfect" on the get-dressed/appearance loop + a calm-breath start (AM overwhelm/anxiety); boys-lean = a movement burst + "what's next?" impulse-pause to channel energy into the sequence.

| Time | Title (EN) | Title (HE) | 6-8 | 9-11 | 12-14 | 15-18 | Sex-tuning | Source |
|---|---|---|:--:|:--:|:--:|:--:|---|---|
| evening | Lay out tomorrow's clothes | להכין בגדים למחר | ✅ | ✅ | ✅ | ✅ | both — kills AM decision fatigue | EveningPrep |
| evening | Pack your bag for tomorrow | לארוז את התיק למחר | ✅ | ✅ | ✅ | ✅ | both — externalize memory | LaunchPad |
| morning | Put your bag and shoes by the door | לשים את התיק והנעליים ליד הדלת | ✅ | ✅ | ✅ | ✅ | both — one fixed spot, ready to go | LaunchPad |
| morning | Brush teeth & wash face | לצחצח שיניים ולשטוף פנים | ✅ | ✅ | | | both — core hygiene step | MorningTips |
| morning | Get dressed before breakfast | להתלבש לפני ארוחת הבוקר | ✅ | ✅ | ✅ | | both — natural anchor, no race | MorningTips |
| morning | Take 3 calm breaths before the day starts | 3 נשימות רגועות לפני שהיום מתחיל | ✅ | ✅ | ✅ | ✅ | girls-lean — calms AM overwhelm | GirlsADHD |
| morning | Move your body for one minute | להזיז את הגוף דקה אחת | ✅ | ✅ | | | boys-lean — channel energy | SexDiff |
| morning | Eat breakfast before you leave | לאכול ארוחת בוקר לפני שיוצאים | ✅ | ✅ | ✅ | ✅ | both — commonly skipped | MorningTips |
| evening | Set your own alarm for tomorrow | לכוון לעצמך שעון מעורר למחר | | | ✅ | ✅ | both — fades to independence; set at night | EveningPrep |

---

## 2. Homework / focus / academics — **Mild tuning**
*(challenge IDs: `homework_reading`, `homework_focus`, `homework_focus_adv`, `academic_perf`)*

**Why hard:** The hardest part is **task initiation**, not effort. Working memory can't hold a multi-step assignment → "make a work map" / paper + sticky notes + a desk stripped to project-only. A big assignment reads as one blob → break it down; a **5-minute start** sidesteps resistance and builds momentum. **Time-bounded bursts** + visible timer beat open-ended sitting. [TaskInit, WorkingMem, BreakDown, SmartScattered]

**Dev notes:** 6-8 5-10 min bursts + body-double, make starting concrete ("open to the page"); 9-11 one 10-15 min burst + timer + "what's due" list; 12-14 chunk the blob, pick start subject, same-time/place + phone-silent; 15-18 self-managed Pomodoro + milestones.

**Sex tuning:** girls-lean (11-18) = anti-perfectionism ("good enough — finish and let it go") + calm-breath to defuse overwhelm (perfectionism actually *blocks* initiation/finishing); boys-lean (6-12) = shorter bursts + scheduled movement break + impulse-pause; mechanics otherwise unified.

| Time | Title (EN) | Title (HE) | 6-8 | 9-11 | 12-14 | 15-18 | Sex-tuning | Source |
|---|---|---|:--:|:--:|:--:|:--:|---|---|
| afternoon | Just open the book to the right page | רק לפתוח את הספר בעמוד הנכון | ✅ | ✅ | | | both — beats initiation block (young) | TaskInit |
| afternoon | Work out what you need to do today | להבין מה צריך לעשות היום | | ✅ | ✅ | ✅ | both — orient before starting | TaskInit |
| afternoon | Start with a 5-minute try | להתחיל מ-5 דקות בלבד | ✅ | ✅ | ✅ | ✅ | both — momentum over resistance | BreakDown |
| afternoon | Pick the first thing to do | לבחור מה עושים ראשון | | ✅ | ✅ | ✅ | both — chunk the blob | BreakDown |
| afternoon | Do one short focus round, then a break | סבב מיקוד קצר אחד, ואז הפסקה | ✅ | ✅ | ✅ | ✅ | boys-lean — short burst + movement | TimeBlind |
| afternoon | Clear your desk to just what you need | לפנות את השולחן רק למה שצריך | | ✅ | ✅ | ✅ | both — cuts working-memory load | WorkingMem |
| afternoon | Write down what's due today | לכתוב מה צריך להגיש היום | | ✅ | ✅ | ✅ | both — externalize memory | WorkingMem |
| afternoon | Take a quick move-break, then back | הפסקת תנועה קצרה ואז חוזרים | ✅ | ✅ | ✅ | | boys-lean — channel hyperactivity | SexDiff |
| afternoon | "Good enough" — finish and let it go | "מספיק טוב" — לסיים ולשחרר | | | ✅ | ✅ | girls-lean — anti-perfectionism | Perfectionism |
| afternoon | One calm breath, then begin | נשימה רגועה אחת ואז מתחילים | | ✅ | ✅ | ✅ | girls-lean — defuse overwhelm | GirlsADHD |
| afternoon | Write the big task, then break it into steps | לכתוב את המשימה הגדולה ולחלק אותה לצעדים | | | ✅ | ✅ | both — milestone the project | BreakDown |

---

## 3. Organisation / planning / working memory — **Unified** (mild after 12)
*(challenge IDs: `organisation`, `organisation_memory`, `planning_org`, `focus_planning`)*

**Why hard:** Working memory holds only ~3-4 chunks → any plan held silently in the head leaks; the #1 support is **externalizing** every step onto a visible surface. ADHD impairs getting-organized/planning/initiation (brain-based, not character). Highest leverage = **modify the environment, not the child** (single launch pad). "Make the invisible visible." Anchor routines to **fixed daily moments** (right after dinner) not clock times. [CHADD, Barkley, Dawson&Guare, LaunchPad]

**Dev notes:** 6-8 single-step + pictures + co-doing; 9-11 3-5 item list, owns a launch pad, still needs the start prompt; 12-14 planner/notes app + pack-from-timetable, parent fades; 15-18 self-run calendar + self-advocacy, weekly check-in only.

**Sex tuning:** mostly unified. One mild lean (12+): girls present more inattentive + mask ("appear fine, then overwhelmed") → a low-pressure, perfectionism-safe framing on planning capture.

| Time | Title (EN) | Title (HE) | 6-8 | 9-11 | 12-14 | 15-18 | Sex-tuning | Source |
|---|---|---|:--:|:--:|:--:|:--:|---|---|
| evening | Pack your bag using tomorrow's schedule | לארוז את התיק לפי המערכת של מחר | ✅ | ✅ | ✅ | ✅ | both — externalize WM (age 6 with help) | Understood / CHADD |
| afternoon | Empty your school bag onto your desk | לרוקן את התיק על השולחן | ✅ | ✅ | ✅ | | both — landing routine | UntappedLearning |
| afternoon | Go over today's homework | לעבור על שיעורי הבית של היום | | ✅ | ✅ | ✅ | girls-lean — masking/low-pressure | ChildMind |
| afternoon | Pick the one thing to do first | לבחור מה לעשות ראשון | | ✅ | ✅ | ✅ | both — task initiation | Barkley |
| morning | Check your bag before you leave | לבדוק את התיק לפני שיוצאים | ✅ | ✅ | ✅ | ✅ | both — quick self-check | Understood |
| evening | Add one upcoming thing to your calendar | להוסיף ליומן דבר אחד שמתקרב | | | ✅ | ✅ | both — fade scaffolding | ADDitude |

---

## 4. Screen time / social media balance — **Mild tuning**
*(challenge IDs: `screen_time`, `screen_balance`, `screen_limits`, `social_media`)*

**Why hard:** ADHD brains have weaker baseline dopamine, so the gap between a high-stimulation screen and everything else is *dramatic* — screens are uniquely "sticky." ADHD prefers smaller-sooner rewards → games' continuous reward schedules reinforce "one more round." The hardest moment is the **transition off** — clock limits don't register; **activity-based stops** ("end of this round") + countdown warnings work. Devices **out of bedrooms**, screens off ~30-60 min before bed (AAP). AAP moved away from a single hourly limit toward **collaborative, child-included** rules. [CHADD, Understood, AAP/CHOC, PMC-gaming]

**Dev notes:** 6-8 adult-set stops + "what's next"; 9-11 countdown warnings + visible timer, involve in choosing the limit; 12-14 collaborative contract + self-monitor; 15-18 self-managed limits + charge outside bedroom by own choice.

**Sex tuning:** boys-lean (9-14) = gaming / reward-loop tasks (pre-plan the stop & next activity); girls-lean (12-18) = social-media / comparison tasks (unfollow what brings you down; notice how you feel after scrolling). Screen-off/charging tasks unified. **Frame as agency/earning, never deprivation.**

| Time | Title (EN) | Title (HE) | 6-8 | 9-11 | 12-14 | 15-18 | Sex-tuning | Source |
|---|---|---|:--:|:--:|:--:|:--:|---|---|
| afternoon | Choose one thing to do after screen time | לבחור משהו אחד לעשות אחרי המסך | ✅ | | | | both — "what's next" eases transition (young) | CHADD |
| afternoon | Before screens, decide when you'll stop and what's next | לפני המסך, להחליט מתי מפסיקים ומה עושים אחרי | | ✅ | ✅ | ✅ | boys-lean — pre-plan the reward-loop exit | PMC-gaming |
| afternoon | Take a movement break away from the screen | הפסקת תנועה הרחק מהמסך | ✅ | ✅ | ✅ | ✅ | both — balance/movement | CHADD |
| evening | Charge your phone outside your room | לטעון את הטלפון מחוץ לחדר | | | ✅ | ✅ | both — sleep | AAP/HealthyChildren |
| evening | Screens off half an hour before bed | מסכים כבויים חצי שעה לפני השינה | ✅ | ✅ | ✅ | ✅ | both — sleep wind-down | CHOC/AAP |
| afternoon | Set a time limit on the app you scroll most | להגדיר מגבלת זמן לאפליקציה שהכי גוללים בה | | | ✅ | ✅ | girls-lean — infinite-scroll guardrail | ChildMind |
| evening | Unfollow one account that brings you down | לבטל עוקב אחרי חשבון שמעציב אותך | | | ✅ | ✅ | girls-lean — social comparison | PMC-bodyimage |
| afternoon | Notice how you feel after scrolling | לשים לב איך את/ה מרגיש/ה אחרי הגלילה | | | ✅ | ✅ | girls-lean — comparison/self-esteem | ChildMind |

---

## 5. Confidence / social-emotional / friendships — **Strong tuning**
*(challenge IDs: `confidence`, `confidence_friends`, `social_friendships`)*

**Why hard:** Self-esteem erodes from years of extra correction/failure → kids abandon trial-and-error early and never disprove "I can't." **RSD** is pervasive (~99% of teens/adults with ADHD report heightened rejection sensitivity; ~1 in 3 call it the hardest part). Friendship is an **executive-function load** (turn-taking, reciprocity, perspective-taking) — ADHD kids run ~30% behind socially. Behavior gets fused with identity → coping must **separate the action from the self** and build evidence of small wins. [Understood, ClevelandClinic-RSD, ADDitude-social, OT4ADHD]

**Dev notes:** 6-8 concrete "I can do X", structured play; 9-11 social gap visible, 1-on-1 shared-interest playdates, negative self-talk emerges; 12-14 belonging central, RSD spikes, masking begins (esp. girls), *maintenance* is the struggle; 15-18 identity/self-advocacy/imposter feelings — keep tools light, NOT therapy homework.

**Sex tuning (strongest of all domains, 12+):** girls-lean = self-esteem/anti-perfectionism/RSD-coping + separate-behavior-from-identity + power-word; boys-lean = impulsive turn-taking / cool-down. Wins-jar & strengths tasks unified.

| Time | Title (EN) | Title (HE) | 6-8 | 9-11 | 12-14 | 15-18 | Sex-tuning | Source |
|---|---|---|:--:|:--:|:--:|:--:|---|---|
| evening | Name one good thing that happened today | להגיד דבר טוב אחד שקרה היום | ✅ | ✅ | ✅ | ✅ | both — counters daily-failure erosion | ADDitude |
| evening | Name one thing you're good at | להגיד דבר אחד שאני טוב/ה בו | ✅ | ✅ | ✅ | | both — strengths > deficits | Understood |
| morning | Choose a word that gives you strength today | לבחור מילה שנותנת לך כוח היום | ✅ | ✅ | ✅ | ✅ | girls-lean — softens self-criticism | rula |
| school | Say hi to one kid | להגיד שלום לילד/ה אחד/ת | ✅ | ✅ | | | both — low-stakes initiation | ADDitude-friends |
| afternoon | Ask a friend one question about them | לשאול חבר/ה שאלה אחת עליו/ה | | ✅ | ✅ | ✅ | both — reciprocity skill | ADDitude-social |
| afternoon | Take one turn, let them take one | תור שלי, תור שלך | ✅ | ✅ | | | boys-lean — impulsive turn-taking | PMC-peer |
| afternoon | Invite a friend to do something you like | להזמין חבר/ה לעשות משהו שאוהבים | | ✅ | ✅ | ✅ | both — shared-interest playdate | ADDitude-friends |
| evening | When something stings, take a slow breath | כשמשהו צורב, לקחת נשימה איטית | ✅ | ✅ | ✅ | ✅ | both (girls-lean 12+) — RSD coping | ClevelandClinic-RSD |
| evening | Tell yourself: I made a mistake, and that's okay | להגיד לעצמי: טעיתי, וזה בסדר | | | ✅ | ✅ | girls-lean — separate behavior from identity | OT4ADHD |

---

## 6. Time management / self-management — **Mild tuning**
*(challenge IDs: `time_management`, `self_management`)*

**Why hard:** **Time blindness** is neurological — externalize time (visible/audible) rather than expect an internal clock. The **planning fallacy** is built in (underestimate duration → start late, run over); estimation improves only with externalized feedback. **Transitions/sequencing** are the choke points (visual not verbal, <7 steps, location-sequenced). Internal start is unreliable; external cues (timers, body-doubling, night-before prep) work. [CarolinaADHD, ADDitude-estimation, Riveta, SmartScattered]

**Dev notes:** 6-8 visual timer + 3-4 picture sequence + adult co-start; 9-11 written checklist they helped build + simple timer; 12-14 introduce estimation (guess-then-check) + 10-15 min chunks + **start seeing the week** (map this week's tests/due dates); 15-18 **own the weekly ritual** (back-plan exams/projects, assign tasks to days) + plan-tomorrow-tonight + Pomodoro + body-doubling, self-owned. **Planning horizon widens with age:** 6-11 single-day → 12-14 week-aware → 15-18 weekly ownership + back-planning far deadlines.

**Sex tuning:** largely **unified** — time blindness/weak estimation are core EF with no robust split. Mild leans only: girls mask hidden deadline-anxiety → make the plan visible; boys hyperactive → shorter focus chunks + movement.

| Time | Title (EN) | Title (HE) | 6-8 | 9-11 | 12-14 | 15-18 | Sex-tuning | Source |
|---|---|---|:--:|:--:|:--:|:--:|---|---|
| evening | Say tomorrow's main thing in one sentence | להגיד במשפט אחד מה הכי חשוב מחר | | ✅ | ✅ | ✅ | girls-lean — surfaces hidden deadline-stress | Riveta |
| morning | Pick the first thing to do this morning | לבחור מה עושים ראשון בבוקר | ✅ | ✅ | ✅ | | both — beats the start | CarolinaADHD |
| afternoon | Guess how long it'll take, then check | לנחש כמה זמן ייקח, ואז לבדוק | | ✅ | ✅ | ✅ | both — fixes planning fallacy | ADDitude-estimation |
| afternoon | Do one short focus round, then a break | סבב מיקוד קצר אחד, ואז הפסקה | | ✅ | ✅ | ✅ | boys-lean — shorter chunks | ADDitude-Pomodoro |
| afternoon | Do it next to someone (body double) | לעשות את זה ליד מישהו | | | ✅ | ✅ | both — body-doubling | ADDitude-Pomodoro |
| evening | Plan tomorrow tonight | לתכנן את מחר, הערב | | | ✅ | ✅ | both — offload to evening self | ADDitude-schedule |
| evening | Look at the whole week — tests and things due | להסתכל על כל השבוע — מבחנים ודברים להגשה | | | ✅ | ✅ | both — weekly view, see it at a glance | Understood-TimeSys |
| evening | Spread a big assignment across a few days | לפזר עבודה גדולה על כמה ימים | | | ✅ | ✅ | both — back-plan far deadlines | Understood-TimeSys |
| evening | Choose what each day this week is for | לבחור מה עושים בכל יום השבוע | | | | ✅ | both — assign tasks to days | ADDitude-planner |
| evening | Sum up the day in one sentence | לסכם את היום במשפט אחד | | | | ✅ | both — light self-review | ADDitude |

---

## 7. Independence / life skills — **Unified** (mild in teens)
*(challenge IDs: `independence`, `life_independence`)*

**Why hard:** Independence *is* executive function in action. **The 30% rule (Barkley):** ADHD kids run ~30% behind peers on self-regulation (a 10-y-o may self-manage like a 7-y-o) — peg tasks to *executive age*, not birthday. Vague/multi-step tasks cause initiation paralysis → one chore at a time + visual steps. **Learned helplessness is the central trap**: parents over-do (faster) → teens who can't self-start; antidote = **do-it-WITH then fade**. Money is uniquely hard (dopamine of buying; ADHD teens ~3x more adult financial stress). [Barkley-30%, ADDitude-chores, CHADD-overparenting, ADDitude-money]

**Dev notes:** 6-8 self-care + single-step chores (dress, teeth, bed, feed pet, clear plate, pack own bag); 9-11 multi-step + home contribution (pack bag, dishwasher, manage a small weekly budget); 12-14 self-direction (own alarm, own laundry, make own breakfast, plan a meal, budget, self-advocate); 15-18 adult prep (full meals + budget shop, own appointments, self-advocate with adults).

**Sex tuning:** **mostly unified** — never gender the chore. Mild teen leans on *what stalls the start*: girls-lean = lower the bar to "good-enough/messy first try" + normalize asking for help (perfectionism + masking); boys-lean = save-jar / "wait 24h before you buy" on money tasks (impulse-spend).

| Time | Title (EN) | Title (HE) | 6-8 | 9-11 | 12-14 | 15-18 | Sex-tuning | Source |
|---|---|---|:--:|:--:|:--:|:--:|---|---|
| morning | Get dressed all by yourself | להתלבש לבד | ✅ | ✅ | | | both | ADDitude-chores |
| morning | Make your bed | לסדר את המיטה | ✅ | ✅ | ✅ | | both | Joon |
| morning | Wake up to your own alarm | להתעורר לבד עם השעון | | | ✅ | ✅ | both — fades the #1 over-done task | CHADD |
| morning | Pack your own bag | לארוז את התיק לבד | ✅ | ✅ | | | both | Treehouse |
| morning | Make your own breakfast | להכין לעצמך ארוחת בוקר | | | ✅ | ✅ | both | ADDitude-chores |
| afternoon | Feed your pet / water a plant | להאכיל את החיה / להשקות צמח | ✅ | ✅ | | | both | OTToolbox |
| afternoon | Clear your plate after eating | לפנות את הצלחת אחרי האוכל | ✅ | ✅ | | | both | Joon |
| afternoon | Load the dishwasher | לסדר כלים במדיח | | ✅ | ✅ | ✅ | both | BrainBalance |
| afternoon | Do a load of your own laundry | לעשות כביסה משלך | | | ✅ | ✅ | girls-lean — "good-enough first try" | CHADD |
| afternoon | Plan and cook one simple meal | לתכנן ולבשל ארוחה פשוטה | | | ✅ | ✅ | both | ADDitude-chores |
| evening | Plan your weekly allowance | לתכנן את דמי הכיס השבועיים | | ✅ | ✅ | ✅ | boys-lean — impulse-spend guardrail | ADDitude-money |
| evening | Ask for one thing you need today | לבקש דבר אחד שאת/ה צריך/ה היום | | | ✅ | ✅ | girls-lean — counters masking | CHADD |
| evening | Book or check one of your own appointments | לתאם או לבדוק תור משלך | | | | ✅ | both | CHADD |

---

## 8. What this changes vs. current code + open decisions

**Vs. `onboardingData.ts` (`STARTER_TASKS_BY_CHALLENGE`) today:**
- Today: 3 tasks per challenge, **no gender**, loose age differentiation (many keys share identical tasks).
- Proposed: a **tagged task library** per domain where each task carries `ageBands[]`, `timeOfDay`, and `sexLean: 'both' | 'girls' | 'boys'`. At onboarding we already know **age + gender** → the generator filters by age band, then prefers `sexLean` matches, fills the rest from `both`, capped at the existing 3-5.
- This supersedes the positional `TASK_TIMES[index]` issue the v1.1 table already fixed, and adds the gender layer on top.

**Open decisions for Adi (need answers before coding):**
1. **Generator rule** — when a child is e.g. a 13-y-o girl picking "homework", do we *inject* the girls-lean task (anti-perfectionism) as one of the 3, or only *prefer* it if slots remain? Recommend: **guarantee 1 sex-lean task when one exists for that age, fill rest from `both`** (so tuning is visible but doesn't crowd out core tasks).
2. **`other` gender** — onboarding offers `boy | girl | other`. For `other`, recommend: **treat as `both` only** (no lean) — safest, no assumption.
3. **6-8 tuning** — recommend **none** (evidence weakest); keep all 6-8 tasks `both`. Confirm.
4. **Cross-domain dedupe** — "pack your bag" / "lay out clothes" appear in domains 1, 3, 6. The generator should de-dupe by task id across a child's selected challenges. Confirm that's the behavior you want.
5. **HE wording sign-off** — all Hebrew strings are yours to approve; gendered verb forms can be auto-conjugated per child since we store gender.
6. **Cycle/puberty-aware scheduling** (older girls) — surfaced in research as *opt-in, parent-mediated only*. Recommend: **out of scope** for this package; note as a future FLAG. Confirm.
7. **Timers (Adi flagged 2026-06-01)** — removed all beat-the-clock/self-care timer tasks. Two soft-timer tasks remain as an *optional focus tool* ("Do one short focus round, then a break" in Domains 2 & 6). Keep them, or drop timers entirely from starter tasks? Recommend: **keep the two reworded focus-round tasks** (timer is the single best-evidenced ADHD focus tool, and the framing is now "a round you choose," not "a race you can lose"). Confirm.

---

## 9. Master source list

**Authoritative — sex differences / clinical:**
- Frontiers 2025, Sex differences in children & adolescents with ADHD — https://www.frontiersin.org/journals/child-and-adolescent-psychiatry/articles/10.3389/frcha.2025.1582502/full · PMC https://pmc.ncbi.nlm.nih.gov/articles/PMC12222223/
- Gender differences, objective/subjective measures — https://pmc.ncbi.nlm.nih.gov/articles/PMC6923191/
- Gender-related clinical characteristics — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8777610/
- Self-worth trajectories in ADHD adolescents — https://pmc.ncbi.nlm.nih.gov/articles/PMC6287970/
- Self-esteem meta-analysis — https://www.sciencedirect.com/science/article/abs/pii/S0272735824000151
- CDC ADHD data/stats — https://www.cdc.gov/adhd/data/index.html
- ADDitude, puberty & ADHD by sex — https://www.additudemag.com/puberty-and-adhd-symptoms-teens/
- ADDitude, ADHD masking — https://www.additudemag.com/adhd-masking-signs-consequences-solutions/
- Cleveland Clinic, symptoms boys vs girls — https://health.clevelandclinic.org/adhd-symptoms-boys-vs-girls
- Cleveland Clinic, RSD — https://my.clevelandclinic.org/health/diseases/24099-rejection-sensitive-dysphoria-rsd
- Understood, restraint collapse — https://www.understood.org/en/articles/restraint-collapse-why-kids-fall-apart-after-school

**Authoritative — executive function / strategies:**
- Barkley EF & self-regulation fact sheet — https://www.russellbarkley.org/factsheets/ADHD_EF_and_SR.pdf
- Barkley 30% / executive-age — https://lifeskillsadvocate.com/blog/adhd-executive-age/ · https://elitepsychiatrycenter.com/blog/understanding-adhd-30-percent-rule/
- Dawson & Guare, *Smart but Scattered* — https://www.guilford.com/books/Smart-but-Scattered/Dawson-Guare-Guare/9781462554591
- CHADD, executive-functioning support — https://chadd.org/attention-article/executive-functioning-support-for-kids-with-adhd/
- Child Mind, executive functions — https://childmind.org/article/helping-kids-who-struggle-with-executive-functions/
- CHOP, improving EF in ADHD kids — https://www.chop.edu/health-resources/improving-executive-functioning-children-adhd-what-parents-and-caregivers-can-do
- ADDitude, working memory — https://www.additudemag.com/working-memory-powers-executive-function/
- ADDitude, task initiation / Mini ADHD Coach — https://www.theminiadhdcoach.com/living-with-adhd/adhd-task-initiation
- ADDitude, time estimation / planning fallacy — https://www.additudemag.com/time-estimation-planning-fallacy-adhd/
- ADDitude, Pomodoro for teens — https://www.additudemag.com/pomodoro-focus-breaks-teens-adhd/
- ADDitude, sample schedules — https://www.additudemag.com/sample-schedule-adhd-morning-after-school-bedtime/
- Understood, time-management system for high-schoolers (`Understood-TimeSys`) — https://www.understood.org/en/articles/help-adhd-teens-create-time-management-system
- ADDitude, student planner / weekly layout (`ADDitude-planner`) — https://www.additudemag.com/adhd-student-planner/ · https://www.additudemag.com/high-school-planner-motivate-adhd-teen/
- Carolina ADHD Coaching, time blindness — https://carolinaadhdcoaching.com/time-blindness-in-adhd-guide/
- ADD Resource Center, evening prep — https://www.addrc.org/the-adhd-evening-advantage-master-your-mornings-by-preparing-tonight/
- Life Skills Advocate, launch pad / morning routines — https://lifeskillsadvocate.com/blog/morning-routines-for-people-with-adhd/ · https://lifeskillsadvocate.com/blog/neurodivergent-toolbox-how-to-use-a-launch-pad/
- Catch Up Kids, launch pad — https://www.catchupkids.co.za/ending-morning-chaos-how-to-create-a-launch-pad-for-your-child-with-adhd/
- OT4ADHD, visual schedules / RSD — https://ot4adhd.com/2022/08/08/effective-visual-schedules-for-adhd/ · https://ot4adhd.com/2026/01/26/rejection-sensitivity-in-children-with-adhd/
- Riveta Labs, morning checklist — https://rivetalabs.com/blogs/executive-function-lab/adhd-morning-routine-parent-checklist
- Honestly ADHD, morning routines — https://honestlyadhd.com/adhd-and-morning-routines/

**Authoritative — screens / social / money / confidence / chores:**
- Understood, screen time — https://www.understood.org/en/articles/at-a-glance-helping-kids-with-adhd-manage-screen-time
- CHADD, gaming limits / healthy use — https://chadd.org/adhd-news/adhd-news-caregivers/cant-stop-gaming-help-your-child-set-limits/ · https://chadd.org/attention-article/a-parents-guide-to-healthy-video-game-and-internet-use-for-children-with-adhd/
- AAP/CHOC, screen-time recommendations — https://health.choc.org/updated-aap-recommendations-for-screen-time/
- ADHD–Gaming Disorder review — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9600100/
- Girls, social media & body image — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9238066/
- Child Mind, social media & teens — https://childmind.org/article/how-using-social-media-affects-teenagers/
- ADDitude, social skills / friendships — https://www.additudemag.com/social-skills-for-kids-friendships-adhd/ · https://www.additudemag.com/help-your-child-make-friends/
- Understood, confidence & self-esteem — https://www.understood.org/en/topics/confidence-and-self-esteem
- Foothills Academy, girls with ADHD — https://www.foothillsacademy.org/community/articles/special_consideration_for_girls_with_adhd
- ADDitude, perfectionism — https://www.additudemag.com/perfectionism-adhd-not-good-enough-anxiety/
- ADDitude, household chores / responsibility — https://www.additudemag.com/household-chores-adhd-children/ · https://www.additudemag.com/chores-for-kids-adhd-responsibility/
- ADDitude, money / behavioral finance — https://www.additudemag.com/behavioral-finance-money-management-skills-adhd/ · https://www.additudemag.com/spending-and-saving-basics-for-an-i-want-it-now-child/
- CHADD, overparenting / nurturing independence — https://chadd.org/adhd-weekly/supportive-or-overparenting-helping-your-teen-with-adhd-develop-independence/ · https://chadd.org/adhd-weekly/nurturing-independence-in-your-children-and-teens/
- Joon / Brain Balance / OT Toolbox / Treehouse — age-appropriate chore lists (see Domain 7).

**Lived-experience / clinical-practice (masking, restraint collapse, RSD, helplessness):**
- Simply Psychology, masking — https://www.simplypsychology.com/articles/adhd-masking-guide
- A Day In Our Shoes / CADDAC — after-school restraint collapse — https://adayinourshoes.com/after-school-meltdown/ · https://caddac.ca/understanding-after-school-restraint-collapse-in-kids-with-adhd-by-lara/
- Parenting ADHD & Autism, RSD steps — https://parentingadhdandautism.com/2024/03/255-7-steps-to-help-kids-and-teens-with-rejection-sensitive-dysphoria/
- Child/Teen/Family Therapy, learned helplessness — https://childteenfamilytherapy.com/has-your-teen-learned-helplessness-5-ways-to-reverse-the-problem/

> **Forum note:** direct Reddit (r/ADHD, r/ADHDparenting, r/adhdwomen) / Mumsnet thread URLs did not surface cleanly via search. The recurring lived-experience patterns (masks at school → collapses at home; "good-girl daydreamer" missed for years; parents over-doing → learned helplessness; "one more round" gaming transitions) are corroborated across the clinical-practice and qualitative sources above rather than single quotable posts. Flag if you want a dedicated forum-mining pass.

---

## 10. Values Check (BUFF_VALUES.md — 9 questions)

**Pillar 1 — Intrinsic Motivation:** ✅ Tasks are real-world doable actions tied to the child's own goals; no virtual-reward dependency; copy is "let's try / when you're ready," not "you must."
**Pillar 2 — Positive Coaching:** ✅ No shame/comparison/failure-counting; sex-tuning adds *supportive scaffolds* (calm-breath, "good enough," movement break), never deficit-labeling; guardrails forbid pathologizing.
**Pillar 3 — Independence-Building:** ✅ Every task is self-doable and fades over time; Domain 7 explicitly "do-WITH-then-fade"; tasks peg to executive age, building competence not dependence.
**Sensitive-data guardrail:** gender used only for clinically-grounded task *defaults*, never exposed as judgment; `other` → neutral; cycle-aware scheduling kept out of scope.

> **One values caution to confirm with Adi:** sex-based defaults, even clinically grounded, touch identity. The guardrails (§0.3) — behavior overrides sex, no gender-locking, no stereotypes, light-touch at 6-8 — are what keep this Pillar-2 safe. Sign-off needed.

---

## 11. Validation pass — Adi's review edits vs. the evidence (2026-06-01)

Every change made during Adi's review was re-checked against the sourced recommendations. **Verdict: all edits remain evidence-aligned**, with two honest divergences flagged where Adi's product judgment intentionally softens the literature (both defensible).

| Edit | Evidence check | Verdict |
|---|---|---|
| **D1** "bag & shoes by the door" → **morning** | Launch-pad literature frames the spot as *evening prep + morning grab*. Moving the *action* to morning keeps the spot, drops the overnight expectation. | ✅ aligned · ⚠️ **minor divergence** — evening-prep sources lean toward staging the night before; Adi's call (parents dislike overnight bag-by-door) is a reasonable trade. |
| **D2** "open the book to the right page" → young only; add "work out what to do today" for older | Task-initiation evidence: make the *first concrete step* tiny; older teens orient/plan before starting. | ✅ aligned |
| **D3** "copy down homework" → **"go over today's homework"** (read not write) | Planner literature favors *actively recording* (writing = concrete externalization). Reading is a lower-friction adaptation for kids who find writing tiring. | ✅ acceptable · ⚠️ **minor divergence** — loses some externalization benefit; keep an optional "write it down" variant for kids who tolerate it (see §12 A/B). |
| **D3** pack-bag-from-timetable → all ages (6 w/ help) | Externalizing WM onto a visible surface is the #1 support, all ages. | ✅ aligned |
| **D4** merge "stop + what's next" into one pre-commit task | Activity-based stops + *pre-planned* exit beat clock limits for the reward-loop. | ✅ strongly aligned |
| **D4** "one hour" → **"half an hour"** before bed | AAP range is ~30–60 min screens-off before sleep; 30 is the realistic lower bound. | ✅ within evidence |
| **D4** add "set a time limit on the app you scroll most" | Infinite-scroll / social comparison is a documented teen-girl risk; app limits are a recommended guardrail. | ✅ aligned |
| **D5** "say hi to one person" → **"one kid"** | Low-stakes peer initiation (not strangers) is the intended skill. | ✅ aligned (sharper) |
| **D5** "I'm still me" → **"I made a mistake, and that's okay"** | Self-compassion / separate-behavior-from-identity for RSD. | ✅ aligned |
| **D6** add weekly tasks (map week / spread big assignment / assign days) | High-school EF sources: weekly view, weekly planning ritual, back-plan far deadlines. | ✅ strongly aligned (newly sourced) |
| **D7** pack-own-bag → **6-11**; make-own-breakfast → **12-18** | Barkley executive-age: bag = single/low-step (younger ok); cooking = multi-step + safety (older). | ✅ aligned |
| **D7** money task → **from age 9**, "budget" → **"allowance / דמי כיס"** | Money-skill sources support early start; concrete "allowance" framing is more age-appropriate than abstract "budget". | ✅ aligned |

**Two items to confirm with Adi:** (a) the bag-by-door morning move (vs. evening-prep literature) — keep as-is? (b) homework "go over" vs. "write down" — ship both as variants?

---

## 12. Proposed architecture — generic, flexible, and self-learning

> Design only — not approved, not built. Goal Adi set: *as generic and change-friendly as possible, and learning from what parents pick / kids actually do.*

**Principle: separate DATA from LOGIC from POLICY from LEARNING.** Each layer changes independently; content edits never touch code, policy changes never touch content, and the learning loop only re-weights — it never invents or hides tasks without a human-set floor.

### Layer 1 — Task library (pure data, no logic)
Each task is a record, not code:
```ts
type StarterTaskDef = {
  id: string;                    // stable, used for dedupe + learning key
  domain: 1|2|3|4|5|6|7;
  title: I18nString;             // { en, he } — gendered HE conjugated at render
  timeOfDay: 'morning'|'school'|'afternoon'|'evening';
  ageBands: AgeBand[];           // ['6-8','9-11','12-14','15-18']
  sexLean: 'both'|'girls'|'boys';
  evidenceTag: string;           // → §9 source (auditable)
  rationale: string;             // parent-facing "why", never shown to child
  enabled: boolean;              // soft-retire without deleting history
  baseWeight: number;            // editorial priority before learning
  variantOf?: string;            // for A/B wording tests (e.g. "go over" vs "write down")
};
```
The whole library above (§1–§7) is just an array of these. Editing wording, ages, or sexLean = a data edit. **Phase 2: move this array to a Supabase `starter_task_defs` table** so content/tuning ship server-side without an app release.

### Layer 2 — Generator (pure, deterministic, testable)
```
generateStarterTasks({ age, gender, challenges, config, learned }) → StarterTaskDef[]
```
1. Resolve age → ageBand; map selected challenges → domains.
2. Candidate set = tasks where `enabled && ageBand ∈ ageBands && domain ∈ selected`.
3. Score each = `baseWeight + sexLeanBonus(gender) + learnedScore(ageBand,gender,id)`.
4. Dedupe by `id` across challenges (fixes the "pack bag" appearing in D1/D3/D6).
5. Apply policy: guarantee ≥1 sex-lean task when one exists (config), cap 3–5.
Pure function → fully unit-testable, no surprises.

### Layer 3 — Policy / config (the open §8 decisions, as data)
```ts
const generatorConfig = {
  taskCap: 5, minTasks: 3,
  guaranteeSexLean: true,        // §8.1
  otherGenderTreatment: 'both',  // §8.2
  tune6to8: false,               // §8.3
  dedupeAcrossChallenges: true,  // §8.4
};
```
Every policy Adi is deciding in §8 becomes a config value — changeable without code surgery.

### Layer 4 — Learning loop (the adaptive part)
Two signals, aggregated **anonymously at the population level** (never per-child):
- **Parent signal:** which challenges get picked (already captured at onboarding).
- **Kid signal:** for each generated task — kept vs. dismissed/swapped, and completion rate over the first N days.

Aggregate into `(ageBand × gender × taskId) → { shown, kept, completed }`. Derive a `learnedScore` (e.g. a smoothed keep×complete rate, Bayesian-shrunk so low-sample tasks stay near baseline). Feed back into Layer 2 scoring: tasks kids consistently keep & do rise; tasks they ignore sink — **but a human-set `baseWeight` floor prevents the loop from ever fully burying an editorially-important task** (e.g. the meds anchor). This is a simple contextual-bandit / scoring scheme, not heavy ML.

**Privacy (Pillar 2 — children's app):** store only aggregate counts keyed by age-band × gender × task; no per-child behavioral profile, no PII, consistent with the Sentry-scrubbing posture already in the app. Cycle/puberty logic stays out (§8.6).

### Why this is change-friendly
- **Content** edits = data only (and server-side in Phase 2).
- **Policy** edits = config values.
- **New domains / locales** = add records; generator untouched.
- **Experiments** = `variantOf` A/B (e.g. the "go over" vs "write down" homework question) measured by the same learning loop.
- **Auditability** = every task keeps its `evidenceTag` → §9 source, so the clinical basis is always traceable.

**Suggested build order:** (1) ship the static library + deterministic generator + config (replaces today's positional `TASK_TIMES`/`STARTER_TASKS_BY_CHALLENGE`); (2) add the kid/parent signal capture (counts only); (3) turn on the learned re-weighting once there's enough data. Steps 2–3 are separate packages — step 1 stands alone and is shippable.
