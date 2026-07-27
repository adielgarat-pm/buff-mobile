# BUFF — FAQ (Canonical Answers)

> תשובות אחידות לכל שאלה נפוצה — לפורומים, מכירות, About page, חנות אפליקציות, ראיונות, פרסומות.
> בלי המסמך הזה: כל ערוץ ממציא תשובה ויוצאת drift. עם המסמך: עקביות.

**עודכן:** 11 במאי 2026
**מקור:** BUFF_PRD, BUFF_VALUES, BUFF_BRAND, BUFF_COMPETITORS, BUFF_BUDDY_SYSTEM + landing page (Landing.tsx)
**שפה:** שאלות ותשובות מובאות באנגלית ראשונה (קהל יעד US/UK/AU). תרגום עברי לכל שאלה. הסברים פנימיים בעברית.

---

## איך משתמשים במסמך הזה

לכל שאלה יש שתי תשובות:

- **Short** — ל-Twitter reply, Play Store Q&A, פוסט בפייסבוק (1–2 משפטים)
- **Long** — ל-About page, blog, מענה לראיון (3–4 משפטים, יותר context)

⚠ = תשובה דורשת אימות מול PRD/code/Adi לפני שמשתמשים בה במקום שמיכיר (ad ממומן, חנות, press). דוגמה: pricing — תלוי בסטטוס grace period.

---

## A. Product Basics

### Q1. What is BUFF? / מה זה BUFF?

**Short:** *BUFF is a coaching app for families of kids with ADHD, ages 6–18, that ties daily routines to real-life rewards kids choose themselves.*

**HE Short:** *BUFF היא אפליקציית אימון משפחתית לילדים ובני נוער עם ADHD (6–18), שמקשרת בין שגרה יומיומית לפרסים אמיתיים מהחיים שהילד בוחר.*

**Long:** *BUFF replaces the daily reminder loop with a coaching system. Kids see their tasks, complete them at their own pace, and earn toward real-life rewards they chose themselves (a concert ticket, a day trip, a new gadget). Built on positive coaching principles, it has two modes — a buddy-led one for ages 6–12 and a dashboard-style one for 13–18, co-designed by a teen with ADHD. The explicit goal: kids outgrow the app.*

---

### Q2. Who is it for? / למי זה מיועד?

**Short:** *Parents of kids and teens with ADHD (ages 6–18) who want to end the daily routine battles.*

**Long:** *BUFF is for two people simultaneously: the parent who buys it (tired of repeating themselves five times every morning) and the child who uses it (wants to feel competent, not managed). It's designed for families where ADHD makes daily routines a source of conflict — mornings, homework, bedtime. It works best for parents who already lean toward positive discipline / coaching approaches.*

---

### Q3. What ages does BUFF support? / לאיזה גילים?

**Short:** *Ages 6 to 18. Two interfaces — Children Mode (6–12) and Teen Mode (13–18).*

**Long:** *BUFF is the only ADHD app that follows the full 6–18 arc in one product. Children Mode (6–12) is buddy-led, visual, with a friendly character. Teen Mode (13–18) is dashboard-style with no buddy character — co-designed by a 15-year-old with ADHD who said "ADHD apps feel babyish." Both modes share the same family system, so a household with kids and teens uses one product.*

---

### Q4. Is BUFF available in Hebrew or English? / איזה שפות?

**Short:** *English and Hebrew, full support in both.*

**Long:** *BUFF supports English (primary, for US/UK/Canada/Australia launch) and Hebrew (Israel, where 96% of beta users are). All 1,036 translation keys are localized in both languages. The product is designed English-first; Hebrew is a parallel localization, not a translation afterthought.*

---

### Q5. Is it web or mobile? / רשת או נייד?

**Short:** *Mobile-first. Android native first, iOS coming after.*

**Long:** *BUFF is a React Native app, currently in internal testing on Google Play Console. iOS architecture is ready; App Store release is Phase 2. Push notifications work natively on Android (FCM). A small fraction of users (65% per beta research) share a parent's phone, so the app is designed for that case.*

