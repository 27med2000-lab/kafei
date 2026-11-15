-- Kafei products, editable from the owner dashboard. Run AFTER 002_dashboard.sql, once:
-- Supabase > SQL Editor > New query > paste > Run.
-- The shop reads visible products through /api/products; only the server (service role) writes them.

create table if not exists public.products (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,59}$'),   -- e.g. kuvani-maestro
  cat text not null check (cat in ('espresso-machines', 'pourover-machines', 'beans', 'pourover-accessories', 'espresso-accessories', 'cups', 'tumblers', 'grinders')),
  sub text check (sub in ('filter', 'espresso', 'manual', 'electric')),
  name_en text not null check (char_length(name_en) between 2 and 60),
  name_ar text not null check (char_length(name_ar) between 2 and 60),
  kind_en text check (char_length(kind_en) <= 60), kind_ar text check (char_length(kind_ar) <= 60),
  what_en text check (char_length(what_en) <= 160), what_ar text check (char_length(what_ar) <= 160),
  desc_en text check (char_length(desc_en) <= 800), desc_ar text check (char_length(desc_ar) <= 800),
  facts jsonb not null default '[]',             -- [[label_en, label_ar, value_en, value_ar], ...]
  price_fils integer check (price_fils is null or price_fils between 1 and 100000000),  -- null = "Ask for price"
  img text,                                      -- photo address (Supabase Storage or the site's img/ folder)
  fit text not null default 'cover' check (fit in ('cover', 'contain')),
  visible boolean not null default true,
  sort integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
-- No policies on purpose: customers read products through the server, which returns only visible ones.

-- the four products the shop sells today
insert into public.products (id, cat, sub, name_en, name_ar, kind_en, kind_ar, what_en, what_ar, desc_en, desc_ar, facts, img, fit, sort) values
('kuvani-maestro', 'espresso-machines', null, 'Kuvani Maestro', 'كوفاني مايسترو', 'Espresso machine', 'ماكينة إسبريسو',
 'An espresso machine with its own grinder.', 'ماكينة إسبريسو بمطحنتها الخاصة.',
 'A grinder with its own touchscreen sits beside the group head, and a steam wand with a wooden handle stands on each side. Beans go from hopper to cup on one counter.',
 'مطحنة بشاشة لمس خاصة بها بجانب رأس الاستخلاص، وذراع بخار بمقبض خشبي على كل جانب. من الحاوية إلى الكوب على سطح واحد.', '[]', 'img/kuvani.webp', 'cover', 10),
('xbloom-studio', 'pourover-machines', null, 'xBloom Studio', 'إكس بلوم ستوديو', 'Pour-over machine', 'ماكينة تقطير',
 'Pour-over that grinds, weighs and pours for you.', 'قهوة مقطرة تطحن وتزن وتصب عنك.',
 'Load the beans, choose a recipe and press start. The machine grinds, doses and pours in stages, so the cup comes out the way the recipe was written.',
 'ضع البن واختر الوصفة واضغط تشغيل. الماكينة تطحن وتزن وتصب على مراحل، فيخرج الكوب كما كُتبت وصفته.', '[]', 'img/xbloom.webp', 'contain', 20),
('kuvani-gevi-v60', 'pourover-machines', null, 'Kuvani × Gevi V60', 'كوفاني × جيفي V60', 'Automatic pour-over', 'تقطير أوتوماتيكي',
 'A grinder and a V60 brewer in one machine.', 'مطحنة وجهاز V60 في ماكينة واحدة.',
 'It grinds the beans at the top, pours over a V60-style cone and brews into a glass server. A round plate on the base holds a second cup.',
 'تطحن البن في الأعلى، وتصب فوق قمع بطراز V60 في إبريق زجاجي. وعلى القاعدة صحن دائري لكوب ثانٍ.', '[]', 'img/gevi.webp', 'cover', 30),
('sias-cattopia', 'beans', 'filter', 'SIAS Cattopia Blend', 'سياس كاتوبيا بلند', 'Coffee beans, 200 g', 'بن، 200 غ',
 'A sweet house blend from SIAS Coffee Roaster.', 'خلطة حلوة من محمصة سياس.',
 'Blueberry, cheesecake and candy in the cup. A medium-light roast that suits a V60 or either pour-over machine.',
 'توت أزرق وتشيز كيك وحلوى في الكوب. تحميص متوسط فاتح يناسب V60 أو أي من ماكينتي التقطير.',
 '[["Roaster","المحمصة","SIAS Coffee Roaster","محمصة سياس"],["Process","المعالجة","Washed","مغسولة"],["Origin","المنشأ","Chiang Mai","تشيانغ ماي"],["Notes","النكهات","Blueberry, cheesecake, candy","توت أزرق، تشيز كيك، حلوى"],["Roast","التحميص","Medium-light","متوسط فاتح"],["Weight","الوزن","200 g","200 غ"]]',
 'img/sias.webp', 'cover', 40)
on conflict (id) do nothing;

-- product photos: a public bucket (anyone can view a photo; only the server can upload)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
