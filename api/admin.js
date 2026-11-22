// /api/admin  Owner-only dashboard data. Requires a Supabase sign-in token whose email is in ADMIN_EMAILS.
//   GET  ?days=30            -> every figure the dashboard shows, computed here from real rows only
//   POST {action:"stock", product_id, units, low_at}            -> set stock
//   POST {action:"delivery", order_id, delivery_status}         -> mark an order delivered / to deliver / cancelled
//   POST {action:"code_save", code:{code, kind, value, once, min, ends, active}} / {action:"code_delete", code} -> discount codes
import { sbAuth, json, readBody, supa, supaOn, userFromToken, bearer, isAdmin, CATALOGUE, GOVS, CATS, productRows, forgetCatalogue, adjustStock } from "./_lib.js";

const SAME_DAY = new Set(["capital", "hawalli"]);
const PLACED = new Set(["paid", "cod"]);          // an order counts once it is paid online or placed for cash
const DAY = 864e5;
const dayKey = d => new Date(d).toISOString().slice(0, 10);
// weeks start on Sunday, as the working week does in Kuwait
const weekKey = d => { const x = new Date(new Date(d).toISOString().slice(0, 10) + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() - x.getUTCDay()); return x.toISOString().slice(0, 10); };
// the product list: database rows when connected, prices.json otherwise
let PRODUCTS = Object.entries(CATALOGUE).filter(([k]) => !k.startsWith("_")).map(([id, p]) => ({ id, name: p.name, name_ar: p.name }));
const products = () => PRODUCTS;
const setProducts = rows => { if (rows) PRODUCTS = rows.map(r => ({ id: r.id, name: r.name_en, name_ar: r.name_ar, visible: r.visible, colors: Array.isArray(r.colors) ? r.colors : [], cost_fils: Number.isFinite(r.cost_fils) ? r.cost_fils : null })); };
// stock lines: one per product, or one per colour (product:colour) when the product has colours
const stockLines = () => products().flatMap(p => p.colors && p.colors.length
  ? p.colors.map(c => ({ id: `${p.id}:${c.id}`, name: `${p.name} (${c.name_en})`, name_ar: `${p.name_ar} (${c.name_ar})`, product: p.id, visible: p.visible }))
  : [{ id: p.id, name: p.name, name_ar: p.name_ar, product: p.id, visible: p.visible }]);

async function allRows(path) {
  const out = []; const page = 1000;
  for (let from = 0; from < 50000; from += page) {
    const r = await supa("GET", path, null, { Range: `${from}-${from + page - 1}`, "Range-Unit": "items" });
    if (!r.ok) throw Object.assign(new Error("read failed"), { status: r.status, detail: r.data });
    out.push(...(r.data || [])); if (!r.data || r.data.length < page) break;
  }
  return out;
}
async function signups() {
  const out = [];
  for (let p = 1; p <= 50; p++) {
    const r = await supa("GET", `/auth/v1/admin/users?page=${p}&per_page=1000`);
    if (!r.ok) return null;
    const users = Array.isArray(r.data) ? r.data : r.data?.users || [];
    out.push(...users.map(u => u.created_at)); if (users.length < 1000) break;
  }
  return out;
}

