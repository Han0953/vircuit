begin;

create table public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null,
  replay_operation_ids uuid[] not null default '{}' check (cardinality(replay_operation_ids) <= 256),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (length(course_id) between 1 and 100),
  lesson_id text not null check (length(lesson_id) between 1 and 100),
  challenge_id text not null check (length(challenge_id) between 1 and 100),
  challenge_version integer not null check (challenge_version > 0),
  evaluator_version text not null check (length(evaluator_version) between 1 and 40),
  engine_version text not null check (length(engine_version) between 1 and 40),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  summary jsonb not null check (jsonb_typeof(summary) = 'object' and octet_length(summary::text) <= 32768),
  passed boolean not null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, operation_id),
  unique (user_id, challenge_id, challenge_version, evaluator_version, engine_version, fingerprint),
  unique (id, user_id, lesson_id)
);
create index challenge_attempts_user_created on public.challenge_attempts(user_id, created_at desc);
create index challenge_attempts_project on public.challenge_attempts(project_id) where project_id is not null;

create table public.learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (length(course_id) between 1 and 100),
  lesson_id text not null check (length(lesson_id) between 1 and 100),
  status text not null check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  completion_source text check (completion_source in ('manual', 'challenge')),
  verified_attempt_id uuid,
  primary key (user_id, lesson_id),
  foreign key (verified_attempt_id, user_id, lesson_id) references public.challenge_attempts(id, user_id, lesson_id),
  check ((status = 'in_progress' and completed_at is null and completion_source is null and verified_attempt_id is null)
    or (status = 'completed' and completed_at is not null and completion_source is not null
      and ((completion_source = 'manual' and verified_attempt_id is null) or (completion_source = 'challenge' and verified_attempt_id is not null))))
);
create index learning_progress_user_activity on public.learning_progress(user_id, last_activity_at desc);
create index learning_progress_verified_attempt on public.learning_progress(verified_attempt_id) where verified_attempt_id is not null;

alter table public.learning_progress enable row level security;
alter table public.challenge_attempts enable row level security;
revoke all on public.learning_progress, public.challenge_attempts from public, anon, authenticated;
grant select on public.learning_progress, public.challenge_attempts to authenticated;
create policy learning_progress_read_own on public.learning_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy challenge_attempts_read_own on public.challenge_attempts for select to authenticated using ((select auth.uid()) = user_id);

create function public.record_learning_event(p_user_id uuid, p_course_id text, p_lesson_id text, p_complete boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.learning_progress;
begin
  if p_user_id is null or p_course_id is null or p_lesson_id is null or p_complete is null then
    raise exception 'Invalid learning event' using errcode = '22023';
  end if;
  if p_complete and p_lesson_id <> 'lesson.tegangan-ground' then
    raise exception 'Verified challenge required' using errcode = '22023';
  end if;
  insert into public.learning_progress(user_id, course_id, lesson_id, status, completed_at, completion_source)
    values(p_user_id, p_course_id, p_lesson_id, case when p_complete then 'completed' else 'in_progress' end,
      case when p_complete then now() end, case when p_complete then 'manual' end)
  on conflict (user_id, lesson_id) do update set
    last_activity_at = now(),
    status = case when excluded.status = 'completed' then 'completed' else learning_progress.status end,
    completed_at = coalesce(learning_progress.completed_at, excluded.completed_at),
    completion_source = coalesce(learning_progress.completion_source, excluded.completion_source)
  returning * into result;
  return to_jsonb(result);
end;
$$;

create function public.record_challenge_attempt(
  p_user_id uuid, p_operation_id uuid, p_course_id text, p_lesson_id text, p_challenge_id text,
  p_challenge_version integer, p_evaluator_version text, p_engine_version text, p_fingerprint text,
  p_summary jsonb, p_passed boolean, p_project_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.challenge_attempts;
begin
  if p_user_id is null or p_operation_id is null then raise exception 'Invalid submission' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select * into result from public.challenge_attempts where user_id = p_user_id and (operation_id = p_operation_id or p_operation_id = any(replay_operation_ids));
  if found then
    if result.fingerprint <> p_fingerprint or result.challenge_id <> p_challenge_id
      or result.challenge_version <> p_challenge_version or result.evaluator_version <> p_evaluator_version or result.engine_version <> p_engine_version then
      raise exception 'Operation conflict' using errcode = '40001';
    end if;
    return to_jsonb(result);
  end if;
  if p_project_id is not null and not exists (select 1 from public.projects where id = p_project_id and user_id = p_user_id) then
    raise exception 'Project not found' using errcode = '42501';
  end if;
  select * into result from public.challenge_attempts where user_id = p_user_id and challenge_id = p_challenge_id
    and challenge_version = p_challenge_version and evaluator_version = p_evaluator_version
    and engine_version = p_engine_version and fingerprint = p_fingerprint;
  if found then
    if cardinality(result.replay_operation_ids) >= 256 then raise exception 'Too many attempts' using errcode = 'P0001'; end if;
    update public.challenge_attempts set replay_operation_ids = array_append(replay_operation_ids, p_operation_id) where id = result.id returning * into result;
    update public.learning_progress set last_activity_at = now() where user_id = p_user_id and lesson_id = p_lesson_id;
    return to_jsonb(result);
  end if;
  if (select count(*) from public.challenge_attempts where user_id = p_user_id and created_at > now() - interval '1 hour') >= 120 then
    raise exception 'Too many attempts' using errcode = 'P0001';
  end if;
  insert into public.challenge_attempts(user_id, operation_id, course_id, lesson_id, challenge_id, challenge_version,
    evaluator_version, engine_version, fingerprint, summary, passed, project_id)
  values(p_user_id, p_operation_id, p_course_id, p_lesson_id, p_challenge_id, p_challenge_version,
    p_evaluator_version, p_engine_version, p_fingerprint, p_summary, p_passed, p_project_id) returning * into result;
  insert into public.learning_progress(user_id, course_id, lesson_id, status, completed_at, completion_source, verified_attempt_id)
  values(p_user_id, p_course_id, p_lesson_id, case when p_passed then 'completed' else 'in_progress' end,
    case when p_passed then now() end, case when p_passed then 'challenge' end, case when p_passed then result.id end)
  on conflict (user_id, lesson_id) do update set
    last_activity_at = now(),
    status = case when p_passed then 'completed' else learning_progress.status end,
    completed_at = coalesce(learning_progress.completed_at, excluded.completed_at),
    completion_source = coalesce(learning_progress.completion_source, excluded.completion_source),
    verified_attempt_id = coalesce(learning_progress.verified_attempt_id, excluded.verified_attempt_id);
  return to_jsonb(result);
end;
$$;

revoke all on function public.record_learning_event(uuid,text,text,boolean) from public, anon, authenticated;
revoke all on function public.record_challenge_attempt(uuid,uuid,text,text,text,integer,text,text,text,jsonb,boolean,uuid) from public, anon, authenticated;
grant execute on function public.record_learning_event(uuid,text,text,boolean) to service_role;
grant execute on function public.record_challenge_attempt(uuid,uuid,text,text,text,integer,text,text,text,jsonb,boolean,uuid) to service_role;
commit;
