-- Kafei: usernames for customer accounts, and a brand for each product. Run AFTER 005_inventory.sql, once:
-- Supabase > SQL Editor > New query > paste > Run. Safe to run again.

-- 1) brands: the dashboard's "Brand" box, used by "Shop by brand"
alter table public.products add column if not exists brand text check (brand is null or char_length(brand) <= 40);
update public.products set brand = 'xBloom' where brand is null and id like 'xbloom%';
update public.products set brand = 'Kuvani' where brand is null and id like 'kuvani%';
update public.products set brand = 'SIAS'   where brand is null and id like 'sias%';

-- 2) usernames: 3-20 letters, numbers, dots or underscores; unique whatever the capitals
alter table public.profiles add column if not exists username text check (username is null or username ~ '^[A-Za-z0-9._]{3,20}$');
create unique index if not exists profiles_username_key on public.profiles (lower(username));

-- a new account gets its profile row straight away, with the username chosen at sign-up
-- (Google accounts have no username; they sign in with Google)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare u text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
begin
  if u is not null and u !~ '^[A-Za-z0-9._]{3,20}$' then u := null; end if;
  insert into public.profiles (id, username, name)
  values (new.id, u, nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 50), ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- the sign-up form asks whether a username is free; it learns nothing else
create or replace function public.username_available(u text) returns boolean
language sql security definer set search_path = public stable as $$
  select u ~ '^[A-Za-z0-9._]{3,20}$' and not exists (select 1 from public.profiles where lower(username) = lower(u));
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- customers may not change their username by editing their profile row directly to someone else's: the unique index stops it

-- 3) signing in with a username: only the server (service role) may turn a username into its email
create or replace function public.login_email(u text) returns text
language sql security definer set search_path = public, auth stable as $$
  select au.email from public.profiles p join auth.users au on au.id = p.id where lower(p.username) = lower(u) limit 1;
$$;
revoke all on function public.login_email(text) from public, anon, authenticated;
grant execute on function public.login_email(text) to service_role;
