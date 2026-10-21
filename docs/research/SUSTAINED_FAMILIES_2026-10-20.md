# Sustained families: what keeps kids going (2026-10-20)

Source: read-only SQL on the mobile Supabase (daily_progress, profiles, tasks, reward_redemptions, child_vibes, buddy_relationships, device_tokens). Excludes Adi's own and QA families, plus Sam's (seed data).

## The cohort

| Family | Kids (own login) | Active weeks since Jun | Days in last 30 | Trend |
|---|---|---|---|---|
| Noa Morag | Leia, 8 | 18 | 7 | steady, thinner (15 days Jul → 5-6/mo) |
| Tal Eliyahu | Eyal + Tomer | 14 | 6 | spiky (19 days Sep, 2 days Oct so far, Tomer silent since Sep 5) |
| Shani Yitbark | Matan, 10 | 12 | 4 | low but steady, kid opened app today |
| Tamar Belek | Alon | 13 | 2 | fading (20 days Jun → 1/mo Sep-Oct) |
| Rachel Snai (bonus) | Lavi + Arbel | 5 | 8 | came back in Oct after nothing since June |

## What they have in common

1. **All 5 are January-February veterans** (Lovable era) who moved to the app in late May/June. Their kids have been on BUFF for ~9 months. All have lifetime access.
   Of 50 families that signed up since Jun 15, none is still active. The best was Efrat's (web, kid login, 8 weeks, stopped Sep 13).
2. **Every kid has their own login** (10/10 kids). Matches the 8/4 finding: kid login = ignition.
3. **The anchor is one fixed routine with the same 4-6 steps every day, at the same time.** Three of the five include medication as a task: Noa "תרופות" 07:30, Shani "תרופה" 07:01, Rachel "לקחת כדור" 06:45. Tal has a 6-step school-morning list (breakfast, teeth, bed, shirt, shoes, water and food).
   The parent wrote every task (0 system-generated), and the list barely changes: Noa, Shani and Tamar added 0 tasks in 60 days.
4. **The kid keeps going after the parent stops opening the app.** Shani was last seen Sep 11 and Tamar Aug 15, but Matan and Alon were both in the app today. Parent setup → kid ownership (Pillar 3 in practice).
5. **Rewards actually get redeemed.** Tal has 9 approved redemptions, the last on Oct 10, and the kids proposed 4 of the rewards themselves. Noa has 4 approved and Rachel 2 (Oct 18).
6. **Vibe Check and BUDDY are used too:** 25-52 vibe check-ins per family, BUDDY level 3-4.
7. **Many kids tick tasks in the evening, not live.** Shani's tasks get ticked at 17-19 and Tal's at 20-21, including morning tasks, so it works as an end-of-day recap.
8. **It isn't push-driven.** Most of the kids have no device token (Tal's two kids, Alon, Lavi). This is habit, not reminders.

## Risks this surfaced

- **Matan (Shani) has a reward request from today, and his parent hasn't opened the app since Sep 11.** The request will just sit there. If a reward isn't answered, the rewards loop breaks.
- Tamar is fading, and Tomer (Tal) has been silent since Sep 5.
- n=5, all Hebrew-speaking Israeli veterans with lifetime access. These are correlations, not causes. There's survivorship bias, and none of this says anything about willingness to pay.

## What to do to get more families like this

1. **Onboarding: build one fixed daily routine with 4-6 concrete steps**, not a generated mix. Let the parent write or edit it, and offer a medication slot when relevant. Medical wording needs a Values + copy check.
   Possible conflict with the "no morning focus in copy" rule: that's about marketing copy, while here we're talking about the in-product routine. Adi's call.
2. **Kid login within 48h** (already known; this confirms it again).
3. **Close the reward-approval loop.** Send the parent a nudge when a request is waiting, or fall back to auto-approve after X days.
4. **Support evening logging:** let the kid tick off today's earlier tasks in the evening without friction, and consider an evening recap prompt instead of a morning reminder.
5. **15-minute calls:** Rachel (what brought her back?), Tamar (why is it fading?), Noa/Tal (what would make them leave?). The data shows "what", only they know "why".
