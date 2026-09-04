-- 059_notify_parent_on_teen_task.sql
--
-- pkg/teen-autonomy Increment 1.6 — notify the parent(s) when a teen self-authors
-- a task. Mirrors the shipped child_suggestion notification trigger
-- (docs/sessions/child-suggest/migration.sql:73-104) but fans out ONE row per
-- family parent (like parent_sos, migrations/011) so co-parents are covered.
--
-- The inserted notifications row is picked up by:
--   • the in-app bell (realtime on notifications), classified INFO (FYI), and
--   • the push DB-webhook → push-notification-fanout Edge Function, which sends
--     Android (Expo) + Web (VAPID) push. type must be registered there too.
--
-- NOT YET APPLIED TO PRODUCTION — for review. Grounded in live checks
-- (buff-production, 2026-09-04): notifications columns = (family_id, parent_id,
-- type, child_id, child_name, entity_id, entity_name, is_read); profiles.role
-- uses 'parent'/'child'. Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

create or replace function public.notify_parents_on_teen_task()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_child_name text;
  v_parent     record;
begin
  -- Only teen self-authored tasks (created via the teen create flow). A parent's
  -- normal insert leaves created_by_child = false and never notifies.
  if NEW.created_by_child is not true then
    return NEW;
  end if;

  select display_name into v_child_name
    from public.profiles
   where id = NEW.assigned_to;

  -- One notification per parent in the family (co-parent coverage).
  for v_parent in
    select id from public.profiles
     where family_id = NEW.family_id and role = 'parent'
  loop
    insert into public.notifications
      (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
    values
      (NEW.family_id, v_parent.id, 'teen_task_added', NEW.assigned_to,
       coalesce(v_child_name, ''), NEW.id, coalesce(NEW.title, ''), false);
  end loop;

  return NEW;
end;
$function$;

drop trigger if exists trg_notify_parents_on_teen_task on public.tasks;
create trigger trg_notify_parents_on_teen_task
  after insert on public.tasks
  for each row execute function public.notify_parents_on_teen_task();

commit;

-- ─── Rollback (manual) ───────────────────────────────────────────────────────
-- drop trigger if exists trg_notify_parents_on_teen_task on public.tasks;
-- drop function if exists public.notify_parents_on_teen_task();
