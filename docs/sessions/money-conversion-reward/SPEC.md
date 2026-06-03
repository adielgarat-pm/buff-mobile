# SPEC — pkg/money-conversion-reward

**Target state:** A money-motivated child of **any age** can earn a parent-confirmed
**"Convert BUFFs → cash"** reward. The BUFF cost is anchored to **5 weekdays × 70%** of the
child's own daily BUFFs (pocket-money pace, deliberately high so cash stays cheap for the
parent). The cash amount is parent-set and **currency-agnostic** — the symbol is rendered
from the device locale, never stored. Closes IN-2026-05-29-03 (a/b/c).

## Why this shape
Per Adi (2026-05-29 / 2026-05-30): *"a store reward that converts BUFFs to cash, each at
their own rate by country"*; *"suggest to the parent 750 BUFFs = 50 cash"*; *"5 days × 70%
of the child's daily BUFFs — like pocket money."* Older kids want autonomy over how they
spend/save (pocket-money top-up, saving toward something big) → Pillar 3.

Real money is the **most extrinsic reward** in BUFF (Pillar 1), so it is **never
auto-seeded**: the cash reward was removed from `REWARD_PICKS` and is only created when a
parent deliberately confirms the suggestion.

## Behaviour contract

1. **Motivator (b)** — new `money` motivator in `MOTIVATORS`
   (`onboarding.mot.moneyEarning` = "Earning & saving money" / "להרוויח ולחסוך כסף"),
   selectable in UStep4 like any other (max-2 unchanged). `MONEY_MOTIVATOR_ID` exported.

2. **Cost anchor (c)** — `MONEY_REWARD_DAYS = 5` in `onboardingConfig`;
   `calcMoneyRewardCredits(dailyBuffs) = round(0.7 × dailyBuffs × 5)`. `dailyBuffs` is the
   sum of the child's active `tasks.credits` (fallback `DEFAULT_TASKS_COUNT × DEFAULT_BUFF_VALUE`
   = 60 when the child has no tasks). The illustrative "750" assumes a higher-earning kid;
   the **formula** is the spec.

3. **Reachable at any age (a)** — `MONEY_CONVERSION_REWARD` is a standalone template
   (**not** in `REWARD_PICKS`). It surfaces as a **suggested quick-add card** on
   `ParentRewardsScreen`, shown only when the selected child's
   `pro_settings.onboarding_data.motivators` includes `money` **and** no cash reward exists
   yet for that child. No age gate.

4. **Cash storage** — new nullable `store_rewards.cash_value numeric` (NULL for all normal
   rewards). **No currency column** — `getCurrencySymbol()` (expo-localization
   `getLocales()[0].currencySymbol`, fallback `₪`) renders the symbol at display time.

5. **Parent flow** — tapping the suggestion opens the existing add-reward modal in
   **cash mode**: title is the fixed bilingual concept (read-only), size hidden, BUFF cost
   prefilled to the 5-day anchor (editable), plus a **cash-amount field** (locale symbol) and
   a live `{credits} BUFFs = {symbol}{amount}` preview. Saving inserts a bilingual-titled
   row with `cash_value` set. The cash badge (`= {symbol}{amount}`) shows on the parent card.

6. **Child surface** — `ChildRewardsScreen` (Mint) and `GamerRewardsScreen` show the cash
   value with the locale symbol so the child sees the real savings goal. Redemption path
   unchanged (parent fulfils manually, as with every reward).

## Decisions (confirmed by Adi)
- **5 days × 70%** of the child's daily BUFFs (not 7). *(Adi, 2026-05-30.)*
- **Never auto-seeded** — parent-confirmed suggestion only (Pillar 1). *(CC surfaced, Adi approved.)*
- **Currency-agnostic** — render from device locale, store no currency. *(Adi: "generic, don't get complicated.")*
- **`cash_value` column** on `store_rewards` (mobile DB, no prod users). *(Adi approved schema.)*
- **Suggestion gated on the child's `money` motivator** — don't push cash to non-money kids. *(CC, Pillar 1.)*

## Capability Check
- **CC did:** migration (mobile DB), config + onboardingData (motivator, calc, template),
  currency helper, parent suggestion + cash-mode modal, both child themes, i18n (both
  locales), typecheck / jest (271 pass) / i18n:check, docs.
- **Adi must do (Hat-4):** run on a real device/emulator (auth-gated) — onboard a child with
  the **money** motivator; on Parent → Rewards the cash suggestion appears; set an amount;
  confirm; child sees `⚡ = {symbol}{amount}` in both Gamer and Mint shops.
- **Bottleneck:** parent/child screens are auth-gated → no headless runtime check here; web
  render is unreliable for theme-gated child screens (project precedent).

## Values Check (9 questions — passes; verified against implemented behaviour)
**Pillar 1 — Intrinsic Motivation**
1. Want it without a virtual reward? — It's real cash for a real-life goal the child chose. ✅
2. Closer to a child-chosen reward? — Gated on the child's own money motivation;
   parent-confirmed; **never an auto-seeded default**. ✅
3. "Want" vs "must"? — Opt-in savings goal; deliberately-high cost keeps it a real bridge,
   not an everyday loop. ✅

**Pillar 2 — Positive Coaching**
1. Demeaning / comparison / failure framing? — No; the badge just states the deal. ✅
2. On "can't afford yet", empathy vs pressure? — Reuses the existing safe-harbour "keep
   going" copy; BUFFs are never lost. ✅
3. BUDDY suffering / loss / anger? — None. ✅

**Pillar 3 — Independence-Building**
1. More capable without the app? — Builds saving / money-management habits (esp. older kids). ✅
2. Child has a voice? — Gated on the child's stated motivator; child redeems by choice. ✅
3. Necessary in 6 months? — A scaffold toward real-world money habits; fades like others. ✅

## Out of scope (flagged, untouched)
- Automated cash payout — the reward is parent-fulfilled manually, like every reward.
- Per-family stored currency / FX — locale symbol only; no currency column.
- Onboarding auto-insert of the cash reward — deliberately excluded (Pillar 1).
- `pr_4` (old "Convert BUFFs to money", privileges×15-18) replaced by non-cash `pr_5`
  ("Pick the weekend plan") so nothing auto-seeds cash.
