-- 058_tasks_child_authored.sql
--
-- pkg/teen-autonomy — Phase 1. Lets a TEEN self-author their own tasks directly
-- (live, no parent approval), while keeping the BUFFs economy parent-governed.
-- Mirrors the child-authored write pattern of migrations/027_activities_child_authored.sql
-- and the server-stamp economy pattern of supabase/migrations/057_economy_integrity.sql.
--
-- NOT YET APPLIED TO PRODUCTION — for review. Grounded in live read-only checks
-- against buff-production (2026-09-01):
--   • public.tasks: RLS ENABLED (not forced).
--   • Existing policies: "Parents can manage tasks" (ALL, parent+family),
--     "Children can view their tasks" (SELECT, family + assigned_to = own profile),
--     plus parent/admin SELECT. There is NO child write policy today — this adds it.
--   • authenticated already holds INSERT/UPDATE/DELETE grants on tasks (no GRANT needed).
--   • public.get_my_family_id() exists (uuid). profiles.role uses 'parent'/'child'.
--   • tasks.credits is NOT NULL default 10 — so a plain child insert would bank 10
--     BUFFs. The stamp trigger below forces child-authored credits to 0 (the parent
--     sets the real value later). Keyed on the CALLER's role, so a later parent
--     UPDATE of credits is NOT overwritten.
--
-- The base tasks RLS is Lovable-era and lives outside this repo, so this migration
-- is PURELY ADDITIVE: it only DROP ... IF EXISTS the new policies it owns, and never
-- touches the base parent/child policies above.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ─── Provenance column ───────────────────────────────────────────────────────
-- Distinct from proposed_by_child (which means "promoted from a child_suggestions
-- proposal, set by the PARENT on approval"). created_by_child = the teen authored
-- this task row directly.
alter table public.tasks
  add column if not exists created_by_child boolean not null default false;

-- ─── Child write policies (own rows only) ────────────────────────────────────
-- A teen may only INSERT/UPDATE/DELETE tasks that are their OWN (assigned_to =
-- their profile) and flagged created_by_child. They can never touch a
-- parent-assigned task or a sibling's task. The client UX additionally gates
-- these affordances to the teen age band, but RLS is the real boundary.
drop policy if exists "Children can add their own tasks"    on public.tasks;
drop policy if exists "Children can update their own tasks" on public.tasks;
drop policy if exists "Children can delete their own tasks" on public.tasks;

create policy "Children can add their own tasks"
  on public.tasks
  for insert
  with check (
    family_id = public.get_my_family_id()
    and created_by_child = true
    and assigned_to = (
      select id from public.profiles where user_id = auth.uid() limit 1
    )
  );

create policy "Children can update their own tasks"
  on public.tasks
  for update
  using (
    family_id = public.get_my_family_id()
    and created_by_child = true
    and assigned_to = (
      select id from public.profiles where user_id = auth.uid() limit 1
    )
  )
  with check (
    family_id = public.get_my_family_id()
    and created_by_child = true
    and assigned_to = (
      select id from public.profiles where user_id = auth.uid() limit 1
    )
  );

create policy "Children can delete their own tasks"
  on public.tasks
  for delete
  using (
    family_id = public.get_my_family_id()
    and created_by_child = true
    and assigned_to = (
      select id from public.profiles where user_id = auth.uid() limit 1
    )
  );

-- ─── Economy stamp: the teen never sets BUFFs (parent governs value) ──────────
-- BEFORE INSERT OR UPDATE. When the CALLER is a child, force credits := 0 (the
-- governed default). Keyed on caller role, not on the row flag, so that when a
-- PARENT later prices the task, their value is preserved. A crafted child insert
-- that supplies credits is therefore neutralized server-side.
--
-- Phase 4 swap point: replace `0` with a parent per-task cap
--   (e.g. least(NEW.credits, <family cap>)) — one expression, no client change.
create or replace function public.tasks_stamp_child_economy()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller_role text;
begin
  select role into v_caller_role
    from profiles
   where user_id = auth.uid()
   limit 1;

  if v_caller_role = 'child' then
    NEW.credits := 0;   -- governed default; parent assigns the real value later
  end if;

  return NEW;
end;
$function$;

drop trigger if exists trg_tasks_stamp_child_economy on public.tasks;
create trigger trg_tasks_stamp_child_economy
  before insert or update on public.tasks
  for each row execute function public.tasks_stamp_child_economy();

commit;

-- ─── Rollback (manual) ───────────────────────────────────────────────────────
-- drop trigger if exists trg_tasks_stamp_child_economy on public.tasks;
-- drop function if exists public.tasks_stamp_child_economy();
-- drop policy if exists "Children can add their own tasks"    on public.tasks;
-- drop policy if exists "Children can update their own tasks" on public.tasks;
-- drop policy if exists "Children can delete their own tasks" on public.tasks;
-- alter table public.tasks drop column if exists created_by_child;
