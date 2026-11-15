-- Product colours (the xBloom Studio's four finishes), the xBloom price, and hiding the products not in stock.
-- Run AFTER 003_products.sql, once:
-- Supabase > SQL Editor > New query > paste > Run.
-- Each colour: {"id", "name_en", "name_ar", "hex", "trim" (optional second swatch colour), "img", "sold_out"}.
-- The dashboard's product form has a tick box per colour to mark it sold out.

alter table public.products add column if not exists colors jsonb not null default '[]';

update public.products set img = 'img/xbloom-twilight.webp', fit = 'contain', colors = '[
  {"id":"twilight","name_en":"Twilight","name_ar":"توايلايت","hex":"#E9E7E3","trim":"#3A3A3C","img":"img/xbloom-twilight.webp","sold_out":false},
  {"id":"moonlight-white","name_en":"Moonlight White","name_ar":"أبيض مونلايت","hex":"#F4F3F0","img":"img/xbloom-white.webp","sold_out":false},
  {"id":"midnight-black","name_en":"Midnight Black","name_ar":"أسود ميدنايت","hex":"#2E2E30","img":"img/xbloom-black.webp","sold_out":false},
  {"id":"offline-blue","name_en":"Offline Blue","name_ar":"أزرق أوفلاين","hex":"#2F5FC4","img":"img/xbloom-blue.webp","sold_out":false}
]'::jsonb
where id = 'xbloom-studio' and colors = '[]'::jsonb;

-- 2026-11-07: the xBloom Studio goes on sale at KWD 199.000 in every colour.
update public.products set price_fils = 199000 where id = 'xbloom-studio';
-- The Kuvani machines and the SIAS beans come off the shop until new stock arrives.
-- Their descriptions stay saved: to bring one back, open it in the dashboard, tick "Show on the shop" and set its price.
update public.products set visible = false where id in ('kuvani-maestro', 'kuvani-gevi-v60', 'sias-cattopia');
