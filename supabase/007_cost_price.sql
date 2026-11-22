-- Kafei: a private cost price for each product. Run AFTER 006_accounts_brands.sql, once:
-- Supabase > SQL Editor > New query > paste > Run. Safe to run again.
-- Only the owner's dashboard reads it (through the server); the shop never sends it to customers.
alter table public.products add column if not exists cost_fils integer
  check (cost_fils is null or cost_fils between 0 and 100000000);
