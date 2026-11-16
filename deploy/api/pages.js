// The shop's own page addresses (/shop, /shop/grinders/manual, /p/xbloom-studio, /about ...).
// Every one is the same app page, sent with its own title, description and canonical link, so search engines
// and share previews see the right page before any script runs. Unknown addresses get the 404 page.
// Also builds /sitemap.xml from the products that are live.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productRows, getCatalogue } from "./_lib.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = () => (process.env.SITE_URL || "https://kafeikw.com").replace(/\/$/, "");
const BRAND = "Kafei كفي";

// keep in step with CATS in parts/js1.js
const CATS = {
  "espresso-machines": "Espresso machines", "pourover-machines": "Pour-over machines", "beans": "Coffee beans",
  "pourover-accessories": "Pour-over tools", "espresso-accessories": "Espresso tools", "cups": "Cups",
  "tumblers": "Tumblers", "grinders": "Grinders"
};
const SUBS = { beans: { filter: "Filter beans", espresso: "Espresso beans" }, grinders: { manual: "Manual grinders", electric: "Electric grinders" } };
const DELIVERY = "Same-day delivery in the Capital and Hawalli. Pay by KNET, card or Apple Pay.";

let tpl = null, tplAt = 0;
function template() {
  const f = path.join(root, "index.html"); const m = fs.statSync(f).mtimeMs;
  if (!tpl || m !== tplAt) { tpl = fs.readFileSync(f, "utf8"); tplAt = m; }
  return tpl;
}
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function products() {
  const rows = await productRows().catch(() => null);
  if (rows) return rows.filter(p => p.visible).map(p => ({ id: p.id, name: p.name_en, what: p.what_en, img: p.img, cat: p.cat, brand: p.brand }));
  const cat = await getCatalogue();
  return Object.entries(cat).filter(([k, v]) => !k.startsWith("_") && v && v.name).map(([id, v]) => ({ id, name: v.name, what: "", img: v.img, cat: v.cat }));
}

// what a path is, or null when it isn't one of the shop's pages
async function describe(pathname) {
  const p = pathname.replace(/\/+$/, "") || "/";
  const s = p.split("/").filter(Boolean);
  if (p === "/") return { home: true };
  if (s[0] === "shop" && s.length === 1) return { title: "Shop", desc: "Everything Kafei has in stock: coffee machines, grinders, beans and brewing gear. " + DELIVERY };
  if (s[0] === "shop" && s.length <= 3 && CATS[s[1]]) {
    const sub = s[2] ? (SUBS[s[1]] || {})[s[2]] : null; if (s[2] && !sub) return null;
    const name = sub || CATS[s[1]]; return { title: name, desc: `${name} from Kafei in Kuwait. ${DELIVERY}` };
  }
  if (s[0] === "p" && s.length === 2) {
    const pr = (await products()).find(x => x.id === s[1]); if (!pr) return null;
    return { title: pr.name, desc: (pr.what ? pr.what + " " : "") + DELIVERY, img: pr.img };
  }
  if (s[0] === "brand" && s.length === 2) {
    const list = (await products()).filter(x => x.brand && x.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === s[1]); if (!list.length) return null;
    return { title: list[0].brand, desc: `Everything Kafei stocks from ${list[0].brand}. ${DELIVERY}` };
  }
  const fixed = { delivery: ["Delivery", "Delivery across Kuwait: same day in the Capital and Hawalli when you order before 2 pm. Free over KWD 15."],
    about: ["About us", "Kafei is a small coffee-gear shop in Kuwait. In the Gulf you shake your finjan when you've had enough; that little shake is our name."],
    account: ["Your account", "Sign in to Kafei to see your orders and saved address.", true], checkout: ["Checkout", "", true], order: ["Order sent", "", true], paid: ["Payment", "", true] };
  if (s.length === 1 && fixed[s[0]]) { const [title, desc, noindex] = fixed[s[0]]; return { title, desc: desc || DELIVERY, noindex }; }
  return null;
}

// {status, body, type} for a shop page or the sitemap; null to let the server look for a file
export async function appPage(pathname) {
  if (pathname === "/sitemap.xml") {
    const urls = ["/", "/shop", "/delivery", "/about", "/privacy"];
    const ps = await products().catch(() => []);
    for (const c of new Set(ps.map(x => x.cat).filter(c => CATS[c]))) urls.push("/shop/" + c);
    for (const x of ps) urls.push("/p/" + x.id);
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE()}${u}</loc></url>`).join("\n")}\n</urlset>\n`;
    return { status: 200, body, type: "application/xml" };
  }
  if (pathname === "/" || pathname === "/index.html") return null;
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return null; // a file: images, scripts, fonts, privacy.html ...
  const d = await describe(pathname).catch(() => null);
  if (!d) return null;
  const url = SITE() + pathname.replace(/\/+$/, "");
  const title = `${d.title} · ${BRAND}`;
  let html = template()
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(d.desc)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(d.desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(url)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(url)}">`)
    // the pre-built home page is not this page: send this page's own heading and summary instead (the app draws the full page over it)
    .replace(/<main id="main" tabindex="-1">[\s\S]*?<\/main>/, `<main id="main" tabindex="-1" style="min-height:100vh"><div class="wrap page-head"><h1>${esc(d.title)}</h1><p class="lead">${esc(d.desc)}</p></div></main>`);
  if (d.img) html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(SITE() + "/" + String(d.img).replace(/^\//, ""))}">`);
  if (d.noindex) html = html.replace("</title>", '</title>\n<meta name="robots" content="noindex">');
  return { status: 200, body: html, type: "text/html; charset=utf-8" };
}
