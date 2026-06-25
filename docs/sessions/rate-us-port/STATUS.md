# STATUS — rate-us-port

| Phase | State | Date | Tests | Notes |
|---|---|---|---|---|
| 1 — Settings entry + gate sheet + DB write | BUILT (unverified on device) | 2026-06-20 | jest green (isolated) · tsc 0 errors (ours) · i18n guards pass | `RateBuffSheet` + `submitReview` → existing `reviews` table, no migration |
| 2 — Passive nudge (Nudge Manager slot) | BUILT | 2026-06-20 | `reviewStatus` + `rateEligibility` unit tests green | one-line `useRateNudgeRegistration` in dashboard; priority/cooldown inherited from PR #267 |
| 3 — Admin feedback view (admin-web) | BUILT (typecheck deferred to Vercel) | 2026-06-20 | n/a (admin-web deps not in worktree) | `FeedbackBoard` + `useFeedbackReviews`; **now a 3rd tab** in the admin Dashboard (rebase) |
| 4 — **Native in-app review auto-prompt** | BUILT (Hat-3 pending) | 2026-06-25 | rate unit tests green · tsc 0 errors (ours) | `expo-store-review` (~9.0.9) + platform-split `requestNativeReview`; auto-fires on dashboard, no gate/CTA |
| 5 — **Platform-aware Settings + standalone feedback** | BUILT (Hat-3 pending) | 2026-06-25 | same | Rate row → store link (native) / sheet (web); new "Send feedback" row → feedback phase |
| 6 — **Option A (no exposed number) + approved copy** | BUILT (Hat-3 pending) | 2026-06-25 | same | feedback ends in-app → admin follows up; `contactSupport.ts` deleted; copy applied (en+he) |
| — **Rebase onto main (a4bfe32)** | DONE | 2026-06-25 | tsc/rate tests green post-rebase | branch was 68 behind; kept main's new bilateral referral row, integrated FeedbackBoard as admin tab |

## What shipped (current design — matches store policy + best practice)
- **Native rating (Android/iOS):** the OS in-app review card fires **automatically** on the parent
  dashboard once the retention gate passes — **no sentiment question, no CTA button** (Google forbids both
  in front of the native API; Apple treats a happy-only funnel as review manipulation). Suppressed during
  view-as-child. This is what drives the rating lift in comparable apps.
- **Web rating:** no OS API → keeps the passive banner + `RateBuffSheet`, which writes to our first-party
  `public.reviews` table (compliant: first-party curation, no sentiment-gated third-party link).
- **Settings "Rate BUFF":** native deep-links to the Play listing (a CTA must NOT fire the native API —
  quota may make it a no-op → broken UX); web/iOS open the in-app sheet.
- **Settings "Send feedback":** always-available private channel (opens the sheet at the feedback phase →
  writes to `reviews`). NOT a sentiment filter in front of the public rating.
- **No exposed contact number (decision: option A, 2026-06-25):** feedback is captured in-app and surfaced
  in the admin **FeedbackBoard**; Adi reaches out from there. A personal number can't be truly hidden in a
  client bundle, so none is shipped. `contactSupport.ts` removed.
- **Nudge coordination (web):** rate registers as the lowest-priority passive nudge; install (20) beats
  rate (10); Manager's 7-day global cooldown + rate's 90-day local cooldown prevent overload.

## Files
- `src/lib/rateBuff/` — reviewStatus, rateEligibility, submitReview, highIntentDestination(.android/.web),
  **requestNativeReview(.ts native / .web.ts no-op)** · ~~contactSupport~~ (deleted)
- `src/components/rate/` — RateBuffSheet (+ `initialPhase`), RateNudge (platform-split behaviour)
- `src/screens/parent/ParentSettingsScreen.tsx` (Rate + Send-feedback rows), `ParentDashboardScreen.tsx`
  (nudge line + `enabled: !isChildPreview`)
- `src/i18n/en.json` + `he.json` — `rate.*` (18 keys, balanced; approved copy 2026-06-25)
- `admin-web/` — FeedbackBoard, useFeedbackReviews, api.fetchRows, Dashboard tab
- `package.json` — `expo-store-review` `~9.0.9`

## Open
1. **Hat-3 (emulator, native):** verify the OS review card fires on the dashboard for an eligible parent,
   and that the Settings Rate row deep-links to Play. (Quota is opaque — card may not always show.)
2. **Web preview (logged-in parent):** Settings → Rate BUFF (sheet) + Send feedback (feedback phase) +
   the restored Invite-a-friend row all render.
3. **admin-web typecheck** confirmed by the Vercel build on merge (deps not installed in the worktree).
4. **Lockfile:** `expo-store-review` installed via `--no-save` into shared node_modules; a full
   `npm install` from a main-synced checkout before the build will pin it in the lockfile.

## Values Check
PASS (SPEC §8). Parent-facing, optional, dismissible; the native prompt is unconditional (no manipulation);
the unhappy path is private + captured for a human follow-up. No mechanics in copy (Pillar-2 / WHY-WHAT).
