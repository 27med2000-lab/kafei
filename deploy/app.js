(function(){
"use strict";
/* ===== settings: change these ===== */
const CONFIG = {
  phoneDisplay: "+965 6690 8822",
  whatsapp: "96566908822",
  phoneVerified: true,
  freeOver: 15000, fee: 1500,     // fils
  // Online payment (MyFatoorah). Works where the /api functions are deployed; the claude.ai demo falls back to WhatsApp.
  // Customer accounts (Supabase). Paste your project URL and anon (public) key from Supabase > Project Settings > API.
  // The anon key is safe in the page: the row-level security in supabase/schema.sql decides what each customer can see.
  // Customer accounts (Supabase). The publishable key is public by design; the database rules decide what each customer can see.
  // Off on the claude.ai preview (it can't reach Supabase); on everywhere else.
  accounts: (/^https?:$/.test(location.protocol) && !/claude|anthropic/i.test(location.hostname)) ? { url: "https://gupwztbbazuusnimjkvt.supabase.co", anonKey: "sb_publishable_TqNf6lA2qlFbYbVpsDcxjg_r8Gbf70p" } : null,
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
 {id:"espresso-machines", motif:"tree", band:"caramel", name:{en:"Espresso machines",ar:"مكائن الإسبريسو"}},
 {id:"pourover-machines", motif:"eyes", band:"espresso", name:{en:"Pour-over machines",ar:"مكائن التقطير"}},
 {id:"beans", motif:"grain", band:"cream", name:{en:"Beans",ar:"البن"}, subs:[{id:"filter",name:{en:"Filter beans",ar:"بن للتقطير"}},{id:"espresso",name:{en:"Espresso beans",ar:"بن للإسبريسو"}}]},
 {id:"pourover-accessories", motif:"tri", band:"coffee", name:{en:"Pour-over accessories",ar:"أدوات التقطير"}},
 {id:"espresso-accessories", motif:"zig", band:"caramel", name:{en:"Espresso accessories",ar:"أدوات الإسبريسو"}},
 {id:"cups", motif:"comb", band:"espresso", name:{en:"Cups",ar:"الأكواب"}},
 {id:"tumblers", motif:"cross", band:"coffee", name:{en:"Tumblers",ar:"الأكواب الحافظة"}},
 {id:"grinders", motif:"zig", band:"cream", name:{en:"Grinders",ar:"المطاحن"}, subs:[{id:"manual",name:{en:"Manual grinders",ar:"مطاحن يدوية"}},{id:"electric",name:{en:"Electric grinders",ar:"مطاحن كهربائية"}}]}
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
  fx_same:"Same day", fx_fee:"Delivery fee", fx_pay:"Payment", fx_fee_v:"Free over KWD 15. Under that, KWD 1.500.", fx_pay_v:"KNET, card or Apple Pay.", fx_same_v:"Order before 2 pm and it reaches the Capital and Hawalli the same day.",
  how_h:"How ordering works", st1:"Choose a product and tap Ask for price, or add it to your cart.", st2:"We reply on WhatsApp with the price and the delivery time.", st3:"Pay by KNET, card or Apple Pay.",
  far_h:"Outside the Capital and Hawalli?", far_p:"Message us and we'll tell you the delivery day for your area.", far_wa:"Hello Kafei, when can you deliver to my area?",
  about_h:"About us", about_lead:"Kafei sells a short list of coffee machines and beans in Kuwait, in Arabic and English.",
  name_h:"The name", name_p1:"كفي means enough. Say it with a shadda, كفّي, and it means my palm.", name_p2:"We liked both: a cup that is exactly enough, held in your hand.",
  carry_h:"What we carry", carry_p:"We list only what is in stock. More products and categories open as stock arrives.",
  weave_h:"The weave", weave_p1:"The bands and patterns on this site come from Al Sadu, the Bedouin weaving of Kuwait: horizontal bands in natural colours, divided by rows of teeth and eyes.", weave_p2:"Each product has its own motif, the way each Sadu band carries its own pattern.",cart:"Cart",lang:"العربية",
  cart_n:n=>n===1?"1 item in cart":`${n} items in cart`,
  lead:"A short list of coffee gear, chosen and delivered in Kuwait.",
  t1:"Same day in the Capital and Hawalli when you order before 2 pm",
  t2:"Free delivery over KWD 15, otherwise KWD 1.500",
  t3:"KNET, card or Apple Pay",
  see_all:"See all four", loom_label:"Kafei's four products",
  ask_price:"Ask for price", details:"Details", color_h:"Colour", choose_color:"Choose a colour", view_colors:"View colours", d_close:"close-up of the brewing head", d_side:"side view", details_h:"Closer look", sold_out:"sold out", all_sold:"Every colour is sold out right now. Ask us when the next ones arrive.", one_sold:"Sold out right now. Ask us when the next ones arrive.", out_ask:"Sold out. Ask us", wa_back:n=>`Hello Kafei, when will the ${n} be back in stock?`, add:"Add to cart", added:n=>`Added ${n} to your cart`,
  price_soon:"Price on request. Message us and we'll reply with today's price and delivery time.",
  wa_item:(n)=>`Hello Kafei, what is the price of the ${n}, and when can you deliver it?`,
  deliv_big:"Order before 2 pm and it reaches the Capital and Hawalli the same day.",
  d2:"Free over KWD 15. Under that, KWD 1.500", d3:"Pay with KNET, card or Apple Pay",
  ask_h:"Ask us first", ask_p:"Not sure which machine suits your counter or your coffee? Send us a message and we'll help you choose.",
  wa_open:"Message on WhatsApp", copy:"Copy number", copied:"Number copied", copy_fail:"Select the number to copy it",
  shop_h:"Shop", home:"Home",
  f_about:"كفي means enough. With a shadda, كفّي, it means my palm: a cup that is exactly enough, held in your hand.",
  f_shop:"Shop", f_help:"Help", f_imprint:"Kafei, Kuwait. Prices in Kuwaiti dinar.", f_credits:"Brewing footage:",
  qty:"Quantity", dec:"Fewer", inc:"More", remove:"Remove", close:"Close cart",
  cart_h:"Your cart", empty:"Nothing poured yet. Everything we have in stock is in the shop.",
  subtotal:"Subtotal", delivery:"Delivery", free:"Free", total:"Total", checkout:"Checkout", shop_all:"See all four",
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
  fx_same:"في نفس اليوم", fx_fee:"رسوم التوصيل", fx_pay:"الدفع", fx_fee_v:"مجاني فوق 15 د.ك، وأقل من ذلك 1.500 د.ك.", fx_pay_v:"كي نت، بطاقة أو Apple Pay.", fx_same_v:"اطلب قبل الساعة 2 ظهرًا ويصلك في العاصمة وحولي في اليوم نفسه.",
  how_h:"كيف تطلب", st1:"اختر المنتج واضغط «اسأل عن السعر»، أو أضفه إلى السلة.", st2:"نرد عليك عبر واتساب بالسعر وموعد التوصيل.", st3:"ادفع بالكي نت أو البطاقة أو Apple Pay.",
  far_h:"خارج العاصمة وحولي؟", far_p:"راسلنا ونخبرك بيوم التوصيل لمنطقتك.", far_wa:"مرحبًا كفي، متى يمكن التوصيل لمنطقتي؟",
  about_h:"من نحن", about_lead:"كفي متجر يبيع قائمة قصيرة من مكائن القهوة والبن في الكويت، بالعربية والإنجليزية.",
  name_h:"الاسم", name_p1:"كفي تعني: يكفي. وبالشدّة، كفّي، تعني راحة يدي.", name_p2:"أحببنا المعنيين: كوب يكفي تمامًا، تحمله في يدك.",
  carry_h:"ما نوفّره", carry_p:"نعرض فقط ما هو متوفر. تُضاف منتجات وأقسام جديدة مع وصول المخزون.",
  weave_h:"السدو", weave_p1:"الأشرطة والنقوش في هذا الموقع مستوحاة من السدو، النسيج البدوي في الكويت: أشرطة أفقية بألوان طبيعية تفصلها صفوف من الأسنان والعيون.", weave_p2:"لكل منتج نقشه الخاص، كما يحمل كل شريط في السدو نقشه.",cart:"السلة",lang:"English",
  cart_n:n=>n===1?"منتج واحد في السلة":`${n} منتجات في السلة`,
  lead:"قائمة قصيرة من أدوات القهوة، نختارها ونوصّلها في الكويت.",
  t1:"في نفس اليوم للعاصمة وحولي للطلبات قبل الساعة 2 ظهرًا",
  t2:"توصيل مجاني فوق 15 د.ك، وإلا 1.500 د.ك",
  t3:"كي نت، بطاقة أو Apple Pay",
  see_all:"اعرض المنتجات الأربعة", loom_label:"منتجات كفي الأربعة",
  ask_price:"اسأل عن السعر", details:"التفاصيل", color_h:"اللون", choose_color:"اختر لونًا", view_colors:"عرض الألوان", d_close:"لقطة قريبة لرأس التحضير", d_side:"منظر جانبي", details_h:"نظرة أقرب", sold_out:"نفد", all_sold:"نفدت كل الألوان حاليًا. اسألنا عن موعد وصول الدفعة القادمة.", one_sold:"نفد حاليًا. اسألنا عن موعد وصول الدفعة القادمة.", out_ask:"نفد. اسألنا", wa_back:n=>`مرحبًا كفي، متى يتوفر ${n} من جديد؟`, add:"أضف إلى السلة", added:n=>`أُضيف ${n} إلى سلتك`,
  price_soon:"السعر عند الطلب. راسلنا ونرد عليك بسعر اليوم وموعد التوصيل.",
  wa_item:(n)=>`مرحبًا كفي، كم سعر ${n}، ومتى يمكن توصيله؟`,
  deliv_big:"اطلب قبل الساعة 2 ظهرًا ويصلك في العاصمة وحولي في اليوم نفسه.",
  d2:"مجاني فوق 15 د.ك، وأقل من ذلك 1.500 د.ك", d3:"ادفع بالكي نت أو البطاقة أو Apple Pay",
  ask_h:"اسألنا أولًا", ask_p:"محتار أي ماكينة تناسب مطبخك أو قهوتك؟ راسلنا ونساعدك في الاختيار.",
  wa_open:"راسلنا عبر واتساب", copy:"انسخ الرقم", copied:"تم نسخ الرقم", copy_fail:"حدّد الرقم لنسخه",
  shop_h:"المتجر", home:"الرئيسية",
  f_about:"كفي تعني: يكفي. وبالشدّة، كفّي، تعني راحة يدي: كوب يكفي تمامًا، تحمله في يدك.",
  f_shop:"المتجر", f_help:"المساعدة", f_imprint:"كفي، الكويت. الأسعار بالدينار الكويتي.", f_credits:"لقطات التحضير:",
  qty:"الكمية", dec:"أقل", inc:"أكثر", remove:"إزالة", close:"أغلق السلة",
  cart_h:"سلتك", empty:"لم نصبّ شيئًا بعد. كل ما لدينا في المتجر.",
  subtotal:"المجموع الفرعي", delivery:"التوصيل", free:"مجاني", total:"الإجمالي", checkout:"إتمام الطلب", shop_all:"اعرض المنتجات الأربعة",
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


/* ===== v3 copy ===== */
Object.assign(T.en,{hero_cta:"See what's in stock",pour_p:"What we have on the counter today, poured for you one at a time.",meter:"Products in stock",
  deliv_h:"Same day in the Capital and Hawalli",deliv_sub:"Order before 2 pm.",back:"Back to",
  custom:"In the Gulf, you shake your finjan when you've had enough. That little shake is our name.",
  brand:"Not sure which one suits your counter? Ask us on WhatsApp before you buy.",
  nf_h:"Nothing poured here",nf_p:"This page doesn't exist. The shop is one tap away.",nf_btn:"Go to the shop",acct_signin:"Sign in",sending:"Sending code…",verifying:"Checking the code…",saving:"Saving…",e_link:"That sign-in didn't finish. Try again, or sign in with your email and password.",e_wait:n=>`We just sent you a code. Check your email (and spam folder), or wait ${n} seconds to ask for a new one.`,acct_mine:"Your account",acct_h_in:"Sign in to Kafei",acct_p_in:"We email you a sign-in code. No password needed, and checkout works without an account.",f_email:"Email",send_code:"Send code",code_sent:e=>`We sent a code to ${e}. Use the newest email: each new code replaces the last one.`,f_code:"Code from the email",sign_in:"Sign in",other_email:"Use another email",acct_h:"Your account",saved_h:"Saved details",saved_p:"Checkout fills these in for you.",save:"Save details",saved:"Details saved",orders_h:"Your orders",no_orders:"No orders yet. Orders you pay online appear here.",sign_out:"Sign out",e_email:"Enter an email address, for example name@gmail.com.",e_code:"That code didn't work. Use the code from the newest email, or request a new one.",e_send:"We couldn't send the code. Wait a minute and try again.",e_save:"Your details weren't saved. Check the phone number and try again.",save_addr:"Save these details to my account",st_pending:"Waiting for payment",st_paid:"Paid",st_failed:"Not paid",st_sent:"Sent on WhatsApp",demo_code:"Demo: no email is sent. Your code is",loading:"Loading",paying:"Opening the secure payment page",pay_fail:"The payment page could not open. Try again, or choose another payment method.",cod_instead:"Pay cash on delivery instead",demo_live:"KNET, card and Apple Pay open MyFatoorah's secure page.",checking:"Checking your payment",paid_h:id=>`Paid. Order ${id} is ours to deliver`,paid_p:"We have your payment. Send the order on WhatsApp so we can confirm the delivery time.",paid_send:"Send order on WhatsApp",unpaid_h:"Payment not completed",unpaid_p:"Nothing was charged, and your cart is still here. Try again, or choose another payment method.",back_co:"Back to checkout",check_fail:"We couldn't confirm the payment yet. Message us on WhatsApp with your order number and we'll check.",soon_line:"Not in stock yet:",wa_hello_soon:"Hello Kafei, I'm looking for something you don't list yet.",ask_wa_short:"WhatsApp"});
Object.assign(T.ar,{hero_cta:"شاهد المتوفر",pour_p:"ما لدينا اليوم، نصبّه لك واحدًا تلو الآخر.",meter:"المنتجات المتوفرة",
  deliv_h:"في نفس اليوم للعاصمة وحولي",deliv_sub:"اطلب قبل الساعة 2 ظهرًا.",back:"العودة إلى",
  custom:"في الخليج، تهزّ فنجالك حين تكتفي. ومن هذه الهزّة جاء اسمنا.",
  brand:"محتار أيها يناسب مطبخك؟ اسألنا عبر واتساب قبل الشراء.",
  nf_h:"لم نصبّ شيئًا هنا",nf_p:"هذه الصفحة غير موجودة. المتجر على بعد نقرة.",nf_btn:"اذهب إلى المتجر",acct_signin:"تسجيل الدخول",sending:"جارٍ إرسال الرمز…",verifying:"جارٍ التحقق من الرمز…",saving:"جارٍ الحفظ…",e_link:"لم يكتمل تسجيل الدخول. حاول مرة أخرى، أو ادخل ببريدك وكلمة المرور.",e_wait:n=>`أرسلنا لك رمزًا للتو. تحقق من بريدك (ومجلد الرسائل غير المرغوب فيها)، أو انتظر ${n} ثانية لطلب رمز جديد.`,acct_mine:"حسابك",acct_h_in:"سجّل الدخول إلى كفي",acct_p_in:"نرسل لك رمز دخول بالبريد. لا حاجة لكلمة مرور، ويمكنك الطلب دون حساب.",f_email:"البريد الإلكتروني",send_code:"أرسل الرمز",code_sent:e=>`أرسلنا رمزًا إلى ${e}. استخدم أحدث رسالة: كل رمز جديد يلغي الرمز السابق.`,f_code:"الرمز من البريد",sign_in:"دخول",other_email:"استخدم بريدًا آخر",acct_h:"حسابك",saved_h:"بياناتك المحفوظة",saved_p:"نملؤها لك عند إتمام الطلب.",save:"احفظ البيانات",saved:"تم حفظ البيانات",orders_h:"طلباتك",no_orders:"لا توجد طلبات بعد. تظهر هنا الطلبات المدفوعة إلكترونيًا.",sign_out:"تسجيل الخروج",e_email:"اكتب بريدًا إلكترونيًا، مثل name@gmail.com.",e_code:"لم يعمل هذا الرمز. استخدم الرمز من أحدث رسالة، أو اطلب رمزًا جديدًا.",e_send:"تعذّر إرسال الرمز. انتظر دقيقة وحاول مرة أخرى.",e_save:"لم تُحفظ بياناتك. تحقق من رقم الهاتف وحاول مرة أخرى.",save_addr:"احفظ هذه البيانات في حسابي",st_pending:"بانتظار الدفع",st_paid:"مدفوع",st_failed:"لم يُدفع",st_sent:"أُرسل عبر واتساب",demo_code:"تجربة: لا يُرسل بريد. رمزك هو",loading:"جارٍ التحميل",paying:"جارٍ فتح صفحة الدفع الآمنة",pay_fail:"تعذّر فتح صفحة الدفع. حاول مرة أخرى، أو اختر طريقة دفع أخرى.",cod_instead:"ادفع نقدًا عند الاستلام بدلًا من ذلك",demo_live:"الكي نت والبطاقة وApple Pay تفتح صفحة ماي فاتورة الآمنة.",checking:"نتحقق من الدفع",paid_h:id=>`تم الدفع. الطلب ${id} جاهز للتوصيل`,paid_p:"وصلنا الدفع. أرسل الطلب عبر واتساب لنؤكد لك موعد التوصيل.",paid_send:"أرسل الطلب عبر واتساب",unpaid_h:"لم يكتمل الدفع",unpaid_p:"لم يُخصم أي مبلغ، وسلتك كما هي. حاول مرة أخرى أو اختر طريقة دفع أخرى.",back_co:"العودة إلى إتمام الطلب",check_fail:"لم نتمكن من تأكيد الدفع بعد. راسلنا عبر واتساب برقم الطلب وسنتحقق.",soon_line:"غير متوفر بعد:",wa_hello_soon:"مرحبًا كفي، أبحث عن منتج غير معروض لديكم بعد.",ask_wa_short:"واتساب"});

/* ===== shared parts ===== */
const arName=o=>`<p class="ar2"><bdi lang="${lang==="ar"?"en":"ar"}" dir="${lang==="ar"?"ltr":"rtl"}">${esc(other(o))}</bdi></p>`;
const cName=(p,c)=>L(p.name)+(c?` (${L(c.name)})`:"");
function askLink(p,cls="btn",c=null,id=""){
  if(p.out) return `<a class="${cls}" ${id?`id="${id}"`:""} href="${wa(t("wa_back",cName(p,c)))}" target="_blank" rel="noopener">${cls==="btn"?ICON.wa:""}<span>${t("out_ask")}</span></a>`;
  if(p.price==null) return `<a class="${cls}" ${id?`id="${id}"`:""} href="${wa(t("wa_item",cName(p,c)))}" target="_blank" rel="noopener">${cls==="btn"?ICON.wa:""}<span>${t("ask_price")}</span></a>`;
  if(p.colors&&p.colors.length) return `<a class="${cls}" href="#p-${p.id}"><span>${t("view_colors")}</span></a><span class="price-note num">${money(p.price)}</span>`;
  return `<button class="${cls}" type="button" data-add="${p.id}"><span>${t("add")}, <span class="num">${money(p.price)}</span></span></button>`;
}
function photo(p,eager){ return `<img src="${p.img}" alt="${esc(L(p.name))}" ${p.fit==="contain"?'class="contain"':""} ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async" width="800" height="1000">`; }
const vessel=(p,eager,attrs="")=>`<div class="vessel" ${attrs}>${p?photo(p,eager):""}</div>`;
const inCat=(c,sb)=>P.filter(p=>p.cat===c.id&&(!sb||p.sub===sb));
const crumbs=items=>`<ol class="crumbs">${items.map(([h,l],i)=>i===items.length-1?`<li aria-current="page">${esc(l)}</li>`:`<li><a href="#${h}">${esc(l)}</a></li>`).join("")}</ol>`;
const WAVE=`<svg viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 14C20 6 40 6 60 14S100 22 120 14S160 6 180 14S220 22 240 14V28H0Z"/></svg>`;
const FINJAN=(cls="")=>`<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="fj-${cls||"x"}"><path d="M22 16H78C77 38 71 60 61 69Q58 72 54 72H46Q42 72 39 69C29 60 23 38 22 16Z"/></clipPath></defs><g transform="translate(0 4) rotate(-9 50 72)"><g clip-path="url(#fj-${cls||"x"})"><rect class="fj-level" x="0" y="${cls==="finjan"?40:76}" width="100" height="100" fill="#B9824B"/></g><path d="M22 16H78C77 38 71 60 61 69Q58 72 54 72H46Q42 72 39 69C29 60 23 38 22 16Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/></g><path d="M11.5 58.5C12.5 82 37 95 60 90C76.5 86.4 87.5 73 92.5 53.5Q93.4 50.2 91.2 52.4C84.4 68.6 74.4 78.2 60.2 81.2C41.6 85 24.2 78.2 20.6 61.6Q19.8 56.4 15.4 56.2Q11.4 56.2 11.5 58.5Z" fill="currentColor"/></svg>`;
function soonLine(){ const e=CATS.filter(c=>!inCat(c).length); return e.length?`<p class="soonline"><span>${t("soon_line")}</span> ${e.map(c=>`<a href="#shop-${c.id}">${esc(L(c.name))}</a>`).join(lang==="ar"?"، ":", ")}. <a class="textlink" href="${wa(t("wa_hello_soon"))}" target="_blank" rel="noopener">${t("ask_wa")}</a></p>`:""; }
function catList(skip,stockedOnly){
  return `<ul class="catlist">${CATS.filter(c=>c.id!==skip&&(!stockedOnly||inCat(c).length)).map(c=>{const n=inCat(c).length;
    return `<li><a href="#shop-${c.id}"><b>${esc(L(c.name))}</b><span class="ar2" lang="${lang==="ar"?"en":"ar"}">${esc(other(c.name))}</span><span class="ct${n?" has":""}">${n?t("n_products",n):t("n_none")}</span></a></li>`}).join("")}</ul>`;
}

/* ===== views ===== */
function viewHome(){
  const cups=P.map((p,i)=>`<li class="cup${i===0?" on":""}" data-i="${i}">
      <div class="vessel">${photo(p,i===0)}<div class="surface" aria-hidden="true">${WAVE}</div></div>
      <div class="cup-copy"><h3><a href="#p-${p.id}">${esc(L(p.name))}</a></h3>${arName(p.name)}<p class="kind">${esc(L(p.kind))}</p><p class="what">${esc(L(p.what))}</p>
      <p class="acts">${askLink(p)}${p.colors&&p.colors.length&&p.price!=null?"":`<a class="textlink" href="#p-${p.id}">${t("details")}</a>`}</p></div></li>`).join("");
  const meter=P.length<2?"":`<div class="meter">${FINJAN("meter-cup")}<ol aria-label="${t("meter")}">${P.map((p,i)=>`<li><button type="button" data-pour="${i}" ${i===0?'aria-current="true"':""}><span class="dot" aria-hidden="true"></span><span class="nm">${esc(L(p.name))}</span><span class="sr">${esc(L(p.name))}</span></button></li>`).join("")}</ol></div>`;
  return `<section class="hero" aria-labelledby="heroH"><img class="poster" src="img/hero-1280.webp" srcset="img/hero-760.webp 760w, img/hero-1280.webp 1280w" sizes="100vw" alt="" fetchpriority="high" width="1280" height="720"><video muted loop playsinline preload="none" aria-hidden="true" data-src="img/hero-pourover.mp4"></video>
    <div class="wrap hero-in"><div class="hero-copy"><h1 id="heroH" aria-label="Kafei, كفي"><span class="w" aria-hidden="true">${[..."Kafei"].map(c=>`<span class="ch">${c}</span>`).join("")}</span><span class="ar" lang="ar" aria-hidden="true"><span>كفي</span></span></h1>
    <p class="lead" data-intro>${t("custom")}</p><a class="btn" href="#stock" data-intro><span>${t("hero_cta")}</span></a></div></div></section>
  <section class="pour sec" id="stock" style="--n:${P.length}" aria-labelledby="stockH"><div class="stage wrap">
    <div class="pour-head"><h2 id="stockH">${t("stock_h")}</h2><p>${t("pour_p")}</p></div>
    <ol class="serve">${cups}</ol>${meter}</div></section>
  ${catRail()}${brandRail()}
  <section class="strip" aria-labelledby="delH"><div class="wrap"><h2 id="delH" class="sr">${t("nav_delivery")}</h2>
    <ul><li>${ICON.truck}<span><b>${t("deliv_h")}</b> ${t("deliv_sub")}</span></li><li>${ICON.tag}<span>${t("d2")}</span></li><li>${ICON.card}<span>${t("d3")}</span></li></ul>
    <a class="textlink" href="#delivery">${t("deliv_more")}</a></div></section>`;
}
function prow(p){
  return `<li class="prow">${vessel(p)}<div><h2><a href="#p-${p.id}">${esc(L(p.name))}</a></h2>${arName(p.name)}<p class="kind">${esc(L(p.kind))}</p></div>${askLink(p,"textlink")}</li>`;
}
function viewShop(){
  return `<div class="wrap page-head">${crumbs([["home",t("home")],["shop",t("shop_h")]])}<h1 data-rise>${t("shop_h")}</h1><p class="lead">${t("shop_lead")}</p>
    <nav class="chips" aria-label="${t("cats_label")}"><a href="#shop" aria-current="page">${t("all")} <span>${P.length}</span></a>${CATS.filter(c=>inCat(c).length).map(c=>`<a href="#shop-${c.id}">${esc(L(c.name))} <span>${inCat(c).length}</span></a>`).join("")}</nav></div>
  <div class="wrap"><ul class="plist">${P.map(prow).join("")}</ul></div>`;
}
function viewCategory(c,sb){
  const s=sb&&c.subs?c.subs.find(x=>x.id===sb):null, list=inCat(c,s&&s.id), nm=s?s.name:c.name;
  const chips=c.subs?`<nav class="chips" aria-label="${esc(L(c.name))}"><a href="#shop-${c.id}" ${s?"":'aria-current="page"'}>${t("all")} <span>${inCat(c).length}</span></a>${c.subs.map(x=>`<a href="#shop-${c.id}-${x.id}" ${s&&s.id===x.id?'aria-current="page"':""}>${esc(L(x.name))} <span>${inCat(c,x.id).length}</span></a>`).join("")}</nav>`:"";
  const tr=[["home",t("home")],["shop",t("shop_h")],["shop-"+c.id,L(c.name)]]; if(s) tr.push(["",L(s.name)]);
  const body=list.length?`<ul class="plist">${list.map(prow).join("")}</ul>`
    :`<div class="soon">${vessel(null)}<div><h2>${t("soon_h")}</h2><p>${esc(t("soon_p",L(nm)))}</p><a class="textlink" href="${wa(t("soon_wa",L(nm)))}" target="_blank" rel="noopener">${t("ask_wa")}</a></div></div>`;
  return `<div class="wrap page-head">${crumbs(tr)}<h1 data-rise>${esc(L(nm))}</h1>${arName(nm)}${chips}</div>
  <div class="wrap">${body}</div>
  <section class="sec wrap" aria-labelledby="otherH"><div class="cats-head"><h2 id="otherH" data-rise>${t("other_cats")}</h2></div>${catList(c.id)}</section>`;
}
function swatches(p,sel){
  if(!p.colors||!p.colors.length) return "";
  return `<fieldset class="swatches"><legend>${t("color_h")}: <b id="swName">${sel?esc(L(sel.name)):t("sold_out")}</b></legend><div class="sw-row">${p.colors.map(c=>`<label class="sw${c.out?" out":""}" title="${esc(L(c.name))}${c.out?", "+t("sold_out"):""}"><input type="radio" name="pcolor" value="${esc(c.id)}" ${c===sel?"checked":""} ${c.out?"disabled":""}><span class="dot" style="--c:${esc(c.hex||"#ccc")};--t:${esc(c.trim||c.hex||"#ccc")}" aria-hidden="true"></span><span class="sr">${esc(L(c.name))}${c.out?", "+t("sold_out"):""}</span></label>`).join("")}</div></fieldset>`;
}
/* two close views of the chosen colour, on their own black studio background */
function detailTiles(p,sel){
  const d=sel&&sel.details; if(!d||d.length<2) return "";
  return `<ul class="details" aria-label="${t("details_h")}">${["d_close","d_side"].map((k,i)=>`<li><img src="${d[i]}" alt="${esc(cName(p,sel))}, ${t(k)}" loading="lazy" decoding="async" width="880" height="1100" data-detail="${i}"></li>`).join("")}</ul>`;
}
function viewProduct(p){
  const c=catById[p.cat], hasC=!!(p.colors&&p.colors.length), sel=firstColor(p), allOut=(hasC&&!sel)||!!p.out;
  const shown=sel?{...p,img:sel.img||p.img,name:{en:`${p.name.en} (${sel.name.en})`,ar:`${p.name.ar} (${sel.name.ar})`}}:p;
  const facts=p.facts?`<dl class="facts">${p.facts.map(f=>`<dt>${lang==="ar"?f[1]:f[0]}</dt><dd>${lang==="ar"?f[3]:f[2]}</dd>`).join("")}</dl>`:"";
  const acts=p.price==null||allOut?`<div class="acts sticky">${askLink(allOut?{...p,out:true}:{...p,price:null},"btn",sel,"pdpAsk")}</div>`
    :`<div class="acts sticky"><div class="stepper" role="group" aria-label="${t("qty")}"><button type="button" data-pq="-1" aria-label="${t("dec")}">−</button><output id="pq">1</output><button type="button" data-pq="1" aria-label="${t("inc")}">+</button></div><button class="btn" type="button" id="pdpAdd" data-pid="${p.id}"><span>${t("add")}</span></button></div>`;
  return `<div class="wrap page-head">${crumbs([["home",t("home")],["shop-"+c.id,L(c.name)],["",L(p.name)]])}</div>
  <div class="wrap pdp"><div class="stage-col">${vessel(shown,true,'data-pourin')}${detailTiles(p,sel)}</div>
    <div class="copy"><h1>${esc(L(p.name))}</h1>${arName(p.name)}<p class="kind">${esc(L(p.kind))}</p><p class="what">${esc(L(p.what))}</p><p class="desc">${esc(L(p.desc))}</p>${facts}
    ${swatches(p,sel)}${allOut?`<p class="desc">${t(hasC?"all_sold":"one_sold")}</p>`:p.price==null?`<p class="desc">${t("price_soon")}</p>`:`<p class="price num">${money(p.price)}</p>`}${acts}<p><a class="textlink" href="#shop-${c.id}">${t("back")} ${esc(L(c.name))}</a></p></div></div>`;
}
function viewDelivery(){
  return `<div class="wrap page-head">${crumbs([["home",t("home")],["",t("deliv_page_h")]])}<h1 data-rise>${t("deliv_page_h")}</h1><p class="lead">${t("deliv_big")}</p></div>
  <div class="wrap"><dl class="dl">${[["fx_same","fx_same_v"],["fx_fee","fx_fee_v"],["fx_pay","fx_pay_v"]].map(([a,b])=>`<div><dt>${t(a)}</dt><dd>${t(b)}</dd></div>`).join("")}</dl></div>
  <section class="sec wrap split" aria-labelledby="howH"><h2 id="howH" data-rise>${t("how_h")}</h2><ol class="steps"><li>${t("st1")}</li><li>${t("st2")}</li><li>${t("st3")}</li></ol></section>
  <section class="wrap split" aria-labelledby="farH"><h2 id="farH" data-rise>${t("far_h")}</h2><div><p>${t("far_p")}</p><p style="margin-top:24px"><a class="btn" href="${wa(t("far_wa"))}" target="_blank" rel="noopener">${ICON.wa}<span>${t("wa_open")}</span></a></p></div></section>`;
}
function viewAbout(){
  return `<div class="wrap page-head">${crumbs([["home",t("home")],["",t("about_h")]])}<h1 data-rise>${t("about_h")}</h1><p class="lead">${t("about_lead")}</p></div>
  <section class="wrap split" aria-labelledby="nameH"><div><h2 id="nameH" data-rise>${t("name_h")}</h2><p class="big-ar" lang="ar">كفي</p></div><div style="padding-top:12px"><p>${t("name_p1")}</p><p>${t("name_p2")}</p></div></section>
  <section class="sec wrap split" aria-labelledby="carryH"><div><h2 id="carryH" data-rise>${t("carry_h")}</h2><p style="margin-top:16px;color:var(--muted)">${t("carry_p")}</p></div>
    <ul class="brands">${P.map(p=>`<li><a href="#p-${p.id}"><b>${esc(L(p.name))}</b><span>${esc(L(p.kind))}</span></a></li>`).join("")}</ul></section>
  <section class="wrap split" aria-labelledby="askH"><h2 id="askH" data-rise>${t("ask_h")}</h2><div><p>${t("ask_p")}</p><p style="margin-top:24px"><a class="btn" href="${wa(t("wa_hello"))}" target="_blank" rel="noopener">${ICON.wa}<span>${t("wa_open")}</span></a></p></div></section>`;
}
/* sign-in links in emails come back as kafeikw.com/#access_token=...&refresh_token=... (or #error_description=... when expired).
   Keep the tokens for Supabase, take them out of the address bar, and show the account page. */
let authReturn=null;
(function(){ const h=location.hash.slice(1); if(!/(^|&)(access_token|error_description|error_code)=/.test(h)) return;
  authReturn=Object.fromEntries(new URLSearchParams(h)); history.replaceState(null,"",location.pathname+location.search+"#account"); })();
/* return from MyFatoorah: confirm with the server, never with the redirect alone */
let payReturn=null;
(function(){ const q=new URLSearchParams(location.search.slice(1).replace(/\?/g,"&")); if(!q.get("pay")) return;
  payReturn={kind:q.get("pay"),order:q.get("order")||"",track:q.get("paymentId")||q.get("paymentid")||q.get("PaymentId")||"",state:"checking"};
  history.replaceState(null,"",location.pathname+"#paid"); })();
function viewPaid(){
  const p=payReturn, pend=store.get("kafei-pending",null);
  if(!p) return view404();
  if(p.state==="checking"){
    if(!(p.kind==="return"&&p.track&&CONFIG.payments)){ p.state=p.kind==="return"?"unknown":"unpaid"; }
    else { fetch(CONFIG.payments.status+"?payment_id="+encodeURIComponent(p.track)).then(r=>r.json()).then(d=>{ p.state=d.paid?"paid":(d.final===false?"unknown":"unpaid"); p.method=d.method; },()=>{ p.state="unknown"; }).then(()=>{ if(location.hash==="#paid") swap(); });
      return `<div class="wrap page-head"><h1>${t("checking")}</h1></div>`; }
  }
  if(p.state==="paid"){
    if(cart.length){ cart=[]; saveCart(); }
    const text=(pend&&pend.wa?pend.wa+"\n":"")+`${lang==="ar"?"مدفوع":"Paid"}: ${p.method||"MyFatoorah"}, ${lang==="ar"?"رقم الدفع":"payment"} ${p.track}`;
    store.set("kafei-pending",null);
    return `<div class="wrap page-head"><h1>${esc(t("paid_h",p.order||(pend&&pend.id)||""))}</h1><p class="lead">${t("paid_p")}</p><p style="display:flex;flex-wrap:wrap;gap:10px;margin-top:28px"><a class="btn" href="${wa(text)}" target="_blank" rel="noopener">${ICON.wa}<span>${t("paid_send")}</span></a><a class="btn ghost" href="#shop"><span>${t("ok_back")}</span></a></p></div>`;
  }
  if(p.state==="unknown") return `<div class="wrap page-head"><h1>${t("checking")}</h1><p class="lead">${t("check_fail")}</p><p style="display:flex;flex-wrap:wrap;gap:10px;margin-top:28px"><a class="btn" href="${wa((p.order||"")+" "+p.track)}" target="_blank" rel="noopener">${ICON.wa}<span>${t("wa_open")}</span></a></p></div>`;
  return `<div class="wrap page-head"><h1>${t("unpaid_h")}</h1><p class="lead">${t("unpaid_p")}</p><p style="display:flex;flex-wrap:wrap;gap:10px;margin-top:28px"><a class="btn" href="#checkout"><span>${t("back_co")}</span></a><a class="btn ghost" href="#shop"><span>${t("ok_back")}</span></a></p></div>`;
}
/* ===== customer accounts (Supabase): email code sign-in, saved details, order history ===== */
let sb=null, sbUser=null, sbProfile=null, sbReady=null, acctStep="signin", acctEmail="", acctMsg="";
const accountsDemo=()=>!!(CONFIG.accounts&&CONFIG.accounts.demo);
const accountsOn=()=>!!(CONFIG.accounts&&(accountsDemo()||(/^https?:$/.test(location.protocol)&&!/claude|anthropic/i.test(location.hostname))));
/* demo stand-in for Supabase: same calls, kept in this browser. Used only when CONFIG.accounts.demo is true. */
let demoCode="";
function demoClient(){
  const K="kafei-demo-accounts", load=()=>store.get(K,{users:{},session:null,profiles:{},orders:[]}), save=d=>store.set(K,d), subs=[];
  const q=table=>{ let filt=null; const o={select(){return o},eq(c,val){filt=[c,val];return o},order(){return o},
    limit(){ const d=load(); const uid=d.session&&d.session.user.id; return Promise.resolve({data:table==="orders"&&uid?d.orders.filter(x=>x.user_id===uid).sort((a,b)=>b.created_at.localeCompare(a.created_at)):[]}); },
    maybeSingle(){ const d=load(); return Promise.resolve({data:filt?d.profiles[filt[1]]||null:null}); },
    upsert(row){ const d=load(); d.profiles[row.id]=row; save(d); return Promise.resolve({error:null}); } }; return o; };
  return {auth:{
    getSession:async()=>({data:{session:load().session}}),
    onAuthStateChange:f=>subs.push(f),
    signInWithOtp:async({email})=>{ demoCode=String(Math.floor(100000+Math.random()*900000)); const d=load(); d.pending={email:email.toLowerCase(),code:demoCode,at:Date.now()}; save(d); return {error:null}; },
    verifyOtp:async({email,token})=>{ const d=load(); const p=d.pending;
      if(!p||p.email!==email.toLowerCase()||p.code!==token||Date.now()-p.at>3600e3) return {data:{},error:{message:"invalid"}};
      const id=d.users[p.email]||(d.users[p.email]="demo-"+Math.random().toString(36).slice(2,10));
      d.session={user:{id,email:p.email},access_token:null}; delete d.pending; save(d); subs.forEach(f=>f("SIGNED_IN",d.session)); return {data:{session:d.session},error:null}; },
    signOut:async()=>{ const d=load(); d.session=null; save(d); subs.forEach(f=>f("SIGNED_OUT",null)); return {error:null}; }},
    from:q, _record(order){ const d=load(); d.orders.push(order); save(d); }};
}
function demoRecordOrder(o){ if(accountsDemo()&&sb&&sb._record&&sbUser) sb._record({...o,user_id:sbUser.id,created_at:new Date().toISOString()}); }
function sbLoad(){
  if(!accountsOn()) return Promise.resolve(null);
  if(sbReady) return sbReady;
  if(accountsDemo()&&!window.supabase) window.supabase={createClient:demoClient};
  sbReady=new Promise((ok,fail)=>{ if(window.supabase) return ok(); const s=document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"; s.onload=ok; s.onerror=fail; document.head.appendChild(s); })
    .then(async()=>{ sb=window.supabase.createClient(CONFIG.accounts.url,CONFIG.accounts.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      if(authReturn){ const a=authReturn; authReturn=null;
        if(a.access_token&&a.refresh_token){ const {error}=await sb.auth.setSession({access_token:a.access_token,refresh_token:a.refresh_token}); if(error) setTimeout(()=>toast(t("e_link")),400); }
        else setTimeout(()=>toast(t("e_link")),400); }
      const {data}=await sb.auth.getSession(); sbUser=data&&data.session?data.session.user:null; if(sbUser) await loadProfile();
      sb.auth.onAuthStateChange((_e,s)=>{ const was=!!sbUser; sbUser=s?s.user:null; if(!sbUser) sbProfile=null; updateAcct(); if(was!==!!sbUser&&location.hash==="#account") renderAccount(); });
      updateAcct(); return sb; })
    .catch(e=>{ console.warn("accounts unavailable",e); sbReady=null; return null; });
  return sbReady;
}
async function sbToken(){ if(!sb) return null; try{ const {data}=await sb.auth.getSession(); return data&&data.session?data.session.access_token:null; }catch(e){ return null; } }
async function loadProfile(){ try{ const {data}=await sb.from("profiles").select("*").eq("id",sbUser.id).maybeSingle(); sbProfile=data||null; }catch(e){ sbProfile=null; } }
async function saveProfile(p,quiet){ if(!sb||!sbUser) return false;
  const row={id:sbUser.id,updated_at:new Date().toISOString()}; for(const k of ["name","phone","gov","area","block","street","avenue","house","notes"]) row[k]=(p[k]||"").trim()||null;
  if(p.username!==undefined) row.username=(p.username||"").trim()||null;
  const {error}=await sb.from("profiles").upsert(row); if(!error){ sbProfile={...(sbProfile||{}),...row}; if(!quiet) toast(t("saved")); return true; } if(!quiet) toast(error.code==="23505"?t("e_user_taken"):t("e_save")); return false; }
function updateAcct(){ const b=$("#acctBtn"); if(!b) return; b.hidden=!accountsOn(); b.classList.toggle("in",!!sbUser); b.setAttribute("aria-label",sbUser?t("acct_mine"):t("acct_signin")); if(location.hash==="#account") b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); }
function viewAccount(){
  if(!accountsOn()) return view404();
  setTimeout(renderAccount,0);
  return `<div id="acctView"><div class="wrap page-head">${crumbs([["home",t("home")],["",t("acct_mine")]])}<h1>${t("loading")}</h1></div></div>`;
}
async function renderAccount(){
  await sbLoad(); const box=$("#acctView"); if(!box) return;
  const head=crumbs([["home",t("home")],["",sbUser?t("acct_h"):t("acct_signin")]]);
  const err=acctMsg?`<div class="err-summary" role="alert"><h2>${esc(acctMsg)}</h2></div>`:""; acctMsg="";
  if(!sb){ box.innerHTML=`<div class="wrap page-head">${head}<h1>${t("acct_signin")}</h1><p class="lead">${t("e_send")}</p></div>`; return; }
  if(!sbUser){ await checkGoogle(); if($("#acctView")!==box) return; box.innerHTML=authCard(head,err); const f=box.querySelector("form input"); if(f&&acctStep!=="signin") f.focus(); return; }
  let orders=[]; try{ const {data}=await sb.from("orders").select("id,created_at,status,method,total_fils,items").order("created_at",{ascending:false}).limit(20); orders=data||[]; }catch(e){}
  const p=sbProfile||{}, val=k=>esc(p[k]||"");
  const df=new Intl.DateTimeFormat(lang==="ar"?"ar-KW":"en-GB",{day:"numeric",month:"short",year:"numeric"});
  box.innerHTML=`<div class="wrap page-head">${head}<h1>${t("acct_h")}</h1><p class="lead" dir="ltr" style="text-align:start">${p.username?`<b>@${esc(p.username)}</b><br>`:""}${esc(sbUser.email||"")}</p></div>
  <div class="wrap acct-grid">
    <form id="acctProfile" novalidate><h2>${t("saved_h")}</h2><p class="muted" style="margin:-6px 0 18px">${t("saved_p")}</p>${err}
      <div class="fgrid">
        <div class="f full"><label for="puser">${t("f_user")}</label><input id="puser" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" dir="ltr" value="${val("username")}"><p class="help">${t("f_user_h")}</p></div>
        <div class="f full"><label for="pname">${t("f_name")}</label><input id="pname" autocomplete="name" value="${val("name")}"></div>
        <div class="f full"><label for="pphone">${t("f_phone")}</label><div class="tel"><span>+965</span><input id="pphone" type="tel" inputmode="tel" maxlength="9" value="${val("phone")}"></div></div>
        <div class="f"><label for="pgov">${t("f_gov")}</label><select id="pgov"><option value="">${t("f_choose")}</option>${GOVS.map(g=>`<option value="${g[0]}" ${p.gov===g[0]?"selected":""}>${lang==="ar"?g[2]:g[1]}</option>`).join("")}</select></div>
        <div class="f"><label for="parea">${t("f_area")}</label><input id="parea" value="${val("area")}"></div>
        <div class="f"><label for="pblock">${t("f_block")}</label><input id="pblock" inputmode="numeric" value="${val("block")}"></div>
        <div class="f"><label for="pstreet">${t("f_street")}</label><input id="pstreet" value="${val("street")}"></div>
        <div class="f"><label for="pavenue">${t("f_avenue")}</label><input id="pavenue" value="${val("avenue")}"></div>
        <div class="f"><label for="phouse">${t("f_house")}</label><input id="phouse" value="${val("house")}"></div>
      </div>
      <p style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:20px"><button class="btn" type="submit"><span>${t("save")}</span></button><button class="btn ghost" type="button" id="acctOut"><span>${t("sign_out")}</span></button></p>
    </form>
    <section aria-labelledby="ordH"><h2 id="ordH">${t("orders_h")}</h2>${orders.length?`<ol class="olist">${orders.map(o=>`<li><b class="num">${esc(o.id)}</b><span class="st ${esc(o.status)}">${t("st_"+o.status)}</span><span class="meta">${df.format(new Date(o.created_at))}, <span class="num">${money(o.total_fils)}</span>${(o.items||[]).length?", "+esc(o.items.map(i=>i.qty+" × "+i.name).join(lang==="ar"?"، ":", ")):""}</span></li>`).join("")}</ol>`:`<p class="muted">${t("no_orders")}</p>`}</section>
  </div>`;
}
Object.assign(T.en,{acct_p_in:"Sign in with your email or username. Checkout works without an account too.",f_login:"Email or username",f_pass:"Password",f_pass_new:"New password",f_user:"Username",
  f_user_h:"3 to 20 letters or numbers. Dots and underscores are fine.",f_pass_h:"At least 8 characters.",show_pass:"Show",hide_pass:"Hide",
  to_signup:"Create an account",to_signin:"I already have an account",forgot:"Forgot your password?",google:"Continue with Google",or:"or",
  su_h:"Create your Kafei account",su_p:"We email you a code once to check the address. After that you sign in with your password.",su_btn:"Create account",
  vf_h:"Check your email",vf_p:e=>`We sent a 6-digit code to ${e}. Enter it to finish. You only do this once.`,vf_btn:"Confirm email",resend:"Send a new code",resent:"New code sent",
  fg_h:"Reset your password",fg_p:"Enter the email on your account. We'll send a code to set a new password.",fg_btn:"Send code",
  rs_h:"Set a new password",rs_p:e=>`Enter the code we sent to ${e} and choose a new password.`,rs_btn:"Save new password",rs_done:"Password changed. You're signed in.",
  e_login:"That email, username or password is wrong.",e_pass:"Use at least 8 characters for the password.",e_user:"Usernames are 3 to 20 letters or numbers, and may use dots and underscores.",
  e_user_taken:"That username is taken. Try another.",e_exists:"There's already an account with this email. Sign in, or reset your password.",
  e_unconfirmed:"Confirm your email first. We sent you a new code.",e_signup:"We couldn't create the account. Wait a minute and try again.",
  e_many:n=>`Too many tries. Wait ${Math.ceil(n/60)} minutes and try again.`,signing:"Signing in…",creating:"Creating account…",acct_user:"Username",
  e_google:"Google sign-in didn't finish. Try again, or use your email and password."});
Object.assign(T.ar,{acct_p_in:"سجّل الدخول ببريدك أو اسم المستخدم. ويمكنك الطلب دون حساب أيضًا.",f_login:"البريد أو اسم المستخدم",f_pass:"كلمة المرور",f_pass_new:"كلمة المرور الجديدة",f_user:"اسم المستخدم",
  f_user_h:"من 3 إلى 20 حرفًا إنجليزيًا أو رقمًا، ويمكن استخدام النقطة والشرطة السفلية.",f_pass_h:"8 أحرف على الأقل.",show_pass:"إظهار",hide_pass:"إخفاء",
  to_signup:"أنشئ حسابًا",to_signin:"لدي حساب بالفعل",forgot:"نسيت كلمة المرور؟",google:"المتابعة عبر Google",or:"أو",
  su_h:"أنشئ حسابك في كفي",su_p:"نرسل لك رمزًا مرة واحدة للتأكد من بريدك، وبعدها تدخل بكلمة المرور.",su_btn:"إنشاء الحساب",
  vf_h:"تحقق من بريدك",vf_p:e=>`أرسلنا رمزًا من 6 أرقام إلى ${e}. أدخله لإكمال التسجيل. هذه الخطوة مرة واحدة فقط.`,vf_btn:"تأكيد البريد",resend:"أرسل رمزًا جديدًا",resent:"أُرسل رمز جديد",
  fg_h:"إعادة تعيين كلمة المرور",fg_p:"اكتب البريد المسجّل في حسابك، وسنرسل لك رمزًا لتعيين كلمة مرور جديدة.",fg_btn:"أرسل الرمز",
  rs_h:"عيّن كلمة مرور جديدة",rs_p:e=>`أدخل الرمز الذي أرسلناه إلى ${e} واختر كلمة مرور جديدة.`,rs_btn:"احفظ كلمة المرور",rs_done:"تم تغيير كلمة المرور، وأنت الآن مسجّل الدخول.",
  e_login:"البريد أو اسم المستخدم أو كلمة المرور غير صحيحة.",e_pass:"استخدم 8 أحرف على الأقل لكلمة المرور.",e_user:"اسم المستخدم من 3 إلى 20 حرفًا إنجليزيًا أو رقمًا، ويمكن أن يحتوي على نقطة أو شرطة سفلية.",
  e_user_taken:"اسم المستخدم مأخوذ. جرّب اسمًا آخر.",e_exists:"يوجد حساب بهذا البريد. سجّل الدخول، أو أعد تعيين كلمة المرور.",
  e_unconfirmed:"أكّد بريدك أولًا. أرسلنا لك رمزًا جديدًا.",e_signup:"تعذّر إنشاء الحساب. انتظر دقيقة وحاول مرة أخرى.",
  e_many:n=>`محاولات كثيرة. انتظر ${Math.ceil(n/60)} دقائق وحاول مرة أخرى.`,signing:"جارٍ الدخول…",creating:"جارٍ إنشاء الحساب…",acct_user:"اسم المستخدم",
  e_google:"لم يكتمل الدخول عبر Google. حاول مرة أخرى، أو استخدم البريد وكلمة المرور."});
let acctLogin="", googleOn=null;
const USER_RE=/^[A-Za-z0-9._]{3,20}$/, EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
async function checkGoogle(){ if(googleOn!==null) return googleOn;
  try{ const r=await fetch(CONFIG.accounts.url+"/auth/v1/settings",{headers:{apikey:CONFIG.accounts.anonKey}}); const d=await r.json(); googleOn=!!(d&&d.external&&d.external.google); }catch(e){ googleOn=false; }
  return googleOn; }
const GLOGO=`<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>`;
const passField=(id,lab,ac,help)=>`<div class="f"><label for="${id}">${t(lab)}</label><div class="pw"><input id="${id}" type="password" autocomplete="${ac}" required minlength="8" maxlength="200" dir="ltr"><button type="button" class="pw-eye" data-eye="${id}" aria-controls="${id}" aria-pressed="false">${t("show_pass")}</button></div>${help?`<p class="help">${t(help)}</p>`:""}</div>`;
function authCard(head,err){
  const page=(h,p,form)=>`<div class="wrap page-head">${head}<h1>${h}</h1><p class="lead">${p}</p>${form}</div>`;
  const g=googleOn?`<div class="or"><span>${t("or")}</span></div><button class="btn ghost gbtn" type="button" id="acctGoogle">${GLOGO}<span>${t("google")}</span></button>`:"";
  const emailF=`<div class="f"><label for="email">${t("f_email")}</label><input id="email" type="email" inputmode="email" autocomplete="email" required value="${esc(acctEmail)}" dir="ltr"></div>`;
  const codeF=`<div class="f"><label for="otp">${t("f_code")}</label><input id="otp" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="12" required dir="ltr"></div>`;
  if(acctStep==="signup") return page(t("su_h"),t("su_p"),`<form class="acct-card" id="acctSignup" novalidate>${err}${emailF}
    <div class="f"><label for="uname">${t("f_user")}</label><input id="uname" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" required dir="ltr"><p class="help">${t("f_user_h")}</p></div>
    ${passField("pass","f_pass","new-password","f_pass_h")}<button class="btn" type="submit"><span>${t("su_btn")}</span></button>${g}
    <button class="linkbtn" type="button" data-step="signin">${t("to_signin")}</button></form>`);
  if(acctStep==="verify") return page(t("vf_h"),esc(t("vf_p",acctEmail)),`<form class="acct-card" id="acctVerify" novalidate>${err}${codeF}
    <button class="btn" type="submit"><span>${t("vf_btn")}</span></button><button class="linkbtn" type="button" id="acctResend">${t("resend")}</button></form>`);
  if(acctStep==="forgot") return page(t("fg_h"),t("fg_p"),`<form class="acct-card" id="acctForgot" novalidate>${err}${emailF}
    <button class="btn" type="submit"><span>${t("fg_btn")}</span></button><button class="linkbtn" type="button" data-step="signin">${t("to_signin")}</button></form>`);
  if(acctStep==="reset") return page(t("rs_h"),esc(t("rs_p",acctEmail)),`<form class="acct-card" id="acctReset" novalidate>${err}${codeF}${passField("pass","f_pass_new","new-password","f_pass_h")}
    <button class="btn" type="submit"><span>${t("rs_btn")}</span></button><button class="linkbtn" type="button" data-step="forgot">${t("resend")}</button></form>`);
  return page(t("acct_h_in"),t("acct_p_in"),`<form class="acct-card" id="acctSignin" novalidate>${err}
    <div class="f"><label for="login">${t("f_login")}</label><input id="login" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${esc(acctLogin)}" dir="ltr"></div>
    ${passField("pass","f_pass","current-password")}<button class="btn" type="submit"><span>${t("sign_in")}</span></button>
    <button class="linkbtn" type="button" data-step="forgot">${t("forgot")}</button>${g}
    <div class="or"><span>${t("or")}</span></div><button class="btn ghost" type="button" data-step="signup"><span>${t("to_signup")}</span></button></form>`);
}
const busy=(btn,label)=>{ if(!btn) return ()=>{}; btn.disabled=true; const old=btn.innerHTML; btn.innerHTML=`<span class="spin" aria-hidden="true"></span><span>${label}</span>`; btn.setAttribute("aria-busy","true");
  return ()=>{ if(btn.isConnected){ btn.disabled=false; btn.innerHTML=old; btn.removeAttribute("aria-busy"); } }; };
const waitSecs=error=>{ const m=/(\d+)\s*seconds?/i.exec(error&&error.message||""); return m?+m[1]:60; };
const isLimit=error=>!!error&&(error.status===429||/rate|seconds/i.test(error.message||""));
async function signedIn(session){ if(session) await sb.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});
  const {data}=await sb.auth.getSession(); sbUser=data&&data.session?data.session.user:null; acctStep="signin"; if(sbUser) await loadProfile(); updateAcct(); return renderAccount(); }
document.addEventListener("submit",async e=>{
  const id=e.target.id; if(!["acctSignin","acctSignup","acctVerify","acctForgot","acctReset","acctProfile"].includes(id)) return; e.preventDefault();
  const label={acctSignin:t("signing"),acctSignup:t("creating"),acctVerify:t("verifying"),acctForgot:t("sending"),acctReset:t("saving"),acctProfile:t("saving")}[id];
  const done=busy(e.target.querySelector("button[type=submit]"),label), v=k=>{ const el=document.getElementById(k); return el?el.value.trim():""; };
  const fail=m=>{ acctMsg=m; return renderAccount(); };
  try{
    if(id==="acctSignin"){ const login=v("login"), password=$("#pass").value; acctLogin=login;
      if(!login||!password) return fail(t("e_login"));
      if(login.includes("@")){
        const {data,error}=await sb.auth.signInWithPassword({email:login,password});
        if(!error&&data&&data.session) return signedIn();
        if(error&&error.code==="email_not_confirmed"){ acctEmail=login; await sb.auth.resend({type:"signup",email:login}); acctStep="verify"; return fail(t("e_unconfirmed")); }
        return fail(isLimit(error)?t("e_wait",waitSecs(error)):t("e_login")); }
      const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login,password})}); const d=await r.json().catch(()=>({}));
      if(r.ok&&d.access_token) return signedIn(d);
      if(d.error==="email_not_confirmed"&&d.email){ acctEmail=d.email; await sb.auth.resend({type:"signup",email:d.email}); acctStep="verify"; return fail(t("e_unconfirmed")); }
      if(d.error==="too_many") return fail(t("e_many",d.wait||600));
      return fail(t("e_login")); }
    if(id==="acctSignup"){ const email=v("email"), username=v("uname"), password=$("#pass").value; acctEmail=email;
      if(!EMAIL_RE.test(email)) return fail(t("e_email"));
      if(!USER_RE.test(username)) return fail(t("e_user"));
      if(password.length<8) return fail(t("e_pass"));
      const {data:free,error:fe}=await sb.rpc("username_available",{u:username}); if(!fe&&free===false) return fail(t("e_user_taken"));
      const {data,error}=await sb.auth.signUp({email,password,options:{data:{username}}});
      if(error){ console.warn("sign-up failed",error.status,error.message);
        if(/already registered|exists/i.test(error.message||"")) return fail(t("e_exists"));
        if(/database error/i.test(error.message||"")) return fail(t("e_user_taken"));
        if(/password/i.test(error.message||"")) return fail(t("e_pass"));
        return fail(isLimit(error)?t("e_wait",waitSecs(error)):t("e_signup")); }
      if(data&&data.user&&Array.isArray(data.user.identities)&&!data.user.identities.length) return fail(t("e_exists"));
      if(data&&data.session) return signedIn();
      acctStep="verify"; return renderAccount(); }
    if(id==="acctVerify"){ const code=v("otp").replace(/\D/g,""); if(code.length<6) return fail(t("e_code"));
      let {data,error}=await sb.auth.verifyOtp({email:acctEmail,token:code,type:"signup"});
      if(error||!data||!data.session) ({data,error}=await sb.auth.verifyOtp({email:acctEmail,token:code,type:"email"}));
      if(error||!data||!data.session) return fail(t("e_code"));
      return signedIn(); }
    if(id==="acctForgot"){ const email=v("email"); acctEmail=email; if(!EMAIL_RE.test(email)) return fail(t("e_email"));
      const {error}=await sb.auth.resetPasswordForEmail(email);
      if(error){ console.warn("reset failed",error.status,error.message); return fail(isLimit(error)?t("e_wait",waitSecs(error)):t("e_send")); }
      acctStep="reset"; return renderAccount(); }
    if(id==="acctReset"){ const code=v("otp").replace(/\D/g,""), password=$("#pass").value;
      if(code.length<6) return fail(t("e_code")); if(password.length<8) return fail(t("e_pass"));
      const {data,error}=await sb.auth.verifyOtp({email:acctEmail,token:code,type:"recovery"});
      if(error||!data||!data.session) return fail(t("e_code"));
      const {error:ue}=await sb.auth.updateUser({password}); if(ue){ console.warn("password update failed",ue.message); return fail(/password/i.test(ue.message||"")?t("e_pass"):t("e_save")); }
      toast(t("rs_done")); return signedIn(); }
    if(id==="acctProfile"){ const val=k=>$("#p"+k).value; const phone=val("phone").replace(/\D/g,""), uEl=$("#puser"), username=uEl?uEl.value.trim():undefined;
      if(phone&&!/^[4569]\d{7}$/.test(phone)) return fail(t("e_phone"));
      if(username&&!USER_RE.test(username)) return fail(t("e_user"));
      if(username&&username.toLowerCase()!==String((sbProfile||{}).username||"").toLowerCase()){ const {data:free}=await sb.rpc("username_available",{u:username}); if(free===false) return fail(t("e_user_taken")); }
      await saveProfile({name:val("name"),phone,gov:val("gov"),area:val("area"),block:val("block"),street:val("street"),avenue:val("avenue"),house:val("house"),username}); }
  } finally { done(); }
});
document.addEventListener("click",async e=>{
  if(e.target.closest("#acctOut")){ await sb.auth.signOut(); sbUser=null; sbProfile=null; acctStep="signin"; updateAcct(); renderAccount(); return; }
  const st=e.target.closest("[data-step]"); if(st){ acctStep=st.dataset.step; renderAccount(); return; }
  const eye=e.target.closest("[data-eye]"); if(eye){ const i=document.getElementById(eye.dataset.eye), show=i.type==="password"; i.type=show?"text":"password"; eye.textContent=show?t("hide_pass"):t("show_pass"); eye.setAttribute("aria-pressed",String(show)); return; }
  if(e.target.closest("#acctResend")){ const b=e.target.closest("#acctResend"); b.disabled=true; const {error}=await sb.auth.resend({type:"signup",email:acctEmail});
    toast(error?(isLimit(error)?t("e_wait",waitSecs(error)):t("e_send")):t("resent")); setTimeout(()=>{ if(b.isConnected) b.disabled=false; },30000); return; }
  if(e.target.closest("#acctGoogle")){ const {error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+"/"}}); if(error){ acctMsg=t("e_google"); renderAccount(); } }
});
function prefillCheckout(){
  if(!sbUser||!$("#coForm")) return;
  const p=sbProfile||{}; const set=(id,v)=>{ const el=document.getElementById(id); if(el&&!el.value&&v) el.value=v; };
  set("name",p.name); set("phone",p.phone); set("gov",p.gov); set("area",p.area); set("block",p.block); set("street",p.street); set("avenue",p.avenue); set("house",p.house); set("notes",p.notes);
  const btn=$("#coForm button[type=submit]");
  if(btn&&!$("#saveAddr")) btn.insertAdjacentHTML("beforebegin",`<label class="check"><input type="checkbox" id="saveAddr" checked><span>${t("save_addr")}</span></label>`);
}
function view404(){
  return `<div class="wrap nf"><div class="vessel" aria-hidden="true"></div><div><h1>${t("nf_h")}</h1><p>${t("nf_p")}</p><a class="btn" href="#shop"><span>${t("nf_btn")}</span></a></div></div>`;
}
function renderFooter(){
  $("#footer").innerHTML=`<div class="wrap"><div class="name"><p class="word" lang="ar">كفي</p>${FINJAN("finjan")}<p class="custom">${t("lead")}</p></div>
  <p class="brand">${t("brand")}</p>
  <nav aria-labelledby="fShop"><h2 id="fShop">${t("f_shop")}</h2><ul><li><a href="#shop">${t("all_products")}</a></li>${CATS.filter(c=>inCat(c).length).map(c=>`<li><a href="#shop-${c.id}">${esc(L(c.name))}</a></li>`).join("")}</ul></nav>
  <nav aria-labelledby="fHelp"><h2 id="fHelp">${t("f_help")}</h2><ul><li><a href="#delivery">${t("nav_delivery")}</a></li><li><a href="#about">${t("nav_about")}</a></li><li><a href="/privacy">${lang==="ar"?"سياسة الخصوصية":"Privacy policy"}</a></li><li><a href="${wa(t("wa_hello"))}" target="_blank" rel="noopener">${t("ask_wa_short")} <bdi dir="ltr" class="num">${CONFIG.phoneDisplay}</bdi></a></li></ul></nav>
  <p class="imprint">${t("f_imprint")}</p></div>`;
}

