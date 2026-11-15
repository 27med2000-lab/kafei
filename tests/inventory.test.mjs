// Inventory: stock per colour, stock that goes down with orders and back on cancel, sold out at 0.
// Run: node tests/inventory.test.mjs   (offline; uses the fake Supabase)
import assert from "node:assert/strict";
import { Readable } from "node:stream";
process.env.FAKE_EMPTY = "1";
const { start, db } = await import("./fake-supabase.mjs");
process.env.SUPABASE_URL = "http://127.0.0.1:4912"; process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key"; process.env.ADMIN_EMAILS = "owner@kafei.test";
process.env.PRICES_FILE = new URL("./fixtures/test-prices.json", import.meta.url).pathname;
const srv = await start(4912);
const x = db.products.find(p => p.id === "xbloom-studio");
x.colors = [{ id: "twilight", name_en: "Twilight", name_ar: "توايلايت", hex: "#E9E7E3" }, { id: "offline-blue", name_en: "Offline Blue", name_ar: "أزرق", hex: "#2F5FC4" }];
const lib = await import("../api/_lib.js");
const admin = (await import("../api/admin.js")).default, cod = (await import("../api/order-cod.js")).default, products = (await import("../api/products.js")).default;
function call(h, { method = "GET", url = "/api/admin?days=30", token, body } = {}) {
  return new Promise(ok => { const req = Readable.from(body ? [JSON.stringify(body)] : []); req.method = method; req.url = url; req.headers = token ? { authorization: "Bearer " + token } : {};
    const res = { statusCode: 0, setHeader() {}, end(b) { ok({ status: this.statusCode, body: b ? JSON.parse(b) : null }); } }; h(req, res); });
}
const setStock = (id, units, low_at = 1) => call(admin, { method: "POST", token: "admin-token", body: { action: "stock", product_id: id, units, low_at } });
const units = id => (db.stock.find(r => r.product_id === id) || {}).units;
const shop = async () => { lib.forgetCatalogue(); return (await call(products, { url: "/api/products" })).body; };
const order = (items, phone = "66908822") => call(cod, { method: "POST", url: "/api/order-cod", body: { items, customer: { name: "Test Buyer", phone }, address: { gov: "capital", area: "Shuwaikh", block: "1", street: "2", house: "3" } } });
const results = []; const check = async (n, fn) => { try { await fn(); results.push(["PASS", n]); } catch (e) { results.push(["FAIL", n + ": " + e.message]); } };

await check("dashboard lists one stock line per colour", async () => { const r = await call(admin, { token: "admin-token" }); assert.equal(r.status, 200);
  const ids = r.body.stock.map(s => s.id); assert.ok(ids.includes("xbloom-studio:twilight") && ids.includes("xbloom-studio:offline-blue")); assert.ok(!ids.includes("xbloom-studio"), "no shared line for a colour product");
  assert.equal(r.body.stock.find(s => s.id === "xbloom-studio:twilight").name, "xBloom Studio (Twilight)"); });
await check("owner sets units per colour", async () => { assert.equal((await setStock("xbloom-studio:twilight", 2)).status, 200); assert.equal((await setStock("xbloom-studio:offline-blue", 0)).status, 200);
  assert.equal(units("xbloom-studio:twilight"), 2); assert.equal(units("xbloom-studio:offline-blue"), 0); });
await check("an unknown stock line is refused", async () => assert.equal((await setStock("xbloom-studio:pink", 3)).status, 400));
await check("the shop shows a colour at 0 as sold out", async () => { const p = (await shop()).find(p => p.id === "xbloom-studio");
  assert.equal(p.colors.find(c => c.id === "offline-blue").out, true); assert.equal(p.colors.find(c => c.id === "twilight").out, false); assert.ok(!p.out); });
