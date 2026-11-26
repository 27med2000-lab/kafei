// POST /api/myfatoorah-webhook  MyFatoorah calls this when a payment's status changes (Webhook v2, PAYMENT_STATUS_CHANGED).
// It checks the signature, then asks MyFatoorah itself for the payment's status before updating the order,
// so a forged or replayed message can never mark an order paid. The owner is alerted once, when the order turns paid (see alerts.js).
// Set it up in the MyFatoorah portal: Integration Settings > Webhook > URL https://kafeikw.com/api/myfatoorah-webhook,
// version 2, event "Payment Status Changed", then copy the webhook secret key into MYFATOORAH_WEBHOOK_SECRET.
import { json, readBody, webhookIsGenuine, paymentStatus, settleOrder } from "./_lib.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  const { data } = await readBody(req, true);
  if (!data) return json(res, 400, { error: "json" });
  const check = webhookIsGenuine(req.headers || {}, data);
  if (!check.ok) { console.warn("MyFatoorah webhook rejected: bad signature"); return json(res, 401, { error: "signature" }); }
  if (data.Event?.Code !== 1) return json(res, 200, { received: true, ignored: data.Event?.Name || "unknown event" });

  const paymentId = data.Data?.Transaction?.PaymentId;
  const s = paymentId ? await paymentStatus(paymentId, "PaymentId").catch(() => null) : null;
  if (!s) { console.error("MyFatoorah webhook: could not confirm payment", paymentId); return json(res, 502, { error: "confirm" }); } // MyFatoorah retries
  if (s.final) await settleOrder(s.orderId, s.paid, s.paymentId);
  console.log("MyFatoorah webhook", { order: s.orderId, status: s.status, paymentId, method: s.method, signed: check.checked });

  return json(res, 200, { received: true });
}
