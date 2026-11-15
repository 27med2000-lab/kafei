// GET /api/status?payment_id=...  Asks MyFatoorah whether a payment went through. The return page uses this;
// it never trusts the redirect alone. A confirmed result also updates the order in the database.
import { json, paymentStatus, settleOrder } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  const url = new URL(req.url, "http://x");
  const id = url.searchParams.get("payment_id") || "";
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(id)) return json(res, 400, { error: "payment_id", message: "Missing or invalid payment_id." });
  try {
    const s = await paymentStatus(id, "PaymentId");
    if (!s) return json(res, 502, { error: "gateway", message: "Could not check the payment right now." });
    if (s.status === "NOT_FOUND") return json(res, 404, { paid: false, result: "NOT_FOUND", final: true });
    if (s.final) await settleOrder(s.orderId, s.paid, s.paymentId);
    return json(res, 200, { paid: s.paid, result: s.status, orderId: s.orderId, method: s.method, paymentId: s.paymentId, final: s.final });
  } catch (e) {
    console.error("status error", e.message);
    return json(res, 502, { error: "gateway", message: "Could not check the payment right now." });
  }
}
