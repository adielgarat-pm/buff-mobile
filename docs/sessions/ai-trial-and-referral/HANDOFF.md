# ai-trial-and-referral — HANDOFF / Hat-4 checklist

**As of:** 2026-07-02 · **Branch:** `pkg/ai-trial-and-referral` · **PR:** [#309](https://github.com/adielgarat-pm/buff-mobile/pull/309) (base = `pkg/referral-share-and-tracking`, DO NOT fast-merge)

---

## 1. State at a glance

| Phase | What | Status |
|---|---|---|
| 0 | Entitlement security guard (trigger 035) | ✅ **LIVE** on DB, verified |
| A | Server token gate (RPC 036 + edge fn v12) | ✅ **LIVE**, verified server-side |
| B | 14-day trial clock + activation trigger (037) | ✅ **LIVE**, verified (rollback tests) |
| C | Referral +7-on-activation (038) | 📝 **DRAFT, NOT applied** — needs reusable-code redesign + coord with referral-share branch |
| D | Platform-safe card gate + ribbon + locked-coach | ✅ committed, typecheck-clean, ⏳ Hat-4 pending |
| E | Lazy auto-generate coach insight (option A) | ✅ committed, typecheck-clean, ⏳ Hat-4 pending |

**Live DB objects (already applied, additive, zero existing-feature behavior change):**
- `trg_guard_profile_entitlement` on `profiles` (035) — blocks client self-grant of premium.
- `trg_guard_family_trial` on `families` (037) — blocks client write of `trial_started_at`.
- `family_is_entitled(uuid)` RPC (036) — service_role only.
- `families.trial_started_at` column (037) + `start_trial_on_activation()` trigger on `daily_progress`.
- Edge fn `generate-child-insights` v12 — 402 gate for non-entitled families.

**Commits:** 75db7c9 (0+A) · d66bc33 (B) · 6a1a6ad (C draft) · a9bc48c + 479d7af (D) · 414a1af (E) · d9cb398 (SPEC).
(Branch also carries parallel-session commits — auth `ac3711c`, web-to-native `e4206a0`/`2a0f463`/`dc8a563`/`635ac55` — review those separately.)

---

## 2. Why Hat-4 (not Hat-3)

Hat-3 on the emulator is **blocked**: the installed build is **release** (no expo-dev-launcher → can't load branch JS via Metro). Verifying D/E needs a build that CONTAINS this branch + a real Google login. So D/E runtime = Hat-4 (real device or a dev/preview build + your login). 0/A/B are server-side and already verified via SQL.

Fastest path when ready: cut an EAS **preview/dev** build from this branch (or `npx expo run:android` once for a dev client), install, log in, run §3.

---

## 3. Hat-4 scenarios (CC preps the DB state, you drive the app)

> For each, ping CC to run the SQL first (needs a real family_id from the build's login). Placeholders `<FAM>` = the logged-in parent's family_id, `<CHILD>` = a child in it.

### S1 — Paying user NOT blocked
- **DB:** a Founding family (or `UPDATE profiles SET premium_until = now()+interval '30 days' WHERE family_id='<FAM>' AND role='parent';`)
- **Do:** open Parent → Insights.
- **Expect:** a coach insight renders (no paywall, no error). ✅ = payer safe.

### S2 — Free user IS gated (the conversion state)
- **DB:** `UPDATE profiles SET premium_until=NULL, is_lifetime_access=false, is_lifetime_founding=false WHERE family_id='<FAM>' AND role='parent'; UPDATE families SET trial_started_at=now()-interval '30 days' WHERE id='<FAM>';`
- **Do:** open the dashboard.
- **Expect (Android/real device):** insight card shows the **teaser** + "🔒 Unlock your personal AI coach" strip; tapping → Paywall. Opening Insights + pressing generate → **no insight** (402 → premium message). ✅ = leak closed.

### S3 — Activation lights the trial
- **DB reset:** `UPDATE families SET trial_started_at=NULL WHERE id='<FAM>'; UPDATE profiles SET premium_until=NULL WHERE family_id='<FAM>' AND role='parent'; DELETE FROM daily_progress WHERE family_id='<FAM>';` (⚠ test family only)
- **Do:** as the child, complete a task **today**, then complete one **on a second date** (or CC inserts a 2nd-date completed row). 
- **Expect:** parent's `premium_until` turns on (≈14d) and the dashboard card shows the **"✨ AI coaching active"** ribbon. ✅ = trial starts on activation.

### S4 — Lazy auto-generate
- **DB:** entitled/trial family (S1 or S3 state) with **≥2 active days** and **no** saved smart insight: `UPDATE child_insights SET smart_insight=NULL WHERE child_id='<CHILD>';`
- **Do:** open Parent → Insights (don't press generate).
- **Expect:** the coach insight **auto-generates once** (spinner → insight). Re-opening does NOT regenerate. ✅ = option-A wow.

**Cleanup:** restore the test family's real entitlement after; `DELETE FROM daily_progress WHERE date IN ('2019-01-01','2019-02-02')` if any test rows leaked (none should — all prior tests rolled back).

---

## 4. Remaining work (additive, non-blocking)

- **Phase C (referral):** apply after redesigning for reusable multi-referral codes + reconciling with `pkg/referral-share-and-tracking`. Draft in `migrations/038_DRAFT_*.sql`.
- **Phase E rest:** pre-expiry FCM push (needs fanout + cron), funnel instrumentation (needs events approach), task-specific paywall copy.
- **Phase D polish:** "warming-up" state (trial active, <3 days data), surface the LLM insight text on the dashboard card itself, most-recently-active child pick.

## 5. Billing dependency (⚠ before monthly/yearly RC billing goes live)
`rc-webhook` only reflects Founding-lifetime today. Before monthly/yearly subs launch, it MUST write active subs into `premium_until`, or the Phase A gate will 402 real monthly payers. (Add to the billing session.)
