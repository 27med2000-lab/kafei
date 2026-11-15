"""Build demo-dashboard/: the real dashboard page and its real figure code (summarise from api/admin.js),
running in the browser on the made-up test orders, so it can be tried on a claude.ai link with no server."""
import json, os, re
os.chdir(os.path.dirname(os.path.abspath(__file__)))
api = open("api/admin.js").read()
core = api[api.index("const SAME_DAY"):api.index("export default async function handler")].replace("export function", "function")
core += api[api.index("/* ---------- products: create"):api.index("async function saveProduct")].replace("export function", "function")
seedp = [
 {"id": "kuvani-maestro", "cat": "espresso-machines", "sub": None, "name_en": "Kuvani Maestro", "name_ar": "كوفاني مايسترو", "kind_en": "Espresso machine", "kind_ar": "ماكينة إسبريسو", "price_fils": 100000, "img": "img/kuvani.webp", "fit": "cover", "visible": True, "sort": 10, "facts": []},
 {"id": "xbloom-studio", "cat": "pourover-machines", "sub": None, "name_en": "xBloom Studio", "name_ar": "إكس بلوم ستوديو", "kind_en": "Pour-over machine", "kind_ar": "ماكينة تقطير", "price_fils": 80000, "img": "img/xbloom.webp", "fit": "contain", "visible": True, "sort": 20, "facts": []},
 {"id": "kuvani-gevi-v60", "cat": "pourover-machines", "sub": None, "name_en": "Kuvani × Gevi V60", "name_ar": "كوفاني × جيفي V60", "kind_en": "Automatic pour-over", "kind_ar": "تقطير أوتوماتيكي", "price_fils": 60000, "img": "img/gevi.webp", "fit": "cover", "visible": True, "sort": 30, "facts": []},
 {"id": "sias-cattopia", "cat": "beans", "sub": "filter", "name_en": "SIAS Cattopia Blend", "name_ar": "سياس كاتوبيا بلند", "kind_en": "Coffee beans, 200 g", "kind_ar": "بن، 200 غ", "price_fils": 4500, "img": "img/sias.webp", "fit": "cover", "visible": True, "sort": 40, "facts": []}]
