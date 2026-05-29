-- pkg/child-suggest — applied to the mobile Supabase project (gfrongfnyigxsexuofrg)
-- on 2026-05-29 via the Supabase MCP (migration name: create_child_suggestions).
-- Recorded here for the PR; the repo does not track a supabase/migrations tree.

create table public.child_suggestions (
  id                uuid primary key default gen_random_uuid(),
  family_id         uuid not null references public.families(id),
  child_id          uuid not null references public.profiles(id),
  kind              text not null check (kind in ('task','reward')),
  title             text not null,
  emoji             text,
  status            text not null default 'pending'
                      check (status in ('pending','discussing','approved','withdrawn')),
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  resolved_by       uuid references public.profiles(id),
  created_entity_id uuid
);

create index child_suggestions_family_status_idx
  on public.child_suggestions (family_id, status);
create index child_suggestions_child_idx
  on public.child_suggestions (child_id);

alter table public.child_suggestions enable row level security;

create policy "Family members can create suggestions"
  on public.child_suggestions for insert
  with check (family_id = get_my_family_id());

create policy "Parents can view family suggestions"
  on public.child_suggestions for select
  using (
    family_id = get_my_family_id()
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.role = 'parent'
    )
  );

create policy "Children can view their suggestions"
  on public.child_suggestions for select
  using (
    family_id = get_my_family_id()
    and child_id = (select id from profiles where user_id = auth.uid() limit 1)
  );

create policy "Parents can resolve suggestions"
  on public.child_suggestions for update
  using (
    family_id = get_my_family_id()
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.role = 'parent'
    )
  )
  with check (
    family_id = get_my_family_id()
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid() and profiles.role = 'parent'
    )
  );

create policy "Children can withdraw their suggestions"
  on public.child_suggestions for update
  using (
    family_id = get_my_family_id()
    and child_id = (select id from profiles where user_id = auth.uid() limit 1)
  )
  with check (status = 'withdrawn');

create or replace function public.notify_parent_on_child_suggestion()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_child_name text;
  v_parent_id  uuid;
begin
  if NEW.status = 'pending' then
    select display_name into v_child_name from profiles where id = NEW.child_id;

    select id into v_parent_id
    from profiles
    where family_id = NEW.family_id and role = 'parent'
    limit 1;

    if v_parent_id is not null then
      insert into notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
      values (NEW.family_id, v_parent_id, 'child_suggestion', NEW.child_id, coalesce(v_child_name, ''), NEW.id, coalesce(NEW.title, ''), false);
    end if;
  end if;

  return NEW;
end;
$function$;

create trigger trg_notify_parent_on_child_suggestion
  after insert on public.child_suggestions
  for each row
  execute function public.notify_parent_on_child_suggestion();