/* ===== motion: one clock (gsap.ticker drives Lenis, ScrollTrigger and the idle ripple) ===== */
const G=window.gsap, ST=window.ScrollTrigger;
const motionOn=()=>!!(G&&ST&&!reduce.matches);
let lenis=null, pageCtx=null, idleEls=[];
if(motionOn()){
  G.registerPlugin(ST);
  if(window.Lenis){ lenis=new Lenis({lerp:.12,wheelMultiplier:1}); lenis.on("scroll",ST.update);
    G.ticker.add(t=>lenis.raf(t*1000)); G.ticker.lagSmoothing(0);
    let last=0; lenis.on("scroll",({scroll})=>{ if(Math.abs(scroll-last)<4) return; document.documentElement.classList.toggle("frame-away",scroll>200&&scroll>last&&!document.querySelector("#nav.open")); last=scroll; }); }
  G.ticker.add(time=>{ for(const e of idleEls){ e.style.transform=`translateX(${-((time*14)%50)}%)`; } });
} else document.documentElement.classList.remove("motion","intro");
function scrollToY(y,instant){ if(lenis) lenis.scrollTo(y,{immediate:!!instant,duration:1.1}); else scrollTo({top:y,behavior:instant||reduce.matches?"auto":"smooth"}); }

let introShaken=false;
function setupPage(){
  if(!motionOn()||!$(".hero")) document.documentElement.classList.remove("intro");
  if(!motionOn()) return;
  pageCtx=G.context(()=>{
    // hero intro: the name fills up from below. The stylesheet already holds the text in its start position
    // on first load (html.intro), so the pre-built page never shows it, hides it, then replays it.
    if($(".hero")){ const tl=G.timeline({defaults:{ease:"expo.out"}});
      G.set(".hero .ch, .hero .ar span",{y:0,yPercent:110}); G.set(".hero [data-intro]",{y:26,opacity:0});
      document.documentElement.classList.remove("intro");
      tl.to(".hero .ch",{yPercent:0,duration:1.1,stagger:.05})
        .to(".hero .ar span",{yPercent:0,duration:1},"-=.85")
        .to(".hero [data-intro]",{y:0,opacity:1,duration:.9,stagger:.08},"-=.75");
      // once per visit, the finjan in the logo gives the shake that names the shop: enough
      if(!introShaken){ introShaken=true; tl.to(".logo .lm",{keyframes:{rotation:[0,-14,10,-7,4,0]},duration:.85,ease:"power1.inOut",transformOrigin:"50% 78%"},"-=.5"); } }
    // headings rise into place once
    $$("[data-rise]").forEach(h=>G.from(h,{clipPath:"inset(0 0 100% 0)",y:24,duration:1,ease:"expo.out",scrollTrigger:{trigger:h,start:"top 88%",once:true}}));
    // product page: the photo pours into its vessel
    const pin=$("[data-pourin] img"); if(pin) G.fromTo(pin,{clipPath:"inset(100% 0 0 0)"},{clipPath:"inset(0% 0 0 0)",duration:1.2,ease:"expo.out",delay:.1});
    // footer: the finjan shakes once, the way you say enough
    const fj=$(".ftr .finjan"); if(fj) G.to(fj,{keyframes:{rotation:[0,-10,8,-6,4,0]},duration:.9,ease:"power1.inOut",scrollTrigger:{trigger:fj,start:"top 92%",once:true}});
    setupPour();
  });
  idleEls=$$(".surface svg, .meter-cup .fj-wave");
  ST.refresh();
}
/* the pour: one variable q (0..n-1) drives every vessel, the copy, the surface and the meter */
function setupPour(){
  const sec=$(".pour"); if(!sec) return;
  if($$(".cup",sec).length<2) return; // one product: no scroll sequence, it simply sits on the counter
  sec.classList.add("staged");
  const cups=$$(".cup",sec), n=cups.length, level=$(".meter-cup .fj-level"), btns=$$("[data-pour]");
  let active=0;
  const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  const show=i=>{ if(i===active) return; const prev=cups[active], next=cups[i]; active=i;
    cups.forEach((c,j)=>{ c.classList.toggle("on",j===i); const cp=c.querySelector(".cup-copy"); if(j===i) cp.removeAttribute("inert"); else cp.setAttribute("inert",""); });
    btns.forEach((b,j)=>{ if(j===i) b.setAttribute("aria-current","true"); else b.removeAttribute("aria-current"); });
    G.fromTo(next.querySelectorAll(".cup-copy > *"),{y:34,opacity:0},{y:0,opacity:1,duration:.7,stagger:.05,ease:"expo.out",overwrite:true});
    if(i===n-1){ const mc=$(".meter-cup"); if(mc) G.fromTo(mc,{rotation:0},{keyframes:{rotation:[0,-14,10,-7,4,0]},duration:.8,ease:"power1.inOut",transformOrigin:"50% 90%"}); } };
  cups.forEach((c,j)=>{ if(j) c.querySelector(".cup-copy").setAttribute("inert",""); });
  const apply=q=>{
    cups.forEach((c,i)=>{ if(!i) return; const f=sm((q-(i-1)-.2)/.6), img=c.querySelector("img"), s=c.querySelector(".surface"), h=c.querySelector(".vessel").clientHeight;
      img.style.clipPath=`inset(${(1-f)*100}% 0 0 0)`; s.style.top=`${(1-f)*h-14}px`; s.style.opacity=f>0&&f<1?1:0;
      const prev=cups[i-1].querySelector("img"); prev.style.opacity=String(1-.85*f); });
    if(level) level.setAttribute("y",String(76-50*((q+1)/n)));
    const i=Math.min(n-1,Math.max(0,Math.round(q-.05))); show(i);
  };
  const st=ST.create({trigger:sec,start:"top top",end:"bottom bottom",onUpdate:s=>apply(s.progress*(n-1)),invalidateOnRefresh:true});
  apply(0);
  btns.forEach((b,i)=>b.addEventListener("click",()=>scrollToY(st.start+(st.end-st.start)*(i/(n-1))+2)));
}
function teardownPage(){ if(pageCtx){ pageCtx.revert(); pageCtx=null; } idleEls=[]; }

