// POST /api/discount  {code, phone?, sub?}  -> {code, kind, value, min_order_fils} when the code can be used, or 400 {message}
// Only previews the code for the checkout page; /api/checkout checks it again and works out the real total.
import { json, readBody, checkCode } from "./_lib.js";

const tries = new Map(); // ip -> [count, since]: at most 20 checks per 10 minutes, so codes can't be guessed
const WINDOW = 10 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method", message: "Use POST." });
  const ip = String((req.headers || {})["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  const now = Date.now(), t = tries.get(ip), c = t && now - t[1] < WINDOW ? t : [0, now];
  if (c[0] >= 20) return json(res, 429, { error: "slow", message: "Too many tries. Wait a few minutes and try again." });
  c[0]++; tries.set(ip, c); if (tries.size > 5000) tries.clear();
  const { data: b } = await readBody(req);
  const phone = String(b?.phone || "").replace(/\D/g, "");
  const sub = Number.isFinite(Number(b?.sub)) && b?.sub !== null && b?.sub !== undefined ? Math.floor(Number(b.sub)) : null;
  try {
    const k = await checkCode(b?.code, /^[4569]\d{7}$/.test(phone) ? phone : null, sub);
    return k.rule ? json(res, 200, k.rule) : json(res, 400, { error: "code", message: k.message });
  } catch { return json(res, 502, { error: "code", message: "The discount code could not be checked. Try again." }); }
}
