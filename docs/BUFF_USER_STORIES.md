BUFF

User Stories & Acceptance Criteria

MVP v1.0  |  April 2026

This document defines all user stories for the BUFF MVP, organized by persona. Each story includes acceptance criteria, priority (Must Have / Should Have / Nice to Have), and effort estimate (S/M/L/XL).


## Personas


| ID | Persona | Role | Key motivation |
|---|---|---|---|
| PARENT | Parent of ADHD child (6-18) | Paying customer | Stop nagging, build child's independence |
| CHILD | Child with ADHD, ages 6-12 | Primary user (buddy UI) | Feel capable, earn rewards, grow buddy |
| TEEN | Teen with ADHD, ages 13-18 | Primary user (dashboard UI) | Autonomy, own goals, deal-making |


## Parent Stories — Onboarding


| US-P01 | As a parent, I want to create a family account and set up my child's profile so that I can personalize BUFF for my family's specific needs |
|---|---|
| Acceptance Criteria | Parent can register with email or Google / Parent can add family name, child name, and child age / Child UI mode is automatically suggested based on age (6-12 = buddy, 13-18 = teen) / Onboarding completes in under 5 minutes / Parent cannot skip child setup — at least one child required before accessing dashboard |
| Priority / Effort | Must Have  \|  Effort: M |


| US-P02 | As a parent, I want to enter my child's school timetable so that BUFF can automatically suggest what to pack and prepare each day |
|---|---|
| Acceptance Criteria | Parent can input class schedule per day of week / Parent can add subject/teacher per period / Timetable is editable at any time / System generates equipment reminder based on next day's timetable |
| Priority / Effort | Must Have  \|  Effort: M |


| US-P03 | As a parent, I want to define what equipment is needed per subject so that my child gets a correct bag-packing reminder the evening before |
|---|---|
| Acceptance Criteria | Parent can add equipment items per subject (e.g., 'PE → sports shoes, water bottle') / Evening reminder (time configurable) lists items needed for next day / Child sees 'Pack your bag' task with the item list / Reminder is suppressed if the following day has no school (weekend/holiday) |
| Priority / Effort | Must Have  \|  Effort: M |


## Parent Stories — Task Management


| US-P04 | As a parent, I want to create tasks for my child organized by category so that I can build a complete daily and weekly routine |
|---|---|
| Acceptance Criteria | Parent can create tasks in categories: Self-Care, Organization, Learning, Responsibility, Movement / Tasks can be set as daily, specific days, or one-time / Tasks have a time slot (morning, afternoon, evening, flexible) / Parent can set credit value per task / Tasks can be marked as required or optional |
| Priority / Effort | Must Have  \|  Effort: M |


| US-P05 | As a parent, I want to review and approve tasks my child marks as complete so that I can ensure tasks were actually done before credits are awarded |
|---|---|
| Acceptance Criteria | Parent receives push notification when child marks task complete / Parent app shows photo proof option (optional) / Parent can approve, reject, or request redo / Credits are only awarded after parent approval / Parent can enable auto-approve for trusted recurring tasks |
| Priority / Effort | Must Have  \|  Effort: M |


| US-P06 | As a parent, I want to approve or edit tasks my child proposes so that my child feels ownership of their routine while I maintain oversight |
|---|---|
| Acceptance Criteria | Parent receives notification: 'Your child wants to add a task: [task name]' / Parent can approve as-is, edit and approve, or decline with a message / Approved child-proposed tasks are marked with a special badge in child's view / Child is notified of the decision |
| Priority / Effort | Must Have  \|  Effort: S |


| US-P07 | As a parent, I want to pause all tasks with one tap when our routine is disrupted so that we don't lose our progress when life gets in the way |
|---|---|
| Acceptance Criteria | Single 'Pause BUFF' button in parent settings / All tasks freeze — no reminders sent, no streaks broken / Parent can set optional pause end date / On resume: warm 'Welcome back!' message appears in child's app / Streak counter offers a 'grace' restart, not a reset to zero |
| Priority / Effort | Must Have  \|  Effort: S |


