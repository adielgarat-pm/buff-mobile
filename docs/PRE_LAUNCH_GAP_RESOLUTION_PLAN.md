# BUFF — Pre-Launch Gap Resolution Plan (multi-lens)

> Companion to `docs/PRE_LAUNCH_BUG_AUDIT_2026-08-30.md` and `docs/PRE_LAUNCH_HIGH_FIX_SPECS.md`.
> Every remaining gap (H1, H2, M1–M8, L1–L11) was run through **five expert lenses — Architect, UX, UI, PM, Marketing** — and grounded with **live read-only checks against the production Supabase**. This doc is the synthesized recommendation: the best resolution per gap, why, the alternatives rejected, effort/delivery, a test plan, and the exact decisions only Adi can make.
>
> **Already shipped this cycle (excluded):** C1, H5 (#451), H3, H4 (#452).
> **Status legend:** 🟢 client/OTA · 🔴 Supabase schema/RPC (needs approval) · 🧭 needs a founder decision first.

---

## 0. Live production-DB findings (these resolve three open questions)

Read-only queries against `buff-production` (`gfrongfnyigxsexuofrg`), 2026-08-31:

| Question | Finding | Consequence |
|---|---|---|
| **M8** — are `daily_progress` / `credit_vault` in the realtime publication? | `supabase_realtime` contains **only `tasks`** (of the loop tables). `daily_progress`, `credit_vault`, `child_vibes` are **absent**. | M8 is **CONFIRMED, not Suspected** — the parent dashboard's realtime subscriptions never fire. |
| **H1** — is there a legitimate path where `credits_spent ≠ credits_needed`? | Of 48 redemptions: **6 mismatches, 0 negatives, 0 involving `cash_value`.** | The mismatches are **parents editing a reward's price after the child requested** — NOT cash conversion. A naive `credits_spent == credits_needed` check at approve would **wrongly reject 6 real redemptions**. |
| **H1** — how are cash-conversion rewards modelled? | `store_rewards` has a nullable **`cash_value`** column (no `kind`/`type`). Cash rewards still carry a real `credits_needed`. **0 cash rewards redeemed to date.** | Cash rewards are safe under a server-authoritative price; the fix keys off the reward row, not a `kind` flag. |

**These reshape the H1 fix** (see H1 below): the answer is a *server-authoritative price*, not an equality check.

---

## 1. Headline recommendation — stage the launch (PM + Marketing converge)

Do **not** treat launch as one big-bang. Recommended:

1. **Soft-launch now** (Android + Founding-100 early cohort, framed as insider/co-creation). The product is stable: no launch crash, green suite, core daily loop already fixed (C1/H5), parent counts fixed (H3), iOS dead-end fixed (H4).
2. **Before the massive paid push** — ship the **Economy-integrity migration** (H1 + M6 + L9) and, if web is in the acquisition funnel, the **web-parity batch** (M4/M5/L1).
3. **Before/with the Founding-100 paid sell** — ship **M3 + M7** (don't sell lifetime Insights that are broken or never unlock for some).
4. **Gate the massive push on H2** (child-impersonation hardening) — at scale, more circulating family codes = higher odds of a child-safety story. It's the one risk scale itself amplifies.

Two store-copy softenings to do **today**, regardless of fix timing: avoid "safe/private child accounts" (until H2) and "works on web, Android & iOS" (until M4/M5); lead instead with the now-true "honest streaks & accurate progress" (C1/H5) message.

---

## 2. Per-gap resolutions

Each gap: **Recommend** (the call) · **Why** (multi-lens) · **Rejected** (alternatives) · **Deliver/Effort** · **Tests** · **Decision** (if any).

---

### 🔴🧭 H1 — Reward economy: make the price server-authoritative
**Recommend.** Three-layer, keyed on the reward row, never the client:
1. **`BEFORE INSERT` trigger** on `reward_redemptions` that sets `credits_spent := store_rewards.credits_needed` (and forces `child_id` to the caller's own profile for child callers — this folds in **L9**).
2. **`CHECK (credits_spent >= 0)`** (belt-and-suspenders).
3. **`approve_reward_redemption` re-reads** `store_rewards.credits_needed` and deducts *that* (→ `reward_gone` if deleted), so the funds check and deduction use the live server price.

**Why.**
- *Architect + live DB:* the client integer becomes non-load-bearing at both write and approve time. The production data (6 price-edit mismatches, 0 cash, 0 negatives) proves a naive equality check would reject legitimate redemptions — so we **drop the equality check** the earlier SPEC proposed and re-read the live price instead.
- *UX:* honest users see nothing change. The only new surface is the rare price-changed path — frame it to the child as "the reward's price changed, it's back in your shop," never a red "denied," and never claw back a reward the child already saw.
- *PM/Marketing:* protects the Intrinsic-Motivation pillar and kills the "my kid cheated the rewards" review. The `CHECK`+trigger half has **zero false-positive risk → ship it before the massive push**.

**Rejected.** Equality check at approve (rejects the 6 real price-edits); RLS `WITH CHECK` equality on insert (awkward subquery, still trusts stored value later); keeping the client value with only an RPC guard (leaves negative values at rest + `child_id` spoof).

**Deliver/Effort.** 🔴 Supabase migration (`supabase/migrations/057+`) + one client error branch. **S–M.** Not OTA. Backfill: normalize any open (`requested`/`discussing`) rows before adding the CHECK.

**Tests.** Staging: happy path deducts exactly `credits_needed`; forged low value → trigger normalizes → real cost deducted; negative → rejected by CHECK; **cash reward (`cash_value` set) still approves** (the key non-breakage test); price edited mid-request → approves at live price; insufficient funds unchanged. Keep `purchaseService.test.ts` green.

**Decision.** When a parent edits a reward's price while a request is open, approve at the **live** price (recommended) or the **locked** request-time price? Confirm `store_rewards.credits_needed` is only ever written by parents.

---

### 🔴🧭 H2 — Child session hardening (retire the guessable password)
**Recommend.** Server-minted sessions via a `child-signin` **Edge Function** (service-role, never shipped to client): verify family code owns the child → mint a session with the Admin API; one-time rotate every child auth user to a random server-owned password; keep `legacyChildCreds` only as a **dual-read** fallback during migration. **Retire `stableChildCreds`.** Per-child PIN = **optional, deferred**.

**Why.**
- *Architect:* removes the guessable credential entirely; Edge Functions already exist in the repo. Dual-read + lazy rotation avoids locking kids out.
- *UX:* keep the "tap your face" pick-from-list exactly as-is (Independence pillar). A mandatory PIN on a 6-year-old's daily login is a friction tax the core loop can't afford — defer it; if added, it needs a frictionless parent reset and gentle, unlimited retries, never a shaming lockout.
- *PM/Marketing:* this is a **child-safety/privacy** exposure — frame the decision to Adi as *privacy*, not effort. Scale multiplies the risk; gate the massive push on it. Once shipped it's a positive "we hardened how kids sign in" trust beat.

**Rejected.** Add salt/entropy to the derived password (salt must reach the client → same leak); PIN-only while keeping the derived password (underlying credential still guessable via the auth API).

**Deliver/Effort.** 🔴 Edge Function + migration + client swap; **L — standalone package, never bundled.** Fast-follow with dual-read.

**Tests.** Edge Function (valid → session; wrong code → 401; wrong PIN → 401; cross-family → 403); burner-family migration dry-run (every existing child still logs in); keep `childAuth.test.ts`, `authStorage.test.ts`, `RoleSelectionScreen.test.tsx` green; device sign-in/out/re-sign-in.

**Decision.** Launch-blocker or fast-follow? (rec: fast-follow, but a conscious written risk-acceptance on a children's-privacy exposure.) Ship the per-child PIN now or later? (rec: later.) Can `list_family_children` drop its `anon` grant once the Edge Function mediates?

---

### 🟢 M1 — Birthday off-by-one on native
**Recommend.** Normalize the **native** `BirthdayField` to emit **UTC-midnight** (`new Date(Date.UTC(y, m, d))`) so it matches the already-fixed web sibling; the consumer's `toISOString()` then reads the picked day on both platforms. Audit `EditChild` for the same pattern.

**Why.** *Architect/UI:* the real bug is two platform-split files with **divergent value contracts** behind one prop shape (native=local-midnight, web=UTC-midnight). Normalizing native to the web convention is the smaller, lower-risk delta and keeps one serialization path. *UX:* thin surface (age_group drives logic), but a wrong stored birthday is a data-trust paper cut for a privacy-forward brand — worth fixing.

**Rejected.** Switch the consumer to local getters (fixes native, **breaks web**). Symmetric "make web local" variant (UTC-midnight is the safer canonical + matches shipped web fix).

**Deliver/Effort.** 🟢 OTA, no migration. **S.** Existing wrong DOBs not auto-corrected (low impact) — founder may opt to skip backfill.

**Tests.** Unit: native `onChange` yields UTC-midnight for a local pick; round-trip a picked date to the same ISO day under simulated `TZ=UTC+2` and `TZ=UTC-5`. Device: pick on the Israel emulator, confirm stored `birth_date`.

---

### 🟢🧭 M2 — Reward pricing ignores real task count
**Recommend.** Swap both `UStep5_Preview` call sites from `calcRewardCreditsDefault(size)` to the existing-but-unused `calcRewardCredits(tasks, size)` (sums the child's actual generated task BUFFs). The generated `tasks` are already in scope.

**Why.** *Architect:* one-line ×2 swap; the correct helper and its input already exist; default helper stays only as the genuine fallback. *UX (most consequential design lever in the batch):* the felt contract is "N good days → the reward." Under-pricing (current) cheapens the currency; over-pricing (the 1-task fallback, ~3×) is a **motivation-killer/shame vector** for an ADHD child ("I work and it never moves"). Scaling to the child's real daily BUFFs makes "7-day reward ≈ 7 days" true for every child. *PM:* don't redesign the economy — just the helper swap; the *number philosophy* is Adi's call.

**Rejected.** Tune `DEFAULT_TASKS_COUNT` to the generator average (still an approximation that drifts with config).

**Deliver/Effort.** 🟢 OTA, affects newly-seeded rewards only. **S** (design sign-off is the gate).

**Tests.** Unit: `calcRewardCredits([5 tasks], size)` vs default diverge as expected; snapshot seeded costs for a known task set; onboarding save tests stay green.

**Decision.** **Pricing philosophy:** should reward prices scale with the child's actual daily BUFF earning power (rec), or stay a fixed tier? (Dynamic means two kids can see different prices for the "same" reward — a one-line "priced to ~N good days" note in the parent editor pre-empts confusion.)

---

### 🟢🧭 M3 — Insights unlock keyed on profile age
**Recommend.** Gate on **history, from one signal**: have `useParentInsights` expose `hasEnoughData` (presence of `daily_progress` in the window, or ≥K distinct completion-days), and set `showLockedInsights = !hasEnoughData` in `ParentDashboardScreen`. Delete the `created_at` arithmetic. Do this **together with M7** (same hook).

**Why.** *Architect:* lock and content then read the same query → can never disagree. *UX/PM:* a seeded/re-linked child with real history but a fresh `created_at` shows "unlock after 3 days" forever — a permanent false-locked state right at the paid surface; a refund driver for Founding-100. *Marketing:* don't sell Insights that some paying parents can never see.

**Rejected.** Gate on `usePetState` streak (a second source that can diverge from what the insights query found); OR-in "has progress" with created_at (still two signals).

**Deliver/Effort.** 🟢 OTA. **S.**

**Tests.** Unit `hasEnoughData` (0 rows → locked; ≥threshold → unlocked regardless of `created_at`); fresh-`created_at`-with-progress fixture unlocks.

**Decision.** Minimum bar — any `daily_progress` row, or ≥K distinct days (statistical floor)?

---

### 🟢 M4 — Child "Add Activity" date/time picker dead on web
**Recommend.** Replace the inline `@react-native-community/datetimepicker` blocks with the existing `.web`-split **`DateField` + `TimeField`** components (`minimumDate = today`; keep the screen's local-getter `toISODate`). Delete the raw picker import.

**Why.** *Architect/UI:* reuse the established split-component pattern rather than forking a whole `ChildAddActivityScreen.web.tsx` that would drift; native unchanged, web gains real `<input type=date/time>`. *UX:* a silent dead control is the worst failure for an ADHD child (tap → nothing → assumes personal failure → disengages); this is a child-agency (Independence) moment. *UI decision:* `DateField`/`TimeField` hard-code the **parent** palette, so inside a Gamer-themed child screen they'll look off — Option A (accept Mint pickers, ship) vs Option B (add color-override props). Rec A for launch.

**Rejected.** New `.web` screen file (240 lines to keep in lockstep); inline `<input>` branch (reinvents the split components).

**Deliver/Effort.** 🟢 OTA. **S.**

**Tests.** Web render: date/time inputs mount and populate `date`/`time`; `canSave` flips true after a web date pick; native unchanged.

**Decision (UI, minor).** Accept Mint-colored pickers inside a Gamer child screen for MVP (A), or add theme-override props (B)?

---

### 🟢 M5 — Notification "Open settings" throws on web
**Recommend.** Hide the whole denied-permission banner on web: add `&& Platform.OS !== 'web'` to `showDeniedBanner`. Batch with **L1**.

**Why.** *Architect/UI/UX:* the banner is a native concept — browsers have no deep-linkable app-settings; `Linking.openSettings()` doesn't exist on RN-Web → TypeError + dead CTA. Guarding only the tap leaves a button that does nothing (worse). If a web re-enable affordance is wanted later, replace it with copy ("enable notifications in your browser's site settings") behind a web branch — not for launch.

**Rejected.** `try/catch` the `onPress` (dead button remains).

**Deliver/Effort.** 🟢 OTA. **S.**

**Tests.** Render with `Platform.OS='web'` + `permission='denied'` → banner absent; native still renders it.

---

### 🔴🧭 M6 — Instant Buff (+5) farmable
**Recommend.** Server-side per-day idempotency mirroring the SOS one-shot: add `child_vibes.instant_buff_awarded` (bool, default false) + a single `award_instant_buff(child_id)` RPC that, in one txn, locks today's row, returns `already_awarded` if set, else sets the flag **and** credits +5. The client's `awarded` state becomes pure UX; the card computes its hidden state from `todayVibe.instant_buff_awarded` on mount (no flicker-return after reload).

**Why.** *Architect:* reuses the existing one-shot pattern on `child_vibes` (`parent_sos_sent`, `vibe_shared_with_parent`); `credit_vault` is a running balance with no per-event ledger to enforce uniqueness against, so the flag is the right mechanism. *UX (key call):* make the limit **silent** — the card simply doesn't return that day; no "already claimed," no counter. An explicit limit reframes a wellness nudge as a chore the child is failing to maximize (anti-Pillar-1). Never claw back the +5 on a duplicate-after-optimistic-hide. *PM/Marketing:* protects the "no grinding" claim (which M6 currently contradicts in code).

**Rejected.** Reason-scoped uniqueness (no ledger table exists); client-only AsyncStorage flag (not authoritative; cleared on reinstall; web/native diverge).

**Deliver/Effort.** 🔴 additive column + RPC; **S–M.** Ship RPC first (harmless), then client swap; the farm persists in the gap (low severity).

**Tests.** RPC: first call credits +5 + sets flag; second same-day → `already_awarded`, balance unchanged; new day → one more. Client: card stays hidden after reload when flag set. Keep vibe/low-power tests green.

**Decision.** Confirm silent-limit UX (rec). Confirm `credit_vault` has no per-event ledger (affects design). Add `child_vibes` to realtime? (ties to M8).

---

### 🟢 M7 — Insight completion-rate math (>100%)
**Recommend.** Denominator = **days the task was actually scheduled** in the 7-day window, via the shared `isTaskVisibleOn` rule (the same single source H3 now uses): `rate = scheduledDays>0 ? completed/scheduledDays*100 : null` (exclude never-scheduled tasks). Add a **UI clamp to ≤100%** at the render site as belt-and-suspenders. Do with **M3** (same hook).

**Why.** *Architect:* fixes the hardcoded `/5`-over-7 that yields 140% and the Mondays-only-task "failing" artifact; reuses `taskScheduling.ts`. *UX/PM/Marketing:* ">100%" instantly discredits the paid Insights surface and drives the wrong attention/positive-streak cards → the parent coaches on false data (Positive-Coaching-by-proxy failure). *UI:* the giant "140%" on the hero card is the most visible symptom — clamp guarantees a parent never sees a nonsensical number even if math regresses.

**Rejected.** Just widen `/5`→`/7` (still mis-rates non-daily tasks); read a precomputed rate from `child_insights` (the pg_cron may share the same bug — see decision).

**Deliver/Effort.** 🟢 OTA (client). **S–M.** +S server-side **if** the pg_cron `child_insights` job shares the `/5` logic.

**Tests.** Unit: daily 7/7 → 100% (not 140%); Monday-only done its Monday → 100%; never-scheduled → excluded; the `>=70%` hero decision against fixtures.

**Decision.** Does the pg_cron that writes `child_insights` use the same `/5` denominator? If so it needs the same fix + a re-run, or the cached framing stays wrong.

---

### 🟢🔴🧭 M8 — Stale dashboard on focus + dead realtime (CONFIRMED)
**Recommend.** Two parts:
- **Now (🟢 OTA):** extend the dashboard `useFocusEffect` to also call `refetch()` + `refetchInsights()` (the set pull-to-refresh already runs), guarding the mount double-fetch. Closes stale-on-focus on both platforms.
- **Deliberate (🔴 schema):** `ALTER PUBLICATION supabase_realtime ADD TABLE daily_progress, credit_vault` (and `child_vibes` for M6/vibe) so the **already-written** subscriptions light up — after a write-volume/quota check. RLS already scopes events per family.

**Why.** *Live DB + Architect:* confirmed only `tasks` is published; `daily_progress`/`credit_vault` subscriptions never fire. *UX:* stale counts make a parent nudge a child who already did their tasks → unfair pressure, child feels unseen (Positive-Coaching hazard). Realtime is the right UX for a parent watching a child complete tasks; the focus-refetch is the immediate safety net.

**Rejected.** Focus-refetch only, leave realtime dead (screen stays stale between focuses); polling (battery/quota).

**Deliver/Effort.** Focus fix **S** (OTA); publication **S** (migration, after quota check).

**Tests.** Focus fix: navigate away/back → `refetch`/`refetchInsights` called. Publication: staging subscribe → insert a `daily_progress` row → dashboard channel receives it. Device: child completes on A → parent B updates without pull-to-refresh.

**Decision.** Enable the realtime publication (quota headroom OK?) or ship focus-refetch only? Add `child_vibes` too?

---

### L1–L11 — cleanup (one OTA PR, except L3/L9)
| ID | Recommend | Deliver | Effort |
|---|---|---|---|
| **L1** | web-guard `useKidLocalNotifications` (early-return on web) — **batch with M5** | 🟢 OTA | S |
| **L2** | convert the flagged `.title.en/.he` literals to the sanctioned accessor, **then** wire the i18n guards into `ci.yml` | 🟢 OTA | S–M |
| **L3** | fold progress-upsert + credit into one atomic RPC (TOCTOU). Sequential single-device is already safe → **defer** unless concurrency observed | 🔴 | M |
| **L4** | fix onboarding progress denominator so the last step reads N/N at 100%; check RTL bar-fill origin | 🟢 OTA | S |
| **L5** | surface "these two cover the same skill" at pick time (or remap to distinct domains) — no silent no-op | 🟢 OTA | S |
| **L6** | prefer the engine's Hebrew variant on EN→HE retitle collisions | 🟢 OTA | S |
| **L7** | `navigation.replace` the loader → forward-only (no frozen back-dest) | 🟢 OTA | S |
| **L8** | add a non-`theme_color` fallback so the L3 gift modal always advances; **device-test day-10** | 🟢 OTA | S |
| **L9** | force `child_id` server-side for child callers — **fold into the H1 trigger** | 🔴 (with H1) | S |
| **L10** | route Paywall Privacy/Terms through `openExternalUrl` (Play-compliance edge) | 🟢 OTA | S |
| **L11** | add the `_one` plural variant (en + he dual form) — proactive for M2's dynamic prices | 🟢 OTA | S |

*Marketing note:* pull **L4 + L11** forward despite "Low" — they live in the onboarding first-impression window where a never-completing bar or "1 BUFFs" reads as amateur to a parent deciding whether to trust the app with their kid.

---

## 3. Recommended batching into shippable drops

| Drop | Contents | Delivery | Gate |
|---|---|---|---|
| **A — Economy integrity** | H1 (trigger + CHECK + RPC re-read) **+ L9** · M6 (column + RPC) | 🔴 migration `supabase/migrations/057+` | Supabase approval; ship H1 CHECK/trigger first (zero-risk) |
| **B — Onboarding & pricing** | M2 · M3 · M1 · L4 · L11 | 🟢 OTA | M2 pricing decision |
| **C — Web parity** | M4 · M5 · L1 · L10 | 🟢 OTA | only if web is an acquisition target → pre-push |
| **D — Parent insights accuracy** | M7 · M8 focus-refetch | 🟢 OTA | — |
| **E — Realtime + cleanup** | M8 publication (after quota) · L2 (+CI wiring) · L5 · L6 · L7 · L8 | mixed | quota check; L8 device test |
| **F — Child auth hardening** | H2 (Edge Function + rotation, dual-read) | 🔴 standalone | conscious risk-acceptance |

Keep server drops (A, F, E-publication) **separate** from OTA drops so an OTA rollback never touches the DB and vice-versa.

---

## 4. The decisions only Adi can make (consolidated)

1. **Staged launch** — hold the *massive paid push* until H2 ships? (PM+Mktg rec: yes; soft-launch now.)
2. **H1** — approve the migration; and on a mid-request price edit, charge **live** price (rec) or locked price?
3. **H1 authority** — confirm `store_rewards.credits_needed` is only ever written by parents.
4. **M2** — reward-pricing philosophy: scale with the child's real daily BUFFs (rec) or fixed tier?
5. **M6** — approve the schema; confirm the **silent** limit UX (rec).
6. **M8** — enable the realtime publication (quota OK?) or focus-refetch only?
7. **H2** — launch-blocker or fast-follow (rec: fast-follow, conscious privacy risk-acceptance); PIN now or later (rec: later).
8. **Migration tree** — confirm `supabase/migrations/` (057+) is the tree `db push`/CI applies (repo has two).
9. **M3** — insights-unlock threshold: any progress row, or ≥K distinct days?
10. **M7 server** — does the pg_cron `child_insights` job share the `/5` bug (needs the same fix + re-run)?
11. **M4 (UI, minor)** — Mint-colored pickers inside a Gamer child screen for MVP, or add theme-override props?

**Answering #2, #6, and the M6 ledger question unblocks the most work.**

---

## 5. SPEC-review — completeness matrix

Each resolution checked against: root cause anchored (code + live DB) · multi-lens (Arch/UX/UI/PM/Mktg) · platform parity · Values Check · delivery (OTA vs schema) · rollback · regression + new tests · open decision surfaced.

| Gap | Anchored | Multi-lens | Parity | Values | Rollback | Tests | Decision surfaced |
|---|---|---|---|---|---|---|---|
| **H1** | ✅ code + **live DB** | A/UX/PM/Mktg | ✅ server | Pillar 1 | ✅ keep old RPC in migration | ✅ (cash-reward guard) | ✅ live-vs-locked price |
| **H2** | ✅ | A/UX/PM/Mktg | ✅ | Pillar 2/3 | ⚠️ dual-read | ✅ | ✅ blocker? PIN? |
| **M1** | ✅ | A/UI/UX | ✅ (contract unified) | — | ✅ | ✅ TZ round-trip | none |
| **M2** | ✅ | A/UX/PM | ✅ | Pillar 1 | ✅ | ✅ | ✅ pricing philosophy |
| **M3** | ✅ | A/UX/PM/Mktg | ✅ | Pillar 2 | ✅ | ✅ | ✅ threshold |
| **M4** | ✅ | A/UI/UX | ✅ (the fix) | Pillar 3 | ✅ | ✅ | ✅ theme A/B |
| **M5** | ✅ | A/UI/UX | ✅ | — | ✅ | ✅ | none |
| **M6** | ✅ | A/UX/PM | ✅ | Pillar 1 | ✅ | ✅ | ✅ silent UX + ledger |
| **M7** | ✅ | A/UI/UX/PM | ✅ | Pillar 2 | ✅ | ✅ | ✅ cron parity |
| **M8** | ✅ code + **live DB** | A/UX | ✅ | Pillar 2 | ✅ | ✅ | ✅ publication vs focus-only |
| **L1–L11** | ✅ | A/UX/UI | ✅ | mixed | ✅ | per-item | L5 design; L8 device test |

**Values-check summary:** Pillar 1 (Intrinsic Motivation) — H1, M2, M6 keep the currency real; getting M2's *number* wrong is the subtle risk. Pillar 2 (Positive Coaching / child safety) — H2 (impersonation), M3/M7/M8 (accurate parent signal so nudges are fair), L9 (protect the child's data). Pillar 3 (Independence) — H2 must keep pick-from-list frictionless; M4 restores a child-agency action. **No recommended fix adds pressure/shame to a child**, provided M6 stays silent and error paths never claw back a reward the child already saw.

**Owed by a real device (Hat-3/4), gate final sign-off (can't run in cloud):** C1/H5 on a US-Pacific emulator; M1 stored DOB; M8 realtime end-to-end; L8 buddy day-10 gift; plus Google OAuth + push.

---

*Synthesized from five parallel expert reviews (Architect, UX, UI, PM, Marketing) + live read-only production-DB checks. No product code changed in producing this plan; H1/H2/M6/M8-publication require founder approval before any schema/RPC change.*
