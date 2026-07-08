# Release v1.7.10 (versionCode 66)

## A. Technical
- versionName **1.7.10**, versionCode **66** (EAS remote autoIncrement).
- Content in `main` via PRs #332–#339 + #341. Anchor: `1.7.9 (vc65)` (base `55a243b`).
- Change set: parent path → Signup · no late-shame timestamp · rewards error state · gamer daily loop (server days, hidden 0-streak, full-row tap, banner exit) · child count goal (fuel/egg/ignition) · child purchase-screen gate + legal links · cross-platform dashboard invite share · web time/date pickers · parent surfaces aligned to the count rule.
- Gates: Gate 1 ✅ (tsc 0 · **jest 666/666, 0 skipped** · no-raw-alert clean). Gate 2 ✅ full autonomous sweep 2026-07-08 (Android emulator + Expo Web) — MASTER_TEST_PLAYBOOK § Run 2026-07-08.
- Schema: none. Dependencies: none. Edge functions: none.

## B. User-facing — Play Store "What's new" (English)

Small day, big win — this update makes the daily loop kinder and clearer.

- **A goal your child can actually reach:** the day is a win at ~3 completed missions — the fuel bar, the egg, and your dashboard all agree now.
- **No shame for finishing late** — a task done after its time window looks just as done.
- **Gamer mode polish:** one consistent "successful days" number, no more staring at a zero streak, and the whole quest row is tappable.
- **Sharing BUFF with your child now works everywhere** — including from the browser (link copied automatically).
- **On the web:** time and date fields in Tasks, Child profile and Activities now open real pickers.
- Clearer, safer flows for kids around subscription screens.

### Shorter variant (Play Store limit-friendly)
> A kinder daily loop: a reachable ~3-mission goal everywhere (fuel bar, egg, parent dashboard), no late-completion shame, smoother Gamer mode (consistent stats, tappable rows), working invite sharing on web, and real time/date pickers in the web app.

## C. What's new — עברית (ללוח Play)

> יעד יומי שאפשר באמת להשיג: ~3 משימות = יום פעיל — מד הדלק, הביצה והדשבורד שלך מסכימים עכשיו. בלי בושה על סיום מאוחר, מצב גיימר חלק יותר (מספרים עקביים, שורה שלמה לחיצה), שיתוף הזמנה שעובד גם מהדפדפן, ובוררי שעה ותאריך אמיתיים בגרסת הווב.

## D. Notes
- No in-app "What's New" surface yet (FLAG F-2026-05-30-01) — these notes are for the Play Console listing.
- Landing-site changes of the same days (#331 /summer, #340 SW eviction, #343 guides) ship via Vercel, not this build.
