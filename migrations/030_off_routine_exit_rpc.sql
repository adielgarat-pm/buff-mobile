-- 030: Off-Routine exit cleanup RPC (permanent fix for the off-routine leak).
--
-- Toggling Off-Routine OFF previously only nulled profiles.off_routine_until,
-- leaving the child's is_off_routine task rows alive as orphans. Those orphans
-- then leaked into parent task views (today summaries + Yesterday Recap) as
-- phantom uncompleted tasks — a FALSE failure signal on a normal day.
--
-- This RPC makes exit ATOMIC: in one transaction it (1) deletes the child's
-- off-routine task rows and (2) clears off_routine_until. Re-entry re-seeds via
-- the existing idempotent ensureOffRoutineTasks, so no behavior is lost.
--
-- SECURITY DEFINER so the cleanup is never blocked by the own-device-child RLS
-- gap (a parent cannot directly UPDATE/DELETE rows for a child who owns a device
-- — see INTEGRATION_LEARNINGS "EditChild RLS"). Guarded: the caller must be a
-- parent in the SAME family as the target child, else it raises insufficient_privilege.
--
-- Pairs with the one-time data cleanup in `cleanup_orphaned_off_routine_tasks`
-- (fix/off-routine-orphan-cleanup, #241): that removed the 19 historical orphans;
-- this prevents any new orphan from ever being created.

create or replace function public.exit_off_routine(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Authorize: caller must be a parent of this child's family.
  if not exists (
    select 1
    from public.profiles caller
    join public.profiles child on child.family_id = caller.family_id
    where caller.user_id = auth.uid()
      and caller.role    = 'parent'
      and child.id       = p_child_id
      and child.role     = 'child'
  ) then
    raise exception 'exit_off_routine: caller is not a parent of child %', p_child_id
      using errcode = '42501';  -- insufficient_privilege
  end if;

  delete from public.tasks
   where assigned_to    = p_child_id
     and is_off_routine = true;

  update public.profiles
     set off_routine_until = null
   where id = p_child_id;
end;
$$;

grant execute on function public.exit_off_routine(uuid) to authenticated;