---

## B. How It Works

### Q6. How does the reward system work? / איך עובדת מערכת הפרסים?

**Short:** *Kids earn BUFFs (the in-app currency) by completing tasks. BUFFs convert to real-life rewards the parent and child defined together.*

**Long:** *Parent and child sit down and define rewards together — a movie night, a day trip, a concert, a specific item the child wants. Each reward is priced in BUFFs. The system calculates the child's daily earning capacity from their task list, so small rewards are achievable every 1–2 days, larger rewards every 5–7 days. The child is always close to a win. Critically: BUFFs are not virtual coins — they're tokens for real-world things the child is actually working toward.*

---

### Q7. What are BUFFs? / מה זה BUFFs?

**Short:** *BUFFs are the in-app currency — earned by completing tasks, redeemed for real-life rewards.*

**Long:** *BUFFs are the credits in BUFF (hence the name). Kids earn them when parents approve completed tasks. They never expire, never get deducted as punishment, and they convert to rewards the child chose — never to in-app cosmetics or pet food. The name is a play on the word "buff" from gaming (a temporary power-up) — meaning: completing your routine makes you stronger in real life.*

---

### Q8. Why are there two modes? / למה שני מצבים?

**Short:** *Because a 7-year-old and a 15-year-old need fundamentally different interfaces — and most apps only build for one.*

**Long:** *A 7-year-old responds to a buddy character and visual feedback. A 15-year-old finds those "babyish" and disengages. Most ADHD apps for kids (Joon, Goally) stop at age 12 because they can't bridge the gap. BUFF has two separate interfaces sharing the same family system. Children Mode is buddy-led, gamified, visual. Teen Mode is dashboard-style, no character, dark theme, with autonomy features like child-proposed tasks. The transition happens at age 13.*

---

### Q9. What's BUDDY? / מה זה BUDDY?

**Short:** *BUDDY is the companion character in Children Mode — a friend who grows alongside the child, never a pet to feed.*

**Long:** *BUDDY is BUFF's character system, used only in Children Mode (6–12). Unlike Joon's Doter pet (which the child has to feed or it gets sad), BUDDY only gives — never demands. When the child has a successful day, BUDDY gives a small gift. There's no penalty mechanic, no sad-buddy state, no guilt. In Teen Mode, BUDDY is optional or absent — teens chose to remove the character per Itay's design feedback.*

---

### Q10. What's Vibe Check? / מה זה Vibe Check?

**Short:** *A daily 5-second check-in where the child rates their energy 1–5. Low energy triggers Low Power Mode — a shorter task list.*

**Long:** *Vibe Check is the daily energy check. At the start of the day, the child (or teen) marks their energy level. If they mark 1 or 2, BUFF activates Low Power Mode: the task list gets shorter, an SOS button to the parent appears, and an "Instant Buff" option is available for low-stakes wins. The principle: a hard day is normal, not failure. The system adapts to the child, not the other way around.*

---

### Q11. What's Pause Mode? / מה זה Pause Mode?

**Short:** *One button that freezes all tasks without losing progress. For vacations, illness, exam weeks, or hard times.*

