// POST /api/login  {login, password}  Signs a customer in with a username (or email) and password.
// A username is turned into its email on the server, so emails are never shown to anyone; Supabase checks the password.
// Returns {access_token, refresh_token} for the browser to keep, or {error} with a reason the page can explain.
import { json, readBody, supa, supaOn } from "./_lib.js";

const tries = new Map(); // ip|login -> [count, since]: at most 10 wrong tries per 15 minutes
const LIMIT = 10, WINDOW = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  if (!supaOn() || !process.env.SUPABASE_ANON_KEY) return json(res, 503, { error: "config", message: "Sign-in is not set up." });
  const { data: b } = await readBody(req);
  const login = String(b?.login || "").trim(), password = String(b?.password || "");
  if (!login || !password || login.length > 120 || password.length > 200) return json(res, 400, { error: "invalid_credentials" });
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  const k = ip + "|" + login.toLowerCase(), now = Date.now(), t = tries.get(k);
  if (t && now - t[1] < WINDOW && t[0] >= LIMIT) return json(res, 429, { error: "too_many", wait: Math.ceil((WINDOW - (now - t[1])) / 1000) });

  let email = login;
  if (!login.includes("@")) {
    if (!/^[A-Za-z0-9._]{3,20}$/.test(login)) return fail();
    const r = await supa("POST", "/rest/v1/rpc/login_email", { u: login });
    email = r.ok && typeof r.data === "string" ? r.data : "";
    if (!email) return fail();
  }
  const r = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: process.env.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const d = await r.json().catch(() => ({}));
  if (r.ok && d.access_token) { tries.delete(k); return json(res, 200, { access_token: d.access_token, refresh_token: d.refresh_token }); }
  const code = d.error_code || d.code || "";
  if (code === "email_not_confirmed") return json(res, 403, { error: "email_not_confirmed", email });
  if (r.status === 429) return json(res, 429, { error: "too_many", wait: 60 });
  return fail();

  function fail() { const c = t && now - t[1] < WINDOW ? t : [0, now]; c[0]++; tries.set(k, c); if (tries.size > 5000) tries.clear(); return json(res, 401, { error: "invalid_credentials" }); }
}
