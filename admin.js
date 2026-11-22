/* Kafei owner dashboard. Signs the owner in with Supabase (email code), then reads every figure from
   /api/admin, which checks the account against ADMIN_EMAILS. Nothing here invents or fills in numbers. */
(function () {
  "use strict";
  const CFG = window.KAFEI_ADMIN || {};
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  let lang = store.get("kafei-admin-lang", "en"), days = store.get("kafei-admin-days", 30);

  const T = {
    en: { title: "Dashboard", lang: "العربية", out: "Sign out", period: "Period", d: n => `${n} days`,
      in_h: "Sign in to the dashboard", in_p: "Only the shop owner's email can open it. We email you a sign-in code.", email: "Email", send: "Send code",
      sent: e => `We sent a code to ${e}. Use the newest email: each new code replaces the last one.`, code: "Code from the email", go: "Sign in", other: "Use another email",
      e_email: "Enter an email address.", e_code: "That code is wrong or has expired. Request a new one.", e_send: "We couldn't send the code. Wait a minute and try again.", e_wait: n => `We just sent you a code. Check your email (and spam), or wait ${n} seconds to ask for a new one.`,
      e_cfg: "The dashboard isn't connected yet. Add the Supabase URL and anon key to admin.html.", e_forbidden: "This account is not allowed into the dashboard. Sign in with the owner's email.",
      e_read: "The dashboard could not read the shop's data. Try again in a minute.", retry: "Try again", loading: "Loading the shop's figures",
      updated: t => `Figures from the shop's orders, updated ${t}.`,
      orders: "Orders", revenue: "Money collected", revenue_s: "Paid online, and cash on delivered orders", collect: "Cash to collect", collect_s: "Cash orders not yet delivered",
      profit: "Profit", profit_s: "Money collected minus product cost", profit_part: "Some products have no cost price yet, so they are left out", stockval: "Stock value", stockval_s: "What the stock on the shelf cost you", th_profit: "Profit", th_cost: "Cost", th_margin: "Margin", f_cost: "Cost price in KWD", f_cost_h: "What you paid per unit. Only you see this; it is never shown in the shop.", margin_line: (g, pc) => `Profit per unit: ${g} (${pc}% margin)`, margin_loss: g => `Below cost: you lose ${g} per unit`,
      codes_h: "Discount codes", codes_s: "Customers type these at checkout. The discount comes off the items, not delivery.", codes_none: "Run 11_discount_codes.sql in Supabase to start using codes.", codes_empty: "No codes yet.", newc: "New code", c_code: "Code", c_kind: "Type", c_pct: "Percent off", c_fixed: "KWD off", c_value: "Amount", c_value_h: "For percent, a whole number like 10. For KWD, an amount like 2.000.", c_min: "Minimum order in KWD (optional)", c_ends: "Last day (optional)", c_once: "Once per customer (by phone number)", c_active: "Active: customers can use it now", c_uses: "Used", c_given: "Given away", c_rule: "Discount", c_limits: "Limits", c_once_s: "once each", c_min_s: m => `min ${m}`, c_ends_s: d => `until ${d}`, c_off: "paused", savec: "Save code", savedc: "Code saved", delc: "Delete", delc_q: c => `Delete the code ${c}? Orders that used it keep their discount.`, deletedc: "Code deleted", pausec: "Pause", resumec: "Turn on", discounts: "Discounts given",
      avg: "Average order", active: "Customers", active_s: n => `${n} returning`,
      daily_h: "Money collected per day", daily_s: n => `Last ${n} days, in KWD`, weekly_h: "Orders per week", weekly_s: "Last 12 weeks, weeks start on Sunday",
      pay_h: "How customers pay", pay_s: "Orders in this period", knet: "KNET", card: "Card", apple: "Apple Pay", cod: "Cash on delivery",
      st_paid: "Paid", st_cod: "Cash orders", st_pending: "Waiting for payment", st_failed: "Not paid",
      gov_h: "Where orders go", gov_s: n => `${n} in the same-day zone`, same: "same day",
      capital: "Capital", hawalli: "Hawalli", farwaniya: "Farwaniya", mubarak: "Mubarak Al-Kabeer", ahmadi: "Ahmadi", jahra: "Jahra",
      del_h: "To deliver", del_s: (a, b) => `${a} to deliver, ${b} delivered in this period`, mark: "Mark delivered", marked: "Marked delivered", cxl: "Cancel order", cxl_q: "Cancel this order? Its items go back into stock. Refund the customer in MyFatoorah yourself if they paid by card.", cxld: "Order cancelled",
      th_order: "Order", th_date: "Placed", th_items: "Items", th_area: "Area", th_pay: "Payment", th_total: "Total",
      prod_h: "Sales by product", prod_s: "Units ordered and money collected in this period", th_product: "Product", th_units: "Units", th_rev: "Collected",
      stock_h: "Stock", stock_s: "Units on the shelf. They go down by themselves with every paid or cash order, and come back if you cancel one. At 0 the shop shows it as sold out. Leave a box empty to not count that item.", out: "Sold out", th_left: "Units left", th_low: "Flag at", save: "Save", saved: "Stock saved", low: "Low", ok: "In stock", unset: "Not set",
      prods_h: "Products", prods_s: "What the shop shows. New products appear on the shop within a minute.", newp: "New product", edit: "Edit", hide: "Hide", show: "Show",
      visible: "On the shop", hidden: "Hidden", ask: "Ask for price", no_cat: "Connect Supabase and run 003_products.sql to manage products here.",
      f_brand: "Brand", f_brand_h: "For example xBloom or Timemore. Products with the same brand are grouped in Shop by brand.", f_name_en: "Name in English", f_name_ar: "Name in Arabic", f_cat: "Category", f_sub: "Type", f_kind_en: "Short label in English", f_kind_ar: "Short label in Arabic",
      f_what_en: "One line in English", f_what_ar: "One line in Arabic", f_desc_en: "Description in English", f_desc_ar: "Description in Arabic",
      f_price: "Price in KWD", f_price_h: "Leave empty to show Ask for price.", f_units: "Units in stock", f_units_colors: "This product has colours: set the units for each colour in the Stock panel.", f_low: "Flag low at", f_photo: "Photo", f_photo_h: "JPG, PNG or WebP. It is resized before upload.",
      f_fit: "The photo has a plain or see-through background (show the whole product)", f_vis: "Show on the shop", f_colors: "Colours", f_colors_h: "Untick a colour when it runs out. Customers can still see it, struck through, but can't order it.", c_in: "In stock", f_sort: "Order on the shop", f_sort_h: "Lower numbers come first.",
      savep: "Save product", cancel: "Cancel", savedp: "Product saved", uploading: "Uploading the photo", e_photo: "The photo could not be read. Choose another.",
      choose: "Choose", c_espresso_machines: "Espresso machines", c_pourover_machines: "Pour-over machines", c_beans: "Beans", c_pourover_accessories: "Pour-over accessories",
      c_espresso_accessories: "Espresso accessories", c_cups: "Cups", c_tumblers: "Tumblers", c_grinders: "Grinders",
      s_filter: "Filter", s_espresso: "Espresso", s_manual: "Manual", s_electric: "Electric", th_photo: "Photo", th_cat: "Category", th_price: "Price", th_state: "Shop",
      none_cats: "Categories with nothing to sell yet",
      cust_h: "Customers", cust_s: "Who ordered in this period", new_c: "First order", ret_c: "Returning", signups: "Account sign-ups per week", signups_none: "Sign-ups appear once customer accounts are live.",
      table: "Show as table", day: "Day", week: "Week of", value: "Value",
      e_none_orders: ["No orders yet", "Orders appear here as soon as a customer pays online or places a cash order."],
      e_none_open: ["Nothing to deliver", "Paid and cash orders waiting for delivery are listed here."],
      e_none_stock: ["No stock numbers yet", "Type how many you have in Units left and press Save. Leave a box empty if you don't want to count that item."],
      e_save: "Not saved. Try again.", demo_code: "Demo: no email is sent. Your code is" },
    ar: { title: "لوحة المتابعة", lang: "English", out: "تسجيل الخروج", period: "الفترة", d: n => `${n} يومًا`,
      in_h: "الدخول إلى لوحة المتابعة", in_p: "لا يفتحها إلا بريد صاحب المتجر. نرسل لك رمز دخول بالبريد.", email: "البريد الإلكتروني", send: "أرسل الرمز",
      sent: e => `أرسلنا رمزًا إلى ${e}. استخدم أحدث رسالة: كل رمز جديد يلغي الرمز السابق.`, code: "الرمز من البريد", go: "دخول", other: "استخدم بريدًا آخر",
      e_email: "اكتب بريدًا إلكترونيًا.", e_code: "الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا.", e_send: "تعذّر إرسال الرمز. انتظر دقيقة وحاول مرة أخرى.", e_wait: n => `أرسلنا لك رمزًا للتو. تحقق من بريدك (والرسائل غير المرغوب فيها)، أو انتظر ${n} ثانية لطلب رمز جديد.`,
      e_cfg: "لوحة المتابعة غير متصلة بعد. أضف رابط Supabase والمفتاح العام إلى admin.html.", e_forbidden: "هذا الحساب غير مسموح له بالدخول. سجّل الدخول ببريد صاحب المتجر.",
      e_read: "تعذّر قراءة بيانات المتجر. حاول بعد دقيقة.", retry: "حاول مرة أخرى", loading: "جارٍ تحميل أرقام المتجر",
      updated: t => `أرقام من طلبات المتجر، آخر تحديث ${t}.`,
      orders: "الطلبات", revenue: "المبالغ المحصّلة", revenue_s: "المدفوع إلكترونيًا ونقد الطلبات المسلّمة", collect: "نقد للتحصيل", collect_s: "طلبات نقدية لم تُسلّم بعد",
      profit: "الربح", profit_s: "المبالغ المحصّلة ناقص تكلفة المنتجات", profit_part: "بعض المنتجات بلا سعر تكلفة بعد، لذلك لم تُحتسب", stockval: "قيمة المخزون", stockval_s: "تكلفة البضاعة الموجودة لديك", th_profit: "الربح", th_cost: "التكلفة", th_margin: "الهامش", f_cost: "سعر التكلفة بالدينار", f_cost_h: "ما دفعته للوحدة الواحدة. يظهر لك فقط ولا يظهر في المتجر أبدًا.", margin_line: (g, pc) => `الربح للوحدة: ${g} (هامش ${pc}%)`, margin_loss: g => `أقل من التكلفة: تخسر ${g} للوحدة`,
      codes_h: "أكواد الخصم", codes_s: "يكتبها العملاء عند الدفع. الخصم على المنتجات وليس على التوصيل.", codes_none: "شغّل الملف 11_discount_codes.sql في Supabase لتبدأ باستخدام الأكواد.", codes_empty: "لا توجد أكواد بعد.", newc: "كود جديد", c_code: "الكود", c_kind: "النوع", c_pct: "نسبة خصم", c_fixed: "خصم بالدينار", c_value: "القيمة", c_value_h: "للنسبة رقم صحيح مثل 10، وللدينار مبلغ مثل 2.000.", c_min: "أقل قيمة للطلب بالدينار (اختياري)", c_ends: "آخر يوم (اختياري)", c_once: "مرة واحدة لكل عميل (حسب رقم الهاتف)", c_active: "مفعّل: يقدر العملاء يستخدمونه الآن", c_uses: "مرات الاستخدام", c_given: "قيمة الخصومات", c_rule: "الخصم", c_limits: "الشروط", c_once_s: "مرة لكل عميل", c_min_s: m => `حد أدنى ${m}`, c_ends_s: d => `حتى ${d}`, c_off: "موقوف", savec: "حفظ الكود", savedc: "تم حفظ الكود", delc: "حذف", delc_q: c => `حذف الكود ${c}؟ الطلبات التي استخدمته تبقى بخصمها.`, deletedc: "تم حذف الكود", pausec: "إيقاف", resumec: "تفعيل", discounts: "الخصومات الممنوحة",
      avg: "متوسط الطلب", active: "العملاء", active_s: n => `${n} عائدون`,
      daily_h: "المحصّل يوميًا", daily_s: n => `آخر ${n} يومًا، بالدينار`, weekly_h: "الطلبات أسبوعيًا", weekly_s: "آخر 12 أسبوعًا، يبدأ الأسبوع يوم الأحد",
      pay_h: "طريقة الدفع", pay_s: "طلبات هذه الفترة", knet: "كي نت", card: "بطاقة", apple: "Apple Pay", cod: "الدفع عند الاستلام",
      st_paid: "مدفوع", st_cod: "طلبات نقدية", st_pending: "بانتظار الدفع", st_failed: "لم يُدفع",
      gov_h: "وجهة الطلبات", gov_s: n => `${n} في منطقة التوصيل في نفس اليوم`, same: "نفس اليوم",
      capital: "العاصمة", hawalli: "حولي", farwaniya: "الفروانية", mubarak: "مبارك الكبير", ahmadi: "الأحمدي", jahra: "الجهراء",
      del_h: "بانتظار التوصيل", del_s: (a, b) => `${a} للتوصيل، ${b} سُلّمت في هذه الفترة`, mark: "تم التسليم", marked: "سُجّل التسليم", cxl: "إلغاء الطلب", cxl_q: "إلغاء هذا الطلب؟ ستعود منتجاته إلى المخزون. إذا دفع العميل بالبطاقة فأرجع المبلغ بنفسك من MyFatoorah.", cxld: "أُلغي الطلب",
      th_order: "الطلب", th_date: "التاريخ", th_items: "المنتجات", th_area: "المنطقة", th_pay: "الدفع", th_total: "الإجمالي",
      prod_h: "المبيعات حسب المنتج", prod_s: "الكميات المطلوبة والمبالغ المحصّلة في هذه الفترة", th_product: "المنتج", th_units: "الكمية", th_rev: "المحصّل",
      stock_h: "المخزون", stock_s: "الكميات المتوفرة. تنقص تلقائيًا مع كل طلب مدفوع أو نقدي، وتعود إذا ألغيت الطلب. عند الصفر يظهر المنتج في المتجر كنافد. اترك الخانة فارغة إذا لا تريد عدّه.", out: "نفد", th_left: "المتبقي", th_low: "تنبيه عند", save: "احفظ", saved: "تم حفظ المخزون", low: "منخفض", ok: "متوفر", unset: "غير محدد",
      prods_h: "المنتجات", prods_s: "ما يعرضه المتجر. تظهر المنتجات الجديدة في المتجر خلال دقيقة.", newp: "منتج جديد", edit: "تعديل", hide: "إخفاء", show: "إظهار",
      visible: "في المتجر", hidden: "مخفي", ask: "اسأل عن السعر", no_cat: "اربط Supabase وشغّل 003_products.sql لإدارة المنتجات هنا.",
      f_brand: "الماركة", f_brand_h: "مثل xBloom أو Timemore. المنتجات بنفس الماركة تظهر معًا في «تسوّق حسب الماركة».", f_name_en: "الاسم بالإنجليزية", f_name_ar: "الاسم بالعربية", f_cat: "القسم", f_sub: "النوع", f_kind_en: "وصف قصير بالإنجليزية", f_kind_ar: "وصف قصير بالعربية",
      f_what_en: "سطر واحد بالإنجليزية", f_what_ar: "سطر واحد بالعربية", f_desc_en: "الوصف بالإنجليزية", f_desc_ar: "الوصف بالعربية",
      f_price: "السعر بالدينار", f_price_h: "اتركه فارغًا ليظهر «اسأل عن السعر».", f_units_colors: "لهذا المنتج ألوان: حدّد الكمية لكل لون في قسم المخزون.", f_units: "الكمية المتوفرة", f_low: "تنبيه عند", f_photo: "الصورة", f_photo_h: "JPG أو PNG أو WebP. يُصغَّر حجمها قبل الرفع.",
      f_fit: "خلفية الصورة سادة أو شفافة (اعرض المنتج كاملًا)", f_vis: "اعرضه في المتجر", f_colors: "الألوان", f_colors_h: "أزل العلامة عن اللون حين ينفد. يبقى ظاهرًا للعملاء مشطوبًا، لكن لا يمكن طلبه.", c_in: "متوفر", f_sort: "الترتيب في المتجر", f_sort_h: "الأرقام الأصغر تظهر أولًا.",
      savep: "احفظ المنتج", cancel: "إلغاء", savedp: "تم حفظ المنتج", uploading: "جارٍ رفع الصورة", e_photo: "تعذّرت قراءة الصورة. اختر صورة أخرى.",
      choose: "اختر", c_espresso_machines: "مكائن الإسبريسو", c_pourover_machines: "مكائن التقطير", c_beans: "البن", c_pourover_accessories: "أدوات التقطير",
      c_espresso_accessories: "أدوات الإسبريسو", c_cups: "الأكواب", c_tumblers: "الأكواب الحافظة", c_grinders: "المطاحن",
      s_filter: "للتقطير", s_espresso: "للإسبريسو", s_manual: "يدوية", s_electric: "كهربائية", th_photo: "الصورة", th_cat: "القسم", th_price: "السعر", th_state: "المتجر",
      none_cats: "أقسام لا تحتوي منتجات بعد",
      cust_h: "العملاء", cust_s: "من طلب في هذه الفترة", new_c: "أول طلب", ret_c: "عائدون", signups: "الحسابات الجديدة أسبوعيًا", signups_none: "تظهر الحسابات الجديدة بعد تفعيل حسابات العملاء.",
      table: "اعرض كجدول", day: "اليوم", week: "أسبوع", value: "القيمة",
      e_none_orders: ["لا توجد طلبات بعد", "تظهر الطلبات هنا فور الدفع الإلكتروني أو تقديم طلب نقدي."],
      e_none_open: ["لا شيء للتوصيل", "تظهر هنا الطلبات المدفوعة والنقدية التي تنتظر التوصيل."],
      e_none_stock: ["لا توجد كميات بعد", "اكتب الكمية المتوفرة في خانة المتبقي ثم اضغط حفظ. اترك الخانة فارغة إذا لم ترد عدّ هذا المنتج."],
      e_save: "لم يُحفظ. حاول مرة أخرى.", demo_code: "تجربة: لا يُرسل بريد. رمزك هو" }
  };
  const t = (k, ...a) => { const v = T[lang][k] ?? T.en[k]; return typeof v === "function" ? v(...a) : v; };
  const kwd = f => f == null ? "—" : (lang === "ar" ? `${(f / 1000).toFixed(3)} د.ك` : `KWD ${(f / 1000).toFixed(3)}`);
  const kwdShort = f => (f / 1000).toFixed(f % 1000 ? 3 : 0);
  const nf = n => new Intl.NumberFormat(lang === "ar" ? "ar-KW" : "en-GB").format(n);
  const df = (d, o) => new Intl.DateTimeFormat(lang === "ar" ? "ar-KW" : "en-GB", o || { day: "numeric", month: "short" }).format(new Date(d));
  const toast = m => { const e = $("#toast"); e.textContent = m; e.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove("show"), 2600); };
  const ICON = {
    good: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2l6.5 11.5h-13z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6.5v3.2M8 11.6v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    bad: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    neutral: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 5v3.3l2 1.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };
  const ALLCATS = { "espresso-machines": [], "pourover-machines": [], beans: ["filter", "espresso"], "pourover-accessories": [], "espresso-accessories": [], cups: [], tumblers: [], grinders: ["manual", "electric"] };
  const catName = c => t("c_" + c.replace(/-/g, "_"));
  const BUILTIN = [{ id: "kuvani-maestro", cat: "espresso-machines", name_en: "Kuvani Maestro", name_ar: "كوفاني مايسترو", visible: false }, { id: "xbloom-studio", cat: "pourover-machines", name_en: "xBloom Studio", name_ar: "إكس بلوم ستوديو", visible: true },
    { id: "kuvani-gevi-v60", cat: "pourover-machines", name_en: "Kuvani × Gevi V60", name_ar: "كوفاني × جيفي V60", visible: false }, { id: "sias-cattopia", cat: "beans", sub: "filter", name_en: "SIAS Cattopia Blend", name_ar: "سياس كاتوبيا بلند", visible: false }];
  const catalog = () => (data && data.catalog) || BUILTIN;
  const pname = p => { const c = catalog().find(x => x.id === p.id); return c ? (lang === "ar" ? c.name_ar : c.name_en) : (lang === "ar" && p.name_ar ? p.name_ar : p.name); };
  const emptyCats = () => { const live = catalog().filter(p => p.visible !== false); const out = [];
    for (const [c, subs] of Object.entries(ALLCATS)) { if (!live.some(p => p.cat === c)) out.push(catName(c)); else for (const sb of subs) if (!live.some(p => p.cat === c && p.sub === sb)) out.push(catName(c) + ": " + t("s_" + sb)); }
    return out; };
  let editing = null, photoData = null, editingCode = null;   // editingCode: null, "new", or a code   // editing: null, "new", or a product id

  /* ---------- Supabase sign-in ---------- */
  let sb = null, session = null, step = "email", email = "", msg = "", data = null, state = "signin";
  function loadSb() {
    if (sb) return Promise.resolve(sb);
    if (!CFG.supabaseUrl || !CFG.anonKey) return Promise.resolve(null);
    return new Promise((ok, fail) => { if (window.supabase) return ok(); const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"; s.onload = ok; s.onerror = fail; document.head.appendChild(s); })
      .then(async () => { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "kafei-admin-auth" } }); const r = await sb.auth.getSession(); session = r.data && r.data.session; return sb; })
      .catch(() => null);
  }
  async function token() { if (!sb) return null; const r = await sb.auth.getSession(); session = r.data && r.data.session; return session ? session.access_token : null; }
  async function api(method, body) {
    const tok = await token();
    const r = await fetch(method === "GET" ? `/api/admin?days=${days}` : "/api/admin", { method, headers: { "Content-Type": "application/json", ...(tok ? { Authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({})); return { status: r.status, d };
  }

  /* ---------- charts: single-series bars, roast on the panel; a table view under each ---------- */
  function columns(points, { label, value, fmt, id }) {
    if (!points.length) return "";
    const W = 640, H = 220, L = 44, B = 26, T = 10, w = W - L - 8, h = H - B - T;
    const max = Math.max(1, ...points.map(value)); const step = niceStep(max); const top = Math.ceil(max / step) * step;
    const n = points.length, slot = w / n, bw = Math.max(3, Math.min(28, slot - 2));
    let g = "";
    for (let v = 0; v <= top + 1e-9; v += step) { const y = T + h - (v / top) * h; g += `<line class="grid-l" x1="${L}" x2="${W - 8}" y1="${y}" y2="${y}"/><text class="axis" x="${L - 6}" y="${y + 4}" text-anchor="end">${fmt(v, true)}</text>`; }
    const every = Math.ceil(n / 7); let bars = "";
    points.forEach((p, i) => {
      const v = value(p), x = L + i * slot + (slot - bw) / 2, bh = v ? Math.max(2, (v / top) * h) : 0, y = T + h - bh;
      const tip = `${label(p, true)}|${fmt(v)}`;
      bars += `<rect class="hit" x="${L + i * slot}" y="${T}" width="${slot}" height="${h}" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(label(p, true) + ": " + fmt(v))}"/>`;
      if (bh) bars += `<path class="bar${i === n - 1 ? " hot" : ""}" d="M${x} ${T + h}V${y + 4}q0-4 4-4h${bw - 8}q4 0 4 4V${T + h}z"/>`;
      if (i % every === 0 || i === n - 1) bars += `<text class="axis" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(label(p))}</text>`;
    });
    const rows = points.map(p => `<tr><td>${esc(label(p, true))}</td><td class="r num">${esc(fmt(value(p)))}</td></tr>`).join("");
    return `<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(id)}" dir="ltr">${g}${bars}</svg><div class="tip" hidden></div></div>
      <details class="astable"><summary>${t("table")}</summary><div class="tscroll"><table><thead><tr><th>${t(id.startsWith("w") ? "week" : "day")}</th><th class="r">${t("value")}</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }
  function niceStep(max) { const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function hbars(rows) {
    const max = Math.max(1, ...rows.map(r => r.v));
    return `<ul class="hbars">${rows.map(r => `<li><span>${esc(r.k)}${r.tag ? `<span class="tag">${esc(r.tag)}</span>` : ""}</span><span class="track" aria-hidden="true"><span class="fill" style="width:${r.v ? Math.max(1.5, (r.v / max) * 100) : 0}%"></span></span><span class="val num">${nf(r.v)}</span></li>`).join("")}</ul>`;
  }
  const empty = k => `<div class="empty"><b>${esc(t(k)[0])}</b>${esc(t(k)[1])}</div>`;
  const chip = (cls, label, n) => `<span class="st ${cls}">${ICON[cls]}${esc(label)} <span class="num">${nf(n)}</span></span>`;

  /* ---------- screens ---------- */
  function shell() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $("#tTitle").textContent = t("title"); $("#lang").textContent = t("lang"); $("#lang").setAttribute("lang", lang === "ar" ? "en" : "ar"); $("#out").textContent = t("out");
    $("#range").setAttribute("aria-label", t("period"));
    $$("#range button").forEach(b => { b.setAttribute("aria-pressed", String(+b.dataset.days === days)); b.setAttribute("aria-label", t("d", b.dataset.days)); });
    $("#range").hidden = state !== "dash"; $("#out").hidden = !session;
    document.title = (lang === "ar" ? "لوحة كفي" : "Kafei Dashboard");
  }
  function viewSignIn() {
    const err = msg ? `<p class="err" role="alert">${esc(msg)}</p>` : ""; msg = "";
    if (!CFG.supabaseUrl || !CFG.anonKey) return `<div class="wrap signin"><div class="card"><h1>${t("in_h")}</h1><p class="err">${t("e_cfg")}</p></div></div>`;
    if (step === "code") return `<div class="wrap signin"><form class="card" id="fCode" novalidate><h1>${t("in_h")}</h1><p class="note">${esc(t("sent", email))}</p>${CFG.demo && window.__demoCode ? `<p class="note" style="color:var(--good);font-weight:700;font-size:15px">${t("demo_code")} <span class="num" dir="ltr">${window.__demoCode}</span></p>` : ""}${err}
      <div class="f"><label for="otp">${t("code")}</label><input id="otp" class="code num" inputmode="numeric" autocomplete="one-time-code" maxlength="12" required></div>
      <button class="btn" type="submit">${t("go")}</button><button class="btn ghost" type="button" id="back">${t("other")}</button></form></div>`;
    return `<div class="wrap signin"><form class="card" id="fEmail" novalidate><h1>${t("in_h")}</h1><p class="note">${t("in_p")}</p>${err}
      <div class="f"><label for="em">${t("email")}</label><input id="em" type="email" dir="ltr" autocomplete="email" required value="${esc(email)}"></div>
      <button class="btn" type="submit">${t("send")}</button></form></div>`;
  }
  function viewDash(s) {
    const placed = s.totals.orders;
    const tiles = `<div class="tiles">
      <div class="tile"><p class="k">${t("orders")}</p><p class="v num">${nf(placed)}</p><p class="s">${t("d", s.days)}</p></div>
      <div class="tile"><p class="k">${t("revenue")}</p><p class="v num">${kwd(s.totals.revenue_fils)}</p><p class="s">${t("revenue_s")}</p></div>
      ${s.totals.profit_fils !== null && s.totals.profit_fils !== undefined ? `<div class="tile"><p class="k">${t("profit")}</p><p class="v num">${kwd(s.totals.profit_fils)}</p><p class="s">${s.totals.profit_partial ? t("profit_part") : t("profit_s")}</p></div>` : ""}
      ${s.totals.stock_value_fils !== null && s.totals.stock_value_fils !== undefined ? `<div class="tile"><p class="k">${t("stockval")}</p><p class="v num">${kwd(s.totals.stock_value_fils)}</p><p class="s">${t("stockval_s")}</p></div>` : ""}
      <div class="tile"><p class="k">${t("collect")}</p><p class="v num">${kwd(s.totals.to_collect_fils)}</p><p class="s">${t("collect_s")}</p></div>
      <div class="tile"><p class="k">${t("avg")}</p><p class="v num">${kwd(s.totals.average_fils)}</p><p class="s">${t("d", s.days)}</p></div>
      <div class="tile"><p class="k">${t("active")}</p><p class="v num">${nf(s.customers.active)}</p><p class="s">${t("active_s", nf(s.customers.returning))}</p></div></div>`;
    const anyOrders = s.weeks.some(w => w.orders) || placed > 0;
    const daily = anyOrders ? columns(s.daily, { id: "daily", value: p => p.revenue_fils, fmt: (v, axis) => axis ? kwdShort(v) : kwd(v), label: (p, long) => df(p.day, long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" }) }) : empty("e_none_orders");
    const weekly = anyOrders ? columns(s.weeks, { id: "weekly", value: p => p.orders, fmt: v => nf(v), label: (p, long) => df(p.week, long ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" }) }) : empty("e_none_orders");
    const pay = placed ? hbars(["knet", "card", "apple", "cod"].map(k => ({ k: t(k), v: s.methods[k] }))) : empty("e_none_orders");
    const states = `<div class="states">${chip("good", t("st_paid"), s.states.paid)}${chip("neutral", t("st_cod"), s.states.cod)}${chip("warn", t("st_pending"), s.states.pending)}${chip("bad", t("st_failed"), s.states.failed)}</div>`;
    const gov = placed ? hbars(Object.keys(s.gov).map(k => ({ k: t(k), v: s.gov[k], tag: (k === "capital" || k === "hawalli") ? t("same") : "" }))) : empty("e_none_orders");
    const open = s.open.length ? `<div class="tscroll"><table class="cards"><thead><tr><th>${t("th_order")}</th><th>${t("th_date")}</th><th>${t("th_items")}</th><th>${t("th_area")}</th><th>${t("th_pay")}</th><th class="r">${t("th_total")}</th><th></th></tr></thead><tbody>${s.open.map(o => `<tr>
      <td class="num">${esc(o.id)}</td><td>${df(o.created_at)}</td><td>${esc(o.items.map(i => i.qty + " × " + pname(i)).join(lang === "ar" ? "، " : ", "))}</td><td>${o.gov ? t(o.gov) : "—"}</td>
      <td>${t(o.method) || "—"}</td><td class="r num">${kwd(o.total_fils)}</td><td class="r"><button class="btn small" type="button" data-deliver="${esc(o.id)}">${t("mark")}</button> <button class="btn small ghost" type="button" data-cancel="${esc(o.id)}">${t("cxl")}</button></td></tr>`).join("")}</tbody></table></div>` : empty("e_none_open");
    const pmax = Math.max(1, ...s.products.map(p => p.units));
    const prod = `<div class="tscroll"><table><thead><tr><th>${t("th_product")}</th><th class="r">${t("th_units")}</th><th class="r">${t("th_rev")}</th><th class="r">${t("th_profit")}</th></tr></thead><tbody>${s.products.map(p => `<tr><td>${esc(pname(p))}</td><td class="r num">${nf(p.units)}${p.units ? `<span class="inbar" style="width:${Math.max(2, p.units / pmax * 60)}px" aria-hidden="true"></span>` : ""}</td><td class="r num">${kwd(p.revenue_fils)}</td><td class="r num">${p.profit_fils === null || p.profit_fils === undefined ? "—" : kwd(p.profit_fils)}</td></tr>`).join("")}</tbody></table></div>`;
    const anyStock = s.stock.some(r => r.units !== null);
    const stock = `<div class="tscroll"><table><thead><tr><th>${t("th_product")}</th><th class="r">${t("th_left")}</th><th class="r">${t("th_low")}</th><th></th><th></th></tr></thead><tbody>${s.stock.map(r => `<tr>
      <td>${esc(pname(r))}</td><td class="r"><input class="stock-in num" type="number" min="0" step="1" inputmode="numeric" id="u-${r.id}" value="${r.units ?? ""}" aria-label="${esc(pname(r) + ": " + t("th_left"))}"></td>
      <td class="r"><input class="stock-in num" type="number" min="0" step="1" inputmode="numeric" id="l-${r.id}" value="${r.low_at ?? 2}" aria-label="${esc(pname(r) + ": " + t("th_low"))}"></td>
      <td>${r.units === null ? chip("neutral", t("unset"), 0).replace(/ <span class="num">0<\/span>/, "") : r.units === 0 ? chip("bad", t("out"), 0).replace(/ <span class="num">0<\/span>/, "") : r.low ? chip("warn", t("low"), r.units).replace(/ <span class="num">\d+<\/span>/, "") : chip("good", t("ok"), r.units).replace(/ <span class="num">\d+<\/span>/, "")}</td>
      <td class="r"><button class="btn ghost small" type="button" data-stock="${r.id}">${t("save")}</button></td></tr>`).join("")}</tbody></table></div>${anyStock ? "" : empty("e_none_stock")}
      <p class="sub" style="margin-top:16px">${t("none_cats")}</p><div class="cats">${emptyCats().map(c => `<span>${esc(c)}</span>`).join("")}</div>`;
    const signups = s.customers.signups_known && s.weeks.some(w => w.signups) ? columns(s.weeks, { id: "wsignups", value: p => p.signups, fmt: v => nf(v), label: (p, long) => df(p.week, long ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" }) }) : `<p class="empty">${t("signups_none")}</p>`;
    const cust = `<div class="cust one"><div><div class="tiles" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:0"><div class="tile"><p class="k">${t("new_c")}</p><p class="v num">${nf(s.customers.new)}</p></div><div class="tile"><p class="k">${t("ret_c")}</p><p class="v num">${nf(s.customers.returning)}</p></div></div></div><div><p class="sub" style="margin-bottom:8px">${t("signups")}</p>${signups}</div></div>`;
    return `<div class="wrap"><p class="updated">${esc(t("updated", df(s.generated_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })))}</p>${tiles}
      <div class="grid">
        <section class="panel" aria-labelledby="h1"><div class="panel-head"><h2 id="h1">${t("daily_h")}</h2><p class="sub">${t("daily_s", s.days)}</p></div>${daily}</section>
        <section class="panel" aria-labelledby="h2"><div class="panel-head"><h2 id="h2">${t("weekly_h")}</h2><p class="sub">${t("weekly_s")}</p></div>${weekly}</section>
        <section class="panel" aria-labelledby="h3"><div class="panel-head"><h2 id="h3">${t("pay_h")}</h2><p class="sub">${t("pay_s")}</p></div>${pay}${states}</section>
        <section class="panel" aria-labelledby="h4"><div class="panel-head"><h2 id="h4">${t("gov_h")}</h2><p class="sub">${t("gov_s", nf(s.same_day))}</p></div>${gov}</section>
        <section class="panel wide" aria-labelledby="h5"><div class="panel-head"><h2 id="h5">${t("del_h")}</h2><p class="sub">${t("del_s", nf(s.open.length), nf(s.delivery.delivered || 0))}</p></div>${open}</section>
        <section class="panel" aria-labelledby="h6"><div class="panel-head"><h2 id="h6">${t("prod_h")}</h2><p class="sub">${t("prod_s")}</p></div>${prod}</section>
        <section class="panel" aria-labelledby="h8"><div class="panel-head"><h2 id="h8">${t("cust_h")}</h2><p class="sub">${t("cust_s")}</p></div>${cust}</section>
        <section class="panel wide" aria-labelledby="h9" id="prods"><div class="panel-head"><h2 id="h9">${t("prods_h")}</h2>${s.catalog ? `<button class="btn small" type="button" id="newp">${t("newp")}</button>` : ""}</div><p class="sub" style="margin:-6px 0 12px">${t("prods_s")}</p>${viewProducts(s)}</section>
        <section class="panel wide" aria-labelledby="h10" id="codes"><div class="panel-head"><h2 id="h10">${t("codes_h")}</h2>${s.codes ? `<button class="btn small" type="button" id="newc">${t("newc")}</button>` : ""}</div><p class="sub" style="margin:-6px 0 12px">${t("codes_s")}</p>${viewCodes(s)}</section>
        <section class="panel wide" aria-labelledby="h7"><div class="panel-head"><h2 id="h7">${t("stock_h")}</h2><p class="sub">${t("stock_s")}</p></div>${stock}</section>
      </div></div>`;
  }
  function viewCodes(s) {
    if (!s.codes) return `<p class="empty">${t("codes_none")}</p>`;
    const form = editingCode ? codeForm(editingCode === "new" ? null : s.codes.find(c => c.code === editingCode)) : "";
    const day = iso => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuwait" });
    const rows = s.codes.map(c => `<tr>
      <td><b class="num" dir="ltr">${esc(c.code)}</b></td>
      <td class="num">${c.kind === "percent" ? c.value + "%" : kwd(c.value)}</td>
      <td>${[c.once_per_customer ? t("c_once_s") : "", c.min_order_fils ? t("c_min_s", kwd(c.min_order_fils)) : "", c.ends_at ? t("c_ends_s", day(c.ends_at)) : ""].filter(Boolean).join(", ") || "—"}</td>
      <td class="r num">${nf(c.uses)}</td><td class="r num">${kwd(c.given_fils)}</td>
      <td>${c.active && !(c.ends_at && new Date(c.ends_at) < new Date()) ? chip("good", t("visible"), 0).replace(/ <span class="num">0<\/span>/, "") : chip("neutral", t("c_off"), 0).replace(/ <span class="num">0<\/span>/, "")}</td>
      <td class="r" style="white-space:nowrap"><button class="btn ghost small" type="button" data-editc="${esc(c.code)}">${t("edit")}</button> <button class="btn ghost small" type="button" data-togglec="${esc(c.code)}">${c.active ? t("pausec") : t("resumec")}</button> <button class="btn ghost small" type="button" data-delc="${esc(c.code)}">${t("delc")}</button></td></tr>`).join("");
    return form + (s.codes.length ? `<div class="tscroll"><table class="cards"><thead><tr><th>${t("c_code")}</th><th>${t("c_rule")}</th><th>${t("c_limits")}</th><th class="r">${t("c_uses")}</th><th class="r">${t("c_given")}</th><th>${t("th_state")}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="empty">${t("codes_empty")}</p>`);
  }
  // the dashboard form sends KWD and percent as typed; the server checks and converts them
  const codeBody = c => ({ code: c.code, kind: c.kind, value: c.kind === "percent" ? c.value : (c.value / 1000).toFixed(3), once: c.once_per_customer, min: c.min_order_fils ? (c.min_order_fils / 1000).toFixed(3) : "", ends: c.ends_at ? new Date(new Date(c.ends_at).getTime() + 3 * 36e5).toISOString().slice(0, 10) : "", active: c.active });
  function codeForm(c) {
    const b = c ? codeBody(c) : { code: "", kind: "percent", value: "", once: true, min: "", ends: "", active: true };
    return `<form class="pform" id="cform" novalidate><h3>${c ? esc(c.code) : t("newc")}</h3><div id="cerr"></div><div class="fgrid">
      <div class="f"><label for="cf-code">${t("c_code")}</label><input id="cf-code" maxlength="20" dir="ltr" autocapitalize="characters" value="${esc(b.code)}" ${c ? "readonly" : ""} style="text-transform:uppercase"></div>
      <div class="f"><label for="cf-kind">${t("c_kind")}</label><select id="cf-kind"><option value="percent" ${b.kind === "percent" ? "selected" : ""}>${t("c_pct")}</option><option value="fixed" ${b.kind === "fixed" ? "selected" : ""}>${t("c_fixed")}</option></select></div>
      <div class="f"><label for="cf-value">${t("c_value")}</label><input id="cf-value" inputmode="decimal" maxlength="10" dir="ltr" value="${esc(b.value)}"><p class="note">${t("c_value_h")}</p></div>
      <div class="f"><label for="cf-min">${t("c_min")}</label><input id="cf-min" inputmode="decimal" maxlength="10" dir="ltr" value="${esc(b.min)}"></div>
      <div class="f"><label for="cf-ends">${t("c_ends")}</label><input id="cf-ends" type="date" value="${esc(b.ends)}"></div>
      <label class="check full"><input type="checkbox" id="cf-once" ${b.once ? "checked" : ""}> <span>${t("c_once")}</span></label>
      <label class="check full"><input type="checkbox" id="cf-active" ${b.active ? "checked" : ""}> <span>${t("c_active")}</span></label>
    </div><p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn" type="submit">${t("savec")}</button><button class="btn ghost" type="button" id="ccancel">${t("cancel")}</button></p></form>`;
  }
  async function submitCode() {
    const g = k => { const e = $("#cf-" + k); return e.type === "checkbox" ? e.checked : e.value; };
    const btn = $("#cform button[type=submit]"); btn.disabled = true;
    const r = await api("POST", { action: "code_save", code: { code: g("code"), kind: g("kind"), value: g("value"), min: g("min"), ends: g("ends"), once: g("once"), active: g("active") } }).catch(() => ({ status: 0, d: {} }));
    if (r.status === 200) { editingCode = null; toast(t("savedc")); await load(); const sec = $("#codes"); if (sec) sec.scrollIntoView({ block: "start" }); return; }
    $("#cerr").innerHTML = `<p class="err" role="alert">${esc((r.d && r.d.message) || t("e_save"))}</p>`; btn.disabled = false;
  }
  function viewProducts(s) {
    if (!s.catalog) return `<p class="empty">${t("no_cat")}</p>`;
    const form = editing ? productForm(editing === "new" ? null : s.catalog.find(p => p.id === editing), s) : "";
    // units for a product: its own line, or the total of its colours (blank when none are counted)
    const stockOf = id => { const ls = s.stock.filter(r => (r.product || r.id) === id), n = ls.filter(r => r.units !== null && r.units !== undefined);
      return n.length ? n.reduce((a, r) => a + r.units, 0) : (ls.length ? null : undefined); };
    const rows = s.catalog.map(p => `<tr>
      <td><span class="thumb">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" style="object-fit:${p.fit === "contain" ? "contain" : "cover"}">` : ""}</span></td>
      <td><b>${esc(lang === "ar" ? p.name_ar : p.name_en)}</b><br><span class="muted" lang="${lang === "ar" ? "en" : "ar"}">${esc(lang === "ar" ? p.name_en : p.name_ar)}</span></td>
      <td>${esc(catName(p.cat))}${p.sub ? ", " + esc(t("s_" + p.sub)) : ""}</td>
      <td class="r num">${p.price_fils == null ? `<span class="muted">${t("ask")}</span>` : kwd(p.price_fils)}</td>
      <td class="r num">${p.cost_fils == null ? "—" : kwd(p.cost_fils)}</td>
      <td class="r num">${p.cost_fils == null || p.price_fils == null ? "—" : Math.round((p.price_fils - p.cost_fils) / p.price_fils * 100) + "%"}</td>
      <td class="r num">${stockOf(p.id) ?? "—"}</td>
      <td>${p.visible ? chip("good", t("visible"), 0).replace(/ <span class="num">0<\/span>/, "") : chip("neutral", t("hidden"), 0).replace(/ <span class="num">0<\/span>/, "")}</td>
      <td class="r" style="white-space:nowrap"><button class="btn ghost small" type="button" data-editp="${esc(p.id)}">${t("edit")}</button> <button class="btn ghost small" type="button" data-togglep="${esc(p.id)}">${p.visible ? t("hide") : t("show")}</button></td></tr>`).join("");
    return form + `<div class="tscroll"><table class="cards prod"><thead><tr><th>${t("th_photo")}</th><th>${t("th_product")}</th><th>${t("th_cat")}</th><th class="r">${t("th_price")}</th><th class="r">${t("th_cost")}</th><th class="r">${t("th_margin")}</th><th class="r">${t("th_left")}</th><th>${t("th_state")}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  // live profit-per-unit line under the price and cost boxes
  function marginNote(price, cost) {
    const pr = Number(String(price).replace(",", ".")), co = Number(String(cost).replace(",", "."));
    if (!(pr > 0) || String(cost).trim() === "" || !(co >= 0)) return "";
    const g = Math.round((pr - co) * 1000);
    return g < 0 ? t("margin_loss", kwd(-g)) : t("margin_line", kwd(g), Math.round(g / (pr * 1000) * 100));
  }
  document.addEventListener("input", e => { if (e.target.id === "pf-price" || e.target.id === "pf-cost") { const n = $("#pf-margin"); if (n) n.textContent = marginNote($("#pf-price").value, $("#pf-cost").value); } });
  function productForm(p, s) {
    p = p || { cat: "", visible: true, fit: "cover", sort: 100 };
    const v = k => esc(p[k] ?? ""), st = p.id ? s.stock.find(r => r.id === p.id) : null;
    const subs = ALLCATS[p.cat] || [];
    const field = (k, lab, o = {}) => `<div class="f${o.full ? " full" : ""}"><label for="pf-${k}">${t(lab)}</label>${o.area ? `<textarea id="pf-${k}" rows="3" maxlength="${o.max || 800}" ${o.dir ? `dir="${o.dir}"` : ""}>${v(k)}</textarea>` : `<input id="pf-${k}" ${o.type ? `type="${o.type}"` : ""} ${o.mode ? `inputmode="${o.mode}"` : ""} maxlength="${o.max || 60}" value="${o.value ?? v(k)}" ${o.dir ? `dir="${o.dir}"` : ""}>`}${o.help ? `<p class="note">${t(o.help)}</p>` : ""}</div>`;
    return `<form class="pform" id="pform" novalidate><h3>${p.id ? esc(lang === "ar" ? p.name_ar : p.name_en) : t("newp")}</h3><div id="perr"></div>
      <div class="fgrid">
        ${field("name_en", "f_name_en", { dir: "ltr" })}${field("name_ar", "f_name_ar", { dir: "rtl" })}
        ${field("brand", "f_brand", { dir: "ltr", max: 40, help: "f_brand_h" })}
        <div class="full fgrid"><div class="f"><label for="pf-cat">${t("f_cat")}</label><select id="pf-cat"><option value="">${t("choose")}</option>${Object.keys(ALLCATS).map(c => `<option value="${c}" ${p.cat === c ? "selected" : ""}>${esc(catName(c))}</option>`).join("")}</select></div>
        <div class="f" id="pf-subwrap" ${subs.length ? "" : "hidden"}><label for="pf-sub">${t("f_sub")}</label><select id="pf-sub"><option value="">${t("choose")}</option>${subs.map(x => `<option value="${x}" ${p.sub === x ? "selected" : ""}>${t("s_" + x)}</option>`).join("")}</select></div></div>
        ${field("kind_en", "f_kind_en", { dir: "ltr" })}${field("kind_ar", "f_kind_ar", { dir: "rtl" })}
        ${field("what_en", "f_what_en", { dir: "ltr", max: 160 })}${field("what_ar", "f_what_ar", { dir: "rtl", max: 160 })}
        ${field("desc_en", "f_desc_en", { area: 1, dir: "ltr" })}${field("desc_ar", "f_desc_ar", { area: 1, dir: "rtl" })}
        ${field("price", "f_price", { mode: "decimal", max: 12, value: p.price_fils == null ? "" : (p.price_fils / 1000).toFixed(3), help: "f_price_h", dir: "ltr" })}
        ${field("cost", "f_cost", { mode: "decimal", max: 12, value: p.cost_fils == null ? "" : (p.cost_fils / 1000).toFixed(3), help: "f_cost_h", dir: "ltr" })}
        <p class="note full" id="pf-margin" aria-live="polite">${marginNote(p.price_fils == null ? "" : p.price_fils / 1000, p.cost_fils == null ? "" : p.cost_fils / 1000)}</p>
        ${field("sort", "f_sort", { type: "number", mode: "numeric", max: 4, value: p.sort ?? 100, help: "f_sort_h" })}
        ${Array.isArray(p.colors) && p.colors.length ? `<p class="note full">${t("f_units_colors")}</p>` : field("units", "f_units", { type: "number", mode: "numeric", max: 6, value: st && st.units != null ? st.units : "" })}
        ${Array.isArray(p.colors) && p.colors.length ? "" : field("low_at", "f_low", { type: "number", mode: "numeric", max: 4, value: st && st.low_at != null ? st.low_at : 2 })}
        <div class="f full"><label for="pf-photo">${t("f_photo")}</label><div class="photo-row"><span class="thumb big" id="pf-prev">${p.img ? `<img src="${esc(p.img)}" alt="" style="object-fit:${p.fit === "contain" ? "contain" : "cover"}">` : ""}</span><input id="pf-photo" type="file" accept="image/jpeg,image/png,image/webp"></div><p class="note">${t("f_photo_h")}</p></div>
        <label class="check full"><input type="checkbox" id="pf-fit" ${p.fit === "contain" ? "checked" : ""}> <span>${t("f_fit")}</span></label>
        <label class="check full"><input type="checkbox" id="pf-vis" ${p.visible !== false ? "checked" : ""}> <span>${t("f_vis")}</span></label>
        ${Array.isArray(p.colors) && p.colors.length ? `<fieldset class="f full colors"><legend>${t("f_colors")}</legend><p class="note">${t("f_colors_h")}</p>${p.colors.map((c, i) => `<label class="check"><input type="checkbox" data-color="${i}" ${c.sold_out ? "" : "checked"}> <span class="cdot" style="background:${esc(c.hex || "#ccc")}" aria-hidden="true"></span><span>${esc(lang === "ar" ? c.name_ar : c.name_en)}: ${t("c_in")}</span></label>`).join("")}</fieldset>` : ""}
      </div>
      <p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn" type="submit">${t("savep")}</button><button class="btn ghost" type="button" id="pcancel">${t("cancel")}</button></p></form>`;
  }
  // resize a chosen photo to at most 1400 px on its long side, as JPEG (or PNG when it has see-through parts)
  function readPhoto(file) {
    return new Promise((ok, fail) => { const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        const png = file.type === "image/png" || file.type === "image/webp"; ok(c.toDataURL(png ? "image/webp" : "image/jpeg", 0.86)); };
      img.onerror = () => { URL.revokeObjectURL(url); fail(); }; img.src = url; });
  }
  async function submitProduct() {
    const g = k => { const e = $("#pf-" + k); return e ? (e.type === "checkbox" ? e.checked : e.value) : undefined; };
    const btn = $("#pform button[type=submit]"); btn.disabled = true; const errBox = $("#perr");
    const base = editing === "new" ? {} : (data.catalog.find(p => p.id === editing) || {});
    const colors = Array.isArray(base.colors) ? base.colors.map((c, i) => { const box = $(`#pform [data-color="${i}"]`); return { ...c, sold_out: box ? !box.checked : !!c.sold_out }; }) : [];
    const prod = { id: base.id, facts: base.facts, colors, img: base.img, name_en: g("name_en"), name_ar: g("name_ar"), brand: g("brand"), cat: g("cat"), sub: g("sub") || null, kind_en: g("kind_en"), kind_ar: g("kind_ar"),
      what_en: g("what_en"), what_ar: g("what_ar"), desc_en: g("desc_en"), desc_ar: g("desc_ar"), price: g("price"), cost: g("cost"), sort: g("sort"), units: g("units"), low_at: g("low_at"), fit: g("fit") ? "contain" : "cover", visible: g("vis") };
    try {
      if (photoData) { toast(t("uploading")); const up = await api("POST", { action: "product_photo", product_id: prod.id || prod.name_en, data_url: photoData });
        if (up.status !== 200) throw new Error(up.d.message || t("e_save")); prod.img = up.d.url; }
      const r = await api("POST", { action: "product_save", product: prod });
      if (r.status !== 200) throw new Error(r.d.message || t("e_save"));
      editing = null; photoData = null; toast(t("savedp")); await load(); const sec = $("#prods"); if (sec) sec.scrollIntoView({ block: "start" });
    } catch (e) { errBox.innerHTML = `<p class="err" role="alert">${esc(e.message)}</p>`; btn.disabled = false; errBox.scrollIntoView({ block: "center" }); }
  }
  function render() {
    shell(); const m = $("#main");
    if (state === "signin") m.innerHTML = viewSignIn();
    else if (state === "loading") m.innerHTML = `<div class="wrap"><p class="updated">${t("loading")}</p></div>`;
    else if (state === "error") m.innerHTML = `<div class="wrap signin"><div class="card"><p class="err" role="alert">${esc(msg)}</p><button class="btn" type="button" id="retry">${t("retry")}</button></div></div>`;
    else if (state === "dash" && data) m.innerHTML = viewDash(data);
    const f = $("#em,#otp"); if (f && state === "signin") f.focus();
  }
  async function load() {
    state = "loading"; render();
    const r = await api("GET").catch(() => ({ status: 0, d: {} }));
    if (r.status === 200) { data = r.d; state = "dash"; }
    else if (r.status === 401) { state = "signin"; session = null; }
    else { state = "error"; msg = r.status === 403 ? t("e_forbidden") : t("e_read"); }
    render();
  }

  /* ---------- events ---------- */
  document.addEventListener("submit", async e => {
    e.preventDefault(); if (e.target.id === "pform") return submitProduct(); if (e.target.id === "cform") return submitCode(); const btn = e.target.querySelector("button[type=submit]"); if (btn) btn.disabled = true;
    try {
      if (e.target.id === "fEmail") { email = $("#em").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg = t("e_email"); return render(); }
        // a first sign-in creates the account; only emails in ADMIN_EMAILS (on the server) can see any figures
        const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
        if (error) { const m = /(\d+)\s*seconds?/i.exec(error.message || ""); console.warn("send code failed", error.status, error.message);
          msg = error.status === 429 || /rate|seconds/i.test(error.message || "") ? t("e_wait", m ? +m[1] : 60) : t("e_send"); return render(); }
        step = "code"; return render(); }
      if (e.target.id === "fCode") { const code = $("#otp").value.replace(/\D/g, "");
        const { data: d, error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
        if (error || !d || !d.session) { msg = t("e_code"); return render(); } session = d.session; step = "email"; return load(); }
    } finally { if (btn && btn.isConnected) btn.disabled = false; }
  });
  document.addEventListener("click", async e => {
    const el = e.target.closest("button"); if (!el) return;
    if (el.id === "lang") { lang = lang === "ar" ? "en" : "ar"; store.set("kafei-admin-lang", lang); return render(); }
    if (el.id === "out") { if (sb) await sb.auth.signOut(); session = null; data = null; state = "signin"; return render(); }
    if (el.id === "back") { step = "email"; return render(); }
    if (el.id === "retry") return load();
    if (el.dataset.days) { days = +el.dataset.days; store.set("kafei-admin-days", days); return load(); }
    if (el.dataset.cancel) { if (!confirm(t("cxl_q"))) return; el.disabled = true; const r = await api("POST", { action: "delivery", order_id: el.dataset.cancel, delivery_status: "cancelled" });
      if (r.status === 200) { toast(t("cxld")); return load(); } el.disabled = false; return toast(t("e_save")); }
    if (el.dataset.deliver) { el.disabled = true; const r = await api("POST", { action: "delivery", order_id: el.dataset.deliver, delivery_status: "delivered" });
      if (r.status === 200) { toast(t("marked")); return load(); } el.disabled = false; return toast(t("e_save")); }
    if (el.id === "newp") { editing = "new"; photoData = null; render(); return $("#pform").scrollIntoView({ block: "start" }); }
    if (el.dataset.editp) { editing = el.dataset.editp; photoData = null; render(); return $("#pform").scrollIntoView({ block: "start" }); }
    if (el.id === "pcancel") { editing = null; photoData = null; return render(); }
    if (el.id === "newc") { editingCode = "new"; render(); return $("#cform").scrollIntoView({ block: "start" }); }
    if (el.dataset.editc) { editingCode = el.dataset.editc; render(); return $("#cform").scrollIntoView({ block: "start" }); }
    if (el.id === "ccancel") { editingCode = null; return render(); }
    if (el.dataset.togglec) { const c = data.codes.find(x => x.code === el.dataset.togglec); if (!c) return; el.disabled = true;
      const r = await api("POST", { action: "code_save", code: { ...codeBody(c), active: !c.active } });
      if (r.status === 200) { toast(t("savedc")); return load(); } el.disabled = false; return toast(r.d.message || t("e_save")); }
    if (el.dataset.delc) { if (!confirm(t("delc_q", el.dataset.delc))) return; el.disabled = true;
      const r = await api("POST", { action: "code_delete", code: el.dataset.delc });
      if (r.status === 200) { toast(t("deletedc")); return load(); } el.disabled = false; return toast(r.d.message || t("e_save")); }
    if (el.dataset.togglep) { const p = data.catalog.find(x => x.id === el.dataset.togglep); if (!p) return; el.disabled = true;
      const r = await api("POST", { action: "product_save", product: { ...p, price: p.price_fils == null ? "" : p.price_fils / 1000, cost: p.cost_fils == null ? "" : p.cost_fils / 1000, visible: !p.visible } });
      if (r.status === 200) { toast(t("savedp")); return load(); } el.disabled = false; return toast(r.d.message || t("e_save")); }
    if (el.dataset.stock) { const id = el.dataset.stock; el.disabled = true;
      const r = await api("POST", { action: "stock", product_id: id, units: document.getElementById("u-" + id).value, low_at: document.getElementById("l-" + id).value });
      if (r.status === 200) { toast(t("saved")); return load(); } el.disabled = false; return toast(r.d.message || t("e_save")); }
  });
  // chart tooltips: pointer and keyboard
  function tipShow(hit) { const c = hit.closest(".chart"), tip = $(".tip", c), [a, b] = hit.dataset.tip.split("|");
    tip.innerHTML = `<b>${esc(b)}</b>${esc(a)}`; tip.hidden = false; const r = hit.getBoundingClientRect(), cr = c.getBoundingClientRect();
    tip.style.left = Math.min(cr.width - 60, Math.max(60, r.left - cr.left + r.width / 2)) + "px"; tip.style.top = (r.top - cr.top + 18) + "px"; }
  function tipHide(hit) { const c = hit && hit.closest(".chart"); if (c) $(".tip", c).hidden = true; }
  document.addEventListener("pointerover", e => { const h = e.target.closest && e.target.closest(".hit"); if (h) tipShow(h); });
  document.addEventListener("pointerout", e => { const h = e.target.closest && e.target.closest(".hit"); if (h) tipHide(h); });
  document.addEventListener("change", async e => {
    if (e.target.id === "pf-cat") { const subs = ALLCATS[e.target.value] || [], w = $("#pf-subwrap"); w.hidden = !subs.length; $("#pf-sub").innerHTML = `<option value="">${t("choose")}</option>` + subs.map(x => `<option value="${x}">${t("s_" + x)}</option>`).join(""); }
    if (e.target.id === "pf-photo" && e.target.files[0]) { try { photoData = await readPhoto(e.target.files[0]); $("#pf-prev").innerHTML = `<img src="${photoData}" alt="" style="object-fit:cover">`; } catch { photoData = null; toast(t("e_photo")); } }
  });
  document.addEventListener("focusin", e => { if (e.target.classList && e.target.classList.contains("hit")) tipShow(e.target); });
  document.addEventListener("focusout", e => { if (e.target.classList && e.target.classList.contains("hit")) tipHide(e.target); });

  render();
  loadSb().then(() => { if (session) load(); else render(); });
})();
