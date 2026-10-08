begin;

-- Operational usage only: no prompts, code, circuit snapshots, or responses.
create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  mode text not null check (mode in ('tutor', 'debugger', 'project-assistant')),
  created_at timestamptz not null default now(),
  lease_until timestamptz not null,
  finished_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'ok', 'error', 'canceled')),
  model_category text check (model_category in ('FAST', 'SMART')),
  tokens integer check (tokens >= 0),
  latency_ms integer check (latency_ms >= 0),
  primary key (user_id, request_id)
);
create index ai_usage_retention on public.ai_usage(created_at);
create index ai_usage_user_created on public.ai_usage(user_id, created_at desc);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from public, anon, authenticated;
grant select on public.ai_usage to authenticated;
create policy ai_usage_read_own on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);

-- Policy arguments are trusted server configuration; only the server credential can call this.
create function public.reserve_cirra_request(p_user_id uuid, p_request_id uuid, p_mode text,
  p_minute integer, p_day integer, p_concurrency integer, p_timeout_ms integer)
returns text language plpgsql security definer set search_path = '' as $$
declare minute_count integer; day_count integer; active_count integer;
begin
  if p_user_id is null or p_request_id is null or p_mode is null or p_mode not in ('tutor','debugger','project-assistant')
    or p_minute is null or p_minute not between 1 and 60 or p_day is null or p_day not between 1 and 1000
    or p_concurrency is null or p_concurrency not between 1 and 3
    or p_timeout_ms is null or p_timeout_ms not between 1000 and 60000 then
    raise exception 'Invalid request policy' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cirra:' || p_user_id::text, 0));
  if exists(select 1 from public.ai_usage where user_id=p_user_id and request_id=p_request_id) then return 'duplicate'; end if;
  select count(*) filter (where created_at > now() - interval '1 minute'), count(*),
    count(*) filter (where finished_at is null and lease_until > now())
    into minute_count, day_count, active_count from public.ai_usage
    where user_id=p_user_id and created_at > now() - interval '24 hours';
  if active_count >= p_concurrency then return 'concurrent'; end if;
  if minute_count >= p_minute or day_count >= p_day then return 'limited'; end if;
  insert into public.ai_usage(user_id,request_id,mode,lease_until)
    values(p_user_id,p_request_id,p_mode,now() + (p_timeout_ms + 10000) * interval '1 millisecond');
  return 'reserved';
end $$;

create function public.finish_cirra_request(p_user_id uuid, p_request_id uuid, p_status text,
  p_model_category text, p_tokens integer, p_latency_ms integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status is null or p_status not in ('ok','error','canceled') then raise exception 'Invalid status' using errcode='22023'; end if;
  update public.ai_usage set finished_at=now(), status=p_status, model_category=p_model_category,
    tokens=p_tokens, latency_ms=p_latency_ms
    where user_id=p_user_id and request_id=p_request_id and finished_at is null;
end $$;
revoke all on function public.reserve_cirra_request(uuid,uuid,text,integer,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.finish_cirra_request(uuid,uuid,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_cirra_request(uuid,uuid,text,integer,integer,integer,integer) to service_role;
grant execute on function public.finish_cirra_request(uuid,uuid,text,text,integer,integer) to service_role;
commit;
