# Parent Insights screen — Acceptance Criteria Matrix

Branch `pkg/insights-screen` (off `pkg/monetization-model`). Verified 2026-06-19.
Hat-1 = jest/typecheck; Hat-3 = adb on emulator (parent = Adi, demo family Itay/Leia/Emmy).

| # | AC | Source | Hat | Verdict | Evidence |
|---|---|---|---|---|---|
| 1.1 | `isActiveDay` mirrors the BUDDY EOD rule (`completed ≥ LEAST(3, assigned)`), one shared def | DESIGN §1, D-2026-06-14-01 | 1 | ✅ | `src/utils/successDay.ts`; imported by `useWeeklyStats` |
| 1.2 | `useWeeklyStats` returns real WoW (or `null` when prior week has no usage) — no `Math.random` | SPEC §4.1 | 1+3 | ✅ | Leia seed: "↑ 2 vs last week" (5−3); new family → badge hidden |
| 2.1 | `selectInsightFraming` pure, C0 checked before C1–C5 | PROMPT ch2 | 1 | ✅ | 17/17 unit tests `insightFraming.test.ts` |
| 2.2 | Every B-case (B1–B5) returns a warm message + CTA (B5 = empty, no CTA) | DESIGN §3 Layer B | 1+3 | ✅ | B1 live (Leia), B5 live (Itay); B2–B4 unit-tested (same render path) |
| 3.1 | Subscriber taps dashboard insight card → lands on Insights screen | PROMPT ch4 | 3 | ✅ | drive_02; navigated, no paywall |
| 3.2 | Non-subscriber → Paywall (unchanged free branch + screen guard) | SPEC §5 | 1 | 🤔 | Free branch untouched + `!isSubscribed` guard in screen; not seen live (Adi subscribed) |
| 3.3 | Child selector switches the active child (multi-kid) | DESIGN §6 | 3 | ✅ | drive_02/03/04 — Itay/Leia/Emmy chips, re-fetch on switch |
| 4.1 | B1 strong week + active/rest counters + real WoW badge | DESIGN §3 B1 | 3 | ✅ | drive_04 — "Leia had a strong week", 5 active / 2 rest, ↑2 |
| 4.2 | Highlights: strongest phase + most-active window | DESIGN §3 Layer D | 3 | ✅ | drive_04 — 🏆 School 100% / ⏰ Morning |
| 4.3 | Weekly map: 7 active/rest dots, correct + localized | DESIGN §3 D3 | 3 | ✅ | drive_05 — Sat🔥 Sun💤 Mon🔥 Tue🔥 Wed💤 Thu🔥 Fri🔥 (matches seed) |
| 5.1 | Reward-loop nudge (C0) fires for earning-without-redeeming family | PROMPT, DESIGN C0 | 3 | ✅ | drive_03 — C0a "BUFFs need a finish line… Leia" + Open rewards CTA |
| 5.2 | Targeted tip triggered by category/phase, NOT title keyword | PROMPT, DESIGN C | 3 | ✅ | drive_02 — Itay evening "Shutdown Ritual" (C3 weakest phase) |
| 6.1 | CTA wired to an existing lever (no duplicated logic) | PROMPT | 3 | ✅ | drive_06 — "Send a bonus" → dashboard Bonus sheet opens |
| 6.2 | Copy on tone rules; "active day / rest day", no "ignition" | DESIGN §1, Adi 2026-06-19 | 1+3 | ✅ | en/he keys; i18n parity test passes |

## Bugs found + fixed this run
- 🐛 **B5 message `{{name}}` not interpolated** — `t('insights.weekly.comingSoon.message')` missing the `{ name }` arg. Fixed; re-verified live (drive_07: "…and Itay's weekly picture…").

## Notes / deferred
- Meds-specific tip (C1) folded into self-care for v1 (Adi-approved): meds tasks are stored as `category: 'self-care'` with no medication tag, so they're structurally indistinguishable from hygiene; title-keyword matching is intentionally NOT used. Follow-up: a `medication` category or strategy tag to split them.
- B2/B3/B4 not exercised with live data (no demo child sat in those buckets); covered by unit tests + the proven B1/B5 render path.
- Non-subscriber → Paywall not seen live (test parent is subscribed); covered by the untouched free branch + the in-screen guard.
- Out of band: removed a dead `jest.mock('expo-audio')` in `jest-setup.ts` (pkg dropped in 1.6.2 hotfix) — un-broke the whole jest suite (440/440 now pass) and the nightly Hat-1 automation.
