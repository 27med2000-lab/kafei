-- Kafei: SIAS Koffee order INV-20261031-02 (Bold Beans Co., 31 Oct 2026).
-- Adds the 8 products with cost price (landed: goods + shipping + clearance, from the owner's cost sheet),
-- selling price at a 50% margin (cost x 2, rounded up to the nearest 0.250 KWD), and the units received.
-- Products start HIDDEN in the shop until their photos are added in the dashboard.
-- Run in Supabase > SQL Editor > New query > paste > Run. Safe to run again (it updates the same rows).

-- the cost column (same as 007_cost_price.sql, repeated so this file works on its own)
alter table public.products add column if not exists cost_fils integer
  check (cost_fils is null or cost_fils between 0 and 100000000);

insert into public.products (id, cat, sub, brand, name_en, name_ar, kind_en, kind_ar, price_fils, cost_fils, fit, visible, sort) values
 ('sias-milky-cat',   'beans', 'espresso', 'SIAS', 'SIAS Milky Cat Blend', 'سياس ميلكي كات بلند', 'Coffee beans, 200 g',     'بن، 200 غ',          6500, 3137, 'contain', false, 40),
 ('sias-kyoho-field', 'beans', 'filter',   'SIAS', 'SIAS Kyoho Field',     'سياس كيوهو فيلد',     'Coffee beans, 200 g',     'بن، 200 غ',          9250, 4549, 'contain', false, 41),
 ('sias-toffy-cake',  'beans', 'espresso', 'SIAS', 'SIAS Toffy Cake',      'سياس توفي كيك',       'Coffee beans, 200 g',     'بن، 200 غ',          8000, 3921, 'contain', false, 42),
 ('sias-barry-boo',   'beans', 'filter',   'SIAS', 'SIAS Barry Boo',       'سياس باري بو',        'Coffee beans, 200 g',     'بن، 200 غ',         10500, 5176, 'contain', false, 43),
 ('sias-peachy-pop',  'beans', 'filter',   'SIAS', 'SIAS Peachy Pop',      'سياس بيتشي بوب',      'Coffee beans, 200 g',     'بن، 200 غ',          9000, 4392, 'contain', false, 44),
 ('sias-bubble-gum',  'beans', 'filter',   'SIAS', 'SIAS Bubble Gum',      'سياس ببل غم',         'Coffee beans, 200 g',     'بن، 200 غ',          9000, 4392, 'contain', false, 45),
 ('sias-cattopia',    'beans', 'filter',   'SIAS', 'SIAS Cattopia Blend',  'سياس كاتوبيا بلند',   'Coffee beans, 200 g',     'بن، 200 غ',          9000, 4392, 'contain', false, 46),
 ('sias-drip-box',    'beans', 'filter',   'SIAS', 'SIAS Drip Box',        'سياس دريب بوكس',      'Drip coffee bags, box',   'أكياس قهوة مقطرة، علبة', 5250, 2588, 'contain', false, 47)
on conflict (id) do update set
  cat = excluded.cat, sub = excluded.sub, brand = excluded.brand,
  name_en = excluded.name_en, name_ar = excluded.name_ar, kind_en = excluded.kind_en, kind_ar = excluded.kind_ar,
  price_fils = excluded.price_fils, cost_fils = excluded.cost_fils, updated_at = now();

-- units received (low-stock flag at 3 bags / 5 boxes)
insert into public.stock (product_id, units, low_at) values
 ('sias-milky-cat', 20, 3), ('sias-kyoho-field', 20, 3), ('sias-toffy-cake', 20, 3), ('sias-barry-boo', 20, 3),
 ('sias-peachy-pop', 10, 3), ('sias-bubble-gum', 10, 3), ('sias-cattopia', 10, 3), ('sias-drip-box', 50, 5)
on conflict (product_id) do update set units = excluded.units, low_at = excluded.low_at, updated_at = now();
