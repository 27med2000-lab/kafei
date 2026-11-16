// Username or email + password sign-in through /api/login. Run: node tests/login.test.mjs (offline; a small fake Supabase)
import assert from "node:assert/strict";
import http from "node:http";
import { Readable } from "node:stream";
const USERS = { "ahmed@kafei.test": { password: "goodpass1", username: "Ahmed_K", confirmed: true }, "new@kafei.test": { password: "newpass12", username: "newbie", confirmed: false } };
const srv = http.createServer((req, res) => { let s = ""; req.on("data", c => (s += c)); req.on("end", () => {
  const b = s ? JSON.parse(s) : {}; res.setHeader("Content-Type", "application/json");
  if (req.url === "/rest/v1/rpc/login_email") { const e = Object.keys(USERS).find(k => USERS[k].username.toLowerCase() === String(b.u).toLowerCase()); return res.end(JSON.stringify(e || null)); }
  if (req.url.startsWith("/auth/v1/token")) { const u = USERS[b.email];
    if (!u || u.password !== b.password) { res.statusCode = 400; return res.end(JSON.stringify({ error_code: "invalid_credentials" })); }
    if (!u.confirmed) { res.statusCode = 400; return res.end(JSON.stringify({ error_code: "email_not_confirmed" })); }
    return res.end(JSON.stringify({ access_token: "at-" + b.email, refresh_token: "rt" })); }
  res.statusCode = 404; res.end("{}"); }); });
await new Promise(ok => srv.listen(4913, ok));
process.env.SUPABASE_URL = "http://127.0.0.1:4913"; process.env.SUPABASE_SERVICE_ROLE_KEY = "service"; process.env.SUPABASE_ANON_KEY = "anon";
const login = (await import("../api/login.js")).default;
const call = (body, ip = "1.1.1.1") => new Promise(ok => { const req = Readable.from([JSON.stringify(body)]); req.method = "POST"; req.url = "/api/login"; req.headers = { "x-forwarded-for": ip };
  const res = { statusCode: 0, setHeader() {}, end(b) { ok({ status: this.statusCode, body: b ? JSON.parse(b) : null }); } }; login(req, res); });
const results = []; const check = async (n, fn) => { try { await fn(); results.push(["PASS", n]); } catch (e) { results.push(["FAIL", n + ": " + e.message]); } };
await check("username + right password signs in", async () => { const r = await call({ login: "ahmed_k", password: "goodpass1" }); assert.equal(r.status, 200); assert.equal(r.body.access_token, "at-ahmed@kafei.test"); });
await check("email + right password signs in", async () => assert.equal((await call({ login: "ahmed@kafei.test", password: "goodpass1" })).status, 200));
await check("wrong password is refused without saying which part was wrong", async () => { const r = await call({ login: "Ahmed_K", password: "nope" }); assert.equal(r.status, 401); assert.equal(r.body.error, "invalid_credentials"); });
await check("unknown username looks the same as a wrong password", async () => { const r = await call({ login: "ghost", password: "x" }); assert.equal(r.status, 401); assert.equal(r.body.error, "invalid_credentials"); assert.ok(!("email" in r.body)); });
await check("unconfirmed account asks for the email code", async () => { const r = await call({ login: "newbie", password: "newpass12" }); assert.equal(r.status, 403); assert.equal(r.body.error, "email_not_confirmed"); });
await check("10 wrong tries lock that login for a while", async () => { for (let i = 0; i < 10; i++) await call({ login: "Ahmed_K", password: "bad" }, "2.2.2.2");
  const r = await call({ login: "Ahmed_K", password: "goodpass1" }, "2.2.2.2"); assert.equal(r.status, 429); assert.equal(r.body.error, "too_many");
  assert.equal((await call({ login: "Ahmed_K", password: "goodpass1" }, "3.3.3.3")).status, 200, "other visitors are not locked out"); });
await check("GET is refused", async () => { const r = await new Promise(ok => { const req = Readable.from([]); req.method = "GET"; req.url = "/api/login"; req.headers = {};
  login(req, { statusCode: 0, setHeader() {}, end() { ok(this.statusCode); } }); }); assert.equal(r, 405); });
srv.close();
for (const [s, n] of results) console.log(s, n);
if (results.some(r => r[0] === "FAIL")) process.exit(1);
