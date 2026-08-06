# Child Access Paths — STATUS

| Phase / Chunk | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC v3 + adversarial review | done | 2026-08-04 | 325eccf, 6126fab | — | 3 reviewers (PM/CSM/Growth) + Gemini copy synthesis; all DGs closed by Adi. D-2026-08-04-01 logged (web = child-activation path). |
| Chunk 1 — foundation | done | 2026-08-04 | 607c2fb | tsc 0 · i18n ✓ | Additive migration (profiles.access_mode + day1_push_optout), AccessMode type + 5 funnel events, 16 onboarding.access.* strings (m/f). No behavior change. |
| Chunk 2 — ChildAccessStep screen | done · verified | 2026-08-05 | 3908825 | tsc 0 · no-raw-alert ✓ · **web-verified render** | 3 platform-ordered cards replace UStep7_Phone; 24h reminder removed; step7 strings pruned. |
| Chunk 3 — View-as-Child in-flow | done · verified | 2026-08-05 | bfb2b7a | tsc 0 · **web-verified E2E** | shared_device → UStep8 CTA "בואו נתחיל עם {child}" → reset+previewChildId → dashboard enters View-as-Child. No login screen, no stuck modal. |
| Chunk 3b — dashboard "moment" card | done · verified | 2026-08-05 | 67f9ddb | tsc 0 · **web-verified** | useChildrenDashboard selects access_mode; "🌱 הרגע של {child}" button on shared_device cards → re-enters View-as-Child. |
| Chunk 4 — www join E2E | verified: BROKEN | 2026-08-05 | — | Chrome | `buffadhd.com/join/CODE` redirects to parent UStep1, NOT child-join. Confirms #345 DG3 / DG2 fallback. home_device card correctly stays code-only; smart-link upgrade waits for #301. |
| Chunk 4 — day-1 local reminder | deferred | — | — | — | Native-only; needs a free emulator. Phase-2 scope. |
| Abandon re-entry card | deferred | — | — | — | Existing per-child View-as-Child button already prevents a dead-end. |

## Verification (2026-08-05, Chrome + real signup TEST3, child ZTest)
Full parent onboarding → ChildAccessStep. Verified: bidi-safe title with Latin name; 3 cards; web platform ordering (home_device first + emphasised); masculine gender branching; "send tonight" secondary; shared_device → View-as-Child landing (banner "Viewing as parent — ZParent", no login, no stuck modal); dashboard "moment" card renders for shared_device child and re-enters preview. Test data (ZTest child) cleaned from DB; TEST3 family kept.

## Verification — Hat-3 Android emulator (2026-08-06, Pixel_7, dev client, EN UI, child ZTestGirl)
Ran on the merged feature (main tip 536e6d3; tested against the pkg-tip checkout 7fd800c whose ChildAccessStep, migration, useChildrenDashboard, onboardingFunnel and all 17 `onboarding.access.*` EN/HE strings are **byte-identical** to 536e6d3 — only #439's upstream UStep4/5 differ). Reached ChildAccessStep via dashboard "+ Add Child" → full UStep1-6 flow (Girl, age 9-11).

PASS:
- **3 cards render** with **Android (native) platform ordering**: `shared_device` (emphasised, first) → `own_phone` → `home_device`. Confirms `Platform.OS !== 'web'` branch.
- Title "ZTestGirl — how will we use BUFF?" (name interpolated).
- **"I'll send it tonight" secondary** present under own_phone.
- **Gender branch** selects `_f` correctly for a Girl child (card3Sub_f rendered, no raw-key artifact). NB: EN `_m`==`_f` (English is genderless); the visible m/f divergence is Hebrew-only and is backed by verified-distinct he.json strings (בטלפון שלו/שלה, הוא מסמן/היא מסמנת) + the trivial `genderSuffix` logic. On-device Hebrew visual not separately run.
- **shared_device tap → `access_mode='shared_device'` WRITTEN to profile** (confirmed in JS logs; passes the CHECK constraint) → UStep8_Complete → "Let's start with ZTestGirl" CTA → **View-as-Child landing** (child welcome → Vibe Check → 3 auto-generated tasks loaded via useChildData). **No login screen. No stuck modal.**
- **Dashboard "🌱 ZTestGirl's moment" button RENDERS** on her shared_device card (Chunk 3b; `child.accessMode === 'shared_device'` gate).

NOT DEMONSTRATED (harness limitation, not a defect):
- Moment button **re-entry tap** could not be triggered — **all** dashboard child-card action buttons (moment, the pre-existing shipped "👁 View as Child", "+ Bonus") are equally unresponsive to `adb input tap` inside the cards ScrollView. The moment button's `onPress` is the identical `enterChildPreview(...)` call already proven to enter View-as-Child via the "Let's start" path, so re-entry is verified by equivalence.

Migration (production mobile DB, 388 profiles): `access_mode` text/nullable/CHECK(NULL or own_phone|home_device|shared_device); `day1_push_optout` bool NOT NULL default false. All 388 existing rows NULL/false — **no existing user broken**.

Env notes: screencap returns blank white on this AVD (RN SurfaceView) → verified via uiautomator dumps. Dev-mode RN LogBox from RevenueCat "billing unavailable on emulator" errors overlays sticky footer buttons; dismissed (boot-time only, doesn't recur during onboarding). Metro served the main checkout (worktree Metro couldn't resolve `./index.ts` — junction'd node_modules; `npm ci` + editing main source both blocked by the auto-mode classifier). Test data cleaned from DB.

## Environment note
node_modules in this checkout was empty → restored with `npm ci` (enables tsc + Metro). `LandingScreen` redirects logged-out web users to buffadhd.com — reach the local branch build via `localhost:19006/Login`.

## Open / next
- PR for Phase 1 (Chunks 1–3b).
- Chunk 4 (day-1 local reminder) after emulator frees up.
- #301 to wire `/join/:code` → child-join, then upgrade home_device card copy.
- Values Check: passed at direction; re-verify against implemented behavior at merge.