/* curtain: a pour in, a drain out */
function curtain(dir){ return new Promise(res=>{ const c=$("#curtain"), f=$("#curtain .fill");
  if(dir==="in"){ c.style.visibility="visible"; G.fromTo(f,{yPercent:105},{yPercent:0,duration:.5,ease:"power2.in",onComplete:res}); }
  else G.to(f,{yPercent:105,duration:.6,ease:"power2.out",onComplete:()=>{ c.style.visibility="hidden"; res(); }}); }); }

/* ===== router ===== */
let firstRender=true, rendering=false, queued=false;
const ROUTES=["home","shop","delivery","about","checkout","order"];
function route(){
  const h=(location.hash||"#home").slice(1)||"home";
  if(h==="home") return {html:viewHome(),nav:""};
  if(h==="shop") return {html:viewShop(),nav:"shop"};
  if(h.startsWith("shop-")){ const rest=h.slice(5), c=CATS.find(x=>rest===x.id||rest.startsWith(x.id+"-"));
    if(c) return {html:viewCategory(c,rest.length>c.id.length?rest.slice(c.id.length+1):null),nav:"shop"}; }
  if(h.startsWith("p-")&&byId[h.slice(2)]) return {html:viewProduct(byId[h.slice(2)]),nav:"shop"};
  if(h.startsWith("brand-")){ const b=brandById(h.slice(6)); if(b) return {html:viewBrand(b),nav:"shop"}; }
  if(h==="delivery") return {html:viewDelivery(),nav:"delivery"};
  if(h==="about") return {html:viewAbout(),nav:"about"};
  if(h==="checkout") return {html:viewCheckout(),nav:""};
  if(h==="order") return {html:viewOrder(),nav:"shop"};
  if(h==="paid") return {html:viewPaid(),nav:""};
  if(h==="account") return {html:viewAccount(),nav:""};
  if(h==="main"||h==="stock") return {html:viewHome(),nav:"",target:h};
  return {html:view404(),nav:"",nf:true};
}
function swap(){
  teardownPage();
  const r=route();
  $("#main").innerHTML=r.html;
  const h1=$("#main h1"), base=lang==="ar"?"كفي Kafei: مكائن وأدوات قهوة في الكويت":"Kafei كفي: coffee machines and gear in Kuwait";
  document.title=$(".hero")||!h1?base:`${h1.textContent.trim()} · ${lang==="ar"?"كفي Kafei":"Kafei كفي"}`;
  $$("#nav a").forEach(a=>{ if(a.dataset.nav===r.nav) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  closeMenu(false);
  document.documentElement.classList.remove("frame-away");
  if(!reduce.matches){ const vid=$(".hero video"); if(vid){ const go=()=>{ if(!vid.isConnected) return; vid.src=vid.dataset.src; vid.addEventListener("playing",()=>vid.classList.add("on"),{once:true}); vid.play().catch(()=>{}); }; if(document.readyState==="complete") setTimeout(go,300); else addEventListener("load",()=>setTimeout(go,300),{once:true}); } }
  scrollToY(0,true);
  setupPage(); requestAnimationFrame(railState);
  updateAcct(); if(r.html.includes('id="coForm"')) sbLoad().then(prefillCheckout);
  const el=r.target&&document.getElementById(r.target);
  if(el&&r.target!=="main") requestAnimationFrame(()=>scrollToY(el.getBoundingClientRect().top+scrollY-8,true));
  if(!firstRender&&pendingFocus!==false) $("#main").focus({preventScroll:true});
  pendingFocus=true;
}
async function render(){
  if(rendering){ queued=true; return; }
  if(firstRender||!motionOn()){ swap(); firstRender=false; return; }
  rendering=true;
  await curtain("in"); swap(); await curtain("out");
  rendering=false; if(queued){ queued=false; render(); }
}
if(accountsOn()) setTimeout(sbLoad,0);
function applyLang(){
  const r=document.documentElement; r.lang=lang; r.dir=lang==="ar"?"rtl":"ltr";
  $("#langBtn").innerHTML=`<span class="full">${t("lang")}</span><span class="short" aria-hidden="true">${lang==="ar"?"EN":"ع"}</span>`; $("#langBtn").setAttribute("lang",lang==="ar"?"en":"ar"); $("#langBtn").setAttribute("aria-label",t("lang"));
  $$("[data-t]").forEach(e=>e.textContent=t(e.dataset.t)); $("#skip").textContent=t("skip");
  renderFooter(); updateCount();
}
/* in-page anchors scroll smoothly instead of re-rendering */
document.addEventListener("click",e=>{
  const a=e.target.closest('a[href="#stock"]'); if(!a) return;
  const el=document.getElementById("stock"); if(!el) return;
  e.preventDefault(); scrollToY(el.getBoundingClientRect().top+scrollY,false);
},true);
/* ===== brands, slide-out menu and home carousels ===== */
Object.assign(T.en,{menu_h:"Menu",menu_close:"Close the menu",m_shop:"Shop",m_brands:"Brands",m_more:"More",m_wa:"Message us on WhatsApp",
  brands_h:"Shop by brand",brand_lead:n=>`Everything we stock from ${n}.`,rail_prev:"Previous",rail_next:"Next",soon_short:"Coming soon"});
Object.assign(T.ar,{menu_h:"القائمة",menu_close:"أغلق القائمة",m_shop:"المتجر",m_brands:"الماركات",m_more:"المزيد",m_wa:"راسلنا على واتساب",
  brands_h:"تسوّق حسب الماركة",brand_lead:n=>`كل ما نوفّره من ${n}.`,rail_prev:"السابق",rail_next:"التالي",soon_short:"قريبًا"});

const brandSlug=b=>String(b||"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
/* brands come from the products themselves (the "Brand" box in the dashboard), most products first */
function brands(){
  const m=new Map();
  for(const p of P){ const b=(p.brand||"").trim(), s=brandSlug(b); if(!s) continue; if(!m.has(s)) m.set(s,{id:s,name:b,items:[]}); m.get(s).items.push(p); }
  return [...m.values()].sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name));
}
const brandById=id=>brands().find(b=>b.id===id)||null;

function viewBrand(b){
  return `<div class="wrap page-head">${crumbs([["home",t("home")],["shop",t("shop_h")],["",b.name]])}<h1 data-rise>${esc(b.name)}</h1><p class="lead">${esc(t("brand_lead",b.name))}</p></div>
  <div class="wrap"><ul class="plist">${b.items.map(prow).join("")}</ul></div>`;
}

/* ---- carousels ---- */
function rail(id,title,cards){
  return `<section class="rail-sec" aria-labelledby="${id}H"><div class="wrap rail-head"><h2 id="${id}H" data-rise>${title}</h2>
    <div class="rail-btns"><button type="button" class="rail-btn" data-rail="${id}" data-dir="-1" aria-label="${t("rail_prev")}" aria-controls="${id}">${ARROW}</button><button type="button" class="rail-btn" data-rail="${id}" data-dir="1" aria-label="${t("rail_next")}" aria-controls="${id}">${ARROW}</button></div></div>
    <ul class="rail" id="${id}" tabindex="0" aria-label="${title}">${cards}</ul></section>`;
}
const ARROW=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
function catRail(){
  const cards=CATS.map(c=>{ const list=inCat(c), n=list.length, p=list[0], bd=BANDS[c.band]||BANDS.cream;
    return `<li class="tile${n?"":" is-soon"}"><a href="#shop-${c.id}" style="--tb:${bd[0]};--tf:${bd[1]}">
      <span class="tile-img" aria-hidden="true">${p?`<img src="${p.img}" alt="" ${p.fit==="contain"?'class="contain"':""} loading="lazy" decoding="async" width="400" height="400">`:`<span class="tile-mark">${esc(L(c.name)).slice(0,1)}</span>`}</span>
      <span class="tile-txt"><b>${esc(L(c.name))}</b><span>${n?t("n_products",n):t("soon_short")}</span></span></a></li>`; }).join("");
  return rail("catRail",t("cats_h"),cards);
}
function brandRail(){
  const bs=brands(); if(!bs.length) return "";
  const cards=bs.map(b=>{ const p=b.items[0];
    return `<li class="tile brand"><a href="#brand-${b.id}">
      <span class="tile-img" aria-hidden="true">${p?`<img src="${p.img}" alt="" ${p.fit==="contain"?'class="contain"':""} loading="lazy" decoding="async" width="400" height="400">`:""}</span>
      <span class="tile-txt"><b dir="auto">${esc(b.name)}</b><span>${t("n_products",b.items.length)}</span></span></a></li>`; }).join("");
  return rail("brandRail",t("brands_h"),cards);
}
function railState(){
  $$(".rail").forEach(r=>{ const max=r.scrollWidth-r.clientWidth, x=Math.abs(r.scrollLeft);
    $$(`[data-rail="${r.id}"]`).forEach(b=>{ b.disabled=b.dataset.dir==="-1"?x<4:x>max-4; });
    r.closest(".rail-sec").classList.toggle("fits",max<4); });
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-rail]"); if(!b) return;
  const r=document.getElementById(b.dataset.rail); if(!r) return;
  const step=Math.max(240,r.clientWidth*.8)*(+b.dataset.dir)*(document.documentElement.dir==="rtl"?-1:1);
  r.scrollBy({left:step,behavior:reduce.matches?"auto":"smooth"});
});
document.addEventListener("scroll",e=>{ if(e.target.classList&&e.target.classList.contains("rail")) railState(); },true);
addEventListener("resize",railState);

