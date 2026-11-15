// GET /api/products  The products the shop shows: visible ones only, in the owner's order.
// 204 when the database isn't connected, so the shop keeps its built-in list.
import { json, productRows, shopProduct, stockLevels } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  const rows = await productRows().catch(() => null);
  if (!rows) { res.statusCode = 204; return res.end(); }
  const lv = await stockLevels();
  res.setHeader("Cache-Control", "public, max-age=15");
  return json(res, 200, rows.filter(p => p.visible).map(p => shopProduct(p, lv)));
}