**Long:** *Life disrupts routines — that's normal, not failure. Pause Mode is a single button that freezes everything: tasks don't accrue as "missed," no streaks break (BUFF doesn't have streaks anyway), no progress lost. When the family is ready, they press Resume. The kid sees a "Welcome back" screen — no count of missed days, no guilt-trip. This solves the primary churn reason from beta research: disruption with no easy way back.*

---

### Q12. Can my kid propose tasks themselves? / האם הילד יכול להציע משימות?

**Short:** *Yes. Child-proposed tasks and rewards are a core feature — ownership drives compliance.*

**Long:** *In both modes, kids can propose new tasks or rewards (parent approves). This is one of the deepest differences from competitors: BUFF treats the child as a stakeholder, not a subject. A child who chose their task and chose their reward will engage radically differently from one who's just executing parental orders. This is especially powerful in Teen Mode — teens propose, parents counter-offer, they negotiate. That's the "deal-making" interface.*

---

## C. Compared to Alternatives

### Q13. How is BUFF different from Joon? / במה BUFF שונה מ-Joon?

**Short:** *Three things: real rewards instead of virtual pet coins, ages 6–18 not just 6–12, and the explicit goal that kids outgrow the app.*

**Long:** *Joon is a strong product for ages 6–10 if you want quick gamified fun. But it has three structural limits: (1) virtual rewards (the Doter pet) lose novelty around month 2 — the most common churn point; (2) it caps at 12, so it's a temporary solution; (3) success means engagement, which means the kid never leaves. BUFF inverts all three — rewards are real-world, the age range extends to 18, and success means the kid outgrowing the app.*

---

### Q14. How is BUFF different from a sticker chart? / מה שונה מטבלת מדבקות?

**Short:** *Sticker charts collapse the first time life disrupts them. BUFF has Pause Mode, child-proposed rewards, and 70%-as-success — so disruptions don't end the system.*

**Long:** *Sticker charts work for ~3 weeks then fail at the first illness, vacation, or stressful week — and most families never recover. BUFF was built around the assumption that disruption is normal. Pause Mode handles it. 70% completion = success means a 7/10 day is a win, not a failure. And the rewards are something the child *wants*, not arbitrary stickers chosen by the parent. The math is automatic — the child sees exactly how many days until their next real reward.*

---

### Q15. How is BUFF different from a family calendar like Cozi? / במה שונה מ-Cozi?

**Short:** *Cozi shows you where everyone needs to be. BUFF teaches your ADHD kid how to actually get there.*

**Long:** *Cozi is a great family organizer if your main problem is scheduling — soccer practice on Tuesdays, dentist appointments on Thursdays. BUFF solves a different problem: the gap between knowing what to do and doing it, which is the core ADHD challenge. The two products are complementary, not competing — a family could use Cozi for shared calendar and BUFF for the kid's ADHD routine.*

---

### Q16. Why not just use the school's planner / homework app? / למה לא להשתמש בתוכנת ביה"ס?

**Short:** *Because school planners assume executive function. BUFF builds it.*

**Long:** *School-issued planners (Google Classroom, ClassDojo, etc.) tell the child *what* to do. They assume the child has the executive function to plan, prioritize, and initiate. That's the very capacity ADHD compromises. BUFF is designed for the gap: it doesn't just list tasks, it scaffolds the action of starting them — with timing, breakdown, rewards, and a coach-not-cop tone.*

---

### Q17. Why not just medicate the ADHD? / למה לא פשוט לתת תרופה?

**Short:** *Medication helps neurochemistry. BUFF helps behavior systems. Many families use both.*

**Long:** *Medication and behavioral systems address different things. Even with medication, kids still need help building executive function habits, time awareness, and self-regulation. BUFF is explicitly not a replacement for therapy or medication (PRD §6.4) — it's a complement. Many beta families use BUFF alongside stimulant medication and find them additive: medication helps the brain be available, BUFF helps the behavior become repeatable.*

---

## D. Pricing

### Q18. Is it free? / זה חינם?

**Short:** *Free tier supports 1 child and 5 tasks. Family plan is $9/month for 3 kids unlimited tasks. ⚠*

**Long:** ⚠ *Currently in MVP phase — verify against current pricing structure. Per the PRD: Free tier (1 child, 5 tasks, basic buddy, basic notifications, no ads). Family ($9/mo, up to 3 kids, unlimited tasks, full buddy + skins, smart reminders, no ads). Family Pro ($19/mo, unlimited kids, all skins, weekly reports, no ads). No advertising, ever — the audience is parents of ADHD kids under stress, ads would destroy trust.*

⚠ **Internal note:** verify current grace period status and active payment system before quoting in any paid ad / press / Play Store listing. Source: BUFF_PRD §5.

---

### Q19. Are there any ads? / יש פרסומות?

**Short:** *No. No ads, ever, in any tier — it's an explicit policy.*

**Long:** *The audience is parents of ADHD kids under stress. Showing ads to a stressed-out parent would destroy trust on day one. This is a permanent policy, written into the PRD (§5.1): BUFF will never show ads, in any tier, to any user, ever.*

---

### Q20. Can I cancel anytime? / אפשר לבטל בכל זמן?

**Short:** *Yes — cancel anytime, no commitment.*

**Long:** ⚠ *Verify against current implementation. Subscription is monthly by default; you can cancel from the app's account section or through Google Play / App Store. No annual lock-in. Your tasks and history remain accessible in read-only mode after cancellation for a grace period.*

---

### Q21. Is there a lifetime free option? / יש אפשרות חינם לכל החיים?

**Short:** *Yes — beta users who completed setup get free-for-life access. ⚠*

**Long:** ⚠ *Beta users who completed family setup + child setup AND created at least 1 task, OR responded to the beta survey, get free-for-life access (is_lifetime_access flag in DB). This is a thank-you to the founding community. After grace period ends, this becomes permanent for qualifying users. Verify the current grace period status before promising publicly.*

---

## E. Privacy & Safety

### Q22. What data does BUFF collect? / איזה מידע נאסף?

**Short:** *Task completions and progress. That's it. No location, no behavior tracking, no social monitoring.*

**Long:** *BUFF collects: account info (parent email, child name, age), tasks created, tasks completed, rewards defined, BUFFs balance, Vibe Check responses. It does NOT collect: location, app usage outside BUFF, browsing history, screen time on the device, social media activity, photos, or messages. This is explicit policy in PRD §6.4 — BUFF is not a surveillance tool.*

---

### Q23. Does it track my child's location? / האם המיקום של הילד נעקב?

**Short:** *No. Never. No location tracking, ever.*

**Long:** *BUFF does not access location services. No GPS. No "where is my kid" features. This is an architectural decision, not just a policy — the app simply doesn't ask for location permissions.*

---

### Q24. Can the parent see everything the child does? / האם ההורה רואה הכל?

**Short:** *Parent sees task completions and BUFFs balance. Not chats, not screen time, not anything outside BUFF.*

**Long:** *The parent dashboard shows: which tasks have been completed, child's progress toward chosen rewards, Vibe Check trends (energy patterns over time), and child-proposed tasks awaiting approval. It does NOT show: anything happening outside the BUFF app, screen recordings, or "everything the child sees." In Teen Mode specifically, the child has additional privacy — some areas are kid-only (Vibe Check details, BUDDY conversations).*

---

### Q25. Is BUFF HIPAA / FERPA / COPPA compliant? / האם תואם רגולציות פרטיות?

**Short:** *BUFF follows COPPA principles for children under 13. ⚠ Verify specific certifications before claiming.*

**Long:** ⚠ *BUFF is not a medical device and does not claim HIPAA compliance. For children under 13, BUFF follows COPPA principles — parent consent for accounts, no data sale, no behavioral advertising. FERPA does not apply (BUFF is not a school product). For specific certification questions, contact founder directly. **Don't claim certifications we don't have.***

---

### Q26. What if I want to delete everything? / מה אם אני רוצה למחוק הכל?

**Short:** *Account deletion removes all data permanently. Available from the app's account settings.*

**Long:** *You can request full account deletion at any time. We delete: all profiles, all task history, all rewards, all BUFFs balances, all Vibe Check responses. We retain only what's required by law (transaction records for paid accounts). Deletion is processed within standard timelines.*

---

## F. ADHD & Medical Context

### Q27. Is BUFF a replacement for therapy? / האם BUFF מחליפה טיפול?

**Short:** *No. BUFF complements therapy — it's not a substitute.*

**Long:** *BUFF is a tool, not a treatment. If a child needs CBT, occupational therapy, parent training, or medication management, BUFF doesn't replace any of those — it works alongside them. Many beta families use BUFF in parallel with a therapist or coach. The behavioral system in BUFF can also be shared with a therapist (Phase 2 feature).*

---

### Q28. Is BUFF research-backed? / האם מבוסס מחקר?

**Short:** *Yes — based on executive function research and positive coaching principles. ⚠ We don't claim "clinical trials."*

**Long:** *BUFF's design draws from established work on executive function (Russell Barkley, Smart but Scattered), positive coaching (research on positive reinforcement vs punishment for ADHD), and reinforcement scheduling (the "always close to a win" principle). We don't claim BUFF itself has been through clinical trials — we claim the principles BUFF is built on are research-supported. Important distinction to keep clean.*

---

### Q29. Does it work without medication? / עובד גם בלי תרופות?

**Short:** *Yes. BUFF is independent of medication status — works with or without.*

**Long:** *BUFF works for kids whose parents have chosen medication, kids whose parents are exploring it, and kids whose parents are not pursuing it at all. The behavioral system doesn't depend on medication being present. We don't take a position on medication — that's a decision for the family and their medical team. We do help with the behavior side regardless of which decision they made.*

---

### Q30. Does it work for kids who aren't diagnosed yet? / עובד גם לפני אבחנה?

**Short:** *Yes — BUFF works for any kid who struggles with daily routines, diagnosed or not.*

**Long:** *Many beta users started BUFF before formal ADHD diagnosis. The behavioral principles work for any kid who struggles with executive function — the diagnosis is for the medical system, not the parenting strategy. That said, if you suspect ADHD, BUFF doesn't replace getting a proper evaluation.*

---

### Q31. Does it work for adults with ADHD? / עובד גם למבוגרים?

**Short:** *No — BUFF is built for kids and teens (6–18). Adults should look at Tiimo, Brili, or other adult-focused ADHD apps.*

**Long:** *BUFF's design assumes a child-parent dynamic. The reward system, the dashboard, the BUDDY character — none of these are designed for an adult user. If you're an adult with ADHD, products like Tiimo (visual planner), Brili (dopamine micro-tracking), or even just calendar+habit-tracker stacks are better fits.*

---

### Q32. Does it work for autistic kids / kids with both ADHD and autism? / עובד גם לאוטיזם?

**Short:** ⚠ *Designed primarily for ADHD. Some autistic kids and AuDHD kids benefit, but autism-specific features are not the focus.*

**Long:** ⚠ *BUFF's positive coaching framework, routine scaffolding, and Pause Mode help many autistic kids and AuDHD kids. But BUFF was designed with ADHD as the primary lens — sensory accommodations, communication-difference supports, and rigid-routine handling are not Phase 1 features. We don't claim to be an autism product. For autism-specific tools, Tiimo and similar visual planners may serve better.*

---

## G. For Teens (Direct-to-Teen Q&A)

### Q33. Will my teen actually use it? / האם המתבגר ישתמש?

**Short:** *Teen Mode was co-designed by a 15-year-old with ADHD specifically because most ADHD apps feel babyish to teens. The look and the autonomy features are the answer.*

**Long:** *We tested this. The single biggest reason teens reject ADHD apps is that they're built for younger kids — buddy characters, primary colors, "great job!" praise. Teen Mode is the opposite: dark theme, dashboard interface, no buddy character (it's opt-in), and the teen proposes their own tasks. The parent doesn't dictate — they negotiate. Most importantly, a 15-year-old with ADHD helped design it. He used the phrase "ADHD apps feel babyish" — Teen Mode is the answer.*