/* ---- slide-out menu ---- */
let menuFocus=null;
function renderMenu(){
  const bs=brands(), cur=location.hash.slice(1)||"home";
  const link=(h,label,extra="")=>`<li><a href="#${h}" ${cur===h?'aria-current="page"':""}>${label}${extra}</a></li>`;
  $("#menu").innerHTML=`<div class="drawer-head"><h2 id="menuTitle">${t("menu_h")}</h2><button class="x-btn" id="menuClose" type="button" aria-label="${t("menu_close")}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  <nav class="menu-body" aria-labelledby="menuTitle">
    <h3>${t("m_shop")}</h3><ul class="menu-list">${link("shop",t("all_products"),` <span class="n num">${P.length}</span>`)}${CATS.map(c=>{const n=inCat(c).length;return link("shop-"+c.id,esc(L(c.name)),n?` <span class="n num">${n}</span>`:` <span class="n soon">${t("soon_short")}</span>`);}).join("")}</ul>
    ${bs.length?`<h3>${t("m_brands")}</h3><ul class="menu-list">${bs.map(b=>link("brand-"+b.id,`<bdi>${esc(b.name)}</bdi>`,` <span class="n num">${b.items.length}</span>`)).join("")}</ul>`:""}
    <h3>${t("m_more")}</h3><ul class="menu-list">${link("delivery",t("nav_delivery"))}${link("about",t("nav_about"))}${accountsOn()?link("account",sbUser?t("acct_mine"):t("acct_signin")):""}</ul>
  </nav>
  <div class="drawer-foot menu-foot"><a class="btn" href="${wa(t("wa_hello"))}" target="_blank" rel="noopener">${ICON.wa}<span>${t("m_wa")}</span></a><button class="btn ghost" type="button" id="menuLang">${t("lang")}</button></div>`;
}
function openMenu(){
  closeDrawer(); menuFocus=document.activeElement; renderMenu();
  const m=$("#menu"),s=$("#scrim"); m.hidden=false; s.hidden=false;
  requestAnimationFrame(()=>{ m.classList.add("open"); s.classList.add("show"); $("#menuClose").focus(); });
  document.documentElement.style.overflow="hidden"; $("#menuBtn").setAttribute("aria-expanded","true");
}
function closeMenu(back=true){
  const m=$("#menu"),s=$("#scrim"); if(!m||m.hidden) return;
  m.classList.remove("open"); s.classList.remove("show"); document.documentElement.style.overflow=""; $("#menuBtn").setAttribute("aria-expanded","false");
  setTimeout(()=>{ if(!m.classList.contains("open")){ m.hidden=true; if($("#drawer").hidden) s.hidden=true; } },reduce.matches?0:460);
  if(back&&menuFocus&&menuFocus.focus) menuFocus.focus();
}
document.addEventListener("click",e=>{
  if(e.target.closest("#menuBtn")){ e.stopImmediatePropagation(); $("#menu").hidden?openMenu():closeMenu(); return; }
  if(e.target.closest("#menuClose")||(e.target.id==="scrim"&&!$("#menu").hidden)){ closeMenu(); return; }
  if(e.target.closest("#menuLang")){ closeMenu(false); $("#langBtn").click(); return; }
  if(e.target.closest("#menu a")) closeMenu(false);
},true);
document.addEventListener("keydown",e=>{
  const m=$("#menu"); if(!m||m.hidden) return;
  if(e.key==="Escape"){ closeMenu(); return; }
  if(e.key==="Tab"){ const f=$$("#menu a,#menu button").filter(x=>x.offsetParent); if(!f.length) return; const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); } }
});
/* ===== cart ===== */
const sub=()=>cart.reduce((s,l)=>s+byId[l.id].price*l.qty,0);
const count=()=>cart.reduce((s,l)=>s+l.qty,0);
const fee=s=>s===0||s>=CONFIG.freeOver?0:CONFIG.fee;
function saveCart(){ store.set("kafei-cart2",cart); updateCount(); }
function updateCount(){ $("#cartCount").textContent=count(); $("#cartSr").textContent=t("cart_n",count()); }
function addToCart(id,q=1,color=null){ const p=byId[id]; if(!p||p.price==null||p.out) return; let c=null;
  if(p.colors&&p.colors.length){ c=colorOf(p,color)||firstColor(p); if(!c||c.out) return; }
  const k=lineKey({id,color:c&&c.id}), l=cart.find(x=>lineKey(x)===k); if(l) l.qty=Math.min(99,l.qty+q); else cart.push(c?{id,qty:q,color:c.id}:{id,qty:q}); saveCart(); replay($("#cartCount"),"tick"); toast(t("added",cName(p,c))); }
