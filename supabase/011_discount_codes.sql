-- Kafei: discount codes, managed from the dashboard. Run once in Supabase > SQL Editor > New query > paste > Run.
-- Safe to run again. Only the server (service role) reads this table; customers can't list codes.
create table if not exists public.discount_codes (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  kind text not null check (kind in ('percent', 'fixed')),          -- percent off the items, or a fixed amount in fils
  value integer not null check (value > 0),                          -- 10 = 10%, or 2000 = KWD 2.000
  once_per_customer boolean not null default true,                   -- one paid order per phone number
  min_order_fils integer check (min_order_fils is null or min_order_fils >= 0),
  ends_at timestamptz,                                               -- empty = no end date
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 90)
);
alter table public.discount_codes enable row level security;        -- no policies on purpose: server only

alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists discount_fils integer not null default 0;

-- the launch code: 10% off the items, once per customer
insert into public.discount_codes (code, kind, value, once_per_customer) values ('KAFEI10', 'percent', 10, true)
on conflict (code) do nothing;
