-- Only the Auth + Project Persistence domain. No learning/payment tables.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draft_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 200),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, draft_id)
);
create index projects_owner_updated_idx on public.projects(user_id, updated_at desc);
create table public.project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revision integer not null check (revision > 0),
  operation_id uuid not null,
  schema_version integer not null check (schema_version = 1),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2000000 and payload->>'schemaVersion' = '1'),
  created_at timestamptz not null default now(),
  unique (project_id, revision), unique (project_id, operation_id)
);
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_snapshots enable row level security;
revoke all on public.profiles, public.projects, public.project_snapshots from public, anon, authenticated;
grant select on public.profiles, public.projects, public.project_snapshots to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy projects_read on public.projects for select to authenticated using (user_id = (select auth.uid()));
create policy snapshots_read on public.project_snapshots for select to authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
);
-- Writes are restricted to the RPCs below. No direct client UPDATE/INSERT/DELETE
-- grant: ownership and revision cannot be bypassed through the Data API.
create function public.save_project(p_project_id uuid, p_draft_id uuid, p_expected_revision integer, p_operation_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  item public.projects%rowtype;
  prior public.project_snapshots%rowtype;
  next_revision integer;
  project_title text := btrim(p_payload #>> '{metadata,name}');
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_draft_id is null or p_operation_id is null or p_expected_revision is null or p_expected_revision < 0
    or p_payload is null or jsonb_typeof(p_payload) <> 'object' or p_payload->>'schemaVersion' is distinct from '1'
    or project_title is null or length(project_title) not between 1 and 200 or octet_length(p_payload::text) > 2000000
    or jsonb_typeof(p_payload->'components') is distinct from 'array'
    or jsonb_typeof(p_payload->'wires') is distinct from 'array'
    or jsonb_typeof(p_payload->'code') is distinct from 'object'
    or jsonb_typeof(p_payload->'settings') is distinct from 'object'
    or jsonb_typeof(p_payload->'viewport') is distinct from 'object'
    or jsonb_typeof(p_payload->'metadata') is distinct from 'object'
    or jsonb_typeof(p_payload #> '{metadata,name}') is distinct from 'string'
    or jsonb_typeof(p_payload #> '{code,source}') is distinct from 'string'
    or p_payload #>> '{code,language}' is distinct from 'arduino-cpp-subset'
    or jsonb_typeof(p_payload #> '{viewport,x}') is distinct from 'number'
    or jsonb_typeof(p_payload #> '{viewport,y}') is distinct from 'number'
    or jsonb_typeof(p_payload #> '{viewport,zoom}') is distinct from 'number'
    or not (p_payload->'settings' ? 'boardId')
    or jsonb_typeof(p_payload #> '{settings,boardId}') not in ('string','null')
    then raise exception 'Invalid project' using errcode = '22023'; end if;
  if (p_payload #>> '{viewport,x}')::numeric not between -100000 and 100000
    or (p_payload #>> '{viewport,y}')::numeric not between -100000 and 100000
    or (p_payload #>> '{viewport,zoom}')::numeric not between 0.25 and 4
    then raise exception 'Invalid viewport' using errcode = '22023'; end if;
  if jsonb_array_length(p_payload->'components') > 100 or jsonb_array_length(p_payload->'wires') > 500
    or length(p_payload #>> '{code,source}') > 20000 then raise exception 'Project limit exceeded' using errcode = '22023'; end if;
  if p_project_id is null then
    if p_expected_revision <> 0 then raise exception 'Revision conflict' using errcode = '40001'; end if;
    insert into public.profiles(id) values(owner_id) on conflict(id) do nothing;
    insert into public.projects(user_id, draft_id, title) values(owner_id, p_draft_id, project_title)
      on conflict(user_id, draft_id) do nothing;
    select * into item from public.projects where user_id = owner_id and draft_id = p_draft_id for update;
  else
    select * into item from public.projects where id = p_project_id and user_id = owner_id for update;
  end if;
  if item.id is null then raise exception 'Project not found' using errcode = '42501'; end if;
  select * into prior from public.project_snapshots where project_id = item.id and operation_id = p_operation_id;
  if prior.id is not null then
    if prior.payload <> p_payload then raise exception 'Operation payload changed' using errcode = '22023'; end if;
    return jsonb_build_object('id', item.id, 'revision', prior.revision);
  end if;
  if item.revision <> p_expected_revision then raise exception 'Revision conflict' using errcode = '40001'; end if;
  next_revision := item.revision + 1;
  insert into public.project_snapshots(project_id, revision, operation_id, schema_version, payload)
    values(item.id, next_revision, p_operation_id, 1, p_payload);
  update public.projects set title = project_title, revision = next_revision, updated_at = now() where id = item.id;
  return jsonb_build_object('id', item.id, 'revision', next_revision);
end;
$$;
create function public.delete_project(p_project_id uuid, p_expected_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare item public.projects%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into item from public.projects where id = p_project_id and user_id = auth.uid() for update;
  if item.id is null then raise exception 'Project not found' using errcode = '42501'; end if;
  if p_expected_revision is null or item.revision <> p_expected_revision then raise exception 'Revision conflict' using errcode = '40001'; end if;
  delete from public.projects where id = item.id;
end;
$$;
revoke all on function public.save_project(uuid,uuid,integer,uuid,jsonb), public.delete_project(uuid,integer) from public, anon;
grant execute on function public.save_project(uuid,uuid,integer,uuid,jsonb), public.delete_project(uuid,integer) to authenticated;
commit;