/* restart a one-shot CSS animation (the stylesheet turns these off for reduced motion) */
function replay(el,cls){ if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); el.addEventListener("animationend",()=>el.classList.remove(cls),{once:true}); }
let toastT; function toast(m){ const e=$("#toast"); e.textContent=m; e.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>e.classList.remove("show"),3200); }

function field(id,label,o={}){ const req=o.req!==false;
  return `<div class="f ${o.full?"full":""}"><label for="${id}">${label}${req?' <span class="req" aria-hidden="true">*</span>':""}</label>${o.type==="textarea"?`<textarea id="${id}"></textarea>`:`<input id="${id}" type="text" ${req?'required aria-required="true"':""} ${o.auto?`autocomplete="${o.auto}"`:""} ${o.mode?`inputmode="${o.mode}"`:""}>`}<p class="err" id="${id}-err" hidden></p></div>`; }
function viewCheckout(){
  if(!cart.length) return `<div class="wrap page-head"><h1 class="display">${t("co_h")}</h1><div class="empty"><p>${t("co_empty")}</p><a class="btn" href="#shop">${t("shop_all")}</a></div></div>`;
  const s=sub(), f=fee(s);
  return `<div class="wrap page-head"><ol class="crumbs"><li><a href="#home">${t("home")}</a></li><li aria-current="page">${t("co_h")}</li></ol><h1 class="display">${t("co_h")}</h1></div>
  <div class="wrap co"><form id="coForm" novalidate><div id="errSum"></div>
    <fieldset><legend>${t("co_contact")}</legend><div class="fgrid">${field("name",t("f_name"),{auto:"name",full:true})}
      <div class="f full"><label for="phone">${t("f_phone")} <span class="req" aria-hidden="true">*</span></label><div class="tel"><span>+965</span><input id="phone" type="tel" inputmode="tel" autocomplete="tel-national" required aria-required="true" aria-describedby="phone-help" maxlength="9"></div><p class="help" id="phone-help">${t("f_phone_help")}</p><p class="err" id="phone-err" hidden></p></div></div></fieldset>
    <fieldset><legend>${t("co_addr")}</legend><div class="fgrid">
      <div class="f"><label for="gov">${t("f_gov")} <span class="req" aria-hidden="true">*</span></label><select id="gov" required aria-required="true"><option value="">${t("f_choose")}</option>${GOVS.map(g=>`<option value="${g[0]}">${lang==="ar"?g[2]:g[1]}</option>`).join("")}</select><p class="err" id="gov-err" hidden></p></div>
      ${field("area",t("f_area"))}${field("block",t("f_block"),{mode:"numeric"})}${field("street",t("f_street"))}${field("avenue",t("f_avenue"),{req:false})}${field("house",t("f_house"))}${field("notes",t("f_notes"),{type:"textarea",req:false,full:true})}</div></fieldset>
    <fieldset><legend>${t("co_pay")}</legend><div class="radios">${["knet","card","apple"].map((m,i)=>`<label class="radio"><input type="radio" name="pay" value="${m}" ${i===0?"checked":""}><span>${t("pay_"+m)}</span></label>`).join("")}</div></fieldset>
    <button class="btn" type="submit" style="width:100%;min-height:58px">${t("place")}, <span class="num">${money(s+f)}</span></button><p class="demo">${t(CONFIG.payments?"demo_live":"demo")}</p>
  </form>
  <aside class="summary" aria-labelledby="sumH"><h2 id="sumH">${t("cart_h")}</h2>${cart.map(l=>`<p style="display:flex;justify-content:space-between;gap:12px;padding:6px 0"><span>${l.qty} × ${esc(cName(byId[l.id],colorOf(byId[l.id],l.color)))}</span><span class="num">${money(byId[l.id].price*l.qty)}</span></p>`).join("")}
    <dl class="totals" style="margin-top:12px"><dt>${t("subtotal")}</dt><dd class="num">${money(s)}</dd><dt>${t("delivery")}</dt><dd>${f?money(f):t("free")}</dd><dt class="grand">${t("total")}</dt><dd class="grand num">${money(s+f)}</dd></dl></aside></div>`;
}
function viewOrder(){
  if(!lastOrder) return viewShop();
  return `<div class="wrap page-head"><h1 class="display">${t("ok_h",lastOrder.id)}</h1><p style="margin-top:18px;max-width:50ch">${t("ok_p")}</p><p style="display:flex;flex-wrap:wrap;gap:10px;margin-top:28px"><a class="btn" href="${lastOrder.wa}" target="_blank" rel="noopener">${ICON.wa}<span>${t("ok_send")}</span></a><a class="btn ghost" href="#shop">${t("ok_back")}</a></p></div>`;
}
/* ===== drawer ===== */
let lastFocus=null;
function renderDrawer(){
  const d=$("#drawer"), s=sub(), f=fee(s);
  d.innerHTML=`<div class="drawer-head"><h2 id="drawerTitle">${t("cart_h")}</h2><button class="x-btn" type="button" id="drawerClose" aria-label="${t("close")}">${ICON.close}</button></div>
  <div class="drawer-body">${cart.length?cart.map(l=>{const p=byId[l.id],k=esc(lineKey(l));return `<div class="line"><img src="${lineImg(l)}" alt="" loading="lazy"><div><h3>${esc(cName(p,colorOf(p,l.color)))}</h3><div class="ctl"><div class="stepper" role="group" aria-label="${t("qty")}"><button type="button" data-q="${k}" data-d="-1" aria-label="${t("dec")}">−</button><output>${l.qty}</output><button type="button" data-q="${k}" data-d="1" aria-label="${t("inc")}">+</button></div><button class="linkbtn" type="button" data-rm="${k}">${t("remove")}</button></div></div><span class="num">${money(p.price*l.qty)}</span></div>`}).join(""):`<div class="empty"><p>${t("empty")}</p><a class="btn" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t("wa_hello"))}" target="_blank" rel="noopener">${ICON.wa}<span>${t("ask_price")}</span></a><a class="btn ghost" href="#shop" data-close>${t("shop_all")}</a></div>`}</div>
  ${cart.length?`<div class="drawer-foot"><dl class="totals"><dt>${t("subtotal")}</dt><dd class="num">${money(s)}</dd><dt>${t("delivery")}</dt><dd>${f?money(f):t("free")}</dd><dt class="grand">${t("total")}</dt><dd class="grand num">${money(s+f)}</dd></dl><a class="btn" href="#checkout" data-close>${t("checkout")}</a></div>`:""}`;
}
function openDrawer(){ lastFocus=document.activeElement; renderDrawer(); const d=$("#drawer"),s=$("#scrim"); d.hidden=false; s.hidden=false; requestAnimationFrame(()=>{d.classList.add("open");s.classList.add("show");$("#drawerClose").focus();}); document.documentElement.style.overflow="hidden"; }
function closeDrawer(){ const d=$("#drawer"),s=$("#scrim"); if(d.hidden) return; d.classList.remove("open"); s.classList.remove("show"); document.documentElement.style.overflow=""; setTimeout(()=>{ if(!d.classList.contains("open")){d.hidden=true;s.hidden=true;} },reduce.matches?0:460); if(lastFocus&&lastFocus.isConnected) lastFocus.focus(); }
function setQty(key,q){ const l=cart.find(x=>lineKey(x)===key); if(!l) return; if(q<=0) cart=cart.filter(x=>x!==l); else l.qty=Math.min(99,q); saveCart(); renderDrawer(); }

/* ===== checkout ===== */
const RULES={name:v=>v.trim().length>=2,phone:v=>/^[4569]\d{7}$/.test(v.replace(/\D/g,"")),gov:v=>!!v,area:v=>v.trim().length>=2,block:v=>v.trim().length>=1,street:v=>v.trim().length>=1,house:v=>v.trim().length>=1};
function validate(id){ const el=document.getElementById(id); if(!el) return true; const ok=RULES[id](el.value), er=document.getElementById(id+"-err"); el.setAttribute("aria-invalid",ok?"false":"true"); const desc=[id==="phone"?"phone-help":"",ok?"":id+"-err"].filter(Boolean).join(" "); if(desc) el.setAttribute("aria-describedby",desc); else el.removeAttribute("aria-describedby"); if(er){er.hidden=ok;er.textContent=ok?"":t("e_"+id);} return ok; }
function submitCheckout(e){
  e.preventDefault(); const bad=Object.keys(RULES).filter(id=>!validate(id)); const box=$("#errSum");
  if(bad.length){ box.innerHTML=`<div class="err-summary" role="alert" tabindex="-1" id="errBox"><h2>${t("e_sum",bad.length)}</h2><ul>${bad.map(id=>`<li><a href="#${id}" data-focus="${id}">${t("e_"+id)}</a></li>`).join("")}</ul></div>`; $("#errBox").focus(); return; }
  const v=id=>document.getElementById(id).value.trim(), g=GOVS.find(x=>x[0]===v("gov")), s=sub(), f=fee(s);
  const lines=[t("wa_order"),...cart.map(l=>`• ${l.qty} × ${cName(byId[l.id],colorOf(byId[l.id],l.color))}: ${money(byId[l.id].price*l.qty)}`),`${t("delivery")}: ${f?money(f):t("free")}`,`${t("total")}: ${money(s+f)}`,`${t("f_name")}: ${v("name")}`,`${t("f_phone")}: +965 ${v("phone")}`,`${t("co_addr")}: ${lang==="ar"?g[2]:g[1]}, ${v("area")}, ${t("f_block")} ${v("block")}, ${t("f_street")} ${v("street")}${v("avenue")?", "+v("avenue"):""}, ${v("house")}`,`${t("co_pay")}: ${t("pay_"+$("input[name=pay]:checked").value)}`];
  if(sbUser&&$("#saveAddr")&&$("#saveAddr").checked) saveProfile({name:v("name"),phone:v("phone").replace(/\D/g,""),gov:v("gov"),area:v("area"),block:v("block"),street:v("street"),avenue:v("avenue"),house:v("house"),notes:v("notes")},true);
  const method=$("input[name=pay]:checked").value;
  if(CONFIG.payments){ startPayment(method,v,g,lines); return; }
  lastOrder={id:"KF-"+(20000+Math.floor(Math.random()*79999)),wa:wa(lines.join("\n"))};
  demoRecordOrder({id:lastOrder.id,status:"sent",method:"cod",total_fils:s+f,items:cart.map(l=>({id:l.id,color:l.color,name:cName(byId[l.id],colorOf(byId[l.id],l.color)),qty:l.qty}))});
  cart=[]; saveCart(); location.hash="order";
}
async function placeCod(v,g,lines,s,f){
  const btn=$("#coForm button[type=submit]"); btn.disabled=true;
  let id=null;
  try{ const tok=await sbToken(), hd={"Content-Type":"application/json"}; if(tok) hd.Authorization="Bearer "+tok;
    const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),6000);
    const r=await fetch(CONFIG.payments.cod,{method:"POST",headers:hd,signal:ctl.signal,body:JSON.stringify({items:cart.map(l=>({id:l.id,qty:l.qty,color:l.color})),lang,customer:{name:v("name"),phone:v("phone")},address:{gov:g[0],area:v("area"),block:v("block"),street:v("street"),avenue:v("avenue"),house:v("house"),notes:v("notes")}})});
    clearTimeout(timer); const d=await r.json().catch(()=>({})); if(r.ok&&d.orderId) id=d.orderId;
  }catch(e){}
  // the order still goes to WhatsApp if the server could not record it
  id=id||"KF-"+(20000+Math.floor(Math.random()*79999));
  lastOrder={id,wa:wa([lines[0]+" ("+id+")",...lines.slice(1)].join("\n"))};
  demoRecordOrder({id,status:"sent",method:"cod",total_fils:s+f,items:cart.map(l=>({id:l.id,color:l.color,name:cName(byId[l.id],colorOf(byId[l.id],l.color)),qty:l.qty}))});
  cart=[]; saveCart(); location.hash="order";
}
async function startPayment(method,v,g,lines){
  const btn=$("#coForm button[type=submit]"), box=$("#errSum"), label=btn.innerHTML;
  btn.disabled=true; btn.innerHTML=`<span>${t("paying")}</span>`;
  const body={items:cart.map(l=>({id:l.id,qty:l.qty,color:l.color})),method,lang,customer:{name:v("name"),phone:v("phone")},
    address:{gov:g[1],area:v("area"),block:v("block"),street:v("street"),avenue:v("avenue"),house:v("house"),notes:v("notes")}};
  try{
    const tok=await sbToken(), hd={"Content-Type":"application/json"}; if(tok) hd.Authorization="Bearer "+tok;
    const r=await fetch(CONFIG.payments.checkout,{method:"POST",headers:hd,body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.link) throw new Error(d.message||t("pay_fail"));
    store.set("kafei-pending",{id:d.orderId,total:d.total,method,wa:lines.join("\n")});
    location.href=d.link;
  }catch(err){
    btn.disabled=false; btn.innerHTML=label;
    box.innerHTML=`<div class="err-summary" role="alert" tabindex="-1" id="errBox"><h2>${esc(err.message||t("pay_fail"))}</h2></div>`;
    $("#errBox").focus();
  }
}

/* ===== the loom: one band open at a time ===== */
function openWeft(id,focus){
  openId=id;
  $$(".weft").forEach(w=>{ const on=w.querySelector("[data-weft]").dataset.weft===id; w.dataset.open=String(on); w.querySelector(".weft-head").setAttribute("aria-expanded",String(on)); const b=w.querySelector(".weft-body"); if(on) b.removeAttribute("inert"); else b.setAttribute("inert",""); });
  if(focus) $(`[data-weft="${id}"]`).focus();
}

/* ===== events ===== */
document.addEventListener("click",e=>{
  const w=e.target.closest("[data-weft]"); if(w){ openWeft(w.dataset.weft); return; }
  const a=e.target.closest("[data-add]"); if(a){ addToCart(a.dataset.add); return; }
  if(e.target.closest("#pdpAdd")){ const ch=$("input[name=pcolor]:checked"); addToCart(e.target.closest("#pdpAdd").dataset.pid,+$("#pq").textContent,ch?ch.value:null); return; }
  const pq=e.target.closest("[data-pq]"); if(pq){ const o=$("#pq"); o.textContent=Math.max(1,Math.min(99,+o.textContent+ +pq.dataset.pq)); return; }
  const q=e.target.closest("[data-q]"); if(q){ const l=cart.find(x=>lineKey(x)===q.dataset.q); if(l) setQty(q.dataset.q,l.qty+ +q.dataset.d); return; }
  const rm=e.target.closest("[data-rm]"); if(rm){ setQty(rm.dataset.rm,0); return; }
  if(e.target.closest("#cartBtn")){ openDrawer(); return; }
  if(e.target.closest("#drawerClose")||e.target.id==="scrim"||e.target.closest("[data-close]")){ closeDrawer(); return; }
  if(e.target.closest("#langBtn")){ lang=lang==="ar"?"en":"ar"; store.set("kafei-lang",lang); applyLang(); pendingFocus=false; render(); replay($("#main"),"lang-in"); return; }
  if(e.target.closest("#copyPhone")){ try{ navigator.clipboard.writeText(CONFIG.phoneDisplay).then(()=>toast(t("copied")),selectPhone); }catch(err){ selectPhone(); } return; }
  const fl=e.target.closest("[data-focus]"); if(fl){ e.preventDefault(); const el=document.getElementById(fl.dataset.focus); el&&el.focus(); }
});
function selectPhone(){ const r=document.createRange(); r.selectNodeContents($("#phoneNum")); const s=getSelection(); s.removeAllRanges(); s.addRange(r); toast(t("copy_fail")); }
document.addEventListener("keydown",e=>{
  const w=e.target.closest&&e.target.closest("[data-weft]");
  if(w&&["ArrowDown","ArrowUp","Home","End"].includes(e.key)){ const ids=P.map(p=>p.id), i=ids.indexOf(w.dataset.weft); const j=e.key==="Home"?0:e.key==="End"?ids.length-1:(i+(e.key==="ArrowDown"?1:-1)+ids.length)%ids.length; e.preventDefault(); $(`[data-weft="${ids[j]}"]`).focus(); return; }
  const d=$("#drawer"); if(d.hidden) return;
  if(e.key==="Escape"){ closeDrawer(); return; }
  if(e.key==="Tab"){ const f=$$("a[href],button:not([disabled]),input,select,textarea",d).filter(x=>x.offsetParent!==null); if(!f.length) return; const first=f[0],last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();} }
});
/* colour swatches: swap the photo, the colour name and the WhatsApp question */
document.addEventListener("change",e=>{
  if(e.target.name!=="pcolor") return; const id=(location.hash.match(/^#p-(.+)$/)||[])[1], p=byId[id], c=colorOf(p,e.target.value); if(!c) return;
  const img=$(".pdp .vessel img"); if(img){ img.src=c.img||p.img; img.alt=cName(p,c); }
  $$(".pdp [data-detail]").forEach(d=>{ const i=+d.dataset.detail; if(c.details&&c.details[i]){ d.src=c.details[i]; d.alt=`${cName(p,c)}, ${t(i?"d_side":"d_close")}`; } });
  $("#swName").textContent=L(c.name); const a=$("#pdpAsk"); if(a) a.href=wa(t("wa_item",cName(p,c)));
});
document.addEventListener("focusout",e=>{ const id=e.target.id; if(RULES[id]&&e.target.closest("#coForm")&&(e.target.value||e.target.getAttribute("aria-invalid")==="true")) validate(id); });
document.addEventListener("submit",e=>{ if(e.target.id==="coForm") submitCheckout(e); });
window.addEventListener("hashchange",()=>{ closeDrawer(); render(); });
applyLang(); render();
/* products from the owner's dashboard: replace the built-in list once they arrive; keep it if they don't */
/* (a host without the /api functions answers 404: then checkout sends every order on WhatsApp instead of showing a payment error) */
if(CONFIG.payments&&CONFIG.payments.products) fetch(CONFIG.payments.products).then(r=>{
  if(r.status===404||r.status===405){ CONFIG.payments=null; if(location.hash==="#checkout") render(); return null; }
  return r.status===200?r.json():null; }).then(list=>{
  if(!Array.isArray(list)||!list.length) return;
  P.length=0; list.forEach(x=>P.push(x)); for(const k of Object.keys(byId)) delete byId[k]; P.forEach(x=>byId[x.id]=x);
  const have=new Set(cart.map(lineKey)); cart=cart.filter(okLine);
  for(const l of cartSaved) if(!have.has(lineKey(l))&&okLine(l)) cart.push(l);
  updateCount(); render();
}).catch(()=>{});
})();