---

### Q34. Can I monitor my teen through BUFF? / האם אני יכולה לעקוב אחרי המתבגר?

**Short:** *Parent sees task completion and progress. Not behavior, not chats, not location. That's the design.*

**Long:** *BUFF gives parents visibility into the coaching relationship, not into the teen's life. You see what tasks they completed, how their Vibe Check trends, and what rewards they're working toward. You don't see anything outside BUFF. This is intentional — for the relationship to work, the teen has to know BUFF isn't a surveillance tool.*

---

### Q35. Will the teen see my dashboard? / האם המתבגר רואה את הדשבורד שלי?

**Short:** *Some of it — transparency in both directions is the design. Teen sees what parent sees about them.*

**Long:** *In Teen Mode, the teen can see what the parent sees about them (which tasks are visible to parent, what data is shared). This bidirectional transparency is a deliberate choice — covert tracking destroys teen trust. The teen also has some areas that are kid-only (BUDDY chats, personal Vibe Check notes).*

---

## H. Getting Started

### Q36. How long does setup take? / כמה זמן לוקח להתחיל?

**Short:** *About 5 minutes. Add a child, add 3–5 tasks, define 1–2 rewards. You're running.*

**Long:** *The onboarding is intentionally short — long onboarding kills retention. You add the child (name, age, mode), add 3–5 starter tasks (we suggest by category: Self-Care, Organization, Learning, Responsibility, Movement), and define 1–2 rewards with the child. That's it. You can refine later. The first week is essentially observation — the system learns your child's earning rate, and the math improves from there.*

