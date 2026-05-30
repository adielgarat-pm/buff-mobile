-- pkg/money-conversion-reward — applied to mobile DB (gfrongfnyigxsexuofrg) 2026-05-30
-- Migration name: add_cash_value_to_store_rewards
--
-- Cash-conversion reward: the parent-set money amount a child can redeem their
-- BUFFs for. Currency is NOT stored — it is rendered from the device locale at
-- runtime (see src/lib/currency.ts). NULL for all non-cash rewards.

alter table public.store_rewards
  add column if not exists cash_value numeric;

comment on column public.store_rewards.cash_value is
  'Cash amount (currency-agnostic) for BUFFs->money conversion rewards. NULL for normal rewards. Rendered with device locale currency symbol.';
