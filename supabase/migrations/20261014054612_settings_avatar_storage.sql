begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-avatars','profile-avatars',false,524288,array['image/webp']);
create function public.avatar_account_active() returns boolean language sql stable security definer set search_path = ''
as $$select exists(select 1 from auth.users where id=auth.uid())$$;
revoke all on function public.avatar_account_active() from public, anon;
grant execute on function public.avatar_account_active() to authenticated;
create policy profile_avatar_select on storage.objects for select to authenticated
using(bucket_id='profile-avatars' and name=(select auth.uid())::text || '/avatar.webp' and (select public.avatar_account_active()));
create policy profile_avatar_insert on storage.objects for insert to authenticated
with check(bucket_id='profile-avatars' and name=(select auth.uid())::text || '/avatar.webp' and (select public.avatar_account_active()));
create policy profile_avatar_update on storage.objects for update to authenticated
using(bucket_id='profile-avatars' and name=(select auth.uid())::text || '/avatar.webp' and (select public.avatar_account_active()))
with check(bucket_id='profile-avatars' and name=(select auth.uid())::text || '/avatar.webp' and (select public.avatar_account_active()));
create policy profile_avatar_delete on storage.objects for delete to authenticated
using(bucket_id='profile-avatars' and name=(select auth.uid())::text || '/avatar.webp' and (select public.avatar_account_active()));
notify pgrst, 'reload schema';
commit;
