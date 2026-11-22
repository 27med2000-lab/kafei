// Order alerts: one WhatsApp + email when an order turns paid, never twice, never blocking the order.
// Run: node tests/alerts.test.mjs   (offline; fake Supabase, fake CallMeBot, fake mail server)
import assert from "node:assert/strict";
import net from "node:net";
process.env.FAKE_EMPTY = "1";
const { start, db } = await import("./fake-supabase.mjs");
process.env.SUPABASE_URL = "http://127.0.0.1:4918"; process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";
process.env.CALLMEBOT_PHONE = "96566908822"; process.env.CALLMEBOT_APIKEY = "123456";
const srv = await start(4918);
const sentWa = []; const realFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => { if (String(url).includes("callmebot.com")) { sentWa.push(decodeURIComponent(new URL(url).searchParams.get("text"))); return new Response("Message queued"); } return realFetch(url, o); };
const lib = await import("../api/_lib.js"); const { sendMail, alertText } = await import("../api/alerts.js");
const results = []; const check = async (n, fn) => { try { await fn(); results.push(["PASS", n]); } catch (e) { results.push(["FAIL", n + ": " + e.message]); } };

db.orders.push({ id: "KFTEST1", status: "pending", method: "knet", total_fils: 17700, discount_code: "KAFEI10", discount_fils: 1800, phone: "66001122", address: "Capital, Salmiya, Block 1, St 2, House 3",
  items: [{ id: "sias-cattopia", name: "SIAS Cattopia Blend", qty: 4, price_fils: 4500 }], delivery_status: "to_deliver", created_at: new Date().toISOString() });

await check("the alert says what to deliver, where, and how much", async () => { const t = alertText(db.orders[0]);
  for (const s of ["KFTEST1", "KWD 17.700", "KNET", "4 × SIAS Cattopia Blend", "KAFEI10", "+965 66001122", "Salmiya", "/admin"]) assert.ok(t.includes(s), s); });
await check("a paid order sends one WhatsApp alert", async () => { await lib.settleOrder("KFTEST1", true, "P1"); assert.equal(sentWa.length, 1); assert.match(sentWa[0], /KFTEST1/); });
await check("the same payment confirmed again (webhook + return page) does not alert twice", async () => { await lib.settleOrder("KFTEST1", true, "P1"); assert.equal(sentWa.length, 1); });
await check("a failed payment sends nothing", async () => { db.orders.push({ id: "KFTEST2", status: "pending", items: [], created_at: new Date().toISOString() }); await lib.settleOrder("KFTEST2", false, "P2"); assert.equal(sentWa.length, 1); });
await check("a broken alert channel never stops the order being marked paid", async () => {
  globalThis.fetch = async (url, o) => String(url).includes("callmebot.com") ? Promise.reject(new Error("down")) : realFetch(url, o);
  db.orders.push({ id: "KFTEST3", status: "pending", items: [], created_at: new Date().toISOString() });
  assert.equal(await lib.settleOrder("KFTEST3", true, "P3"), true); assert.equal(db.orders.find(o => o.id === "KFTEST3").status, "paid"); });
await check("the email speaks SMTP correctly (login, sender, recipient, Arabic-safe body)", async () => {
  const got = []; let body = "";
  const mail = net.createServer(s => { s.write("220 hi\r\n"); let data = false;
    s.on("data", d => { const t = d.toString(); if (data) { body += t; if (body.endsWith("\r\n.\r\n")) { data = false; s.write("250 queued\r\n"); } return; }
      for (const line of t.split("\r\n").filter(Boolean)) { got.push(line);
        if (line.startsWith("EHLO")) s.write("250-hello\r\n250 AUTH LOGIN\r\n"); else if (line === "AUTH LOGIN") s.write("334 VXNlcm5hbWU6\r\n");
        else if (got.length === 3) s.write("334 UGFzc3dvcmQ6\r\n"); else if (got.length === 4) s.write(line === Buffer.from("secret").toString("base64") ? "235 ok\r\n" : "535 no\r\n");
        else if (line.startsWith("MAIL") || line.startsWith("RCPT")) s.write("250 ok\r\n"); else if (line === "DATA") { data = true; s.write("354 go\r\n"); } else if (line === "QUIT") { s.write("221 bye\r\n"); s.end(); } } }); });
  await new Promise(ok => mail.listen(4919, ok));
  const r = await sendMail({ host: "127.0.0.1", port: 4919, secure: false, user: "info@kafeikw.com", pass: "secret", from: "info@kafeikw.com", to: "info@kafeikw.com", subject: "طلب جديد", text: "New paid order KFTEST1\nكفي" });
  mail.close(); assert.equal(r, "sent");
  assert.ok(got.includes("MAIL FROM:<info@kafeikw.com>")); assert.ok(got.includes("RCPT TO:<info@kafeikw.com>"));
  const b64 = body.split("\r\n\r\n")[1].replace(/\r\n|\./g, ""); assert.match(Buffer.from(b64, "base64").toString("utf8"), /KFTEST1\nكفي/); });

await check("the dashboard's test button reports each channel", async () => {
  globalThis.fetch = async (url, o) => String(url).includes("callmebot.com") ? new Response("Message queued") : realFetch(url, o);
  process.env.ADMIN_EMAILS = "owner@kafei.test"; const { Readable } = await import("node:stream"); const admin = (await import("../api/admin.js")).default;
  const r = await new Promise(ok => { const req = Readable.from([JSON.stringify({ action: "test_alert" })]); req.method = "POST"; req.url = "/api/admin"; req.headers = { authorization: "Bearer admin-token" };
    admin(req, { statusCode: 0, setHeader() {}, end(b) { ok({ status: this.statusCode, body: JSON.parse(b) }); } }); });
  assert.equal(r.status, 200); assert.equal(r.body.whatsapp, "sent"); assert.equal(r.body.email, "off"); });
srv.close();
for (const [s, n] of results) console.log(s, n);
if (results.some(r => r[0] === "FAIL")) process.exit(1);
