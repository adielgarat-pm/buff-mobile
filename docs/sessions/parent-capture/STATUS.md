# Parent Capture — STATUS

**Branch:** `pkg/parent-capture` (merged to `main` via PR #276, 2026-06-22). Follow-up: `pkg/parent-capture-gemini-align` (PR #380).
**State:** `BETA LAUNCH approved by Adi 2026-07-21 — FEATURE_PARENT_CAPTURE=true (with in-UI beta disclaimer).`

## 2026-07-28 — "stuck spinner" after the OTA → two-sided parse timeout (`claude/version-update-bug-check-qdbwk7`)
Adi's report (screenshot 06:16, minutes after the 06:06 production OTA landed): tapped "תעשה לי סדר" on a pasted text and the button spun with no end. Framed as "broken after the version update".

**What the data showed (not a code regression).** `capture_runs` had TWO successful runs that morning (06:17:07 and 06:18:31 IL, both `outcome=ok`, 5 items each) with `confirmed_at` NULL, and `onboarding_events` had two `capture_opened` rows (06:15:38, 06:15:58) — i.e. the screen was opened twice, both parses **succeeded server-side after ~60-90s**, and the parent had already abandoned the screen before the response arrived. Full delta since the last known-good OTA (#394 client + #395 + `parse-capture` v10) was reviewed line-by-line: no hanging path. Root cause: **a real Gemini parse takes 60-90s, and there was no timeout, no progress copy, and no recovery on either side** — RN `fetch` waits forever, so any slow/lost response reads as a dead feature.

**Fix (this branch):**
- Client `parseCapture.ts`: `withTimeout` race (120s backstop, `PARSE_TIMEOUT_MS`) + `AbortController` passed as `signal` to `functions.invoke`; new typed `CaptureParseError('timeout')`; server 504 mapped to it.
- `CaptureScreen`: while parsing, shows `capture.workingHint` ("…זה יכול לקחת עד דקה") so the wait is announced, not silent; `capture.errorTimeout` for the timeout case. (Copy = draft, Adi to review.)
- `parse-capture` **v11 (deployed 2026-07-28, verified: unauth'd body probe returns the function's own 401 via pg_net)**: `AbortSignal.timeout(100_000)` on the Gemini fetch → typed 504 `gemini_timeout` + `error_gemini` run row instead of holding the connection until the runtime wall clock kills it; logs `gemini_ms` per call for latency observability.
- Timeout ordering: server 100s < client 120s, both above the measured 60-90s — a slow success stays a success.

**Verification:** tsc 0 · jest 86 suites / 790 tests green (new `parseCapture.test.ts`: withTimeout semantics, 402/429/504/500 mapping, dead-connection abort) · i18n parity ✅.

**Known follow-ups (not in this fix, need Adi's call):** (1) latency itself — 60-90s is the real UX problem; options include a Gemini `thinkingBudget` cap or a faster model, both quality tradeoffs; (2) a response that arrives after the parent left the screen is still lost (needs state lifted out of the screen); (3) RELEASE_QUEUE row + OTA dispatch for the client half on merge.

## 2026-07-27 — usability metric (`pkg/capture-usage-metrics`)
Adi's ask: a usability measure for the capture beta (+ a rename, still open — see below).

**What was blind.** `capture_runs` logged how many items the AI *returned*; nothing recorded what the parent then *did* with them. Discards left no trace (`parent_items` stores only kept items), failed runs returned before the insert and existed only in Sentry, and no link tied a run to the items it produced.

**Metric set** (`scripts/capture-usage.sql`, 5 blocks):
- **North Star — Repeat Capture Rate (7d):** of families that ran once, how many came back within a week. In a beta it is the only honest usability signal.
- **Trust Rate** = kept / returned · **Edit Rate** = edited / kept (AI assigned the wrong child) · **Zero-yield** = runs returning 0 items · **Error Rate** = paywall / cap / Gemini failures · **Abandon Rate** = reviewed, never confirmed · **Reach-through** = transferred items the child actually completed.

**Instrumentation** (`047_capture_usage_metrics.sql`, applied 2026-07-27 — additive + nullable, zero impact on builds in the field):
- `capture_runs` + `outcome` (CHECK: ok/empty/error_premium/error_rate_limited/error_gemini/error_internal), `kept_count`, `discarded_count`, `edited_count`, `confirmed_at`; 5 pre-047 rows backfilled to ok/empty (historically a row was written only on success).
- `parent_items` + `capture_run_id`.
- `parse-capture` **v10**: every terminal path writes a run row (failures included) and returns `run_id`. The daily cap now counts only billable runs (`ok`/`empty`) so error rows can't lock a family out.
- Client: `lib/parentCapture/captureMetrics.ts` (pure `summarizeReview` + fire-and-forget `logCaptureConfirm`); `CaptureScreen` snapshots the AI's proposal **before** the parent edits, so "edited" means the AI was wrong, not that the card was touched. `capture_opened` / `capture_consent_granted` go to `onboarding_events` with `source='parent_capture'` (no second event log).
- Privacy posture unchanged: counts only — no titles, no raw input.

**Baseline at build time (prod):** 5 runs · 2 families (Adi's + one test) · 49 items returned · **15/15 transferred items, 0 completed by a child** → reach-through 0%. That is the number to watch, not run volume.

**Verification:** tsc 0 · jest **85 suites / 771 tests** green (7 new metric tests) · all 5 report blocks run against prod · new columns + CHECK exercised with a temp row (inserted → updated → deleted, table back to 5 rows) · rejected `outcome='bogus_outcome'` as expected. Two report bugs found and fixed while verifying: `count(*)` over a `LEFT JOIN` inflating empty windows, and an abandon rate reading 100% because pre-instrumentation rows have no `confirmed_at` (now discovered from the first confirmed run instead of hardcoded).
**Rename — DONE (Adi approved 2026-07-27), same PR.** "לכידה"/"Capture" → **"מארגן חכם" / "Smart Organizer"**; subtitle is now the descriptor "מהודעה או קובץ → משימות התארגנות לילדים"; CTA "קראי את זה" → **"תעשה לי סדר" / "Organize it for me"**; `thisWeek.capture` → "+ מארגן חכם"; consent point 3, the three error strings and the empty-state line de-"read"-ed to match. Hub title stays **"השבוע"**. i18n values only — every `capture.*` / `thisWeek.*` **key is unchanged**, so nothing else in the app moved. Adi's reasoning for rejecting plain "Smart Read": it names the middle step (reading), not what the feature delivers (organizing).
**Not built (out of approved scope):** admin-board strip for these numbers, and an `is_admin()` read policy on `capture_runs` / `parent_items` that such a strip would need.

## 2026-07-24 — capture-fixes-2: assignment UX + clean titles + child day-view (`pkg/capture-fixes-2`)
Adi's day-3 beta feedback (real camp-schedule run, 15 items landed on the wrong child with name-prefixed titles, child saw everything "today at noon"):
- **"Who is this about?"** — optional child chips on the input step; pick becomes the default assignment for every item the AI didn't explicitly match, and is passed as `childHint` to `parse-capture` (v9) to bias matching server-side.
- **Bulk assign** — "assign everything to…" chips on the confirm screen (one tap instead of 15).
- **Clean titles** — prompt rule (title must never contain a child name) + client-side `stripChildNamePrefix` belt. Kid-copy rule enforced.
- **Child day-view** — `isTaskVisibleToday` is now dueDate-aware (dated tasks visible ONLY on their day; before: HQ/dashboards ignored dueDate entirely) + new `TomorrowPreview` strip ("מחר · יום ה'") on both child task screens showing tomorrow's dated tasks (bag prep heads-up). Recurring tasks excluded by design.
- **Smart times** — prompt: bring-items split into "לארוז" (evening before, 19:00) + "לקחת" (event morning, 07:30); dated event with no time → 08:00. Client fallback for dated tasks: 08:00 (was blanket 14:00).
- **Data cleanup (prod, same day):** 15 camp tasks stripped of "לייא: " prefix + the one stray Leia task moved to Emmy.
- Gates: tsc 0 · jest 48/48 (mapping+schedule) · i18n parity ✅ · fs-root-import guard ✅.

## 2026-07-22 — Android file upload broken → fixed (`pkg/capture-fixes`)
- **Bug (Adi report, day 1 of beta):** picking any file/photo on Android showed "Something went wrong while reading" — zero `parse-capture` invocations in Supabase logs (failure was client-side, before the request left the device).
- **Root cause:** Expo SDK 54 moved `readAsStringAsync` to `expo-file-system/legacy`; the root export **throws at runtime**. Both `parseCapture.ts` and `TimetableScreen.tsx` (photo/Excel import, 2 call sites) imported from the root → every Android file read threw immediately. Web unaffected (separate fetch+FileReader path). Text paste unaffected.
- **Fix:** import from `expo-file-system/legacy` in both files. OTA-able (JS-only).
- **Verification:** typecheck 0 errors · jest 98/98 (parentCapture + timetableParser) · **Hat-3 end-to-end on emulator**: Hebrew camp-schedule image (recreation of Adi's real CamScanner file) → picker → Read it → **12 items extracted** with correct dates + bring-lists, auto-assigned to the matched child.
- Emulator-only red herring during testing: low disk (93%) made Android purge the DocumentPicker cache copy between pick and read (ENOENT) — not a product bug.
- **Open (Adi):** feature rename — "לכידה"/"Capture" unclear; candidates: "קריאה חכמה" (recommended), "הוספה חכמה". Separate copy decision, not in this PR.

## 2026-07-21 — Gemini-pattern alignment + beta launch (PR #380)
- `parse-capture` aligned with the `generate-child-insights` posture: JWT auth + family-membership check, `family_is_entitled` gate (402, web free like the AI coach), 30/day family cap server-side (429), key via `x-goog-api-key` header, `created_by` audit. Deployed v7→v8.
- English support: bilingual prompt path (Hebrew prompt kept verbatim; English mirror for non-`he`), client passes `i18n.language`, input `textAlign` follows language.
- Beta disclaimer: "Beta" pill on the dashboard entry card + note line on CaptureScreen (HE+EN, draft copy).
- Web parity: file reads use fetch+FileReader on web (expo-file-system is native-only); web bundle verified building clean.
- Verification: typecheck 0 errors · jest parentCapture 28/28 · i18n parity ✅. Auth-gated UI on real devices = Adi manual check.

| Phase | State | Date | Notes |
|---|---|---|---|
| 0 — Foundation & verification | ✅ done (read-only) | 2026-06-05 | See `PHASE0_FINDINGS.md`. No code, no schema changes. |
| 1 — `parse-capture` Edge Fn | ✅ **deployed + verified** (2026-06-20) | 2026-06-20 | Real Gemini (`gemini-2.5-flash`, paid key in Supabase secret). End-to-end verified on Hebrew text → structured items (date resolution, recurrence, bring-list, no ghosts). Client wired (`parseCapture` replaces stub in `CaptureScreen`). Privacy: only counts logged to `capture_runs`, no raw input. |
| 2 — Schema + RLS + persistence | ✅ **applied** (2026-06-19) | 2026-06-19 | `019_parent_capture.sql` applied: `parent_items` (+`child_name`,`child_task_id`), `capture_runs`, `grade_level`, parent-only RLS, GRANTs verified. `useParentCapture` store swapped AsyncStorage → Supabase (durable + synced). Additive, 0 impact on existing. |
| 3 — CaptureScreen + in-app entry | ✅ **built** (stub, flag-off) | 2026-06-05 | `CaptureScreen.tsx`; paste + image (existing deps, zero new dep) |
| 4 — ConfirmCard | ✅ **built** (stub, flag-off) | 2026-06-05 | `CapturedItemRow.tsx`; owner toggle, confidence, no_match collapse, `category` map in config |
| 5 — Transfer-to-child | ✅ **built** (2026-06-07) | 2026-06-07 | child task/event items → existing `tasks` loop. One-time `due_date` model added (migration 020 **applied**, additive). `isTaskVisibleOn` helper; Values Check PASS. |
| 6 — "This Week" surface | ✅ **built** (stub, flag-off) | 2026-06-05 | `ThisWeekScreen.tsx`; calm pull, time buckets, recency archive, opt-in reminder |
| 7 — Android share target | 🔒 new-dep gate | — | needs `expo-share-intent` + rebuild + Adi approval (in-app capture works without it) |
| 8 — Privacy/consent + i18n | 🟡 i18n done (draft); consent pending | 2026-06-05 | HE+EN keys added (parity ✅, draft→Adi). 🔒 consent copy = privacy posture |
| 9 — Spec sync + tests + PR | 🟡 tests ✅; sync/PR pending | 2026-06-05 | 20 unit tests pass; typecheck 0 errors |

## Built in this session (autonomous, on `pkg/parent-capture`)
- **Feature flag** `FEATURE_PARENT_CAPTURE = false` (`src/config/parentCaptureConfig.ts`) — gates the single dashboard entry; **off in production**.
- **Logic** (pure, tested): `types/parentCapture.ts`, `lib/parentCapture/captureMapping.ts` (dates/buckets/recency/category map), `lib/parentCapture/stubParser.ts` (Gemini stand-in).
- **Store**: `hooks/useParentCapture.ts` — AsyncStorage (swap to Supabase `parent_items` when applied) + `useFamilyChildren` (read-only).
- **UI**: `CaptureScreen` (input→confirm), `CapturedItemRow`, `ThisWeekScreen`, `ParentCaptureEntry` (gated).
- **Nav**: `ParentCapture` + `ParentThisWeek` registered (modal); gated entry on `ParentDashboardScreen`.
- **i18n**: `capture.*` + `thisWeek.*` keys (HE+EN, draft).
- **Migration**: `019_parent_capture.sql` (additive, **not applied**).
- **Tests**: `lib/parentCapture/__tests__/` — 20 pass.
- **Verification**: `npm run typecheck` → 0 errors · `npx jest parentCapture` → 20/20 · `npm run i18n:check` → parity ✅.

## How to try it (on this branch only)
Flip `FEATURE_PARENT_CAPTURE` to `true` in `src/config/parentCaptureConfig.ts`, run the app, open the parent dashboard → "This week" card → Capture. Paste any text or pick a photo → the stub returns a representative item set → confirm → items land in "This Week". **Do not merge with the flag on.**

## Open gates (both Adi's)
1. **Now or V-next?** (focus call — DECISION §7; tester-retention signal informs it)
2. **Gemini paid key + privacy posture** (Phase 0 found a compliant path: paid tier only)
3. *(sub-gate)* **`expo-share-intent` new dependency** — only for the OS share-target (Phase 7)

## Isolation guarantees (per Adi's "build on the side" requirement)
- All work on `pkg/parent-capture`, **never merged to `main` until done** → not on the release path; hotfixes to the test build are fully independent.
- Backend changes **additive-only** (new tables / column / Edge Function) → production code ignores them; zero behavior change.
- The only phase touching production data (`tasks`) is **Transfer-to-child** — built last, behind a feature flag.
- Feature flag (off in production) gates every entry point even after eventual merge.

## Docs in this session
`DECISION.md` · `SPEC.md` · `IMPLEMENTATION_PLAN.md` · `PHASE0_FINDINGS.md` · `STATUS.md`
