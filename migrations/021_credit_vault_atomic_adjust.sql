-- 021_credit_vault_atomic_adjust.sql
--
-- Atomic credit_vault balance adjustment.
--
-- Replaces the client-side read-modify-write of total_balance that lived in
-- useChildProgress.updateTotalBalance, useDailyVibe (Instant Buff),
-- LowPowerContext (+5 self-care) and ParentDashboard (bonus). Those each did
-- SELECT total_balance → compute → UPDATE, which races: two concurrent credits
-- (e.g. a kid completing tasks fast, or parent bonus + child completion at once)
-- both read the same old value and the second write clobbers the first, silently
-- losing BUFFs. This was the root of the recurring balance-drift reports
-- (Emi's BUFFs not dropping, Alon showing 0). One server-side UPDATE is atomic.
--
-- Authorization mirrors the existing credit_vault RLS: caller must be in the
-- child's family AND be either a parent or the child themselves. SECURITY
-- DEFINER (like approve_reward_redemption) so the single UPDATE runs without
-- the read-modify-write window, but family_id is derived from the child's
-- profile server-side, never trusted from the client.
--
-- Deductions floor at 0 (matching the old Math.max(0, ...) semantics). Reward
-- redemption keeps its own RPC (approve_reward_redemption) with an
-- insufficient-funds guard; this function is for task credits, bonuses and
-- self-care/instant-buff increments. p_reason is reserved for a future ledger.

create or replace function public.adjust_credit_vault(
  p_child_id uuid,
  p_delta    integer,
  p_reason   text default null
)
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
  v_new        integer;
begin
  -- Identify the caller.
  select id, role, family_id
    into v_actor_id, v_actor_role, v_actor_fam
    from profiles
   where user_id = auth.uid()
   limit 1;
  if v_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_actor');
  end if;

  -- The child's family is authoritative — never trust a client-supplied family.
  select family_id into v_child_fam from profiles where id = p_child_id;
  if v_child_fam is null then
    return jsonb_build_object('ok', false, 'error', 'no_child');
  end if;

  -- Same family, AND (caller is a parent OR caller is the child themselves).
  if v_actor_fam is distinct from v_child_fam then
    return jsonb_build_object('ok', false, 'error', 'wrong_family');
  end if;
  if v_actor_role <> 'parent' and v_actor_id <> p_child_id then
    return jsonb_build_object('ok', false, 'error', 'not_authorized');
  end if;

  -- Atomic upsert. ON CONFLICT targets the existing partial-unique expression
  -- index credit_vault_family_child_unique, locking the row for the update so
  -- concurrent adjustments serialize instead of clobbering each other.
  insert into credit_vault (family_id, child_id, total_balance, updated_at)
  values (v_child_fam, p_child_id, greatest(0, p_delta), now())
  on conflict (family_id, coalesce(child_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set total_balance = greatest(0, credit_vault.total_balance + p_delta),
                updated_at    = now()
  returning total_balance into v_new;

  return jsonb_build_object('ok', true, 'new_balance', v_new);
end;
$function$;

grant execute on function public.adjust_credit_vault(uuid, integer, text) to authenticated;