await check("a cash order takes units off the shelf", async () => { const r = await order([{ id: "xbloom-studio", qty: 1, color: "twilight" }]); assert.equal(r.status, 200); assert.equal(units("xbloom-studio:twilight"), 1); });
await check("ordering more than is left is refused", async () => { const r = await order([{ id: "xbloom-studio", qty: 2, color: "twilight" }]); assert.equal(r.status, 400); assert.match(r.body.message, /Only 1/); assert.equal(units("xbloom-studio:twilight"), 1); });
await check("a sold-out colour can't be ordered", async () => { const r = await order([{ id: "xbloom-studio", qty: 1, color: "offline-blue" }]); assert.equal(r.status, 400); assert.match(r.body.message, /sold out/); });
await check("a paid online order takes stock once, even if MyFatoorah reports it twice", async () => {
  db.orders.push({ id: "KFPAYTEST1", status: "pending", items: [{ id: "xbloom-studio", color: "twilight", qty: 1 }], delivery_status: "to_deliver", created_at: new Date().toISOString() });
  await lib.settleOrder("KFPAYTEST1", true, "PAY1"); assert.equal(units("xbloom-studio:twilight"), 0);
  await setStock("xbloom-studio:twilight", 5); await lib.settleOrder("KFPAYTEST1", true, "PAY1"); assert.equal(units("xbloom-studio:twilight"), 5, "a repeated message changes nothing"); });
await check("a failed payment leaves stock alone", async () => {
  db.orders.push({ id: "KFPAYTEST2", status: "pending", items: [{ id: "xbloom-studio", color: "twilight", qty: 2 }], created_at: new Date().toISOString() });
  await lib.settleOrder("KFPAYTEST2", false, "PAY2"); assert.equal(units("xbloom-studio:twilight"), 5); });
await check("cancelling an order puts the units back; un-cancelling takes them again", async () => {
  const r = await order([{ id: "xbloom-studio", qty: 2, color: "twilight" }]); assert.equal(units("xbloom-studio:twilight"), 3);
  const id = r.body.orderId; await call(admin, { method: "POST", token: "admin-token", body: { action: "delivery", order_id: id, delivery_status: "cancelled" } }); assert.equal(units("xbloom-studio:twilight"), 5);
  await call(admin, { method: "POST", token: "admin-token", body: { action: "delivery", order_id: id, delivery_status: "cancelled" } }); assert.equal(units("xbloom-studio:twilight"), 5, "cancelling twice gives back once");
  await call(admin, { method: "POST", token: "admin-token", body: { action: "delivery", order_id: id, delivery_status: "to_deliver" } }); assert.equal(units("xbloom-studio:twilight"), 3); });
await check("a product without colours sells out at 0", async () => { await setStock("sias-cattopia", 0); const p = (await shop()).find(p => p.id === "sias-cattopia"); assert.equal(p.out, true);
  const r = await order([{ id: "sias-cattopia", qty: 1 }]); assert.equal(r.status, 400); assert.match(r.body.message, /sold out/); });
await check("an empty box means not counted: never sells out", async () => { assert.equal((await setStock("sias-cattopia", "")).status, 200); assert.equal(units("sias-cattopia"), null);
  const p = (await shop()).find(p => p.id === "sias-cattopia"); assert.ok(!p.out); const r = await order([{ id: "sias-cattopia", qty: 3 }]); assert.equal(r.status, 200); assert.equal(units("sias-cattopia"), null); });
await check("low-stock flag in the dashboard", async () => { await setStock("xbloom-studio:twilight", 1, 2); const r = await call(admin, { token: "admin-token" });
  const l = r.body.stock.find(s => s.id === "xbloom-studio:twilight"); assert.equal(l.low, true); assert.equal(l.out, false); });

srv.close(); for (const [s, n] of results) console.log(s + " " + n);
const bad = results.filter(r => r[0] === "FAIL").length; console.log(bad ? "SOME FAILED" : "ALL PASS"); process.exit(bad ? 1 : 0);
