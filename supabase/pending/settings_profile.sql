-- Prepared additive migration; NOT applied remotely. Register with Supabase CLI
-- migration new settings_profile before applying through the reviewed release workflow.
begin;
create function public.update_my_profile(p_display_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); clean_name text := btrim(p_display_name);
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if clean_name is null or length(clean_name) not between 2 and 100
    or clean_name ~ '[[:cntrl:]<>@]' then
    raise exception 'Invalid display name' using errcode = '22023';
  end if;
  insert into public.profiles(id, display_name) values(owner_id, clean_name)
    on conflict(id) do update set display_name = excluded.display_name, updated_at = now();
  return clean_name;
end;
$$;
-- Definer is necessary for first-time profiles without opening direct writes.
-- Identity is exclusively auth.uid(); the RPC accepts no owner/id argument.
revoke all on function public.update_my_profile(text) from public, anon;
grant execute on function public.update_my_profile(text) to authenticated;
notify pgrst, 'reload schema';
commit;
