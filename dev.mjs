// Local test server: serves the shop (site.html as "/") and runs the /api functions, the same way a host would.
// Run:  MYFATOORAH_API_KEY=<test key> SITE_URL=http://127.0.0.1:4600 node dev.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4600);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".svg": "image/svg+xml" };
const routes = { "/api/checkout": "./api/checkout.js", "/api/status": "./api/status.js", "/api/myfatoorah-webhook": "./api/myfatoorah-webhook.js", "/api/order-cod": "./api/order-cod.js", "/api/admin": "./api/admin.js", "/api/products": "./api/products.js" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (routes[u.pathname]) { const m = await import(routes[u.pathname]); return m.default(req, res); }
  let f = u.pathname === "/" ? "/site.html" : u.pathname === "/admin" ? "/admin.html" : decodeURIComponent(u.pathname);
  if (f.includes("..") || f.startsWith("/api/")) { res.statusCode = 404; return res.end("Not found"); }
  const file = path.join(root, f);
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    // DEV_PRICES='{"sias-cattopia":4500}' gives products a test price in the browser too (testing only)
    // DEV_ADMIN_SUPABASE='{"supabaseUrl":"...","anonKey":"..."}' points the local dashboard at a test project (testing only)
    // DEV_ADMIN_MOCK_SESSION=1 signs the local dashboard in with the fake owner token (testing only, never in deploy/)
    if (f === "/admin.html" && process.env.DEV_ADMIN_MOCK_SESSION) {
      buf = Buffer.from(buf.toString("utf8").replace("<script src=\"admin.js\"></script>", '<script>window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"admin-token"}}}),signOut:async()=>({})}})};</script><script src="admin.js"></script>'));
    }
    if (f === "/admin.html" && process.env.DEV_ADMIN_SUPABASE) {
      buf = Buffer.from(buf.toString("utf8").replace('window.KAFEI_ADMIN = { supabaseUrl: "", anonKey: "" };', "window.KAFEI_ADMIN = " + process.env.DEV_ADMIN_SUPABASE + ";"));
    }
    if (f === "/site.html" && process.env.DEV_PRICES) {
      const banner = '<div role="note" style="position:relative;z-index:60;background:#B9824B;color:#29221E;font:700 14px/1.4 system-ui,sans-serif;padding:10px max(16px,env(safe-area-inset-left,0px));text-align:center">Test mode: these prices are made up and payments use the MyFatoorah test server. No real money moves. KNET test card 8888 8800 0000 0001, expiry 09/30, any 4-digit PIN.</div>';
      buf = Buffer.from(buf.toString("utf8").replace("<body>", "<body>" + banner));
    }
    if (f === "/app.js" && process.env.DEV_PRICES) {
      let js = buf.toString("utf8");
      for (const [id, fils] of Object.entries(JSON.parse(process.env.DEV_PRICES))) js = js.replace(new RegExp(`(\\{id:"${id}"[^\\n]*?price:)null`), `$1${Number(fils)}`);
      buf = Buffer.from(js);
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream"); res.end(buf);
  });
}).listen(port, () => console.log(`Kafei dev server on http://127.0.0.1:${port}`));