| US-P08 | As a parent, I want to define rewards my child can earn with their credits so that there is a meaningful incentive for completing tasks consistently |
|---|---|
| Acceptance Criteria | Parent can create custom rewards (e.g., 'Movie night = 50 credits', 'Extra screen time = 20 credits') / Parent sets credit cost per reward / Parent can mark rewards as active/inactive / Parent approves reward redemption before it is granted / Parent can approve child-proposed rewards |
| Priority / Effort | Must Have  \|  Effort: M |


## Child Stories — Buddy UI (Ages 6-12)


| US-C01 | As a child, I want to see exactly what my next task is without being overwhelmed so that I can start without getting confused about what to do first |
|---|---|
| Acceptance Criteria | Child's home screen shows ONE task at a time (the next due task) / Task is shown with a clear icon and short description / Option to see full day list (secondary, not default) / No past tasks clutter the view |
| Priority / Effort | Must Have  \|  Effort: M |


| US-C02 | As a child, I want to mark my tasks as done and see my buddy react so that I feel a sense of accomplishment immediately |
|---|---|
| Acceptance Criteria | Large, satisfying 'Done!' button / Buddy animates with happiness when task is completed / Credits counter increments visibly / Celebration sound + animation (can be muted) |
| Priority / Effort | Must Have  \|  Effort: M |


| US-C03 | As a child, I want to watch my buddy grow and evolve as I complete more tasks so that I am motivated to keep going over weeks and months |
|---|---|
| Acceptance Criteria | Buddy starts as an egg / Buddy evolves through distinct stages based on cumulative completions / Evolution is a surprise/celebration moment / Buddy appearance changes meaningfully at each stage / Buddy skins can be unlocked with credits |
| Priority / Effort | Must Have  \|  Effort: L |


| US-C04 | As a child, I want to propose a new task to my parent so that I feel like my routine is something I helped build, not just rules imposed on me |
|---|---|
| Acceptance Criteria | Child can tap 'Suggest a task' button / Child enters task name and optionally a time/frequency / Task is sent to parent for approval / Child sees 'Waiting for parent' status / Once approved, task appears with a 'My idea' badge |
| Priority / Effort | Must Have  \|  Effort: S |


| US-C05 | As a child, I want to suggest a reward I would like to earn so that I am motivated by things I actually want, not just what my parent chose |
|---|---|
| Acceptance Criteria | Child can propose a reward from their app / Child enters reward name and suggests a credit cost / Parent receives notification to review / Approved rewards appear in the store |
| Priority / Effort | Must Have  \|  Effort: S |


| US-C06 | As a child, I want to see my bag packing list for tomorrow so that I don't forget important things for school without my parent needing to remind me |
|---|---|
| Acceptance Criteria | Evening notification: 'Time to pack your bag!' / List shows all items needed for next school day / Child can check items off / Last item checked triggers a completion animation |
| Priority / Effort | Must Have  \|  Effort: S |


| US-C07 | As a child, I want to receive a push notification from my buddy when it's time for a task so that I don't rely on my parent to remind me |
|---|---|
| Acceptance Criteria | Push notification sent at task's scheduled time / Notification text is encouraging: '[Buddy name] is waiting for you!' / Tapping notification opens app directly to that task / Notification is suppressed during pause mode |
| Priority / Effort | Must Have  \|  Effort: M |


| US-C08 | As a child, I want to see my task list even when I have no internet so that I can check what I need to do when I'm offline |
|---|---|
| Acceptance Criteria | Last known task list is cached locally / App shows tasks in read-only mode offline / Completions marked offline sync when connection returns / Clear indicator shown when app is in offline mode |
| Priority / Effort | Should Have  \|  Effort: M |


## Teen Stories — Dashboard UI (Ages 13-18)


| US-T01 | As a teen, I want to see a clean dashboard with my goals and tasks — no baby buddy so that I feel respected and not patronized by the app |
|---|---|
| Acceptance Criteria | Teen UI has no buddy character / Home screen shows: today's tasks, weekly goal progress, current streak / Visual style is clean and minimal — not childish colors / Language is direct: 'Your tasks', 'Your goals', not 'Quests' |
| Priority / Effort | Must Have  \|  Effort: M |


