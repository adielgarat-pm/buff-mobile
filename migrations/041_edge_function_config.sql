-- 041_edge_function_config.sql  (pkg/import-extract-equipment)
--
-- Runtime config for Edge Functions so prompt/model tuning is a DB edit,
-- NOT a redeploy (Adi's D-IE-3, 2026-07-07). The parse-schedule function
-- reads its model + optional prompt override per mode from the
-- 'parse_schedule' row using the service-role key. Anything not present in
-- the row falls back to the function's baked-in defaults, so a DB problem
-- (missing row / unreachable) can never break schedule import.
--
-- Config holds PROMPTS/MODELS ONLY (no secrets). RLS denies all client
-- access; the service role (used only server-side by the function)
-- bypasses RLS.

create table if not exists public.edge_function_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.edge_function_config enable row level security;
-- No policies → no anon/authenticated access. Service role bypasses RLS.
revoke all on public.edge_function_config from anon, authenticated;

-- Seed the parse-schedule config. `models` picks the model per mode;
-- `prompts` is an OVERRIDE map — leave a mode out to use the function's
-- baked-in default prompt, or set e.g.
--   update public.edge_function_config
--     set value = jsonb_set(value, '{prompts,image}', '"<new prompt>"'),
--         updated_at = now()
--   where key = 'parse_schedule';
-- to tune extraction live, without a redeploy.
insert into public.edge_function_config (key, value)
values (
  'parse_schedule',
  jsonb_build_object(
    'models', jsonb_build_object(
      'image', 'claude-sonnet-4-6',
      'text',  'claude-haiku-4-5-20251001',
      'excel', 'claude-haiku-4-5-20251001'
    ),
    'prompts', '{}'::jsonb
  )
)
on conflict (key) do nothing;
