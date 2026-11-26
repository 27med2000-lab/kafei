// Shared helpers for the Kafei payment functions (MyFatoorah). Runs on Node 18+ (Hostinger Node.js app, Vercel, Netlify).
// Secrets come from environment variables only; nothing secret ever reaches the browser.
//   MYFATOORAH_API_KEY         API token from MyFatoorah (portal > Integration Settings > API Key). Test key in test mode.
//   MYFATOORAH_BASE            API address. Default is the TEST server https://apitest.myfatoorah.com
//                              Live Kuwait accounts: https://api.myfatoorah.com
//   MYFATOORAH_WEBHOOK_SECRET  Webhook secret key (portal > Integration Settings > Webhook), to check that notifications are genuine
//   SITE_URL                   the shop's own address, e.g. https://kafeikw.com (no trailing slash)
//   NOTIFY_URL                 optional: a webhook (Slack, Discord, Make, Zapier) that receives a message for every paid order
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const CATALOGUE = JSON.parse(fs.readFileSync(process.env.PRICES_FILE || path.join(here, "prices.json"), "utf8"));
export const FREE_OVER = CATALOGUE._delivery.freeOverFils;
export const FEE = CATALOGUE._delivery.feeFils;
const MF_ENV = (process.env.MYFATOORAH_BASE || "").trim();
export const MF_BASE = (/^https:\/\//.test(MF_ENV) ? MF_ENV : "https://apitest.myfatoorah.com").replace(/\/+$/, "");
// The shop's payment choices and MyFatoorah's codes for them
export const METHODS = { knet: "kn", card: "vm", apple: "ap" };

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

// rawFirst: read the untouched bytes; otherwise accept a body a host already parsed.
export async function readBody(req, rawFirst = false) {
  if (rawFirst && req.on) {
    const raw = await new Promise((ok, fail) => { let s = ""; req.on("data", c => (s += c)); req.on("end", () => ok(s)); req.on("error", fail); });
    let data; try { data = raw ? JSON.parse(raw) : {}; } catch { data = null; }
    return { raw, data };
  }
  if (req.body !== undefined && typeof req.body !== "string" && !Buffer.isBuffer(req.body)) return { raw: JSON.stringify(req.body), data: req.body };
  let raw = typeof req.body === "string" ? req.body : Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!raw && req.on) raw = await new Promise((ok, fail) => { let s = ""; req.on("data", c => (s += c)); req.on("end", () => ok(s)); req.on("error", fail); });
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = null; }
  return { raw, data };
}

