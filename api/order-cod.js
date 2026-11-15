// POST /api/order-cod  same body as /api/checkout, without a method. Records a cash-on-delivery order
// (status "cod") so the dashboard sees every order, then returns {orderId, total}. The customer still sends it on WhatsApp.
import { json, readBody, money, buildOrder, getCatalogue, saveOrder, userFromToken, bearer, adjustStock } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method", message: "Use POST." });
  const { data: b } = await readBody(req);
  const o = buildOrder(b, await getCatalogue());
  if (o.error) return json(res, o.error.status, o.error.body);
  const user = await userFromToken(bearer(req));
  const recorded = await saveOrder({ id: o.orderId, user_id: user ? user.id : null, status: "cod", method: "cod", total_fils: o.total, items: o.items, address: o.addr, phone: o.phone, gov: o.gov });
  if (recorded) await adjustStock(o.items, -1); // a cash order is placed now, so it leaves the shelf now
  return json(res, 200, { orderId: o.orderId, total: money(o.total), recorded });
}