---

### Q37. What if my kid hates it after a day? / מה אם הוא לא מסכים?

**Short:** *That's signal, not failure. Pause it, talk to them, try again — usually with their input on what to change.*

**Long:** *A kid who rejects BUFF on day one is usually telling you something about how it was introduced or what tasks/rewards were chosen. The fix is rarely to force it. Common solutions: switch from parent-defined to child-proposed tasks, lower the task count, change rewards, switch to Teen Mode for a tween who feels infantilized. If after honest attempts it doesn't fit, that's OK — not every tool fits every family.*

---

### Q38. What's the first thing we should try? / מה כדאי לעשות קודם?

**Short:** *One easy morning task + one reward your kid actually wants. Get a win on day 1.*

**Long:** *The most common mistake is overloading. Don't add 10 tasks day one. Add ONE — something the kid would have done anyway (brush teeth, get dressed, pack bag). Define ONE reward they actually want — keep it small enough that it's achievable within 3–4 days. The goal of week 1 is for the child to experience the loop once successfully. Scale up from there.*

---

## I. Troubleshooting / Common Concerns

### Q39. What happens if my kid breaks their streak? / מה אם הוא שובר רצף?

**Short:** *BUFF doesn't punish breaks. There are no streaks in the traditional sense.*

**Long:** *Traditional streak mechanics ("you broke your 30-day streak!") trigger ADHD shame and often cause kids to abandon the system entirely. BUFF deliberately doesn't have penalty-streaks. 70% completion is success. A "Welcome back" greets the child after a hard week. The math is forgiving by design.*

