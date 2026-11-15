// POST /api/checkout  {items:[{id,qty,color}], method:"knet"|"card"|"apple", lang, customer:{name,phone}, address:{gov,area,block,street,avenue,house,notes}}
// Recomputes the total from the shop's own prices, creates a MyFatoorah invoice for the chosen method,
// records the order as pending and returns {link, orderId, total}. The browser never decides the price.
import { METHODS, json, readBody, mf, paymentMethodId, money, buildOrder, getCatalogue, saveOrder, userFromToken, bearer } from "./_lib.js";

const FAIL = "The payment page could not open. Try again, or choose cash on delivery.";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method", message: "Use POST." });
  // DEV_ORIGIN_SITE=1 (local testing only): send the customer back to whatever address they are browsing on.
  const site = (process.env.DEV_ORIGIN_SITE && req.headers.origin ? req.headers.origin : process.env.SITE_URL || "").replace(/\/$/, "");
  if (!site) return json(res, 500, { error: "config", message: "SITE_URL is not set." });
  const { data: b } = await readBody(req);
  const code = METHODS[b?.method];
  if (b && !code) return json(res, 400, { error: "method", message: "Choose KNET, card or Apple Pay. Cash on delivery goes through WhatsApp." });
  const o = buildOrder(b, await getCatalogue());
  if (o.error) return json(res, o.error.status, o.error.body);

  try {
    const methodId = await paymentMethodId(code, Number(money(o.total)));
    if (!methodId) { console.error("payment method not enabled on this MyFatoorah account:", code); return json(res, 502, { error: "gateway", message: FAIL }); }
    const a = b.address || {};
    const invoice = {
      PaymentMethodId: methodId,
      InvoiceValue: Number(money(o.total)),
      DisplayCurrencyIso: "KWD",
      CustomerName: o.name,
      MobileCountryCode: "965",
      CustomerMobile: o.phone,
      Language: b.lang === "ar" ? "ar" : "en",
      // the order number: it comes back in every status check, so a payment can always be matched to its order
      CustomerReference: o.orderId,
      // shown on the invoice in your MyFatoorah portal, so you can see what to deliver and where
      CustomerAddress: { Block: String(a.block || "").slice(0, 50), Street: String(a.street || "").slice(0, 80), HouseBuildingNo: String(a.house || "").slice(0, 50),
        Address: o.addr.slice(0, 250), AddressInstructions: (o.notes || "").slice(0, 200) },
      InvoiceItems: o.products.map(p => ({ ItemName: p.name.slice(0, 100), Quantity: p.quantity, UnitPrice: p.price })),
      CallBackUrl: `${site}/?pay=return&order=${o.orderId}`,
      ErrorUrl: `${site}/?pay=cancel&order=${o.orderId}`
    };
    const r = await mf("ExecutePayment", invoice);
    const link = r.data?.Data?.PaymentURL;
    if (!r.ok || !link) { console.error("MyFatoorah ExecutePayment failed", r.status, r.data?.Message, JSON.stringify(r.data?.ValidationErrors || null)); return json(res, 502, { error: "gateway", message: FAIL }); }
    const user = await userFromToken(bearer(req));
    await saveOrder({ id: o.orderId, user_id: user ? user.id : null, status: "pending", method: b.method, total_fils: o.total, items: o.items, address: o.addr, phone: o.phone, gov: o.gov, track_id: String(r.data.Data.InvoiceId || "") || null });
    return json(res, 200, { link, orderId: o.orderId, total: money(o.total) });
  } catch (e) {
    console.error("checkout error", e.message);
    return json(res, e.code === "config" ? 500 : 502, { error: "gateway", message: FAIL });
  }
}
