-- Kafei inventory: stock per colour, stock that goes down with every order, and automatic "sold out" at 0.
-- Run AFTER 004_colors.sql, once: Supabase > SQL Editor > New query > paste > Run.

-- 1. A product (or colour) with no number set is "not counted": it never sells out by itself.
--    Until today the dashboard had never been used, so the starting 0s mean "not set yet", not "none left".
alter table public.stock alter column units drop not null;
alter table public.stock alter column units drop default;
update public.stock set units = null where units = 0;

-- 2. Every colour gets its own stock line, named product:colour (for example xbloom-studio:twilight).
insert into public.stock (product_id, units, low_at)
select p.id || ':' || (c->>'id'), null, 1
from public.products p, jsonb_array_elements(p.colors) c
on conflict (product_id) do nothing;

-- 3. Takes ordered units off the shelf (sign -1) or puts them back when an order is cancelled (sign +1).
--    Items: [{"key": "xbloom-studio:twilight", "qty": 1}, ...]. Lines that aren't counted (no number) are left alone.
create or replace function public.adjust_stock(p_items jsonb, p_sign integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_sign not in (-1, 1) then raise exception 'sign must be -1 or 1'; end if;
  update public.stock s
     set units = greatest(0, s.units + p_sign * x.qty), updated_at = now()
    from (select i->>'key' as key, sum(greatest(0, (i->>'qty')::int)) as qty
            from jsonb_array_elements(p_items) i group by 1) x
   where s.product_id = x.key and s.units is not null;
end $$;
-- only the shop's server may call it; customers and the public cannot
revoke all on function public.adjust_stock(jsonb, integer) from public, anon, authenticated;
grant execute on function public.adjust_stock(jsonb, integer) to service_role;
