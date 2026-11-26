<script>
(function(){
"use strict";
/* ===== settings: change these ===== */
const CONFIG = {
  phoneDisplay: "+965 6690 8822",
  whatsapp: "96566908822",
  phoneVerified: true,
  freeOver: null, fee: 1500,     // fils
  // Visitor tracking. Paste the IDs to switch it on: Google Analytics "G-..." and the Meta pixel number.
  // Nothing loads until a visitor presses "Accept" on the cookie bar. Empty = no bar and no tracking.
  analytics: { ga4: "G-HXR99YQW73", metaPixel: "924273450680201" },
  // Online payment (MyFatoorah). Works where the /api functions are deployed; the claude.ai demo falls back to WhatsApp.
  // Customer accounts (Supabase). Paste your project URL and anon (public) key from Supabase > Project Settings > API.
  // The anon key is safe in the page: the row-level security in supabase/schema.sql decides what each customer can see.
  // Customer accounts (Supabase). The publishable key is public by design; the database rules decide what each customer can see.
  // Off on the claude.ai preview (it can't reach Supabase); on everywhere else.
  accounts: (/^https?:$/.test(location.protocol) && !/claude|anthropic/i.test(location.hostname)) ? { url: "https://gupwztbbazuusnimjkvt.supabase.co", anonKey: "sb_publishable_TqNf6lA2qlFbYbVpsDcxjg_r8Gbf70p", googleClientId: "735250984104-g1kjolr1tvsmbgk1ajqhg276rdj7o9dc.apps.googleusercontent.com" } : null,
  payments: (/^https?:$/.test(location.protocol) && !/claude|anthropic/i.test(location.hostname)) ? { checkout: "/api/checkout", status: "/api/status", cod: "/api/order-cod", products: "/api/products" } : null
};

/* ===== real stock only. Set price in fils (e.g. 389000 = KWD 389.000) once known. ===== */
const P = [
 {id:"xbloom-studio", brand:"xBloom", cat:"pourover-machines", motif:"eyes", band:"espresso", img:"img/xbloom-twilight.webp", fit:"contain", price:199000,
  facts:[["In one machine","في ماكينة واحدة","Grinder, brewer and scale","مطحنة وجهاز تقطير وميزان"],
   ["Colours","الألوان","Twilight, Moonlight White, Midnight Black, Offline Blue","توايلايت، أبيض مونلايت، أسود ميدنايت، أزرق أوفلاين"],
   ["Delivery","التوصيل","Free. Same day in the Capital and Hawalli when you order before 2 pm","مجاني. في نفس اليوم للعاصمة وحولي عند الطلب قبل 2 ظهرًا"]],
  colors:[{id:"twilight",name:{en:"Twilight",ar:"توايلايت"},hex:"#E9E7E3",trim:"#3A3A3C",img:"img/xbloom-twilight.webp",details:["img/xbloom-twilight-d1.webp","img/xbloom-twilight-d2.webp"]},
   {id:"moonlight-white",name:{en:"Moonlight White",ar:"أبيض مونلايت"},hex:"#F4F3F0",img:"img/xbloom-white.webp",details:["img/xbloom-white-d1.webp","img/xbloom-white-d2.webp"]},
   {id:"midnight-black",name:{en:"Midnight Black",ar:"أسود ميدنايت"},hex:"#2E2E30",img:"img/xbloom-black.webp",details:["img/xbloom-black-d1.webp","img/xbloom-black-d2.webp"]},
   {id:"offline-blue",name:{en:"Offline Blue",ar:"أزرق أوفلاين"},hex:"#2F5FC4",img:"img/xbloom-blue.webp",details:["img/xbloom-blue-d1.webp","img/xbloom-blue-d2.webp"]}],
  name:{en:"xBloom Studio",ar:"إكس بلوم ستوديو"}, kind:{en:"Pour-over machine",ar:"ماكينة تقطير"},
  what:{en:"Pour-over that grinds, weighs and pours for you.",ar:"قهوة مقطرة تطحن وتزن وتصب عنك."},
  desc:{en:"Load the beans, choose a recipe and press start. The machine grinds, doses and pours in stages, so the cup comes out the way the recipe was written.",ar:"ضع البن واختر الوصفة واضغط تشغيل. الماكينة تطحن وتزن وتصب على مراحل، فيخرج الكوب كما كُتبت وصفته."}},

];
const byId = Object.fromEntries(P.map(p=>[p.id,p]));
/* colours: a product may list colours; each cart line then carries one */
const colorOf=(p,c)=>p&&p.colors&&p.colors.length?p.colors.find(x=>x.id===c)||null:null;
const firstColor=p=>p&&p.colors&&p.colors.length?(p.colors.find(x=>!x.out)||null):null;
const lineKey=l=>l.id+(l.color?":"+l.color:"");
const lineImg=l=>{const p=byId[l.id],c=colorOf(p,l.color);return c&&c.img||p.img;};
const CATS = [
 {id:"espresso-machines", short:{en:"Espresso",ar:"إسبريسو"}, motif:"tree", band:"caramel", name:{en:"Espresso machines",ar:"مكائن الإسبريسو"}},
 {id:"pourover-machines", short:{en:"Pour-over",ar:"تقطير"}, motif:"eyes", band:"espresso", name:{en:"Pour-over machines",ar:"مكائن التقطير"}},
 {id:"beans", short:{en:"Beans",ar:"بن"}, motif:"grain", band:"cream", name:{en:"Coffee beans",ar:"حبوب القهوة"}, subs:[{id:"filter",name:{en:"Filter beans",ar:"بن للتقطير"}},{id:"espresso",name:{en:"Espresso beans",ar:"بن للإسبريسو"}}]},
 {id:"pourover-accessories", short:{en:"Brewing tools",ar:"أدوات التحضير"}, motif:"tri", band:"coffee", name:{en:"Pour-over tools",ar:"أدوات التقطير"}},
 {id:"espresso-accessories", short:{en:"Barista tools",ar:"أدوات الباريستا"}, motif:"zig", band:"caramel", name:{en:"Espresso tools",ar:"أدوات الإسبريسو"}},
 {id:"cups", short:{en:"Cups",ar:"أكواب"}, motif:"comb", band:"espresso", name:{en:"Cups",ar:"الأكواب"}},
 {id:"tumblers", short:{en:"Tumblers",ar:"أكواب حافظة"}, motif:"cross", band:"coffee", name:{en:"Tumblers",ar:"الأكواب الحافظة"}},
 {id:"grinders", short:{en:"Grinders",ar:"مطاحن"}, motif:"zig", band:"cream", name:{en:"Grinders",ar:"المطاحن"}, subs:[{id:"manual",name:{en:"Manual grinders",ar:"مطاحن يدوية"}},{id:"electric",name:{en:"Electric grinders",ar:"مطاحن كهربائية"}}]}
];
const catById = Object.fromEntries(CATS.map(c=>[c.id,c]));
const BANDS = {espresso:["#1D1209","#F1E7D9"],caramel:["#B9824B","#1D1209"],coffee:["#644A31","#F1E7D9"],cream:["#E4DACD","#1D1209"]};

/* ===== copy ===== */
const T = {
en:{menu:"Menu",skip:"Skip to content",nav_home:"Home",nav_shop:"Shop",nav_delivery:"Delivery",nav_about:"About us",nav_ask:"Ask us",stock_h:"In stock now",
  shop_lead:"Everything we sell, by category. We only list what is in stock.", cats_h:"Shop by category", cats_label:"Categories", all_products:"Every product",
  n_products:n=>n===1?"1 product":`${n} products`, n_none:"Not in stock yet", all:"All", other_cats:"Other categories",
  soon_h:"Not in stock yet", soon_p:n=>`We don't carry ${n.toLowerCase()} yet. Tell us what you're looking for and we'll let you know when it arrives.`,
  soon_wa:n=>`Hello Kafei, I'm looking for ${n.toLowerCase()}. Do you have any coming?`, ask_wa:"Ask on WhatsApp",
  film_h:"Watch it brew", film_p:"Two ways to a good cup: a shot pulled through a bottomless portafilter, and a pour-over blooming in its filter.",
  film_esp:"An espresso shot through a bottomless portafilter", film_po:"Coffee blooming in a pour-over filter", film_po2:"Pouring water from a kettle into a dripper",
  shop_esp:"Espresso machines", shop_po:"Pour-over machines",
  deliv_more:"Delivery details", deliv_page_h:"Delivery",
  fx_same:"Same day", fx_fee:"Delivery fee", fx_pay:"Payment", fx_fee_v:"KWD 1.500 anywhere in Kuwait.", fx_pay_v:"KNET, card or Apple Pay.", fx_same_v:"Order before 2 pm and it reaches the Capital and Hawalli the same day.",
  how_h:"How ordering works", st1:"Choose a product and tap Ask for price, or add it to your cart.", st2:"We reply on WhatsApp with the price and the delivery time.", st3:"Pay by KNET, card or Apple Pay.",
  far_h:"Outside the Capital and Hawalli?", far_p:"Message us and we'll tell you the delivery day for your area.", far_wa:"Hello Kafei, when can you deliver to my area?",
  about_h:"About us", about_lead:"Kafei sells a short list of coffee machines and beans in Kuwait, in Arabic and English.",
  name_h:"The name", name_p1:"كفي means enough. Say it with a shadda, كفّي, and it means my palm.", name_p2:"We liked both: a cup that is exactly enough, held in your hand.",
  carry_h:"What we carry", carry_p:"We list only what is in stock. More products and categories open as stock arrives.",
  weave_h:"The weave", weave_p1:"The bands and patterns on this site come from Al Sadu, the Bedouin weaving of Kuwait: horizontal bands in natural colours, divided by rows of teeth and eyes.", weave_p2:"Each product has its own motif, the way each Sadu band carries its own pattern.",cart:"Cart",lang:"العربية",
  cart_n:n=>n===1?"1 item in cart":`${n} items in cart`,
  lead:"A short list of coffee gear, chosen and delivered in Kuwait.",
  t1:"Same day in the Capital and Hawalli when you order before 2 pm",
  t2:"Delivery KWD 1.500 anywhere in Kuwait",
  t3:"KNET, card or Apple Pay",
  see_all:"See all four", loom_label:"Kafei's four products",
  ask_price:"Ask for price", details:"Details", color_h:"Colour", choose_color:"Choose a colour", view_colors:"View colours", d_close:"close-up of the brewing head", d_side:"side view", details_h:"Closer look", sold_out:"sold out", all_sold:"Every colour is sold out right now. Ask us when the next ones arrive.", one_sold:"Sold out right now. Ask us when the next ones arrive.", out_ask:"Sold out. Ask us", wa_back:n=>`Hello Kafei, when will the ${n} be back in stock?`, add:"Add to cart", added:n=>`Added ${n} to your cart`,
  price_soon:"Price on request. Message us and we'll reply with today's price and delivery time.",
  wa_item:(n)=>`Hello Kafei, what is the price of the ${n}, and when can you deliver it?`,
  deliv_big:"Order before 2 pm and it reaches the Capital and Hawalli the same day.",
  d2:"Delivery KWD 1.500 anywhere in Kuwait", d3:"Pay with KNET, card or Apple Pay",
  ask_h:"Ask us first", ask_p:"Not sure which machine suits your counter or your coffee? Send us a message and we'll help you choose.",
  wa_open:"Message on WhatsApp", copy:"Copy number", copied:"Number copied", copy_fail:"Select the number to copy it",
  shop_h:"Shop", home:"Home",
  f_about:"كفي means enough. With a shadda, كفّي, it means my palm: a cup that is exactly enough, held in your hand.",
  f_shop:"Shop", f_help:"Help", f_imprint:"Kafei, Kuwait. Prices in Kuwaiti dinar.", f_credits:"Brewing footage:",
  qty:"Quantity", dec:"Fewer", inc:"More", remove:"Remove", close:"Close cart",
  cart_h:"Your cart", empty:"Nothing poured yet. Everything we have in stock is in the shop.",
  subtotal:"Subtotal", delivery:"Delivery", code_l:"Discount code", code_apply:"Apply", code_remove:"Remove", code_on:(c,d)=>`${c} applied: ${d} off`, code_line:c=>`Discount (${c})`, code_need:"Type a discount code first.", code_fail:"The code could not be checked. Try again.", free:"Free", total:"Total", checkout:"Checkout", shop_all:"See all four",
  co_h:"Checkout", co_contact:"Contact", co_addr:"Delivery address", co_pay:"Payment", co_empty:"Your cup is empty, so there's nothing to check out yet.",
  f_name:"Full name", f_phone:"Mobile number", f_phone_help:"We send delivery updates by WhatsApp.", f_gov:"Governorate", f_choose:"Choose a governorate",
  f_area:"Area", f_block:"Block", f_street:"Street", f_avenue:"Avenue (optional)", f_house:"House or building", f_notes:"Notes for the driver (optional)",
  pay_knet:"KNET", pay_card:"Credit or debit card", pay_apple:"Apple Pay", pay_cod:"Cash on delivery",
  place:"Place order", demo:"Payments are not connected yet. Placing an order sends it to us on WhatsApp.",
  e_name:"Enter your full name.", e_phone:"Enter an 8-digit Kuwaiti mobile number, for example 6690 8820.", e_gov:"Choose your governorate.",
  e_area:"Enter your area, for example Salmiya.", e_block:"Enter your block number.", e_street:"Enter your street.", e_house:"Enter your house or building number.",
  e_sum:n=>n===1?"Fix 1 field to place your order":`Fix ${n} fields to place your order`,
  ok_h:id=>`Order ${id} ready to send`, ok_p:"Send it on WhatsApp and we'll confirm the delivery time.", ok_send:"Send order on WhatsApp", ok_back:"Back to the shop",
  wa_order:"Hello Kafei, I'd like to order:", wa_hello:"Hello Kafei, could you send me today's prices?", notfound:"We couldn't find that product."},
ar:{menu:"القائمة",skip:"انتقل إلى المحتوى",nav_home:"الرئيسية",nav_shop:"المتجر",nav_delivery:"التوصيل",nav_about:"من نحن",nav_ask:"اسألنا",stock_h:"المتوفر الآن",
  shop_lead:"كل ما نبيعه، حسب القسم. نعرض فقط ما هو متوفر.", cats_h:"تسوّق حسب القسم", cats_label:"الأقسام", all_products:"كل المنتجات",
  n_products:n=>n===1?"منتج واحد":(n===2?"منتجان":`${n} منتجات`), n_none:"غير متوفر بعد", all:"الكل", other_cats:"أقسام أخرى",
  soon_h:"غير متوفر بعد", soon_p:n=>`لا نوفر ${n} بعد. أخبرنا بما تبحث عنه ونخبرك عند توفره.`,
  soon_wa:n=>`مرحبًا كفي، أبحث عن ${n}. هل سيتوفر لديكم قريبًا؟`, ask_wa:"اسألنا عبر واتساب",
  film_h:"شاهدها تُحضَّر", film_p:"طريقتان لكوب جيد: شوت إسبريسو من حامل فلتر مفتوح، وقهوة مقطرة تتفتح في فلترها.",
  film_esp:"شوت إسبريسو من حامل فلتر مفتوح", film_po:"قهوة تتفتح في فلتر التقطير", film_po2:"صب الماء من الغلاية في القمع",
  shop_esp:"مكائن الإسبريسو", shop_po:"مكائن التقطير",
  deliv_more:"تفاصيل التوصيل", deliv_page_h:"التوصيل",
  fx_same:"في نفس اليوم", fx_fee:"رسوم التوصيل", fx_pay:"الدفع", fx_fee_v:"1.500 د.ك لجميع مناطق الكويت.", fx_pay_v:"كي نت، بطاقة أو Apple Pay.", fx_same_v:"اطلب قبل الساعة 2 ظهرًا ويصلك في العاصمة وحولي في اليوم نفسه.",
  how_h:"كيف تطلب", st1:"اختر المنتج واضغط «اسأل عن السعر»، أو أضفه إلى السلة.", st2:"نرد عليك عبر واتساب بالسعر وموعد التوصيل.", st3:"ادفع بالكي نت أو البطاقة أو Apple Pay.",
  far_h:"خارج العاصمة وحولي؟", far_p:"راسلنا ونخبرك بيوم التوصيل لمنطقتك.", far_wa:"مرحبًا كفي، متى يمكن التوصيل لمنطقتي؟",
  about_h:"من نحن", about_lead:"كفي متجر يبيع قائمة قصيرة من مكائن القهوة والبن في الكويت، بالعربية والإنجليزية.",
  name_h:"الاسم", name_p1:"كفي تعني: يكفي. وبالشدّة، كفّي، تعني راحة يدي.", name_p2:"أحببنا المعنيين: كوب يكفي تمامًا، تحمله في يدك.",
  carry_h:"ما نوفّره", carry_p:"نعرض فقط ما هو متوفر. تُضاف منتجات وأقسام جديدة مع وصول المخزون.",
  weave_h:"السدو", weave_p1:"الأشرطة والنقوش في هذا الموقع مستوحاة من السدو، النسيج البدوي في الكويت: أشرطة أفقية بألوان طبيعية تفصلها صفوف من الأسنان والعيون.", weave_p2:"لكل منتج نقشه الخاص، كما يحمل كل شريط في السدو نقشه.",cart:"السلة",lang:"English",
  cart_n:n=>n===1?"منتج واحد في السلة":`${n} منتجات في السلة`,
  lead:"قائمة قصيرة من أدوات القهوة، نختارها ونوصّلها في الكويت.",
  t1:"في نفس اليوم للعاصمة وحولي للطلبات قبل الساعة 2 ظهرًا",
  t2:"التوصيل 1.500 د.ك لجميع مناطق الكويت",
  t3:"كي نت، بطاقة أو Apple Pay",
  see_all:"اعرض المنتجات الأربعة", loom_label:"منتجات كفي الأربعة",
  ask_price:"اسأل عن السعر", details:"التفاصيل", color_h:"اللون", choose_color:"اختر لونًا", view_colors:"عرض الألوان", d_close:"لقطة قريبة لرأس التحضير", d_side:"منظر جانبي", details_h:"نظرة أقرب", sold_out:"نفد", all_sold:"نفدت كل الألوان حاليًا. اسألنا عن موعد وصول الدفعة القادمة.", one_sold:"نفد حاليًا. اسألنا عن موعد وصول الدفعة القادمة.", out_ask:"نفد. اسألنا", wa_back:n=>`مرحبًا كفي، متى يتوفر ${n} من جديد؟`, add:"أضف إلى السلة", added:n=>`أُضيف ${n} إلى سلتك`,
  price_soon:"السعر عند الطلب. راسلنا ونرد عليك بسعر اليوم وموعد التوصيل.",
  wa_item:(n)=>`مرحبًا كفي، كم سعر ${n}، ومتى يمكن توصيله؟`,
  deliv_big:"اطلب قبل الساعة 2 ظهرًا ويصلك في العاصمة وحولي في اليوم نفسه.",
  d2:"التوصيل 1.500 د.ك لجميع مناطق الكويت", d3:"ادفع بالكي نت أو البطاقة أو Apple Pay",
  ask_h:"اسألنا أولًا", ask_p:"محتار أي ماكينة تناسب مطبخك أو قهوتك؟ راسلنا ونساعدك في الاختيار.",
  wa_open:"راسلنا عبر واتساب", copy:"انسخ الرقم", copied:"تم نسخ الرقم", copy_fail:"حدّد الرقم لنسخه",
  shop_h:"المتجر", home:"الرئيسية",
  f_about:"كفي تعني: يكفي. وبالشدّة، كفّي، تعني راحة يدي: كوب يكفي تمامًا، تحمله في يدك.",
  f_shop:"المتجر", f_help:"المساعدة", f_imprint:"كفي، الكويت. الأسعار بالدينار الكويتي.", f_credits:"لقطات التحضير:",
  qty:"الكمية", dec:"أقل", inc:"أكثر", remove:"إزالة", close:"أغلق السلة",
  cart_h:"سلتك", empty:"لم نصبّ شيئًا بعد. كل ما لدينا في المتجر.",
  subtotal:"المجموع الفرعي", delivery:"التوصيل", code_l:"كود الخصم", code_apply:"تطبيق", code_remove:"إزالة", code_on:(c,d)=>`تم تطبيق ${c}: خصم ${d}`, code_line:c=>`الخصم (${c})`, code_need:"اكتب كود الخصم أولًا.", code_fail:"تعذّر التحقق من الكود. حاول مرة أخرى.", free:"مجاني", total:"الإجمالي", checkout:"إتمام الطلب", shop_all:"اعرض المنتجات الأربعة",
  co_h:"إتمام الطلب", co_contact:"بيانات التواصل", co_addr:"عنوان التوصيل", co_pay:"الدفع", co_empty:"فنجالك فارغ، فلا يوجد ما تطلبه بعد.",
  f_name:"الاسم الكامل", f_phone:"رقم الهاتف", f_phone_help:"نرسل تحديثات التوصيل عبر واتساب.", f_gov:"المحافظة", f_choose:"اختر المحافظة",
  f_area:"المنطقة", f_block:"القطعة", f_street:"الشارع", f_avenue:"الجادة (اختياري)", f_house:"المنزل أو المبنى", f_notes:"ملاحظات للسائق (اختياري)",
  pay_knet:"كي نت", pay_card:"بطاقة ائتمان أو خصم", pay_apple:"Apple Pay", pay_cod:"الدفع عند الاستلام",
  place:"أكّد الطلب", demo:"الدفع الإلكتروني غير مفعّل بعد. عند تأكيد الطلب يُرسل إلينا عبر واتساب.",
  e_name:"اكتب اسمك الكامل.", e_phone:"اكتب رقم هاتف كويتي من 8 أرقام، مثل 6690 8820.", e_gov:"اختر محافظتك.",
  e_area:"اكتب منطقتك، مثل السالمية.", e_block:"اكتب رقم القطعة.", e_street:"اكتب الشارع.", e_house:"اكتب رقم المنزل أو المبنى.",
  e_sum:n=>n===1?"صحّح حقلًا واحدًا لإتمام طلبك":`صحّح ${n} حقول لإتمام طلبك`,
  ok_h:id=>`الطلب ${id} جاهز للإرسال`, ok_p:"أرسله عبر واتساب ونؤكد لك موعد التوصيل.", ok_send:"أرسل الطلب عبر واتساب", ok_back:"العودة إلى المتجر",
  wa_order:"مرحبًا كفي، أرغب بطلب:", wa_hello:"مرحبًا كفي، هل يمكن إرسال أسعار اليوم؟", notfound:"لم نجد هذا المنتج."}
};
const GOVS=[["capital","Capital","العاصمة"],["hawalli","Hawalli","حولي"],["farwaniya","Farwaniya","الفروانية"],["mubarak","Mubarak Al-Kabeer","مبارك الكبير"],["ahmadi","Ahmadi","الأحمدي"],["jahra","Jahra","الجهراء"]];

/* ===== helpers ===== */
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let lang=store.get("kafei-lang",(navigator.language||"en").toLowerCase().startsWith("ar")?"ar":"en");
const cartSaved=store.get("kafei-cart2",[]);
const okLine=l=>{const p=byId[l.id]; if(!p||p.price==null||p.out) return false; const c=colorOf(p,l.color); return p.colors&&p.colors.length?!!(c&&!c.out):!l.color;};
let cart=cartSaved.filter(okLine);
let lastOrder=null, openId=P[0].id, pendingFocus=false;
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const t=(k,...a)=>{const v=T[lang][k]??T.en[k];return typeof v==="function"?v(...a):v??k};
const L=o=>o==null?"":(typeof o==="string"?o:o[lang]??o.en);
const other=o=>lang==="ar"?o.en:o.ar;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=f=>{const v=(f/1000).toFixed(3);return lang==="ar"?`${v} د.ك`:`KWD ${v}`};
const wa=text=>`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const ICON={
  wa:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.6 19z"/><path d="M9.2 8.6c.2 2.9 2.4 5.3 5.4 5.9l1-1.2-1.8-.9-.8.7a4.8 4.8 0 0 1-2.4-2.4l.7-.8-.9-1.8z"/></svg>`,
  truck:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>`,
  tag:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/></svg>`,
  card:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13"/><path d="M3 10h18M7 15h4"/></svg>`,
  close:`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`
};

