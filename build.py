"""Build Kafei v3: app.js (all logic), index.html (artifact page), site.html (standalone)."""
import os, re, subprocess
os.chdir('/home/user/kafei/v3')
parts = ['js1.js', 'views.js', 'menu.js', 'js2.js', 'js3.js', 'js4.js', 'js5.js']
js = ''.join(open('parts/' + p).read() for p in parts)
js = js.replace('<script>\n', '', 1)
js = re.sub(r'</script>\s*$', '', js.rstrip()) + '\n'
open('app.js', 'w').write(js)
a = open('parts/a.html').read()
pre = open('parts/prerender.html').read() if os.path.exists('parts/prerender.html') else ''
if pre:
    main, foot = pre.split('<!--FOOTER-->')
    a = a.replace('<main id="main" tabindex="-1"></main>', '<main id="main" tabindex="-1">' + main + '</main>')
    a = a.replace('<footer class="ftr" id="footer"></footer>', '<footer class="ftr" id="footer">' + foot + '</footer>')
idx = a + '<script src="app.js"></script>\n'
open('index.html', 'w').write(idx)
i = idx.index('</style>') + 8
open('site.html', 'w').write('<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + idx[:i] + '\n</head>\n<body>\n' + idx[i:] + '\n</body>\n</html>\n')
subprocess.run(['node', '-e', "new Function(require('fs').readFileSync('app.js','utf8'));console.log('app.js syntax ok')"], check=True)
print('built', len(idx), 'bytes html,', len(js), 'bytes js')

# deploy/: everything a host (Vercel or Netlify) needs, with the standalone page as index.html
import shutil
D = "deploy"
os.makedirs(D + "/img", exist_ok=True); os.makedirs(D + "/api", exist_ok=True)
shutil.copy("site.html", D + "/index.html"); shutil.copy("app.js", D + "/app.js"); shutil.copy("package.json", D + "/package.json")
for f in os.listdir("img"): shutil.copy("img/" + f, D + "/img/" + f)
os.makedirs(D + "/fonts", exist_ok=True)
for f in os.listdir("fonts"):
    if f.endswith(".woff2"): shutil.copy("fonts/" + f, D + "/fonts/" + f)
for f in ("_lib.js", "checkout.js", "status.js", "myfatoorah-webhook.js", "order-cod.js", "admin.js", "products.js", "login.js", "pages.js", "prices.json"): shutil.copy("api/" + f, D + "/api/" + f)
shutil.copy("admin.html", D + "/admin.html"); shutil.copy("privacy.html", D + "/privacy.html"); shutil.copy("404.html", D + "/404.html"); shutil.copy("admin.js", D + "/admin.js")
shutil.copy("server.mjs", D + "/server.mjs"); shutil.copy("htaccess.txt", D + "/.htaccess")  # Apache/LiteSpeed hosts  # for Node.js hosts such as Hostinger: npm start
open(D + "/vercel.json", "w").write('{\n  "headers": [{ "source": "/api/(.*)", "headers": [{ "key": "Cache-Control", "value": "no-store" }] }],\n  "functions": { "api/*.js": { "includeFiles": "api/prices.json" } }\n}\n')
print("deploy folder ready:", D)

# the shop's own address: canonical link, share links, robots.txt and sitemap for search engines
DOMAIN = "https://kafeikw.com"
idx_d = open(D + "/index.html").read()
if 'rel="canonical"' not in idx_d:
    idx_d = idx_d.replace('<meta property="og:image" content="img/og-kafei.png">',
        '<link rel="canonical" href="' + DOMAIN + '/">\n<meta property="og:url" content="' + DOMAIN + '/">\n<meta property="og:image" content="' + DOMAIN + '/img/og-kafei.png">', 1)
# structured data: tells search engines this is a Kuwaiti shop and which products it sells, at what price
import json as _json
_cat = _json.load(open("api/prices.json"))
_prods = [{"@type": "Product", "name": v["name"], "brand": {"@type": "Brand", "name": v.get("brand", v["name"].split()[0])},
  **({"image": DOMAIN + "/" + v["img"]} if v.get("img") else {}),
  **({"color": [c["name"] for c in v["colors"]]} if v.get("colors") else {}),
  "url": DOMAIN + "/#p-" + k,
  "offers": {"@type": "Offer", "price": "%.3f" % (v["price"] / 1000), "priceCurrency": "KWD", "availability": "https://schema.org/InStock", "url": DOMAIN + "/#p-" + k}}
  for k, v in _cat.items() if not k.startswith("_") and isinstance(v, dict) and v.get("price")]
_ld = {"@context": "https://schema.org", "@graph": [{"@type": "OnlineStore", "name": "Kafei كفي", "url": DOMAIN + "/", "logo": DOMAIN + "/img/apple-touch-icon-180.png",
  "telephone": "+96566908822", "areaServed": "KW", "currenciesAccepted": "KWD", "paymentAccepted": "KNET, Credit Card, Apple Pay"}] + _prods}
if "application/ld+json" not in idx_d:
    idx_d = idx_d.replace("</head>", '<script type="application/ld+json">' + _json.dumps(_ld, ensure_ascii=False).replace("</", "<\\/") + "</script>\n</head>", 1)
# cache-busting: each build gives app.js / admin.js a version tag, so visitors get updates at once instead of a stale saved copy
import hashlib as _h
_v = lambda f: _h.md5(open(f, "rb").read()).hexdigest()[:8]
idx_d = idx_d.replace('<script src="app.js"></script>', '<script src="app.js?v=' + _v(D + "/app.js") + '"></script>', 1)
_adm = open(D + "/admin.html").read().replace('<script src="admin.js"></script>', '<script src="admin.js?v=' + _v(D + "/admin.js") + '"></script>', 1)
open(D + "/admin.html", "w").write(_adm)
open(D + "/index.html", "w").write(idx_d)
open(D + "/robots.txt", "w").write("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: " + DOMAIN + "/sitemap.xml\n")
open(D + "/sitemap.xml", "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>' + DOMAIN + '/</loc></url>\n</urlset>\n')
print("domain files ready:", DOMAIN)
