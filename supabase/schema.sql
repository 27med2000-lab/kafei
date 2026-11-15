-- Kafei customer accounts. Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Customers sign in with an emailed 6-digit code (Supabase Auth). Each customer can read and change only
-- their own profile, and read only their own orders. Orders are written by the server (service role) only.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text check (char_length(name) <= 50),
  phone text check (phone ~ '^[4569][0-9]{7}$'),
  gov text, area text, block text, street text, avenue text, house text,
  notes text check (char_length(notes) <= 300),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,                         -- the KF... order number
  user_id uuid references auth.users (id) on delete set null,   -- null for guest checkout
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  method text,                                 -- knet, card, apple
  total_fils integer not null check (total_fils >= 0),
  items jsonb not null default '[]',           -- [{id, name, qty, price_fils}]
  address text,
  phone text,
  track_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists orders_user_created on public.orders (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

drop policy if exists "own profile: read" on public.profiles;
drop policy if exists "own profile: create" on public.profiles;
drop policy if exists "own profile: update" on public.profiles;
create policy "own profile: read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile: create" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile: update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own orders: read" on public.orders;
create policy "own orders: read" on public.orders for select to authenticated using (user_id = auth.uid());
-- No insert/update policy for customers: only the server, using the service role key, writes orders.
