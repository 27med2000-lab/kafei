// Discount codes: checked on the server, once per customer, off the items only, and managed from the dashboard.
// Run: node tests/discount.test.mjs   (offline; uses the fake Supabase and a fake MyFatoorah)
import assert from "node:assert/strict";
import { Readable } from "node:stream";
process.env.FAKE_EMPTY = "1";
const { start, db } = await import("./fake-supabase.mjs");
process.env.SUPABASE_URL = "http://127.0.0.1:4916"; process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key"; process.env.ADMIN_EMAILS = "owner@kafei.test";
process.env.MYFATOORAH_API_KEY = "test"; process.env.SITE_URL = "https://kafeikw.com";
const srv = await start(4916);
// fake MyFatoorah: answers the test server's address and remembers the last invoice it was asked for
let lastInvoice = null; const realFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => { if (!String(url).includes("myfatoorah.com")) return realFetch(url, o);
  const j = d => new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } });
  if (String(url).includes("InitiatePayment")) return j({ IsSuccess: true, Data: { PaymentMethods: [{ PaymentMethodId: 1, PaymentMethodCode: "kn" }, { PaymentMethodId: 2, PaymentMethodCode: "vm" }, { PaymentMethodId: 11, PaymentMethodCode: "ap" }] } });
  lastInvoice = JSON.parse(o.body); return j({ IsSuccess: true, Data: { PaymentURL: "https://pay.test/x", InvoiceId: 77 } }); };
const admin = (await import("../api/admin.js")).default, checkout = (await import("../api/checkout.js")).default, discount = (await import("../api/discount.js")).default;
const { cleanCode } = await import("../api/admin.js");
const lib = await import("../api/_lib.js");
function call(h, { method = "POST", url = "/", token, body, ip = "1.1.1.1" } = {}) {
  return new Promise(ok => { const req = Readable.from(body ? [JSON.stringify(body)] : []); req.method = method; req.url = url; req.headers = { ...(token ? { authorization: "Bearer " + token } : {}), "x-forwarded-for": ip };
    const res = { statusCode: 0, setHeader() {}, end(b) { ok({ status: this.statusCode, body: b ? JSON.parse(b) : null }); } }; h(req, res); });
}
const results = []; const check = async (n, fn) => { try { await fn(); results.push(["PASS", n]); } catch (e) { results.push(["FAIL", n + ": " + e.message]); } };
const order = (code, phone = "66001122") => ({ method: "knet", lang: "en", code, items: [{ id: "sias-cattopia", qty: 4 }], customer: { name: "Test Buyer", phone }, address: { gov: "capital", area: "Salmiya", block: "1", street: "2", house: "3" } });

await check("the dashboard turns a form into a code row", async () => {
  assert.deepEqual(cleanCode({ code: " kafei10 ", kind: "percent", value: "10", once: true }).row, { code: "KAFEI10", kind: "percent", value: 10, once_per_customer: true, min_order_fils: null, ends_at: null, active: true });
  assert.equal(cleanCode({ code: "TWO", kind: "fixed", value: "2.5" }).row.value, 2500);
  assert.match(cleanCode({ code: "a b", kind: "percent", value: "10" }).error, /letters or numbers/);
  assert.match(cleanCode({ code: "BIG", kind: "percent", value: "95" }).error, /1 to 90/); });
await check("the owner can save a code; customers can't", async () => {
  assert.equal((await call(admin, { token: "customer-token", body: { action: "code_save", code: { code: "KAFEI10", kind: "percent", value: "10" } } })).status, 403);
  const r = await call(admin, { token: "admin-token", body: { action: "code_save", code: { code: "kafei10", kind: "percent", value: "10", once: true } } });
  assert.equal(r.status, 200); assert.equal(db.codes[0].code, "KAFEI10"); });
await check("the checkout preview accepts a good code and refuses a wrong one", async () => {
  const ok = await call(discount, { body: { code: "kafei10", phone: "66001122", sub: 18000 } }); assert.equal(ok.status, 200); assert.equal(ok.body.value, 10);
  const bad = await call(discount, { body: { code: "NOPE" } }); assert.equal(bad.status, 400); assert.match(bad.body.message, /isn't valid/); });
await check("10% comes off the items, not delivery, and MyFatoorah is asked for the right total", async () => {
  const r = await call(checkout, { body: order("KAFEI10") }); assert.equal(r.status, 200, JSON.stringify(r.body));
  // 4 x 4.500 = 18.000, minus 1.800, plus 1.500 delivery = 17.700
  assert.equal(r.body.total, "17.700"); assert.equal(lastInvoice.InvoiceValue, 17.7);
  assert.equal(lastInvoice.InvoiceItems.reduce((s, i) => s + i.UnitPrice * i.Quantity, 0), 17.7);
  const saved = db.orders.at(-1); assert.equal(saved.discount_code, "KAFEI10"); assert.equal(saved.discount_fils, 1800); });
await check("delivery is always KWD 1.500 now (no free delivery)", async () => { const r = await call(checkout, { body: order(undefined, "66001133") }); assert.equal(r.body.total, "19.500"); });
await check("once per customer: a paid order with the code blocks a second use by the same phone", async () => {
  db.orders.at(-2).status = "paid";
  const again = await call(checkout, { body: order("KAFEI10") }); assert.equal(again.status, 400); assert.match(again.body.message, /once per customer/);
  const other = await call(checkout, { body: order("KAFEI10", "99887766") }); assert.equal(other.status, 200); });
await check("paused, ended and minimum-order codes are refused", async () => {
  db.codes.push({ code: "OFF", kind: "percent", value: 5, active: false }, { code: "OLD", kind: "percent", value: 5, active: true, ends_at: "2020-01-01T00:00:00Z" }, { code: "BIGONLY", kind: "fixed", value: 2000, active: true, min_order_fils: 50000 });
  for (const [c, m] of [["OFF", /isn't valid/], ["OLD", /ended/], ["BIGONLY", /50\.000 or more/]]) { const r = await call(checkout, { body: order(c, "50000001") }); assert.equal(r.status, 400, c); assert.match(r.body.message, m); } });
await check("a fixed code never takes the items below zero", async () => assert.equal(lib.discountFor({ kind: "fixed", value: 9000 }, 4500), 4500));
await check("the dashboard lists codes with uses and money given away, and profit counts the discount", async () => {
  const r = await call(admin, { method: "GET", url: "/api/admin?days=30", token: "admin-token" }); assert.equal(r.status, 200);
  const k = r.body.codes.find(c => c.code === "KAFEI10"); assert.equal(k.uses, 1); assert.equal(k.given_fils, 1800); assert.equal(r.body.totals.discount_fils, 1800); });
await check("the owner can delete a code", async () => { const r = await call(admin, { token: "admin-token", body: { action: "code_delete", code: "OFF" } }); assert.equal(r.status, 200); assert.ok(!db.codes.find(c => c.code === "OFF")); });
await check("too many guesses are slowed down", async () => { let last; for (let i = 0; i < 22; i++) last = await call(discount, { body: { code: "GUESS" + i }, ip: "9.9.9.9" }); assert.equal(last.status, 429); });

srv.close();
for (const [s, n] of results) console.log(s, n);
if (results.some(r => r[0] === "FAIL")) process.exit(1);
