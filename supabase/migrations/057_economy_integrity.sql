-- 057_economy_integrity.sql
--
-- Pre-launch economy-integrity hardening. Bundles audit items H1 + L9 + M6.
-- See docs/PRE_LAUNCH_GAP_RESOLUTION_PLAN.md §H1/§M6/§L9.
--
-- NOT YET APPLIED TO PRODUCTION — for review. Grounded in live read-only checks
-- against buff-production (2026-08-31): of 48 redemptions, 6 have
-- credits_spent <> credits_needed and 0 involve cash_value (i.e. legitimate
-- parent price-edits, NOT cash conversion), and 0 are negative. So the fix must
-- NOT reject a stored mismatch — it makes the SERVER the sole price authority.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- H1 — the reward economy must never trust a client-supplied amount.
-- Today useRewardRedemptions inserts credits_spent from the client; the INSERT
-- policy checks only family_id; approve_reward_redemption deducts the stored
-- value verbatim; the column has no CHECK. A crafted request can buy cheap or,
-- with a negative value, MINT balance on approve. Fix = three layers, all
-- keyed on store_rewards, never the client.
-- L9 — the same INSERT trusts a client child_id, so a child can file a
-- redemption for a sibling. Bind child_id server-side for child callers.
-- M6 — the +5 self-care Instant Buff has no server-side per-day idempotency, so
-- reopening the app re-credits it. Add a one-shot flag on child_vibes + an
-- atomic award RPC (credit_vault is a running balance with no ledger to
-- enforce uniqueness against, so the flag is the right mechanism).
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ─── H1.1 — non-negative guard (0 negatives today, so no backfill needed) ────
alter table public.reward_redemptions
  drop constraint if exists chk_credits_spent_nonneg;
alter table public.reward_redemptions
  add constraint chk_credits_spent_nonneg check (credits_spent >= 0);

-- ─── H1.2 + L9 — BEFORE INSERT trigger: server stamps the price and the child ─
-- Makes the client-supplied credits_spent and child_id advisory only.
create or replace function public.reward_redemptions_stamp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller_id   uuid;
  v_caller_role text;
  v_caller_fam  uuid;
  v_reward_fam  uuid;
  v_cost        integer;
begin
  -- Resolve the caller (the child requesting, or a parent).
  select id, role, family_id
    into v_caller_id, v_caller_role, v_caller_fam
    from profiles
   where user_id = auth.uid()
   limit 1;

  -- The reward is the single source of truth for price + family.
  select family_id, credits_needed
    into v_reward_fam, v_cost
    from public.store_rewards
   where id = NEW.reward_id;
  if v_reward_fam is null then
    raise exception 'reward_not_found' using errcode = 'P0002';
  end if;

  -- Family integrity: the redemption's family must be the reward's family.
  NEW.family_id := v_reward_fam;
  if v_caller_fam is not null and v_caller_fam is distinct from v_reward_fam then
    raise exception 'wrong_family' using errcode = 'P0001';
  end if;

  -- L9 — a child may only request for THEMSELVES; never a sibling. Parents keep
  -- the provided child_id (they act on behalf of a child in-family).
  if v_caller_role = 'child' then
    NEW.child_id := v_caller_id;
  end if;

  -- H1 — the price is the reward's current credits_needed at request time, never
  -- the client integer. (credits_needed is parent-controlled; see also cash
  -- rewards, which carry a real credits_needed anchor and are unaffected.)
  NEW.credits_spent := greatest(0, coalesce(v_cost, 0));

  return NEW;
end;
$function$;

drop trigger if exists trg_reward_redemptions_stamp on public.reward_redemptions;
create trigger trg_reward_redemptions_stamp
  before insert on public.reward_redemptions
  for each row execute function public.reward_redemptions_stamp();