export function summarise(allOrders, stockRows, signupDates, now = Date.now(), days = 30) {
  const since = now - days * DAY;
  // rows marked _h are older history, used only to tell first-time from returning customers
  const orders = allOrders.filter(o => !o._h);
  const inRange = orders.filter(o => new Date(o.created_at).getTime() >= since);
  const placed = inRange.filter(o => PLACED.has(o.status));
  // money actually in: paid online, or cash orders that were delivered (cash collected)
  const collected = o => o.status === "paid" || (o.status === "cod" && o.delivery_status === "delivered");
  const revenue = placed.filter(collected).reduce((s, o) => s + (o.total_fils || 0), 0);
  const toCollect = placed.filter(o => o.status === "cod" && o.delivery_status !== "delivered" && o.delivery_status !== "cancelled").reduce((s, o) => s + (o.total_fils || 0), 0);

  const daily = []; for (let i = days - 1; i >= 0; i--) daily.push({ day: dayKey(now - i * DAY), orders: 0, revenue_fils: 0 });
  const dIdx = Object.fromEntries(daily.map((d, i) => [d.day, i]));
  const weeks = []; for (let i = 11; i >= 0; i--) { const k = weekKey(now - i * 7 * DAY); if (!weeks.find(w => w.week === k)) weeks.push({ week: k, orders: 0, revenue_fils: 0, signups: 0 }); }
  const wIdx = Object.fromEntries(weeks.map((w, i) => [w.week, i]));
  for (const o of orders.filter(o => PLACED.has(o.status))) {
    const d = dIdx[dayKey(o.created_at)], w = wIdx[weekKey(o.created_at)];
    if (d !== undefined) { daily[d].orders++; if (collected(o)) daily[d].revenue_fils += o.total_fils || 0; }
    if (w !== undefined) { weeks[w].orders++; if (collected(o)) weeks[w].revenue_fils += o.total_fils || 0; }
  }
  for (const s of signupDates || []) { const w = wIdx[weekKey(s)]; if (w !== undefined) weeks[w].signups++; }

  // profit uses each product's cost price as it is set now; products without a cost are left out (and flagged)
  const costOf = Object.fromEntries(products().map(p => [p.id, p.cost_fils ?? null]));
  const byProduct = Object.fromEntries(products().map(p => [p.id, { id: p.id, name: p.name, name_ar: p.name_ar, units: 0, revenue_fils: 0, profit_fils: costOf[p.id] === null ? null : 0 }]));
  let profit = 0, profitKnown = false, profitMissing = false;
  for (const o of placed) for (const it of o.items || []) { const p = byProduct[it.id]; if (!p) continue; p.units += it.qty || 0;
    if (collected(o)) { const q = it.qty || 0, line = (it.price_fils || 0) * q; p.revenue_fils += line;
      if (costOf[it.id] === null) profitMissing = true; else { const g = line - costOf[it.id] * q; p.profit_fils += g; profit += g; profitKnown = true; } } }
  // discount codes come off the profit (they're taken off the whole order, not one product)
  const discounts = placed.filter(collected).reduce((s, o) => s + (o.discount_fils || 0), 0);
  profit -= discounts;

  const methods = { knet: 0, card: 0, apple: 0, cod: 0 };
  for (const o of placed) if (o.method in methods) methods[o.method]++;
  const states = { paid: 0, cod: 0, pending: 0, failed: 0 };
  for (const o of inRange) if (o.status in states) states[o.status]++;
  const gov = Object.fromEntries(Object.keys(GOVS).map(k => [k, 0]));
  for (const o of placed) if (o.gov in gov) gov[o.gov]++;
  const sameDay = placed.filter(o => SAME_DAY.has(o.gov)).length;
  const delivery = { to_deliver: 0, delivered: 0, cancelled: 0 };
  for (const o of placed) delivery[o.delivery_status || "to_deliver"] = (delivery[o.delivery_status || "to_deliver"] || 0) + 1;
  const open = orders.filter(o => PLACED.has(o.status) && (o.delivery_status || "to_deliver") === "to_deliver")
    .sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, 50)
    .map(o => ({ id: o.id, created_at: o.created_at, status: o.status, method: o.method, total_fils: o.total_fils, gov: o.gov, items: (o.items || []).map(i => ({ id: i.id, name: i.name, qty: i.qty })) }));

  // customers: an account, or a phone number for guests; returning = more than one placed order ever
  const allPlaced = allOrders.filter(o => PLACED.has(o.status));
  const counts = {}; for (const o of allPlaced) { const k = o.user_id || (o.phone ? "p:" + o.phone : null); if (k) counts[k] = (counts[k] || 0) + 1; }
  const activeKeys = new Set(placed.map(o => o.user_id || (o.phone ? "p:" + o.phone : null)).filter(Boolean));
  let fresh = 0, returning = 0; for (const k of activeKeys) (counts[k] > 1 ? returning++ : fresh++);

  const stock = stockLines().map(l => { const s = stockRows.find(r => r.product_id === l.id); const units = s && s.units !== undefined ? s.units : null, low_at = s ? s.low_at : null;
    return { id: l.id, product: l.product, name: l.name, name_ar: l.name_ar, hidden: l.visible === false, units, low_at, low: units === null || low_at === null ? null : units <= low_at, out: units === 0 }; });

  // what the stock on the shelf cost you (colour lines share their product's cost)
  let stockValue = 0, stockValueKnown = false;
  for (const r of stock) { const c = costOf[r.product || r.id]; if (r.units > 0 && c !== null && c !== undefined) { stockValue += r.units * c; stockValueKnown = true; } }
  return {
    generated_at: new Date(now).toISOString(), days,
    totals: { orders: placed.length, revenue_fils: revenue, discount_fils: discounts, profit_fils: profitKnown ? profit : null, profit_partial: profitKnown && profitMissing, stock_value_fils: stockValueKnown ? stockValue : null, to_collect_fils: toCollect, average_fils: placed.length ? Math.round(placed.reduce((s, o) => s + (o.total_fils || 0), 0) / placed.length) : null },
    daily, weeks, products: Object.values(byProduct), methods, states, gov, same_day: sameDay, delivery, open,
    customers: { active: activeKeys.size, new: fresh, returning, signups_known: signupDates !== null },
    stock
  };
}

