// Real page addresses: each sends the app with its own title, unknown ones send nothing (the server shows the 404).
// Run: node tests/pages.test.mjs  (offline; no database, so products come from api/prices.json)
import assert from "node:assert/strict";
process.env.SITE_URL = "https://kafeikw.com";
const { appPage } = await import("../deploy/api/pages.js") /* the built site: its index.html carries the canonical link */;
const title = r => (r.body.match(/<title>([^<]*)<\/title>/) || [])[1];
const results = []; const check = async (n, fn) => { try { await fn(); results.push(["PASS", n]); } catch (e) { results.push(["FAIL", n + ": " + e.message]); } };
await check("/shop has its own title, canonical and an empty main", async () => { const r = await appPage("/shop"); assert.equal(r.status, 200); assert.equal(title(r), "Shop · Kafei كفي");
  assert.ok(r.body.includes('<link rel="canonical" href="https://kafeikw.com/shop">')); assert.ok(r.body.includes('<main id="main" tabindex="-1" style="min-height:100vh"><div class="wrap page-head"><h1>Shop</h1>')); });
await check("a category and a sub-category", async () => { assert.equal(title(await appPage("/shop/grinders")), "Grinders · Kafei كفي"); assert.equal(title(await appPage("/shop/grinders/manual")), "Manual grinders · Kafei كفي"); });
await check("a product page is named after the product", async () => assert.equal(title(await appPage("/p/xbloom-studio")), "xBloom Studio · Kafei كفي"));
await check("account and checkout are kept out of search", async () => { assert.ok((await appPage("/account")).body.includes('name="robots" content="noindex"')); assert.ok((await appPage("/checkout")).body.includes("noindex")); });
await check("unknown addresses are not pages", async () => { for (const u of ["/p/nope", "/shop/nope", "/shop/grinders/nope", "/zzz", "/a/b/c"]) assert.equal(await appPage(u), null, u); });
await check("files and the home page are left to the file server", async () => { for (const u of ["/", "/img/xbloom.webp", "/privacy.html", "/app.js"]) assert.equal(await appPage(u), null, u); });
await check("sitemap lists the pages and the products", async () => { const r = await appPage("/sitemap.xml"); assert.equal(r.type, "application/xml");
  for (const u of ["/", "/shop", "/delivery", "/about", "/privacy", "/p/xbloom-studio"]) assert.ok(r.body.includes(`<loc>https://kafeikw.com${u}</loc>`), u); });
for (const [s, n] of results) console.log(s, n);
if (results.some(r => r[0] === "FAIL")) process.exit(1);