---

### Q40. What if we miss a whole week? / מה אם אנחנו מפספסים שבוע שלם?

**Short:** *Use Pause Mode. Resume when you're ready. No data lost, no guilt.*

**Long:** *Press the Pause button. Tasks stop accruing as "missed." Your reward progress is preserved exactly where it was. When you come back — sometimes a day, sometimes 3 weeks — you press Resume and BUFF greets the child with "Welcome back, let's start fresh today." This is one of BUFF's core differentiators. It was built because beta research showed disruption is the #1 churn cause.*

---

### Q41. We have multiple kids sharing a device — does that work? / כמה ילדים על אותו מכשיר?

**Short:** *Yes — each child has their own profile, even on a shared device.*

**Long:** *About 65% of beta families share a device between parent and child. BUFF handles multiple child profiles on one device with separate logins/profiles per child. The parent dashboard sees all kids; each child sees only their own.*

---

### Q42. What if the parents are divorced / co-parenting? / מה במשפחה גרושה?

**Short:** *Both parents can have access to the same child's BUFF account. Coordinated coaching.*

**Long:** ⚠ *Verify implementation. The intent is that a child has one BUFF account, with both parents able to log in (with appropriate permissions). Tasks and rewards are shared across households. This avoids the common ADHD-co-parenting failure: two systems, two sets of rules, confused kid. Verify the exact multi-parent flow in current code before promising specifics.*

