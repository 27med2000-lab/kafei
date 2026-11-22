-- Kafei: SIAS bag photos, plus the tasting details printed on each bag label.
-- Run AFTER 009_sias_descriptions.sql. Supabase > SQL Editor > New query > paste > Run. Safe to run again.
-- The photos are in the site's img/ folder (they go live with the website zip).
-- Products stay hidden: switch each one on in the dashboard when you're ready to sell it.

-- photos
update public.products set img = 'img/' || id || '.webp', fit = 'contain', updated_at = now()
where id in ('sias-toffy-cake', 'sias-milky-cat', 'sias-barry-boo', 'sias-peachy-pop',
             'sias-bubble-gum', 'sias-kyoho-field', 'sias-cattopia');
update public.products set img = 'img/sias-toffee-cake.webp' where id = 'sias-toffy-cake';

-- Toffee Cake (spelled as on the bag)
update public.products set
  name_en = 'SIAS Toffee Cake', name_ar = 'سياس توفي كيك',
  what_en = 'Like a slice of toffee cake: sweet, nutty and chocolatey.',
  what_ar = 'كقطعة كيك التوفي: حلوة، بنكهة المكسرات والشوكولاتة.',
  desc_en = 'A medium-dark blend with caramel sweetness, toasted nuts and a chocolate finish. Made for espresso, and holds its own in a latte.',
  desc_ar = 'خلطة بتحميص متوسط إلى داكن، حلاوة الكراميل مع المكسرات المحمصة ونهاية شوكولاتة. مصممة للإسبريسو وتبقى واضحة في اللاتيه.',
  facts = '[["Notes","النكهات","Caramel, nutty, chocolate","كراميل، مكسرات، شوكولاتة"],
            ["Process","المعالجة","Blend","خلطة"],
            ["Roast","درجة التحميص","Medium to dark","متوسطة إلى داكنة"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-toffy-cake';

update public.products set
  what_en = 'A bowl of mixed berries and Kyoho grapes.',
  what_ar = 'وعاء من التوت المشكّل وعنب كيوهو.',
  desc_en = 'Juicy berries, grape and ripe plum, with Kyoho grape sweetness from a chaptalization process (sugar added during fermentation). Best as a V60 or other filter brew.',
  desc_ar = 'توت عصيري وعنب وبرقوق ناضج، مع حلاوة عنب كيوهو بفضل معالجة التشبتليزيشن (إضافة السكر أثناء التخمير). الأفضل في الـV60 أو أي قهوة مقطرة.',
  facts = '[["Notes","النكهات","Berry, grape, plum, Kyoho grape","توت، عنب، برقوق، عنب كيوهو"],
            ["Process","المعالجة","Chaptalization","تشبتليزيشن (تخمير بإضافة السكر)"],
            ["Roast","درجة التحميص","Medium-light","متوسطة إلى فاتحة"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-barry-boo';

update public.products set
  what_en = 'Peach, flowers and cherry: a bright summer cup.',
  what_ar = 'خوخ وزهور وكرز: كوب صيفي مشرق.',
  desc_en = 'Soft peach and floral aromas with cherry sweetness and a clean citrus finish. Light and juicy as a pour-over, refreshing over ice.',
  desc_ar = 'روائح الخوخ والزهور مع حلاوة الكرز ونهاية حمضية نظيفة. خفيفة وعصيرية كقهوة مقطرة، ومنعشة مع الثلج.',
  facts = '[["Notes","النكهات","Peach, floral, cherry, citrus","خوخ، زهور، كرز، حمضيات"],
            ["Process","المعالجة","Blend","خلطة"],
            ["Roast","درجة التحميص","Medium-light","متوسطة إلى فاتحة"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-peachy-pop';

-- corrections to match the bag labels
update public.products set
  facts = '[["Notes","النكهات","Raspberry, strawberry, gummy candy","توت العليق، فراولة، حلوى جيلي"],
            ["Process","المعالجة","Blend","خلطة"],
            ["Roast","درجة التحميص","Medium-light","متوسطة إلى فاتحة"],
            ["Origin","المنشأ","Colombia, Thailand, Guatemala · 1,250–1,900 m","كولومبيا، تايلاند، غواتيمالا · 1,250–1,900 م"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-bubble-gum';

update public.products set
  facts = '[["Notes","النكهات","Grape, floral, lime, fruity","عنب، زهور، ليمون، فواكه"],
            ["Process","المعالجة","Anaerobic, washed","لاهوائية، مغسولة"],
            ["Roast","درجة التحميص","Medium-light (espresso or filter)","متوسطة إلى فاتحة (إسبريسو أو تقطير)"],
            ["Origin","المنشأ","Colombia · Castillo, Caturra, Bourbon · 1,700–2,200 m","كولومبيا · كاستيو، كاتورا، بوربون · 1,700–2,200 م"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-kyoho-field';

update public.products set
  what_en = 'Blueberry cheesecake in a cup: SIAS''s signature blend.',
  what_ar = 'تشيز كيك التوت الأزرق في كوب: خلطة سياس المميزة.',
  desc_en = 'Ripe blueberry, creamy cheesecake and candy sweetness, from a washed and carbonic maceration process. Shines as filter, smooth as espresso.',
  desc_ar = 'توت أزرق ناضج وقوام كريمي كالتشيز كيك وحلاوة الحلوى، بمعالجة مغسولة مع تخمير كربوني. مميزة كقهوة مقطرة وناعمة كإسبريسو.',
  facts = '[["Notes","النكهات","Blueberry, cheesecake, candy","توت أزرق، تشيز كيك، حلوى"],
            ["Process","المعالجة","Washed & carbonic maceration","مغسولة مع تخمير كربوني"],
            ["Roast","درجة التحميص","Medium-light","متوسطة إلى فاتحة"],
            ["Origin","المنشأ","Three growing regions · 1,250–1,900 m","ثلاث مناطق زراعة · 1,250–1,900 م"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-cattopia';
