// A tiny stand-in for Supabase (auth check + the REST calls the shop's functions make), for local tests only.
// Data comes from tests/fixtures/dashboard-sample.json, or starts empty with FAKE_EMPTY=1.
import http from "node:http";
import fs from "node:fs";
const SERVICE = "service-test-key";
const TOKENS = { "admin-token": { id: "admin-1", email: "owner@kafei.test" }, "customer-token": { id: "u-a", email: "customer@kafei.test" } };
const fx = JSON.parse(fs.readFileSync(new URL("./fixtures/dashboard-sample.json", import.meta.url)));
const now = Date.now(), DAY = 864e5;
const PRODUCTS = [
  { id: "kuvani-maestro", cat: "espresso-machines", sub: null, name_en: "Kuvani Maestro", name_ar: "كوفاني مايسترو", kind_en: "Espresso machine", kind_ar: "ماكينة إسبريسو", price_fils: 100000, img: "img/kuvani.webp", fit: "cover", visible: true, sort: 10, facts: [] },
  { id: "xbloom-studio", cat: "pourover-machines", sub: null, name_en: "xBloom Studio", name_ar: "إكس بلوم ستوديو", kind_en: "Pour-over machine", kind_ar: "ماكينة تقطير", price_fils: 80000, img: "img/xbloom.webp", fit: "contain", visible: true, sort: 20, facts: [] },
  { id: "kuvani-gevi-v60", cat: "pourover-machines", sub: null, name_en: "Kuvani × Gevi V60", name_ar: "كوفاني × جيفي V60", kind_en: "Automatic pour-over", kind_ar: "تقطير أوتوماتيكي", price_fils: 60000, img: "img/gevi.webp", fit: "cover", visible: true, sort: 30, facts: [] },
  { id: "sias-cattopia", cat: "beans", sub: "filter", name_en: "SIAS Cattopia Blend", name_ar: "سياس كاتوبيا بلند", kind_en: "Coffee beans, 200 g", kind_ar: "بن، 200 غ", price_fils: 4500, img: "img/sias.webp", fit: "cover", visible: true, sort: 40, facts: [] }];
