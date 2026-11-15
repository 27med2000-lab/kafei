-- Kafei dashboard additions. Run AFTER schema.sql, once: Supabase > SQL Editor > New query > paste > Run.
-- Adds what the owner dashboard needs: governorate and delivery state on orders, cash-on-delivery orders,
-- and a stock table. Nothing here is readable by customers; the dashboard reads it through the server.

-- orders: where it goes and whether it has been delivered
alter table public.orders add column if not exists gov text
  check (gov in ('capital', 'hawalli', 'farwaniya', 'mubarak', 'ahmadi', 'jahra'));
alter table public.orders add column if not exists delivery_status text not null default 'to_deliver'
  check (delivery_status in ('to_deliver', 'delivered', 'cancelled'));
alter table public.orders add column if not exists delivered_at timestamptz;

-- orders: allow cash-on-delivery orders (status "cod", method "cod")
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending', 'paid', 'failed', 'cod'));
create index if not exists orders_created on public.orders (created_at desc);

-- stock: units on the shelf per product; low_at is when the dashboard flags it
create table if not exists public.stock (
  product_id text primary key,
  units integer not null default 0 check (units >= 0),
  low_at integer not null default 2 check (low_at >= 0),
  updated_at timestamptz not null default now()
);
alter table public.stock enable row level security;
-- No policies on purpose: only the server (service role) reads or writes stock.

insert into public.stock (product_id) values
  ('kuvani-maestro'), ('xbloom-studio'), ('kuvani-gevi-v60'), ('sias-cattopia')
on conflict (product_id) do nothing;