-- ─── H1.3 — approve re-reads the LIVE price and deducts THAT ──────────────────
-- Decision (founder, 2026-08-31): when a parent edited a reward's price while a
-- request was open, approve charges the CURRENT price. credits_spent remains the
-- truthful request-time record; the deduction and funds check use the live cost.
create or replace function public.approve_reward_redemption(p_redemption_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller_id    uuid;
  v_caller_fam   uuid;
  v_red          public.reward_redemptions%rowtype;
  v_vault_id     uuid;
  v_balance      integer;
  v_cost         integer;
  v_child_name   text;
begin
  -- Caller must be a parent.
  select id, family_id into v_caller_id, v_caller_fam
    from profiles
   where user_id = auth.uid() and role = 'parent'
   limit 1;
  if v_caller_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_a_parent');
  end if;

  -- Lock the redemption row.
  select * into v_red from public.reward_redemptions
   where id = p_redemption_id
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_red.family_id <> v_caller_fam then
    return jsonb_build_object('ok', false, 'error', 'wrong_family');
  end if;
  if v_red.status not in ('requested','discussing') then
    return jsonb_build_object('ok', false, 'error', 'invalid_state');
  end if;

  -- Re-read the LIVE reward price — the authority, never the stored value.
  select credits_needed into v_cost
    from public.store_rewards where id = v_red.reward_id;
  if v_cost is null then
    return jsonb_build_object('ok', false, 'error', 'reward_gone');
  end if;

  -- Lock the child's vault and verify funds against the live cost.
  select id, total_balance into v_vault_id, v_balance
    from public.credit_vault
   where family_id = v_red.family_id and child_id = v_red.child_id
   for update;
  if v_vault_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_vault');
  end if;
  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'error', 'insufficient_funds',
                              'balance', v_balance, 'needed', v_cost);
  end if;

  -- Deduct the live cost + mark approved (single transaction).
  update public.credit_vault
     set total_balance = total_balance - v_cost,
         updated_at    = now()
   where id = v_vault_id;

  update public.reward_redemptions
     set status = 'approved', resolved_at = now(), resolved_by = v_caller_id
   where id = p_redemption_id;

  -- Notify the child.
  select display_name into v_child_name from profiles where id = v_red.child_id;
  insert into notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
  values (v_red.family_id, v_caller_id, 'reward_approved', v_red.child_id,
          coalesce(v_child_name, ''), v_red.reward_id, coalesce(v_red.reward_title, ''), false);

  return jsonb_build_object('ok', true, 'new_balance', v_balance - v_cost);
end;
$function$;

grant execute on function public.approve_reward_redemption(uuid) to authenticated, anon;

-- ─── M6 — Instant Buff: one-shot flag + atomic, idempotent award RPC ──────────
alter table public.child_vibes
  add column if not exists instant_buff_awarded boolean not null default false;

-- Awards the +5 self-care micro-reward AT MOST ONCE per child per local day.
-- The amount is fixed server-side (never client-supplied). p_date is the child's
-- LOCAL day key (YYYY-MM-DD) — the same key the client writes the vibe row under
-- (see src/lib/dayKey.ts). Idempotent: a second call the same day is a no-op.
create or replace function public.award_instant_buff(p_child_id uuid, p_date text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor_id   uuid;
  v_actor_role text;
  v_actor_fam  uuid;
  v_child_fam  uuid;
  v_amount     integer := 5;   -- INSTANT_BUFF_AMOUNT — fixed server-side
  v_vibe_id    uuid;
  v_awarded    boolean;
  v_new        integer;
begin
  -- Authorize: the child themselves, or a parent in the same family.
  select id, role, family_id into v_actor_id, v_actor_role, v_actor_fam
    from profiles where user_id = auth.uid() limit 1;
  if v_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_actor');
  end if;
  select family_id into v_child_fam from profiles where id = p_child_id;
  if v_child_fam is null then
    return jsonb_build_object('ok', false, 'error', 'no_child');
  end if;
  if v_actor_fam is distinct from v_child_fam then
    return jsonb_build_object('ok', false, 'error', 'wrong_family');
  end if;
  if v_actor_role <> 'parent' and v_actor_id <> p_child_id then
    return jsonb_build_object('ok', false, 'error', 'not_authorized');
  end if;

  -- Lock today's vibe row (a vibe must exist — the card only shows on a low day).
  select id, instant_buff_awarded into v_vibe_id, v_awarded
    from public.child_vibes
   where child_id = p_child_id and date = p_date
   order by created_at desc
   limit 1
   for update;
  if v_vibe_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_vibe_today');
  end if;
  if v_awarded then
    -- Idempotent: already granted today. Return current balance, credit nothing.
    select total_balance into v_new from public.credit_vault
      where family_id = v_child_fam and child_id = p_child_id;
    return jsonb_build_object('ok', true, 'already_awarded', true,
                              'new_balance', coalesce(v_new, 0));
  end if;

  -- Flip the flag AND credit, atomically.
  update public.child_vibes set instant_buff_awarded = true where id = v_vibe_id;

  insert into public.credit_vault (family_id, child_id, total_balance, updated_at)
  values (v_child_fam, p_child_id, greatest(0, v_amount), now())
  on conflict (family_id, coalesce(child_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set total_balance = greatest(0, credit_vault.total_balance + v_amount),
                updated_at    = now()
  returning total_balance into v_new;

  return jsonb_build_object('ok', true, 'already_awarded', false, 'new_balance', v_new);
end;
$function$;

grant execute on function public.award_instant_buff(uuid, text) to authenticated;

commit;

-- ─── Rollback (manual) ───────────────────────────────────────────────────────
-- drop trigger if exists trg_reward_redemptions_stamp on public.reward_redemptions;
-- drop function if exists public.reward_redemptions_stamp();
-- drop function if exists public.award_instant_buff(uuid, text);
-- alter table public.reward_redemptions drop constraint if exists chk_credits_spent_nonneg;
-- alter table public.child_vibes drop column if exists instant_buff_awarded;
-- (and restore the prior approve_reward_redemption body from migration 019.)
