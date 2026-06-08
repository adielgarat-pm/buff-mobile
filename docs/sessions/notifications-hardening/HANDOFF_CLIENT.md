# `pkg/notifications-hardening` — Client-Session Handoff (Phases 3b–6)

> Server phases (1, 2, 3a) shipped + verified live on 2026-06-08. This handoff is
> for the **client chunk** — React Native UI + the preference enforcement that
> must ride the same app build. Self-contained; readable cold.

## What is ALREADY live (server, via Supabase MCP — do NOT redo)
- **Edge Function `push-notification-fanout` v13** (verify_jwt=false):
  - `child_suggestion` pushes (recipient=parent) + HE/EN copy.
  - `parent_engagement` + `family_joined` are bell-only (SKIP_PUSH_TYPES).
  - `activation_nudge` recipient+copy; canonical `anchor_recovery` copy.
- **Crons**: `scan_for_anchor_recovery` (ever-active gate + graduated 3d/<5-completions, 5d/established + stop-after-3); `scan_for_activation_nudge` (NEW, **family 14–21d window** = beta tester-protection, deduped per family+child_name); job `scan_for_activation_nudge_daily` @ 06:10 UTC.
- **Schema (Phase 3a)**: `app_settings.notif_parent_alerts` (def true), `notif_child_reminders` (def false), `notif_anchor_nudges` (def true), `notif_activation_nudges` (def true); `profiles.notif_self_optin` (nullable). **Nothing reads these yet.**

Repo source for the Edge Function lives on this branch at
`supabase/functions/push-notification-fanout/index.ts` — keep it in sync; a deploy
from stale `main` would revert the live function.

## What's LEFT (this session)

### Phase 3b — Edge Function preference enforcement (ships WITH Phase 4 UI)
In `push-notification-fanout`, before dispatch, read the recipient family's
`app_settings` (and recipient `profiles.notif_self_optin` for teens) and suppress
per the channel mapping (record a new `suppressed_reason`, e.g. `pref_off`):
- `notif_parent_alerts` → parent_sos, child_suggestion, reward_redemption_requested, reward_redeemed
- `notif_anchor_nudges` → anchor_recovery
- `notif_activation_nudges` → activation_nudge
- `notif_child_reminders` → kid_engagement for ages 6–12; for 13–18 use `profiles.notif_self_optin`
**Do not deploy 3b until the Phase 4 toggle UI is in the same build** (else kid
pushes go dark with no control to re-enable — `notif_child_reminders` defaults false).

### Phase 4 — Client (RN) — NEEDS Adi copy/UX sign-off
- One-time prompt at parent onboarding/dashboard seam with **two toggles**:
  "Alerts to me" (default ON) + "Reminders for my child" (default per age).
- **Denial-recovery**: when OS permission is `denied`, a dismissible banner +
  deep-link to system settings (`Linking.openSettings()`). Today
  `NotificationGate.tsx` only shows the pre-prompt when permission is `unknown`,
  so a denied user is dark forever — this is the main UX gap.
- **Settings → Notifications screen**: both toggles + OS permission state + deep-link.
- Files to start from (verify in code): `src/components/NotificationGate.tsx`,
  `src/screens/onboarding/PushPermissionPrePrompt.tsx`, `src/hooks/usePushRegistration.ts`,
  `src/lib/pushTokens.ts`, the parent Settings screen, `src/contexts/AuthContext.tsx`
  (role + age_group), i18n files.

### Phase 5 — Age gate + shared-device routing — NEEDS Hat-4 (Adi's device)
- Age gate (L4): 6–12 parent decides (default off); 13–18 kid decides (`notif_self_optin`).
- Shared-device routing: token re-points to whichever profile foregrounded last
  (`usePushRegistration` keys on profileId; `upsertDeviceToken` onConflict:'token').
  Must verify on a real device with parent + kid profiles that parent-targeted
  pushes reach the parent and View-as-Child doesn't misroute. **Code review is not
  enough — real two-profile device test required.**

### Phase 6 — i18n (EN+HE) · banned-string grep gate · Values re-check · doc sync · close
Banned user-facing strings: פספסת · החמצת · לא הצליח · כבר X ימים · מאחור · missed · failed · inactive · behind.

## Open questions resolved in-session (decisions L1–L8 + OQ recs) — see SPEC.md.
Notable beta override: activation window is **14–21d** (not the day-2 "strike while
warm" in the original SPEC) — protect testers during their trial; revisit post-beta.

## Branch / deploy state
- Branch `pkg/notifications-hardening` off main `c34a68a`; 5 commits; **not pushed, not merged**.
- Server changes are LIVE regardless of git. **Merge to main eventually** so repo
  matches the live Edge Function. At merge: add a `docs/RELEASE_QUEUE.md` row.
