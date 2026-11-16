// Production server for hosts that run a Node.js app (Hostinger Business / Cloud, a VPS, Render, Railway...).
// Serves the shop and runs the /api functions. Start with:  npm start   (the host sets PORT)
// Secrets (MYFATOORAH_API_KEY, MYFATOORAH_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, ...) come from the host's environment variables panel.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appPage } from "./api/pages.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webp": "image/webp",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".woff2": "font/woff2", ".css": "text/css; charset=utf-8" };
const routes = { "/api/checkout": "checkout.js", "/api/status": "status.js", "/api/myfatoorah-webhook": "myfatoorah-webhook.js",
  "/api/admin": "admin.js", "/api/products": "products.js", "/api/login": "login.js" };
const pages = { "/": "index.html", "/admin": "admin.html", "/privacy": "privacy.html" };
const security = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "SAMEORIGIN" };

http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(security)) res.setHeader(k, v);
  let u; try { u = new URL(req.url, "http://localhost"); } catch { res.statusCode = 400; return res.end("Bad request"); }

  // the payment, order, product and dashboard functions
  if (routes[u.pathname]) {
    res.setHeader("Cache-Control", "no-store");
    try { const m = await import(path.join(root, "api", routes[u.pathname])); return await m.default(req, res); }
    catch (e) { console.error(u.pathname, e); if (!res.headersSent) { res.statusCode = 500; res.setHeader("Content-Type", "application/json"); } return res.end('{"error":"server"}'); }
  }
  if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; return res.end("Method not allowed"); }
  // the shop's own addresses (/shop, /p/xbloom-studio, ...) and the sitemap
  const page = await appPage(u.pathname).catch(e => { console.error("page", u.pathname, e.message); return null; });
  if (page) { res.statusCode = page.status; res.setHeader("Content-Type", page.type); res.setHeader("Cache-Control", "no-cache"); return res.end(req.method === "HEAD" ? undefined : page.body); }

  // files: only inside this folder, never hidden files or the server's own code
  let rel; try { rel = pages[u.pathname] || decodeURIComponent(u.pathname).replace(/^\/+/, ""); } catch { res.statusCode = 400; return res.end("Bad request"); }
  const file = path.resolve(root, rel);
  const blocked = !file.startsWith(root + path.sep) || /(^|[\\/])\./.test(rel) || /^(api|node_modules)[\\/]/.test(rel) || /^(server\.mjs|package(-lock)?\.json)$/.test(rel);
  const notFound = () => { res.statusCode = 404; res.setHeader("Cache-Control", "no-cache");
    fs.readFile(path.join(root, "404.html"), (e, html) => { if (e) { res.setHeader("Content-Type", "text/plain"); return res.end("Not found"); }
      res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(req.method === "HEAD" ? undefined : html); }); };
  if (blocked) return notFound();
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound();
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", /\.html$/.test(rel) ? "no-cache" : /^(img|fonts)[\\/]/.test(rel) || u.searchParams.has("v") ? "public, max-age=604800" : "public, max-age=300");
    res.setHeader("Content-Length", st.size);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, () => console.log(`Kafei shop running on port ${port}`));
