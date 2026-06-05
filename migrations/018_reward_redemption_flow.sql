-- 018_reward_redemption_flow.sql
-- pkg/reward-redemption
--
-- Child requests to redeem an existing reward → parent approves → atomic deduct.
-- Rewards are REPEATABLE: redemption lives in this ledger, NOT on the reward row
-- (store_rewards.is_redeemed is left untouched = catalog archive flag only).
--
-- Philosophy (BUFF_VALUES Pillar 2, mirror of child_suggestions): there is NO
-- decline. A parent says "yes, let's do it" (→ approved, points deducted) or
-- "let's talk about it" (→ discussing; stays open, points untouched). A child
-- may withdraw their own request.
--
-- The deduction goes through a SECURITY DEFINER RPC that locks the vault row and
-- checks funds atomically — children only have SELECT on credit_vault, and the
-- balance must never be mutated non-atomically (the BUFF credit-model fragility).

-- ─── 1. Ledger: one row per redemption request / event ──────────────────────
create table if not exists public.reward_redemptions (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null,
  child_id      uuid not null,
  reward_id     uuid not null references public.store_rewards(id) on delete cascade,
  reward_title  text not null default '',
  credits_spent integer not null,
  status        text not null default 'requested'
                  check (status in ('requested','discussing','approved','withdrawn')),
  requested_at  timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid,
  created_at    timestamptz not null default now()
);

create index if not exists idx_reward_redemptions_family_status on public.reward_redemptions(family_id, status);
create index if not exists idx_reward_redemptions_child_status  on public.reward_redemptions(child_id, status);
create index if not exists idx_reward_redemptions_reward        on public.reward_redemptions(reward_id);

-- At most ONE open (requested/discussing) redemption per reward at a time.
-- After approved/withdrawn the reward is free to be requested again (repeatable).
create unique index if not exists uq_reward_redemptions_open_per_reward
  on public.reward_redemptions(reward_id)
  where status in ('requested','discussing');

-- ─── 2. RLS (mirrors child_suggestions) ─────────────────────────────────────
alter table public.reward_redemptions enable row level security;

create policy "Family members can create redemption requests"
  on public.reward_redemptions for insert
  with check (family_id = get_my_family_id());

create policy "Children can view their redemptions"
  on public.reward_redemptions for select
  using (family_id = get_my_family_id()
         and child_id = (select id from profiles where user_id = auth.uid() limit 1));

create policy "Parents can view family redemptions"
  on public.reward_redemptions for select
  using (family_id = get_my_family_id()
         and exists (select 1 from profiles where user_id = auth.uid() and role = 'parent'));

create policy "Children can withdraw their redemptions"
  on public.reward_redemptions for update
  using (family_id = get_my_family_id()
         and child_id = (select id from profiles where user_id = auth.uid() limit 1))
  with check (status = 'withdrawn');

create policy "Parents can resolve redemptions"
  on public.reward_redemptions for update
  using (family_id = get_my_family_id()
         and exists (select 1 from profiles where user_id = auth.uid() and role = 'parent'))
  with check (family_id = get_my_family_id()
         and exists (select 1 from profiles where user_id = auth.uid() and role = 'parent'));

-- ─── 3. Notify the parent on a new request ──────────────────────────────────
-- Mirrors notify_parent_on_child_suggestion. The notifications INSERT triggers
-- push_notification_fanout_on_insert → Expo push to the parent.
create or replace function public.notify_parent_on_redemption_request()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_child_name text;
  v_parent_id  uuid;
begin
  if NEW.status = 'requested' then
    select display_name into v_child_name from profiles where id = NEW.child_id;
    select id into v_parent_id
      from profiles
     where family_id = NEW.family_id and role = 'parent'
     limit 1;
    if v_parent_id is not null then
      insert into notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
      values (NEW.family_id, v_parent_id, 'reward_redemption_requested', NEW.child_id,
              coalesce(v_child_name, ''), NEW.reward_id, coalesce(NEW.reward_title, ''), false);
    end if;
  end if;
  return NEW;
end;
$function$;

create trigger trg_notify_redemption_request
  after insert on public.reward_redemptions
  for each row execute function public.notify_parent_on_redemption_request();

-- ─── 4. Atomic approval RPC ─────────────────────────────────────────────────
-- Parent-only. Locks the redemption + vault rows, verifies funds, deducts,
-- marks approved, and notifies the child (reward_approved → push fanout).
-- Returns jsonb { ok, new_balance } or { ok:false, error }.
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

  -- Lock the child's vault and verify funds.
  select id, total_balance into v_vault_id, v_balance
    from public.credit_vault
   where family_id = v_red.family_id and child_id = v_red.child_id
   for update;
  if v_vault_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_vault');
  end if;
  if v_balance < v_red.credits_spent then
    return jsonb_build_object('ok', false, 'error', 'insufficient_funds',
                              'balance', v_balance, 'needed', v_red.credits_spent);
  end if;

  -- Deduct + mark approved (single transaction).
  update public.credit_vault
     set total_balance = total_balance - v_red.credits_spent
   where id = v_vault_id;

  update public.reward_redemptions
     set status = 'approved', resolved_at = now(), resolved_by = v_caller_id
   where id = p_redemption_id;

  -- Notify the child.
  select display_name into v_child_name from profiles where id = v_red.child_id;
  insert into notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
  values (v_red.family_id, v_caller_id, 'reward_approved', v_red.child_id,
          coalesce(v_child_name, ''), v_red.reward_id, coalesce(v_red.reward_title, ''), false);

  return jsonb_build_object('ok', true, 'new_balance', v_balance - v_red.credits_spent);
end;
$function$;

grant execute on function public.approve_reward_redemption(uuid) to authenticated, anon;