export const db = process.env.FAKE_EMPTY ? { orders: [], stock: [], users: [], codes: [], products: PRODUCTS.map(p => ({ ...p })), files: {} } : {
  products: PRODUCTS.map(p => ({ ...p })), files: {}, codes: [],
  orders: fx.orders.map(o => ({ id: o.id, user_id: o.user, status: o.status, method: o.method, total_fils: o.total_fils, items: o.items, phone: o.phone, gov: o.gov, delivery_status: o.delivery_status,
    created_at: new Date(Math.floor((now - o.days_ago * DAY) / DAY) * DAY + o.hour * 36e5).toISOString() })),
  stock: fx.stock.map(s => ({ ...s })), users: fx.signups_days_ago.map(d => ({ created_at: new Date(now - d * DAY).toISOString() }))
};
export const log = [];
function filter(rows, q) {
  for (const [k, v] of q) {
    if (["select", "order", "limit"].includes(k)) continue;
    const [op, ...rest] = v.split("."); const val = rest.join(".");
    if (op === "eq") rows = rows.filter(r => String(r[k]) === val);
    if (op === "gte") rows = rows.filter(r => r[k] >= val);
    if (op === "lt") rows = rows.filter(r => r[k] < val);
    if (op === "not" && val === "is.null") rows = rows.filter(r => r[k] !== null && r[k] !== undefined);
    if (op === "in") { const set = val.replace(/^\(|\)$/g, "").split(","); rows = rows.filter(r => set.includes(String(r[k]))); }
  }
  return rows;
}
export function start(port) {
  return new Promise(ok => { const srv = http.createServer((req, res) => {
    const chunks = []; req.on("data", c => chunks.push(c)); req.on("end", () => { const raw = Buffer.concat(chunks), body = raw.toString("utf8");
      const u = new URL(req.url, "http://x"), send = (s, d) => { res.writeHead(s, { "Content-Type": "application/json" }); res.end(d === undefined ? "" : JSON.stringify(d)); };
      log.push({ method: req.method, path: u.pathname + u.search, apikey: req.headers.apikey });
      if (u.pathname.startsWith("/storage/v1/object/public/product-photos/")) { const f = db.files[u.pathname.split("/").pop()]; if (!f) return send(404, {}); res.writeHead(200, { "Content-Type": f.type }); return res.end(f.raw); }
      if (u.pathname === "/auth/v1/user") { const tok = (req.headers.authorization || "").replace(/^Bearer /, ""); return TOKENS[tok] ? send(200, TOKENS[tok]) : send(401, { msg: "invalid" }); }
      // like Supabase: the secret key in the apikey header is enough (new-style keys); an Authorization header, if sent, must match
      if (req.headers.apikey !== SERVICE || (req.headers.authorization && req.headers.authorization !== "Bearer " + SERVICE)) return send(401, { message: "service role required" });
      if (u.pathname === "/auth/v1/admin/users") return send(200, { users: db.users });
      if (u.pathname.startsWith("/storage/v1/object/product-photos/") && req.method === "POST") { db.files[u.pathname.split("/").pop()] = { type: req.headers["content-type"], size: raw.length, raw }; return send(200, { Key: u.pathname }); }
      // the adjust_stock function from 005_inventory.sql: lines with no number are left alone, never below 0
      if (u.pathname === "/rest/v1/rpc/adjust_stock" && req.method === "POST") { const { p_items, p_sign } = JSON.parse(body); const sum = {};
        for (const i of p_items) sum[i.key] = (sum[i.key] || 0) + Math.max(0, Number(i.qty) || 0);
        for (const [k, q] of Object.entries(sum)) { const r = db.stock.find(x => x.product_id === k); if (r && r.units !== null && r.units !== undefined) r.units = Math.max(0, r.units + p_sign * q); }
        return send(204); }
      let table = u.pathname.replace("/rest/v1/", "");
      if (table === "discount_codes") { if (process.env.FAKE_NO_CODES) return send(404, {}); table = "codes";
        if (req.method === "POST") { const row = JSON.parse(body), i = db.codes.findIndex(c => c.code === row.code); if (i >= 0) db.codes[i] = { ...db.codes[i], ...row }; else db.codes.push({ created_at: new Date().toISOString(), ...row }); return send(201); }
        if (req.method === "DELETE") { const gone = new Set(filter(db.codes, u.searchParams)); db.codes = db.codes.filter(c => !gone.has(c)); return send(204); } }
      if (!["orders", "stock", "products", "codes"].includes(table)) return send(404, {});
      if (req.method === "GET") return send(200, filter(db[table], u.searchParams));
      if (req.method === "POST") { const row = JSON.parse(body), ignore = /ignore-duplicates/.test(req.headers.prefer || "");
        if (table === "stock") { const i = db.stock.findIndex(s => s.product_id === row.product_id); if (i >= 0) { if (!ignore) db.stock[i] = { ...db.stock[i], ...row }; } else db.stock.push(row); }
        else if (table === "products") { const i = db.products.findIndex(p => p.id === row.id); if (i >= 0) db.products[i] = { ...db.products[i], ...row }; else db.products.push({ created_at: new Date().toISOString(), ...row }); }
        else db.orders.push({ delivery_status: "to_deliver", created_at: new Date().toISOString(), ...row }); return send(201); }
      if (req.method === "PATCH") { const patch = JSON.parse(body), hit = filter(db[table], u.searchParams); for (const r of hit) Object.assign(r, patch); return /return=representation/.test(req.headers.prefer || "") ? send(200, hit) : send(204); }
      send(405, {});
    }); });
    srv.listen(port, () => ok(srv)); });
}
if (process.argv[1] && process.argv[1].endsWith("fake-supabase.mjs")) start(Number(process.env.PORT || 4901)).then(() => console.log("fake supabase on", process.env.PORT || 4901));
