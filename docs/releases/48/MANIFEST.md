# Release 1.6.1 (versionCode 48) — MANIFEST

> Auto-seeded from `RELEASE_QUEUE.md` + verified against `git diff bc38628..HEAD`.
> The queue is the **input**; this MANIFEST is the **verified output** (git is ground truth).

## Build coordinates
- **versionName** 1.6.1 · **versionCode** 48 (EAS remote auto-increment from 47)
- **Branch:** `pkg/release-48` · **built from** `pkg/release-48 @ 837d11b` (= `origin/main @ 2b47941` + 1 prep commit `837d11b`)
- **EAS build:** `92e07549-2d0d-4e1a-93eb-ba4ca21a9ba0` (production, store, app-bundle) — **finished** 2026-06-16 (18:07→18:16, ~9.5 min). AAB: `https://expo.dev/artifacts/eas/SwEWPtIV7xy79v-fNicR3DobLqeHkltpf6SW8jcmThw.aab`
- **Anchor:** last build 1.6.0 (versionCode 47), EAS `ecf981fd`, built from `bc38628` (2026-06-15)
- **SDK:** 54.0.0 · **profile:** production

## Content — 11 merges to `main` since the 47 cut (`bc38628`)

### App-facing (in this Android build)
| PR / Commit | Type | Change | User-facing? |
|---|---|---|---|
| #253 / `2b47941` | feat | **Completion confetti + sound** (kid-delight parity). New `src/lib/confetti.ts` + `src/lib/sfx.ts` (expo-audio); child can mute sound in Menu. Best-effort/try-catch — never breaks a task completion. | yes |
| #252 / `18dc5b1` | feat | **"Recommended now" parent card** — turns the passive dashboard insight into a one-tap action via a transparent priority ladder (Pause→suppress · low-vibe→sticker · lapse→comeback · streak≥3→celebrate). Retires the Anchor-Recovery modal auto-show; routes `anchor_recovery` taps to the dashboard. New `recommendationEngine.ts` + `useParentRecommendations.ts`. | yes |
| — / `89ab9cc` | fix | **Realtime double-subscribe crash** — guarantee unique channel names so a re-subscribe can't crash. | yes (stability) |
| #244 / `c990784` | feat | **BUDDY friendship gift loop closed + L4/L5.** `use_buddy_gift` RPC (already live on DB) opens a gift → reveal modal, marks used, applies a cosmetic theme color; EOD climbs to L4 (30d)/L5 (100d). Cosmetic-only v1. | yes |
| #248 / `9ce2ed8` | fix | **Parent Rewards: hide target-size label when `size = null`** — was rendering the raw i18n key `parentRewards.size.null`. | yes |
| #243 / `3b68318` | fix | **Off-routine leak fix.** | yes |
| #251 / `e43c734` | feat | **Expo-web: hide native-only timetable import** (Excel/photo) on web. Primarily affects the web build; import-safe / inert on Android. | (web) |

### Not in this Android build (Lovable web landing / docs only)
| PR | Type | Note |
|---|---|---|
| #249 / `10b9709` | chore | Landing-tamar combined (buffadhd.com / Lovable) |
| #246 / `397863e` | chore | Landing legal + Tamar copy (Lovable) |
| #245 / `5033740` | chore | Web landing copy (Lovable) |
| #250 / `b0e5452` | docs | queue-248 row |
| #247 / `f8e03a2` | docs | queue-244 row |

> ⚠️ Lovable site changes (#245/#246/#249) ship via **Publish → Update in the Lovable editor**, NOT this build.

## Tests
- **Gate 1 (static):** ✅ tsc 0 · jest **423/423** (40 suites). One pre-existing-in-main regression fixed in this cut: #253 added `expo-audio` without a jest mock, breaking the ChildSettings + EditChild suites on import — fixed by a test-only `jest.mock('expo-audio', …)` in `jest-setup.ts` (`837d11b`). No app-behavior change.
- **Gate 2 (functional):** [pending — Hat-3 emulator smoke on app changes + Hat-4 on-device by Adi]

## Schema / deps
- **No new migration** in this cut (`git diff bc38628..HEAD -- supabase/` empty). The `use_buddy_gift` RPC (#244) is already live on `gfrongfnyigxsexuofrg`.
- **New dependency:** `expo-audio ~1.1.1` (kid-delight sound, #253).
- **No Edge Function deploy gated to this build.**

## Files changed (app)
47 files, +1633 / −152 since `bc38628`. Notable new: `src/lib/confetti.ts`, `src/lib/sfx.ts`, `src/utils/recommendationEngine.ts`, `src/hooks/useParentRecommendations.ts`, `src/lib/setupPwa*.ts`, `src/types/buddy.ts`.