---

### Q43. What if the school assigns rewards / consequences too? / מה אם בית הספר עושה משהו אחר?

**Short:** *BUFF runs alongside school systems without conflict — it's for home routines, not school.*

**Long:** *BUFF doesn't compete with school behavior charts (ClassDojo etc.). BUFF handles home routines — morning, homework, bedtime, life skills. The school can do its own thing. If a child's behavior at school is a concern, share the BUFF approach with the teacher; some teachers adopt similar coaching principles.*

---

## J. For Press / Investors / Bigger Questions

### Q44. Who founded BUFF? / מי ייסדה את BUFF?

**Short:** *Adi Elgarat German, mom of a teen with ADHD, co-designed with her son.*

**Long:** *BUFF was founded by Adi Elgarat German, a product manager and mom of a teen with ADHD (Itay, 15, who co-designed the Teen Mode). She built BUFF because no app on the market served both her younger child and her teenager. Itay's role isn't symbolic — his feedback shaped the dashboard interface, the "no buddy by default" decision in Teen Mode, and the dark aesthetic that distinguishes BUFF from competitors.*

---

### Q45. Where is BUFF based? / איפה ממוקמת BUFF?

**Short:** *Israel-based, international-targeting. Primary market is US/UK/Canada/Australia; secondary is Israel.*

**Long:** *BUFF was built in Israel, where 96% of current beta users are. The international expansion (US/UK/Canada/Australia) is the primary growth target — these are larger ADHD-aware markets with more Facebook ADHD parenting community infrastructure. English is the primary product language; Hebrew is a parallel localization.*

---

### Q46. What's the long-term vision? / מה החזון לטווח ארוך?

**Short:** *A coaching system that grows with the child from age 6 to 18, then lets them go.*

**Long:** *Long-term BUFF is the family coaching infrastructure: the app for the child, the dashboard for the parent, AI insights for both, and eventually optional shareability with therapists or coaches. But the vision is bounded: BUFF wins when the child outgrows it. We don't want to be a lifetime engagement product — we want to be the scaffolding that fades.*

---

## איך המסמך הזה מתעדכן

| תרחיש | פעולה |
|---|---|
| שאלה חוזרת 3+ פעמים מקהל אמיתי | הוסיפי Q חדשה לקטגוריה המתאימה |
| pricing משתנה | עדכן Q18, Q20, Q21 + הסרת ⚠ |
| תכונה חדשה זמינה (e.g. iOS, AI Insights) | הוסיפי Q ייעודית |
| Compliance certification מתקבלת | עדכן Q25 + הסרת ⚠ |
| Press uses an answer that should be canonized | הוסיפי או דייקי בהתאם |

זה מסמך **חי, מתעדכן חודשית** בערך. ⚠ markers הם הקריטיים — תשובות שעלולות להיות לא מעודכנות.

---

## איך משתמשים במסמך

### עבור Adi
לפני ראיון, פגישת VC, או reply לפוסט גדול — לפתוח, להעתיק, להתאים.

### עבור Claude.ai (web)
כשמועבר prompt של "תכתבי תשובה ל[שאלה]" — תקראי את המסמך הזה קודם.

### עבור Claude Code (אני)
לא רלוונטי לרוב המקרים. אם מתבקש לכתוב user-facing FAQ in-app — לעבור על המסמך הזה ולא להמציא.

### עבור customer support / founder reply
זה ה-go-to. אם תשובה לא קיימת במסמך — לרשום אותה כאן אחרי המענה.

---

**סוף מסמך.**

**הבא בתור:** FOUNDER_STORY ו-TESTIMONIALS — שתי אלו תלויות בקלט ממך, אבדוק איתך לפני שאני כותב. בינתיים, הברנד-family כוללת עכשיו 5 מסמכים שמכסים ad / persona / hook / forum / FAQ end-to-end.
