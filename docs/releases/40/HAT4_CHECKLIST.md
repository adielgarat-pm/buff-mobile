# Hat-4 checklist — 1.4.2 (versionCode 40)

Build: EAS `f8d99a1d-060d-4fdc-bdba-6651f8f411cc` · cut from `main @ cf6b353` (+ version bump `c30c9dc`).
**vc40 supersedes the un-promoted vc39** — promote 40, not 39.

## Why this build (the point)
Carries **#209 reward-redemption reachability fix** (`pkg/redemption-talk-reset`): parent can now actually reach the approve button from a redemption notification; requests show family-wide with a per-child dot; refetch on focus; new "let's talk = reset" flow. Migration 025 already live on DB. This is what unblocks matan/leia (full balances, 0 redemptions) + everything that shipped in 39 (notifications UI, Pause calendar-day, off-routine).

## Pickup + promote
- [ ] When build `f8d99a1d` is **finished**, download the AAB from EAS → upload to Play Console (internal → Alpha closed testing)
- [ ] Verify Play shows **1.4.2 (40)**
- [ ] Promote to Alpha / confirm tester install link; tell testers to update

## The redemption journey — verify on a REAL device (the deferred Hat-3)
- [ ] Child redeems a reward → request created
- [ ] Parent gets the notification → **tap it → lands on Parent Rewards, requesting child pre-selected, approve button reachable**
- [ ] Approve → BUFFs deducted atomically (balance drops) → `reward_redemptions` row resolved
- [ ] "Let's talk" → leaves parent list; child sees "ההורה רוצה לדבר 💬" + "הבנתי 👍" → child can re-request
- [ ] Multi-child: a request shows a dot on the right child tab even if another child is selected

## Coordinated server step (from release-39, still applies)
- [ ] After 40 is promoted: tell CC **"deploy the edge function"** → CC deploys `push-notification-fanout` (notifications Phase 3b)

## After confirmed live
- [ ] Tell CC **"verified, tag it"** → CC tags `v40` on commit `c30c9dc` + reconciles RELEASE_QUEUE
