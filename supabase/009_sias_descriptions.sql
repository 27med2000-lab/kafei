-- Kafei: SIAS descriptions, tasting facts and roast date (roasted 2 November 2026).
-- Run AFTER 008_sias_order.sql. Supabase > SQL Editor > New query > paste > Run. Safe to run again.
-- Facts are [label in English, label in Arabic, value in English, value in Arabic].
-- Toffy Cake, Barry Boo, Peachy Pop and the Drip Box get the roast date now; their notes, process and roast
-- are added once known (they are not listed online).

update public.products set
  what_en = 'Made for milk drinks: rich, smooth and sweet.',
  what_ar = 'مصممة لمشروبات الحليب: غنية وناعمة وحلوة.',
  desc_en = 'A comforting blend built for lattes and flat whites. Chocolate and nutty sweetness with a caramel finish that cuts through milk.',
  desc_ar = 'خلطة مريحة صُممت للاتيه والفلات وايت. حلاوة الشوكولاتة والمكسرات مع نهاية كراميل واضحة حتى مع الحليب.',
  facts = '[["Notes","النكهات","Chocolate, nutty, caramel","شوكولاتة، مكسرات، كراميل"],
            ["Roast","درجة التحميص","Medium-dark","متوسطة إلى داكنة"],
            ["Origin","المنشأ","Brazil, Colombia · 1,100–1,800 m","البرازيل، كولومبيا · 1,100–1,800 م"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-milky-cat';

update public.products set
  what_en = 'Bright and fruity, like a bunch of Kyoho grapes.',
  what_ar = 'مشرقة وفاكهية، كعنقود من عنب كيوهو.',
  desc_en = 'Juicy grape and floral aromas, a lift of lime, and a creamy white-chocolate finish. Lovely as a V60 or a fruity espresso.',
  desc_ar = 'نكهة عنب عصيرية وروائح زهرية، لمسة ليمون، ونهاية كريمية بطعم الشوكولاتة البيضاء. رائعة في الـV60 أو كإسبريسو فاكهي.',
  facts = '[["Notes","النكهات","Grape, floral, lime, white chocolate","عنب، زهور، ليمون، شوكولاتة بيضاء"],
            ["Process","المعالجة","Washed & yeast fermentation","مغسولة مع تخمير بالخميرة"],
            ["Roast","درجة التحميص","Medium-light (espresso or filter)","متوسطة إلى فاتحة (إسبريسو أو تقطير)"],
            ["Origin","المنشأ","Colombia · Castillo, Caturra, Bourbon · 1,700–2,200 m","كولومبيا · كاستيو، كاتورا، بوربون · 1,700–2,200 م"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-kyoho-field';

update public.products set
  what_en = 'Sweet berries and candy: fun in a cup.',
  what_ar = 'توت حلو وحلوى: متعة في كوب.',
  desc_en = 'Strawberry and raspberry sweetness with a candy-like finish and a chocolate base. A playful cup that tastes like dessert.',
  desc_ar = 'حلاوة الفراولة والتوت مع نهاية تشبه الحلوى وقاعدة من الشوكولاتة. كوب مرح بطعم الحلويات.',
  facts = '[["Notes","النكهات","Strawberry, raspberry, candy, chocolate","فراولة، توت، حلوى، شوكولاتة"],
            ["Process","المعالجة","Blend","خلطة"],
            ["Roast","درجة التحميص","Medium-light","متوسطة إلى فاتحة"],
            ["Origin","المنشأ","Colombia, Thailand, Guatemala · 1,250–1,900 m","كولومبيا، تايلاند، غواتيمالا · 1,250–1,900 م"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-bubble-gum';

update public.products set
  what_en = 'Creamy blueberry: SIAS''s signature fruity blend.',
  what_ar = 'توت أزرق كريمي: خلطة سياس الفاكهية المميزة.',
  desc_en = 'Ripe blueberry and candy sweetness over a creamy chocolate body, thanks to carbonic maceration. Shines as filter, smooth as espresso.',
  desc_ar = 'توت أزرق ناضج وحلاوة الحلوى فوق قوام كريمي بطعم الشوكولاتة بفضل التخمير الكربوني. مميزة كقهوة مقطرة وناعمة كإسبريسو.',
  facts = '[["Notes","النكهات","Blueberry, candy, chocolate, creamy","توت أزرق، حلوى، شوكولاتة، قوام كريمي"],
            ["Process","المعالجة","Washed & carbonic maceration","مغسولة مع تخمير كربوني"],
            ["Roast","درجة التحميص","Medium-light","متوسطة إلى فاتحة"],
            ["Origin","المنشأ","Three growing regions · 1,250–1,900 m","ثلاث مناطق زراعة · 1,250–1,900 م"],
            ["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-cattopia';

update public.products set
  what_en = 'Specialty coffee anywhere, no machine needed.',
  what_ar = 'قهوة مختصة في أي مكان، بدون آلة.',
  desc_en = 'Tear the bag, hang it on your cup and pour hot water slowly. Fresh specialty coffee at the office, on a trip or at home, with no grinder or machine.',
  desc_ar = 'افتح الكيس، علّقه على الكوب، واسكب الماء الساخن ببطء. قهوة مختصة طازجة في المكتب أو السفر أو البيت، بدون مطحنة أو آلة.',
  facts = '[["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id = 'sias-drip-box';

-- the three without published details: roast date only for now
update public.products set
  facts = '[["Roast date","تاريخ التحميص","2 November 2026","2 نوفمبر 2026"]]'::jsonb,
  updated_at = now()
where id in ('sias-toffy-cake', 'sias-barry-boo', 'sias-peachy-pop');