| US-T02 | As a teen, I want to propose tasks AND set the terms (reward, timeline) for my parent to approve so that I feel like an active participant in my routine, not just someone being managed |
|---|---|
| Acceptance Criteria | Teen can create a full task proposal: name, schedule, credit value they want / Teen can propose a deal: 'I'll do X for Y reward' / Parent receives proposal with all details for approval/counter-offer / Counter-offer is possible (parent edits and sends back) |
| Priority / Effort | Must Have  \|  Effort: S |


| US-T03 | As a teen, I want to track my streaks and see my consistency over time so that I develop a sense of pride in my discipline |
|---|---|
| Acceptance Criteria | Weekly and monthly streak visible on dashboard / Calendar heat-map showing completion days / Milestones recognized (7-day streak, 30-day streak, etc.) / Streak is forgiving: 1 missed day in 7 does not break streak (grace mechanic) |
| Priority / Effort | Should Have  \|  Effort: M |


## System Stories


| US-S01 | As a system, I want to send reliable push notifications at the right time so that children are reminded without parent intervention |
|---|---|
| Acceptance Criteria | FCM push notifications delivered within 2 minutes of scheduled time / Notifications are configurable: on/off per task, per time window / Quiet hours respected (no notifications between 9pm–7am unless overridden) / Delivery rate >95% on active Android devices |
| Priority / Effort | Must Have  \|  Effort: L |


| US-S02 | As a system, I want to support Hebrew and English languages with full RTL for Hebrew so that the app works natively for both international and Israeli users |
|---|---|
| Acceptance Criteria | All UI strings are externalized and translatable / Hebrew UI renders right-to-left correctly / Language is set during onboarding with option to change in settings / Buddy animations and assets work in both directions |
| Priority / Effort | Must Have  \|  Effort: M |


| US-S03 | As a system, I want to migrate existing user data cleanly from the Lovable/PWA version so that beta users do not lose their history and are recognized for their loyalty |
|---|---|
| Acceptance Criteria | All families with completed onboarding (child + at least 1 task) are migrated / Beta users who engaged are flagged for Free-for-Life in the database / School Quest data is archived (not deleted, not shown in UI) / Test accounts are identified and removed / Migration is verified against original Supabase data |
| Priority / Effort | Must Have  \|  Effort: M |


## Additional Stories — From Code Analysis


### US-S04 — Payment and Subscription (Must Have)

As a parent, I want to subscribe to BUFF and pay securely, so that my family has access to all premium features. CRITICAL: Grace period expires May 1 2026 — no payment system currently exists in codebase.

- Android MVP: RevenueCat + Google Play Billing. Free up to $2,500 MRR.
- Web: Lemon Squeezy (Merchant of Record) — works with Israel via PayPal payout. 5% + $0.50 per transaction.
- iOS Phase 2: RevenueCat + App Store Billing — same SDK, no code rewrite.
- Beta users: is_lifetime_access = true in DB — exempt from payment forever (field already exists).

### US-S05 — Daily Vibe Check (existing, carry over)

As a child, I want to rate my energy 1-5 at the start of each day, so BUFF adapts my tasks to how I feel. Already fully built in current codebase (useVibeCheck.ts, DailyVibeCheck.tsx, child_vibes table).

- Children: emoji faces (Amazing to Tough). Teens: energy bars (Full Power to Depleted).
- Level 1-2: Low Power Mode activates (reduced tasks). Options: Instant Buff, SOS to parent, or skip.
- SOS sends push notification to parent. This is the daily disruption mechanism alongside Rest Tickets.

### US-S06 — Migration: Lovable/PWA to React Native

As a product owner, I want to migrate from Lovable/React PWA to React Native while keeping all user data and running both versions in parallel during transition.

- Supabase stays — only the UI layer changes. 1,036 i18n keys already translated in both languages.
- New DB fields: pause_mode_active (app_settings), proposed_by_child (tasks + store_rewards), fcm_token (profiles).
- Tool: Claude Code reads existing GitHub repo, uses it as reference to build React Native version.