prices = json.load(open("tests/fixtures/test-prices.json"))
fx = json.load(open("tests/fixtures/dashboard-sample.json"))
govs = {"capital": "Capital", "hawalli": "Hawalli", "farwaniya": "Farwaniya", "mubarak": "Mubarak Al-Kabeer", "ahmadi": "Ahmadi", "jahra": "Jahra"}
demo = """<script>
/* DEMO ONLY: made-up orders, figures worked out in this browser by the dashboard's own server code. */
(function(){
  const CATALOGUE = %s, GOVS = %s, FX = %s, SEEDP = %s; const CATS = { "espresso-machines": [], "pourover-machines": [], beans: ["filter", "espresso"], "pourover-accessories": [], "espresso-accessories": [], cups: [], tumblers: [], grinders: ["manual", "electric"] };
  const process = { env: { SUPABASE_URL: "demo:" } };
  %s
  const K = "kafei-dash-demo"; let mem = null;
  function seed(){ const now = Date.now(); return { v: 2, session: null, products: SEEDP.map(p => ({ ...p })), photos: {},
    orders: FX.orders.map(o => ({ id: o.id, user_id: o.user, status: o.status, method: o.method, total_fils: o.total_fils, items: o.items, phone: o.phone, gov: o.gov, delivery_status: o.delivery_status,
      created_at: new Date(Math.floor((now - o.days_ago * DAY) / DAY) * DAY + o.hour * 36e5).toISOString() })),
    stock: FX.stock.map(s => ({ ...s })), users: FX.signups_days_ago.map(d => new Date(now - d * DAY).toISOString()) }; }
  function load(){ if (mem) return mem; try { const v = JSON.parse(localStorage.getItem(K)); if (v && v.v === 2) return (mem = v); } catch (e) {} mem = seed(); save(); return mem; }
  function save(){ try { localStorage.setItem(K, JSON.stringify(mem)); } catch (e) {} }
  window.kafeiDemoReset = () => { try { localStorage.removeItem(K); localStorage.removeItem("kafei-admin-lang"); } catch (e) {} location.reload(); };
  let pending = null; window.__demoCode = "";
  window.supabase = { createClient: () => ({ auth: {
    getSession: async () => ({ data: { session: load().session } }),
    signInWithOtp: async ({ email }) => { pending = { email, code: String(Math.floor(100000 + Math.random() * 900000)) }; window.__demoCode = pending.code; return { error: null }; },
    verifyOtp: async ({ email, token }) => { if (!pending || pending.email !== email || pending.code !== token) return { data: {}, error: { message: "invalid" } };
      const d = load(); d.session = { access_token: "demo", user: { email } }; save(); pending = null; window.__demoCode = ""; return { data: { session: d.session }, error: null }; },
    signOut: async () => { const d = load(); d.session = null; save(); return { error: null }; } } }) };
  const reply = (s, o) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => {
    if (!String(url).startsWith("/api/admin")) return realFetch(url, opts);
    const d = load(); if (!d.session) return reply(401, { error: "auth" });
    if ((opts.method || "GET") === "GET") { const days = Number(new URL(url, location.href).searchParams.get("days")) || 30; setProducts(d.products); const s = summarise(d.orders, d.stock, d.users, Date.now(), days);
      s.catalog = d.products.map(p => ({ ...p, img: p.img && d.photos[p.img] ? d.photos[p.img] : p.img })).sort((a, b) => a.sort - b.sort); return reply(200, s); }
    const b = JSON.parse(opts.body || "{}");
    if (b.action === "product_photo") { const m = /^data:image\\/(jpeg|png|webp);base64,/.exec(String(b.data_url || "")); if (!m) return reply(400, { error: "photo", message: "Choose a JPG, PNG or WebP photo." });
      const key = "demo:/storage/v1/object/public/product-photos/" + Date.now().toString(36); d.photos[key] = b.data_url; save(); return reply(200, { url: key }); }
    if (b.action === "product_save") { const p = b.product || {}; if (p.img && String(p.img).startsWith("data:")) p.img = Object.keys(d.photos).find(k => d.photos[k] === p.img) || null; const c = cleanProduct(p, d.products.map(x => x.id)); if (c.error) return reply(400, { error: "product", message: c.error });
      const i = d.products.findIndex(x => x.id === c.row.id); if (i >= 0) d.products[i] = { ...d.products[i], ...c.row }; else d.products.push(c.row);
      if (c.isNew || String(p.units ?? "").trim() !== "") { const u = Math.floor(Number(p.units)), l = Math.floor(Number(p.low_at)); const r = d.stock.find(s => s.product_id === c.row.id);
        if (!r) d.stock.push({ product_id: c.row.id, units: u >= 0 ? u : 0, low_at: l >= 0 ? l : 2 }); else if (!c.isNew) { r.units = u >= 0 ? u : r.units; r.low_at = l >= 0 ? l : r.low_at; } }
      save(); return reply(200, { saved: true, id: c.row.id }); }
    if (b.action === "stock") { const u = Math.floor(Number(b.units)), l = Math.floor(Number(b.low_at ?? 2)); if (!(u >= 0) || !(l >= 0) || String(b.units).trim() === "") return reply(400, { error: "units", message: "Units must be a whole number, 0 or more." });
      const r = d.stock.find(s => s.product_id === b.product_id); if (r) { r.units = u; r.low_at = l; } else d.stock.push({ product_id: b.product_id, units: u, low_at: l }); save(); return reply(200, { saved: true }); }
    if (b.action === "delivery") { const o = d.orders.find(x => x.id === b.order_id); if (!o) return reply(400, { error: "delivery" }); o.delivery_status = b.delivery_status; save(); return reply(200, { saved: true }); }
    return reply(400, { error: "action" });
  };
})();
</script>""" % (json.dumps(prices), json.dumps(govs), json.dumps(fx), json.dumps(seedp, ensure_ascii=False), core)
h = open("admin.html").read()
head = h[h.index("<title>"):h.index("</head>")]
body = h[h.index("<body>") + 6:h.index("</body>")]
head = head.replace("<title>Kafei Dashboard</title>", "<title>Kafei Dashboard Demo</title>")
head = re.sub(r'window\.KAFEI_ADMIN = \{[^}]*\};', 'window.KAFEI_ADMIN = { supabaseUrl: "demo", anonKey: "demo", demo: true };', head)
banner = ('<div role="note" style="background:#B9824B;color:#29221E;font:700 13.5px/1.45 system-ui,sans-serif;padding:9px max(16px,env(safe-area-inset-left,0px));text-align:center">'
          'Demo with made-up orders: nothing here is real sales. Sign in with any email; your code shows on screen. '
          '<button type="button" onclick="kafeiDemoReset()" style="font:inherit;background:none;border:0;text-decoration:underline;cursor:pointer;color:inherit;padding:4px">Reset demo</button></div>')
body = body.replace('<script src="admin.js"></script>', demo + '\n<script src="admin.js"></script>')
os.makedirs("demo-dashboard", exist_ok=True)
open("demo-dashboard/index.html", "w").write(head + "\n" + banner + body)
open("demo-dashboard/admin.js", "w").write(open("admin.js").read())
print("demo-dashboard built")