export default async function handler(req, res) {
  if (!supaOn()) return json(res, 503, { error: "config", message: "The dashboard needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });
  const token = bearer(req);
  if (!token) return json(res, 401, { error: "auth", message: "Sign in first." });
  const user = await userFromToken(token);
  if (!user) return json(res, 401, { error: "auth", message: "Your sign-in has expired. Sign in again." });
  if (!isAdmin(user)) return json(res, 403, { error: "forbidden", message: "This account is not allowed into the dashboard." });

  try {
    if (req.method === "GET") {
      const days = Math.min(365, Math.max(7, Number(new URL(req.url, "http://x").searchParams.get("days")) || 30));
      const since = new Date(Date.now() - Math.max(days, 84) * DAY).toISOString();
      const [orders, stockRows, ups] = await Promise.all([
        allRows(`/rest/v1/orders?select=*&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc`),
        allRows(`/rest/v1/stock?select=product_id,units,low_at`),
        signups()
      ]);
      // returning customers look at every earlier order, not only this range
      const history = await allRows(`/rest/v1/orders?select=user_id,phone,status,created_at&status=in.(paid,cod)&created_at=lt.${encodeURIComponent(since)}`);
      const rows = await productRows(); setProducts(rows);
      const s = summarise([...history.map(h => ({ ...h, _h: true })), ...orders], stockRows, ups, Date.now(), days);
      s.catalog = rows ? rows.map(r => ({ ...r })) : null;   // every product, hidden ones too, for editing
      s.codes = await codeList();
      return json(res, 200, s);
    }
    if (req.method === "POST") {
      const { data: b } = await readBody(req);
      if (b?.action === "product_save") return saveProduct(res, b.product || {});
      if (b?.action === "product_photo") return savePhoto(res, b);
      if (b?.action === "stock") {
        setProducts(await productRows());
        if (!stockLines().some(l => l.id === b.product_id)) return json(res, 400, { error: "product", message: "Unknown product." });
        // an empty box means "don't count this one": it never sells out by itself
        const blank = b.units === null || b.units === undefined || String(b.units).trim() === "";
        const units = blank ? null : Math.floor(Number(b.units)), low = Math.floor(Number(b.low_at ?? 2));
        if ((!blank && !(units >= 0 && units <= 100000)) || !(low >= 0 && low <= 1000)) return json(res, 400, { error: "units", message: "Units must be a whole number, 0 or more." });
        const r = await supa("POST", "/rest/v1/stock", { product_id: b.product_id, units, low_at: low, updated_at: new Date().toISOString() }, { Prefer: "resolution=merge-duplicates,return=minimal" });
        return r.ok ? json(res, 200, { saved: true }) : json(res, 502, { error: "save", message: "Stock was not saved. Try again." });
      }
      if (b?.action === "test_alert") {   // a sample alert so the owner can check WhatsApp and email are set up
        const { orderAlert } = await import("./alerts.js");
        const r = await orderAlert({ id: "TEST", method: "knet", total_fils: 9000, phone: "00000000", address: "Test only: no delivery needed", items: [{ name: "Test alert from the Kafei dashboard", qty: 1 }] });
        return json(res, 200, r);
      }
      if (b?.action === "code_save") return saveCode(res, b.code || {});
      if (b?.action === "code_delete") {
        const c = String(b.code || "").toUpperCase();
        if (!/^[A-Z0-9]{3,20}$/.test(c)) return json(res, 400, { error: "code", message: "Unknown code." });
        const r = await supa("DELETE", `/rest/v1/discount_codes?code=eq.${encodeURIComponent(c)}`, null, { Prefer: "return=minimal" });
        return r.ok ? json(res, 200, { saved: true }) : json(res, 502, { error: "save", message: "The code was not deleted. Try again." });
      }
      if (b?.action === "delivery") {
        if (!["to_deliver", "delivered", "cancelled"].includes(b.delivery_status) || !/^[A-Za-z0-9-]{4,40}$/.test(String(b.order_id || ""))) return json(res, 400, { error: "delivery", message: "Unknown order or state." });
        const before = await supa("GET", `/rest/v1/orders?id=eq.${encodeURIComponent(b.order_id)}&select=status,delivery_status,items`);
        const o = before.ok && Array.isArray(before.data) ? before.data[0] : null;
        const r = await supa("PATCH", `/rest/v1/orders?id=eq.${encodeURIComponent(b.order_id)}`, { delivery_status: b.delivery_status, delivered_at: b.delivery_status === "delivered" ? new Date().toISOString() : null }, { Prefer: "return=minimal" });
        if (!r.ok) return json(res, 502, { error: "save", message: "The order was not updated. Try again." });
        // only orders that took stock (paid or cash) give it back when cancelled, and take it again if un-cancelled
        if (o && PLACED.has(o.status) && o.delivery_status !== b.delivery_status) {
          if (b.delivery_status === "cancelled") await adjustStock(o.items, +1);
          else if (o.delivery_status === "cancelled") await adjustStock(o.items, -1);
        }
        return json(res, 200, { saved: true });
      }
      return json(res, 400, { error: "action", message: "Unknown action." });
    }
    return json(res, 405, { error: "method" });
  } catch (e) {
    console.error("admin error", e.message, e.status, e.detail);
    return json(res, 502, { error: "read", message: "The dashboard could not read the shop's data. Try again." });
  }
}

/* ---------- products: create, edit, hide, photos ---------- */
const clip = (v, n) => { const t = String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim(); return t ? t.slice(0, n) : null; };
const slug = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
export function cleanProduct(p, existingIds) {
  const err = message => ({ error: message });
  const name_en = clip(p.name_en, 60), name_ar = clip(p.name_ar, 60);
  if (!name_en || name_en.length < 2) return err("Write the product name in English.");
  if (!name_ar || name_ar.length < 2) return err("Write the product name in Arabic.");
  if (!(p.cat in CATS)) return err("Choose a category.");
  const subs = CATS[p.cat]; const sub = subs.length ? (subs.includes(p.sub) ? p.sub : null) : null;
  if (subs.length && !sub) return err("Choose the type within the category.");
  let price_fils = null;
  if (p.price !== undefined && p.price !== null && String(p.price).trim() !== "") {
    const kwd = Number(String(p.price).replace(",", "."));
    if (!(kwd > 0 && kwd <= 100000)) return err("Write the price in KWD, for example 4.500, or leave it empty for Ask for price.");
    price_fils = Math.round(kwd * 1000);
  }
  // cost price: private, optional; what the owner paid the supplier per unit
  let cost_fils = null;
  if (p.cost !== undefined && p.cost !== null && String(p.cost).trim() !== "") {
    const kwd = Number(String(p.cost).replace(",", "."));
    if (!(kwd >= 0 && kwd <= 100000)) return err("Write the cost price in KWD, for example 3.250, or leave it empty.");
    cost_fils = Math.round(kwd * 1000);
  }
  let id = p.id && existingIds.includes(p.id) ? p.id : null;
  if (!id) { const base = slug(name_en) || "product"; id = base.length < 2 ? "product-" + base : base; let i = 2; while (existingIds.includes(id)) id = `${base}-${i++}`; }
  const facts = Array.isArray(p.facts) ? p.facts.filter(f => Array.isArray(f) && f.length === 4).slice(0, 12).map(f => f.map(x => clip(x, 80) || "")) : [];
  const own = (process.env.SUPABASE_URL || "").replace(/\/$/, "") + "/storage/v1/object/public/product-photos/";
  const img = p.img && ((p.img.startsWith(own) && /^[^\s"'<>]{8,500}$/.test(p.img)) || /^(https:\/\/[^\s"'<>]{8,500}|img\/[a-z0-9._-]{3,80})$/i.test(p.img)) ? p.img : null;
  const okImg = u => u && ((u.startsWith(own) && /^[^\s"'<>]{8,500}$/.test(u)) || /^(https:\/\/[^\s"'<>]{8,500}|img\/[a-z0-9._-]{3,80})$/i.test(u)) ? u : null;
  // colours: [{id, name_en, name_ar, hex, trim, img, sold_out}], at most 12
  const colors = (Array.isArray(p.colors) ? p.colors : []).slice(0, 12).map(c => ({ id: slug(c && c.id), name_en: clip(c && c.name_en, 40), name_ar: clip(c && c.name_ar, 40),
    hex: /^#[0-9a-f]{6}$/i.test(c && c.hex) ? c.hex : "#cccccc", ...(/^#[0-9a-f]{6}$/i.test(c && c.trim) ? { trim: c.trim } : {}), img: okImg(c && c.img), sold_out: !!(c && c.sold_out) }))
    .filter((c, i, a) => c.id && c.name_en && c.name_ar && a.findIndex(x => x.id === c.id) === i);
  return { row: { id, cat: p.cat, sub, name_en, name_ar, brand: clip(p.brand, 40) || null, cost_fils, kind_en: clip(p.kind_en, 60), kind_ar: clip(p.kind_ar, 60), what_en: clip(p.what_en, 160), what_ar: clip(p.what_ar, 160),
    desc_en: clip(p.desc_en, 800), desc_ar: clip(p.desc_ar, 800), facts, colors, price_fils, img, fit: p.fit === "contain" ? "contain" : "cover", visible: p.visible !== false,
    sort: Number.isFinite(Number(p.sort)) ? Math.max(0, Math.min(9999, Math.floor(Number(p.sort)))) : 100, updated_at: new Date().toISOString() }, isNew: !(p.id && existingIds.includes(p.id)) };
}
// every discount code with how many paid orders used it; null when the table hasn't been set up yet
async function codeList() {
  const r = await supa("GET", "/rest/v1/discount_codes?select=*&order=created_at.desc").catch(() => null);
  if (!r || !r.ok || !Array.isArray(r.data)) return null;
  const used = await supa("GET", "/rest/v1/orders?select=discount_code,discount_fils&discount_code=not.is.null&status=in.(paid,cod)").catch(() => null);
  const n = {}, off = {}; for (const o of used && used.ok && Array.isArray(used.data) ? used.data : []) { n[o.discount_code] = (n[o.discount_code] || 0) + 1; off[o.discount_code] = (off[o.discount_code] || 0) + (o.discount_fils || 0); }
  return r.data.map(c => ({ ...c, uses: n[c.code] || 0, given_fils: off[c.code] || 0 }));
}
// checks a code from the dashboard form; {row} or {error}
export function cleanCode(c) {
  const err = error => ({ error });
  const code = String(c.code || "").toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return err("The code must be 3 to 20 letters or numbers, with no spaces.");
  const kind = c.kind === "fixed" ? "fixed" : "percent";
  const v = Number(String(c.value ?? "").replace(",", "."));
  let value;
  if (kind === "percent") { if (!(Number.isInteger(v) && v >= 1 && v <= 90)) return err("Write the percentage as a whole number from 1 to 90."); value = v; }
  else { if (!(v > 0 && v <= 10000)) return err("Write the amount off in KWD, for example 2.000."); value = Math.round(v * 1000); }
  let min = null;
  if (c.min !== undefined && c.min !== null && String(c.min).trim() !== "") { const m = Number(String(c.min).replace(",", ".")); if (!(m >= 0 && m <= 100000)) return err("Write the minimum order in KWD, or leave it empty."); min = Math.round(m * 1000) || null; }
  let ends = null;
  if (c.ends) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(c.ends))) return err("Choose an end date, or leave it empty."); ends = new Date(c.ends + "T23:59:59+03:00").toISOString(); }
  return { row: { code, kind, value, once_per_customer: c.once !== false, min_order_fils: min, ends_at: ends, active: c.active !== false } };
}
async function saveCode(res, c) {
  const k = cleanCode(c);
  if (k.error) return json(res, 400, { error: "code", message: k.error });
  const r = await supa("POST", "/rest/v1/discount_codes", k.row, { Prefer: "resolution=merge-duplicates,return=minimal" });
  if (!r.ok) return json(res, 502, { error: "save", message: r.status === 404 ? "Run 11_discount_codes.sql in Supabase first." : "The code was not saved. Try again." });
  return json(res, 200, { saved: true });
}
async function saveProduct(res, p) {
  const rows = (await productRows()) || [];
  const c = cleanProduct(p, rows.map(r => r.id));
  if (c.error) return json(res, 400, { error: "product", message: c.error });
  const r = await supa("POST", "/rest/v1/products", c.row, { Prefer: "resolution=merge-duplicates,return=minimal" });
  if (!r.ok) return json(res, 502, { error: "save", message: "The product was not saved. Try again." });
  // a new product gets a stock line; the units come from the form when given
  const units = Math.floor(Number(p.units)), low = Math.floor(Number(p.low_at));
  if (!(Array.isArray(c.row.colors) && c.row.colors.length) && (c.isNew || String(p.units ?? "").trim() !== "")) {
    await supa("POST", "/rest/v1/stock", { product_id: c.row.id, units: units >= 0 ? units : 0, low_at: low >= 0 ? low : 2, updated_at: new Date().toISOString() }, { Prefer: (c.isNew ? "resolution=ignore-duplicates" : "resolution=merge-duplicates") + ",return=minimal" });
  }
  forgetCatalogue();
  return json(res, 200, { saved: true, id: c.row.id });
}
async function savePhoto(res, b) {
  const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.data_url || ""));
  if (!m) return json(res, 400, { error: "photo", message: "Choose a JPG, PNG or WebP photo." });
  const bytes = Buffer.from(m[3], "base64");
  if (bytes.length > 3 * 1024 * 1024) return json(res, 400, { error: "photo", message: "The photo is over 3 MB. Choose a smaller one." });
  const name = `${slug(b.product_id || "new") || "product"}-${Date.now().toString(36)}.${m[2] === "jpeg" ? "jpg" : m[2]}`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY, base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const r = await fetch(`${base}/storage/v1/object/product-photos/${name}`, { method: "POST", headers: { ...sbAuth(key), "Content-Type": m[1], "x-upsert": "false", "Cache-Control": "31536000" }, body: bytes });
  if (!r.ok) { console.error("photo upload failed", r.status, await r.text().catch(() => "")); return json(res, 502, { error: "photo", message: "The photo was not uploaded. Try again." }); }
  return json(res, 200, { url: `${base}/storage/v1/object/public/product-photos/${name}` });
}