// Calls the MyFatoorah API (POST, JSON). Returns {ok, status, data} where ok means HTTP 2xx and IsSuccess.
export async function mf(apiPath, body) {
  const key = (process.env.MYFATOORAH_API_KEY || "").trim().replace(/^bearer\s+/i, "").replace(/^["']|["']$/g, "");
  if (!key) throw Object.assign(new Error("MYFATOORAH_API_KEY is not set"), { code: "config" });
  const r = await fetch(`${MF_BASE}/v2/${apiPath}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body || {}) });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = { Message: text.slice(0, 300) }; }
  return { ok: r.ok && data.IsSuccess !== false, status: r.status, data };
}

// MyFatoorah's numeric id for a payment method ("kn", "vm", "ap") on this account. Looked up once, kept for 10 minutes.
let methodCache = null, methodAt = 0;
export async function paymentMethodId(code, amountKwd) {
  if (!methodCache || Date.now() - methodAt > 600000) {
    const r = await mf("InitiatePayment", { InvoiceAmount: amountKwd, CurrencyIso: "KWD" });
    const list = r.data?.Data?.PaymentMethods;
    if (!r.ok || !Array.isArray(list)) { console.error("InitiatePayment failed", r.status, r.data?.Message, r.data?.ValidationErrors); return null; }
    methodCache = Object.fromEntries(list.map(m => [String(m.PaymentMethodCode || "").toLowerCase(), m.PaymentMethodId])); methodAt = Date.now();
  }
  return methodCache[code] ?? null;
}

// Asks MyFatoorah for the truth about a payment. key: the paymentId MyFatoorah adds to the return address.
// Returns {paid, final, orderId, invoiceId, method, status} or null when MyFatoorah can't be reached.
export async function paymentStatus(key, keyType = "PaymentId") {
  const r = await mf("GetPaymentStatus", { Key: String(key), KeyType: keyType });
  if (r.status === 400 || (r.data && r.data.IsSuccess === false && !r.data.Data)) return { paid: false, final: true, status: "NOT_FOUND", orderId: null };
  const d = r.data?.Data;
  if (!r.ok || !d) return null;
  const tx = Array.isArray(d.InvoiceTransactions) ? d.InvoiceTransactions : [];
  const last = tx[tx.length - 1] || {};
  const paid = d.InvoiceStatus === "Paid";
  // a payment is settled when it is paid, or its last attempt failed or was cancelled; "InProgress" may still change
  const final = paid || /^(Failed|Canceled|Cancelled|Expired)$/i.test(last.TransactionStatus || d.InvoiceStatus || "");
  return { paid, final, status: d.InvoiceStatus, orderId: d.CustomerReference || null, invoiceId: d.InvoiceId, method: last.PaymentGateway || null, paymentId: last.PaymentId || String(key) };
}

// Checks a MyFatoorah webhook (v2, PAYMENT_STATUS_CHANGED): the MyFatoorah-Signature header must equal
// Base64(HMAC-SHA256(secret, "Invoice.Id=..,Invoice.Status=..,Transaction.Status=..,Transaction.PaymentId=..,Invoice.ExternalIdentifier=..")).
export function webhookIsGenuine(headers, body) {
  const secret = process.env.MYFATOORAH_WEBHOOK_SECRET;
  if (!secret) return { checked: false, ok: true };
  const sig = headers["myfatoorah-signature"];
  if (!sig || !body || !body.Data) return { checked: true, ok: false };
  const d = body.Data, v = x => (x === null || x === undefined ? "" : String(x));
  const text = [["Invoice.Id", d.Invoice?.Id], ["Invoice.Status", d.Invoice?.Status], ["Transaction.Status", d.Transaction?.Status],
    ["Transaction.PaymentId", d.Transaction?.PaymentId], ["Invoice.ExternalIdentifier", d.Invoice?.ExternalIdentifier]].map(([k, x]) => `${k}=${v(x)}`).join(",");
  const want = Buffer.from(crypto.createHmac("sha256", Buffer.from(secret, "utf8")).update(text, "utf8").digest("base64"));
  const got = Buffer.from(String(sig));
  return { checked: true, ok: want.length === got.length && crypto.timingSafeEqual(want, got) };
}

// Marks a pending order paid or failed. Only a pending order changes, so a late or repeated message can't undo a payment.
export async function settleOrder(orderId, paid, paymentId) {
  if (!supaOn() || !orderId) return false;
  const r = await supa("PATCH", `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&status=eq.pending`,
    paid ? { status: "paid", paid_at: new Date().toISOString(), track_id: paymentId || null } : { status: "failed", track_id: paymentId || null }, { Prefer: "return=representation" });
  if (!r.ok) { console.error("order status update failed", r.status, r.data); return false; }
  // the order changed just now (not a repeat message): a paid order leaves the shelf
  const row = Array.isArray(r.data) ? r.data[0] : null;
  if (paid && row) { await adjustStock(row.items, -1); await (await import("./alerts.js")).orderAlert(row).catch(e => console.error("order alert failed", e.message)); }
  return true;
}

// ---------- inventory ----------
// Each order line is counted on its own stock line: the product, or product:colour when it has colours.
export const stockKey = it => (it && it.color ? `${it.id}:${it.color}` : it && it.id);
// sign -1 takes units off the shelf, +1 puts them back (a cancelled order). Never blocks an order if it fails.
export async function adjustStock(items, sign) {
  if (!supaOn() || !Array.isArray(items) || !items.length) return false;
  try {
    const r = await supa("POST", "/rest/v1/rpc/adjust_stock", { p_items: items.map(it => ({ key: stockKey(it), qty: Math.max(0, Math.floor(Number(it.qty) || 0)) })), p_sign: sign });
    if (!r.ok) console.error("stock update failed", r.status, r.data);
    return r.ok;
  } catch (e) { console.error("stock update failed", e.message); return false; }
}
// {key: units} for every counted stock line (lines with no number are left out: they never sell out)
export async function stockLevels() {
  if (!supaOn()) return {};
  try { const r = await supa("GET", "/rest/v1/stock?select=product_id,units"); if (!r.ok || !Array.isArray(r.data)) return {};
    return Object.fromEntries(r.data.filter(x => x.units !== null && x.units !== undefined).map(x => [x.product_id, x.units])); }
  catch { return {}; }
}

export const money = fils => (fils / 1000).toFixed(3);

// ---------- shared order building (checkout and cash on delivery use the same rules) ----------
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);
export const GOVS = { capital: "Capital", hawalli: "Hawalli", farwaniya: "Farwaniya", mubarak: "Mubarak Al-Kabeer", ahmadi: "Ahmadi", jahra: "Jahra" };
const govKey = g => { const s = String(g || "").trim().toLowerCase(); return GOVS[s] ? s : Object.keys(GOVS).find(k => GOVS[k].toLowerCase() === s) || null; };

// Checks the cart, customer and address and prices everything from prices.json. Returns {error:{status,body}} or the order.
export function buildOrder(b, cat = CATALOGUE) {
  const bad = (code, message) => ({ error: { status: 400, body: { error: code, message } } });
  if (!b) return bad("json", "The order could not be read.");
  const phone = String(b.customer?.phone || "").replace(/\D/g, "");
  if (!/^[4569]\d{7}$/.test(phone)) return bad("phone", "Enter an 8-digit Kuwaiti mobile number.");
  const name = clean(b.customer?.name, 50);
  if (name.length < 2) return bad("name", "Enter your full name.");
  let sub = 0; const products = [], lines = [], items = [];
  for (const l of Array.isArray(b.items) ? b.items : []) {
    const p = cat[l?.id]; const q = Math.floor(Number(l?.qty));
    if (!p || typeof p !== "object" || !("price" in p) || String(l.id).startsWith("_")) return bad("item", "One product in the cart is not in our list.");
    if (p.price == null) return bad("price", `${p.name} has no online price yet. Ask us on WhatsApp.`);
    if (!(q >= 1 && q <= 99)) return bad("qty", "Quantities must be between 1 and 99.");
    let color = null, label = p.name;
    if (Array.isArray(p.colors) && p.colors.length) {
      color = p.colors.find(c => c && c.id === l.color);
      if (!color) return bad("color", `Choose a colour for ${p.name}.`);
      if (color.soldOut) return bad("color", `${p.name} in ${color.name} is sold out. Choose another colour.`);
      label = `${p.name} (${color.name})`;
    } else if (l.color) return bad("color", `${p.name} doesn't come in colours.`);
    const left = color ? color.left : p.left;
    if (left === 0 || (!color && p.soldOut)) return bad("stock", `${label} is sold out.`);
    if (typeof left === "number" && q > left) return bad("stock", `Only ${left} of ${label} left. Lower the quantity.`);
    sub += p.price * q;
    products.push({ name: label, description: label, price: Number(money(p.price)), quantity: q });
    lines.push(`${q} x ${label}`);
    items.push({ id: l.id, ...(color ? { color: color.id } : {}), name: label, qty: q, price_fils: p.price });
  }
  if (!products.length) return bad("empty", "The cart is empty.");
  const fee = FREE_OVER && sub >= FREE_OVER ? 0 : FEE;   // FREE_OVER null: delivery is always charged
  if (fee) products.push({ name: "Delivery", description: "Delivery in Kuwait", price: Number(money(fee)), quantity: 1 });
  const a = b.address || {};
  if (!a.gov || !a.area || !a.block || !a.street || !a.house) return bad("address", "Fill in the delivery address.");
  const gov = govKey(a.gov);
  if (!gov) return bad("address", "Choose a governorate.");
  const addr = [GOVS[gov], a.area, a.block && `Block ${a.block}`, a.street && `St ${a.street}`, a.avenue && `Ave ${a.avenue}`, a.house && `House ${a.house}`].map(x => clean(x, 60)).filter(Boolean).join(", ");
  const orderId = "KF" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const notes = clean(a.notes, 120);
  return { orderId, name, phone, gov, addr, notes, lines, items, products, sub, fee, total: sub + fee };
}

// ---------- Supabase (server side, service role) ----------
//   SUPABASE_URL                e.g. https://abcd1234.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   server only; never sent to a browser
//   SUPABASE_ANON_KEY           optional; used to check a customer's or owner's sign-in token
//   ADMIN_EMAILS                comma-separated emails allowed into /admin
export const supaOn = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const SB = () => process.env.SUPABASE_URL.replace(/\/$/, "");
// Supabase keys come in two styles: the new ones (sb_secret_..., sb_publishable_...) go in the apikey header only;
// the older ones (JWTs starting "eyJ") also went in Authorization. This sends each the way Supabase expects.
export const sbAuth = key => (String(key || "").startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key });
export async function supa(method, pathAndQuery, body, extraHeaders = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(SB() + pathAndQuery, { method, headers: { ...sbAuth(key), "Content-Type": "application/json", Accept: "application/json", ...extraHeaders }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}
// The signed-in user behind a token, or null. Uses Supabase's own check, so an expired or forged token fails.
export async function userFromToken(token) {
  if (!token || !supaOn()) return null;
  try {
    const r = await fetch(SB() + "/auth/v1/user", { headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null; const u = await r.json(); return u && u.id ? u : null;
  } catch { return null; }
}
export const bearer = req => { const h = (req.headers || {}).authorization || ""; return /^Bearer\s+(.+)$/i.test(h) ? h.replace(/^Bearer\s+/i, "").trim() : null; };
export const isAdmin = u => !!u && (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean).includes(String(u.email || "").toLowerCase());
// Saves an order row; never blocks the customer if the database is down.
export async function saveOrder(row) {
  if (!supaOn()) return false;
  try { const r = await supa("POST", "/rest/v1/orders", row, { Prefer: "return=minimal" }); if (!r.ok) console.error("order save failed", r.status, r.data); return r.ok; }
  catch (e) { console.error("order save failed", e.message); return false; }
}

// ---------- discount codes ----------
export const normCode = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
// How much a code takes off the items (not delivery), in fils.
export const discountFor = (rule, sub) => rule.kind === "percent" ? Math.round(sub * rule.value / 100) : Math.min(rule.value, sub);
// Checks a code for this phone and items subtotal. {rule} when it can be used, or {message} saying why not.
export async function checkCode(code, phone, sub, now = Date.now()) {
  const c = normCode(code);
  const no = message => ({ message });
  if (!c) return no("Type a discount code.");
  if (!supaOn()) return no("Discount codes aren't available right now.");
  const r = await supa("GET", `/rest/v1/discount_codes?code=eq.${encodeURIComponent(c)}&select=*`);
  const rule = r.ok && Array.isArray(r.data) ? r.data[0] : null;
  if (!rule || !rule.active) return no("That code isn't valid. Check the spelling.");
  if (rule.ends_at && new Date(rule.ends_at).getTime() < now) return no("That code has ended.");
  if (rule.min_order_fils && sub !== null && sub < rule.min_order_fils) return no(`That code needs an order of KWD ${money(rule.min_order_fils)} or more.`);
  if (rule.once_per_customer && phone) {
    const u = await supa("GET", `/rest/v1/orders?discount_code=eq.${encodeURIComponent(c)}&phone=eq.${encodeURIComponent(phone)}&status=in.(paid,cod)&select=id&limit=1`);
    if (u.ok && Array.isArray(u.data) && u.data.length) return no("You've already used that code. It works once per customer.");
  }
  return { rule: { code: rule.code, kind: rule.kind, value: rule.value, min_order_fils: rule.min_order_fils || null } };
}
// Applies a code to a built order (from buildOrder). Returns null when it worked, or a message.
export async function applyCode(o, code) {
  if (!code) return null;
  const k = await checkCode(code, o.phone, o.sub);
  if (!k.rule) return k.message;
  const d = discountFor(k.rule, o.sub);
  o.code = k.rule.code; o.discount = d; o.total = o.sub - d + o.fee;
  return null;
}

// ---------- products: the database when connected, prices.json otherwise ----------
export const CATS = { "espresso-machines": [], "pourover-machines": [], beans: ["filter", "espresso"], "pourover-accessories": [], "espresso-accessories": [], cups: [], tumblers: [], grinders: ["manual", "electric"] };
let catCache = null, catAt = 0;
export function forgetCatalogue() { catCache = null; }
// Every product row (hidden ones too), newest settings, cached for 30 seconds.
export async function productRows() {
  if (!supaOn()) return null;
  if (catCache && Date.now() - catAt < 30000) return catCache;
  const r = await supa("GET", "/rest/v1/products?select=*&order=sort.asc,created_at.asc");
  if (!r.ok || !Array.isArray(r.data)) return null;
  catCache = r.data; catAt = Date.now(); return catCache;
}
// {id: {name, price}} for pricing an order. Hidden products can't be bought.
export async function getCatalogue() {
  const rows = await productRows().catch(() => null);
  if (!rows) return CATALOGUE;
  const out = { _delivery: CATALOGUE._delivery };
  const lv = await stockLevels();
  for (const p of rows) if (p.visible) out[p.id] = { name: p.name_en, price: p.price_fils,
    ...(lv[p.id] !== undefined ? { left: lv[p.id], soldOut: lv[p.id] === 0 } : {}),
    ...(Array.isArray(p.colors) && p.colors.length ? { colors: p.colors.map(c => { const k = `${p.id}:${c.id}`;
      return { id: c.id, name: c.name_en, soldOut: !!c.sold_out || lv[k] === 0, ...(lv[k] !== undefined ? { left: lv[k] } : {}) }; }) } : {}) };
  return out;
}
// The shape the shop's pages use.
export const shopProduct = (p, lv = {}) => ({ out: (!(Array.isArray(p.colors) && p.colors.length) && lv[p.id] === 0) || undefined, id: p.id, cat: p.cat, sub: p.sub || undefined, img: p.img, fit: p.fit, price: p.price_fils, brand: p.brand || undefined,
  name: { en: p.name_en, ar: p.name_ar }, kind: { en: p.kind_en || "", ar: p.kind_ar || "" }, what: { en: p.what_en || "", ar: p.what_ar || "" },
  desc: { en: p.desc_en || "", ar: p.desc_ar || "" }, facts: Array.isArray(p.facts) && p.facts.length ? p.facts : undefined,
  colors: Array.isArray(p.colors) && p.colors.length ? p.colors.map(c => ({ id: c.id, name: { en: c.name_en, ar: c.name_ar }, hex: c.hex, trim: c.trim || undefined, img: c.img || undefined, out: !!c.sold_out || lv[`${p.id}:${c.id}`] === 0 })) : undefined });
