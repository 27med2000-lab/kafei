// Cost price: saved privately, used for profit and stock value in the dashboard, never sent to the shop.
// Run: node tests/cost.test.mjs   (offline; uses the fake Supabase)
import assert from "node:assert/strict";
import { Readable } from "node:stream";
process.env.FAKE_EMPTY = "1";
const { start, db } = await import("./fake-supabase.mjs");
process.env.SUPABASE_URL = "http://127.0.0.1:4915"; process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key"; process.env.ADMIN_EMAILS = "owner@kafei.test";
process.env.PRICES_FILE = new URL("./fixtures/test-prices.json", import.meta.url).pathname;
const srv = await start(4915);
const lib = await import("../api/_lib.js");
const admin = (await import("../api/admin.js")).default, products = (await import("../api/products.js")).default;
const { cleanProduct } = await import("../api/admin.js");
function call(h, { method = "GET", url = "/api/admin?days=30", token, body } = {}) {
  return new Promise(ok => { const req = Readable.from(body ? [JSON.stringify(body)] : []); req.method = method; req.url = url; req.headers = token ? { authorization: "Bearer " + token } : {};
    const res = { statusCode: 0, setHeader() {}, end(b) { ok({ status: this.statusCode, body: b ? JSON.parse(b) : null }); } }; h(req, res); });
}
const results = []; const check = async (n, fn) => { try { await fn(); results.push(["PASS", n]); } catch (e) { results.push(["FAIL", n + ": " + e.message]); } };
const base = { name_en: "Test Grinder", name_ar: "مطحنة تجربة", cat: "grinders", sub: "manual" };

await check("a cost price is read in KWD and stored in fils", async () => { const r = cleanProduct({ ...base, price: "45", cost: "28.500" }, []); assert.equal(r.row.cost_fils, 28500); assert.equal(r.row.price_fils, 45000); });
await check("the cost price is optional", async () => assert.equal(cleanProduct({ ...base, price: "45" }, []).row.cost_fils, null));
await check("a nonsense cost price is refused with a clear message", async () => assert.match(cleanProduct({ ...base, price: "45", cost: "abc" }, []).error, /cost price/i));

const x = db.products.find(p => p.id === "xbloom-studio"); x.cost_fils = 140000;
db.orders.push({ id: "KF-COST-1", status: "paid", method: "card", total_fils: 398000, items: [{ id: "xbloom-studio", name: "xBloom Studio", qty: 2, price_fils: 199000 }], gov: "capital", delivery_status: "to_deliver", created_at: new Date().toISOString() });
db.stock.push({ product_id: "xbloom-studio", units: 3, low_at: 1 });

await check("profit = money collected minus cost of the units sold", async () => { const r = await call(admin, { token: "admin-token" }); assert.equal(r.status, 200);
  assert.equal(r.body.totals.profit_fils, 2 * (199000 - 140000)); assert.equal(r.body.products.find(p => p.id === "xbloom-studio").profit_fils, 118000); });
await check("stock value = units on the shelf x cost", async () => { const r = await call(admin, { token: "admin-token" }); assert.equal(r.body.totals.stock_value_fils, 3 * 140000); });
await check("products without a cost are left out and flagged", async () => {
  db.orders.push({ id: "KF-COST-2", status: "paid", method: "knet", total_fils: 4500, items: [{ id: "sias-cattopia", name: "SIAS", qty: 1, price_fils: 4500 }], gov: "capital", delivery_status: "to_deliver", created_at: new Date().toISOString() });
  const r = await call(admin, { token: "admin-token" }); assert.equal(r.body.totals.profit_fils, 118000); assert.equal(r.body.totals.profit_partial, true); });
await check("the shop never receives the cost price", async () => { lib.forgetCatalogue(); const r = await call(products, { url: "/api/products" });
  assert.equal(r.status, 200); assert.ok(!JSON.stringify(r.body).includes("cost")); assert.ok(!JSON.stringify(r.body).includes("140000")); });

srv.close();
for (const [s, n] of results) console.log(s, n);
if (results.some(r => r[0] === "FAIL")) process.exit(1);
