# Follow-up prompt — issues surfaced during vc60 Hat-4 (2026-07-03)

> Paste the block below into a fresh Claude Code session to continue. It is self-contained.

---

## Context (what just shipped)

**vc60 / 1.7.7** was cut from `origin/main` (commit `113f3e2`, PR #313) and is going to the Play Store. It ships the **AI-trial client surface only** (Phases D/E): the insights-card gate (`insightsUnlocked`), the "🔒 Unlock your personal AI coach" teaser CTA, the "✨ AI coaching active" trial ribbon, and lazy auto-generate. Server side (Phases 0/A/B — entitlement guard 035, token gate RPC 036, trial clock 037, edge fn `generate-child-insights` v12) was already live on the DB.

Hat-4 verified on a preview build (real device, family `37d6a2bd`): **S2 gate works** — a free/non-entitled parent sees the locked teaser and tapping it opens the Paywall (screenshot-confirmed). Purchase itself can't complete on a preview build ("not configured for billing via Google Play") — that's expected, works only on a Play-distributed build.

**Deliberately NOT in vc60** (parked, still on `pkg/ai-trial-cta-polish`): the web-to-native-CTA package (`install/*`, `InstallCtaBoard`, migrations 038_install/039), Phase C referral +7 bonus (`038_DRAFT_referral_activation_grant.sql`), and the `useChildProgress` `completed_at` analytics fix.

---

## Issue 1 — Native notification permission prompt re-pops in a loop

**Symptom:** On the native build, the notification-permission prompt re-appears repeatedly even after the user approves. Reported by Adi 2026-07-03.

**Not a vc60 regression:** `src/components/NotificationGate.tsx`, `src/hooks/usePushPromptDismiss.ts`, `src/hooks/usePushRegistration.ts` are unchanged from main and predate the ai-trial work (PR #285 fixed the WEB re-pop loop only; native has a separate cause).

**Investigate:**
1. Is the re-popping element BUFF's own `PushPermissionPrePrompt` card (`src/screens/onboarding/PushPermissionPrePrompt.tsx`), or the OS-level Android permission dialog?
2. `NotificationGate.tsx:76` shows the pre-prompt only while `permission === 'unknown'`. Does `usePushRegistration`'s `permission` actually transition off `'unknown'` after the OS grant on native? If it stays `'unknown'`, the effect keeps re-showing.
3. Does `usePushRegistration` call `requestPermissionsAsync` on every mount/focus?
4. Does `markDismissed`'s AsyncStorage write persist on this native build (key `pushPrePrompt.dismissedAt.{profileId}`)?
5. Confirm it also reproduces on the live vc59 (same code) to establish it isn't new.

Fix as a standalone fast-follow package. Platform-parity: verify the web path still behaves.

---

## Issue 2 — Insights / AI coach content not age-appropriate for teens

**Symptom:** For Itay (15, Gamer/Teen), the dashboard insight was "אתגר בשגרת הבוקר" (a morning-routine challenge) with a young-child framing ("הכינו בגדים ותיק יחד בערב שלפני") — not age-appropriate for a 15-year-old and not relevant to his actual tasks.

**This is a content-quality issue, separate from the trial gate mechanism.** It affects two layers:
1. **Rule-based insights** — `src/hooks/useParentInsights.ts` + `src/utils/insightFraming.ts` build the phase insights ("morning routine challenge", the suggestion copy). The framing/suggestion library is age-agnostic.
2. **AI coach** — `supabase/functions/generate-child-insights/index.ts` builds the LLM prompt. **This is server-side → improving age/teen-fit is an edge-function redeploy, NO new app build needed.**

**Goal:** make both layers account for the child's age band + mode (Teen/Gamer vs Children). A 15-year-old's coaching should read like a teen's (autonomy, ownership, less parent-does-it-for-you), and suggestions should map to the child's real task mix, not assume a young-child morning routine. Cross-check BUFF_VALUES (Pillar 1 intrinsic motivation, Pillar 3 independence) and the Teen Mode / Itay persona docs.

**Note:** the child's age is available on the profile; Teen/Gamer mode is already resolved elsewhere — thread it into both the rule-based framing and the LLM prompt.

---

## Also parked (decide if/when to pick up)
- **Phase C** referral +7-on-activation — `migrations/038_DRAFT_referral_activation_grant.sql`, needs reusable multi-code redesign + reconciliation with the merged referral-share work.
- **web-to-native-CTA** package — the "get the app" nudge + admin funnel board, still on `pkg/ai-trial-cta-polish`.
- **`completed_at` analytics** — `useChildProgress` writes `completed_at` on the branch but that fix never landed on main (repo/DB drift).
- **Billing dep:** once monthly/yearly RC subscriptions go live, `rc-webhook` MUST reflect them into `premium_until` or the Phase A token gate will 402 real monthly payers (it currently only reflects Founding-lifetime).
