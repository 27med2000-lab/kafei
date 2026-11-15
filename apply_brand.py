"""Put the Kafei brand (from ../brand) into the v3 site: header logo, favicon, phone icon, the meter and footer finjans."""
import json, os, re, shutil, urllib.parse
os.chdir(os.path.dirname(os.path.abspath(__file__)))
B = "../brand"
M = json.load(open(f"{B}/mark.json")); O = json.load(open(f"{B}/outlines.json"))
CUP, Q, PALM, TILT, PV = M["CUP"], M["QAHWA"], M["PALM"], M["TILT"], M["PIVOT"]
ROT = f"translate(0 4) rotate({TILT} {PV[0]} {PV[1]})"
WY = M["WAVE_Y"]
QCLIP = f"M0 {WY}C12 {WY-4} 22 {WY-4} 34 {WY}S56 {WY+4} 68 {WY}S92 {WY-4} 100 {WY}V100H0Z"

# header: the mark and the outlined wordmark, as two pieces so the mark can shake on hover
mark_svg = (f'<svg class="lm" viewBox="0 0 100 100" aria-hidden="true"><g transform="{ROT}"><path d="{CUP}" fill="#29221E"/>'
            f'<clipPath id="hq"><path d="{QCLIP}"/></clipPath><path d="{Q}" fill="#B9824B" clip-path="url(#hq)"/></g>'
            f'<path d="{PALM}" fill="#29221E"/></svg>')
L, A = O["lat"], O["ar"]; ww = L["width"] + 22 + A["width"]*0.8
words_svg = (f'<svg class="lw" viewBox="0 -78 {ww:.0f} 112" aria-hidden="true"><path d="{L["d"]}" fill="#29221E"/>'
             f'<g transform="translate({L["width"]+22:.1f} 0) scale(.8)"><path d="{A["d"]}" fill="#76513B"/></g></svg>')
header = f'<a class="logo" href="#home" aria-label="Kafei كفي, home">{mark_svg}{words_svg}</a>'

a = open("parts/a.html").read()
a = a.replace('<a class="logo" href="#home" aria-label="Kafei">Kafei<span lang="ar">كفي</span></a>', header)
a = re.sub(r'<link rel="icon" href="data:image/svg\+xml,[^"]*">', "", a)
fav = open(f"{B}/logo/kafei-avatar-espresso.svg").read().strip()
fav = re.sub(r'\swidth="[\d.]+" height="[\d.]+"', "", fav, count=1)
a = a.replace('<meta name="theme-color" content="#F5F1E8">',
    '<meta name="theme-color" content="#F5F1E8">\n<link rel="icon" href="data:image/svg+xml,' + urllib.parse.quote(fav, safe=" =:/'#,") + '">\n'
    '<link rel="apple-touch-icon" href="img/apple-touch-icon-180.png">', 1)
a = a.replace('<meta property="og:image" content="img/hero-pourover.jpg">', '<meta property="og:image" content="img/og-kafei.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">')
css = (".logo{display:flex;align-items:center;gap:8px;text-decoration:none;min-height:44px}\n"
       ".logo .lm{width:34px;height:34px;flex:none;transform-origin:50% 78%}\n"
       ".logo .lw{height:24px;width:auto;flex:none}\n"
       "@media (max-width:380px){.logo .lw{height:20px}.logo .lm{width:28px;height:28px}}\n")
a = re.sub(r"\.logo\{display:flex;align-items:baseline;gap:10px;text-decoration:none;font:800 1\.55rem/1 var\(--lat\);letter-spacing:-\.04em\}\n\.logo span\{font:700 1\.4rem/1 var\(--txt\);color:var\(--roast\);letter-spacing:0\}\n", css, a)
a = a.replace(".logo:hover span{animation:shake 700ms ease-in-out;color:var(--crema)}", ".logo:hover .lm{animation:shake 700ms ease-in-out}")
a = a.replace(".logo span{display:inline-block;transform-origin:50% 80%}\n", "")
a = a.replace("@media (max-width:380px){.lang .full{display:none}.lang .short{display:inline}.lang{padding:0 10px}.logo{font-size:1.35rem}}",
              "@media (max-width:380px){.lang .full{display:none}.lang .short{display:inline}.lang{padding:0 10px}}")
a = a.replace(".meter-cup{width:34px;height:30px;flex:none}", ".meter-cup{width:40px;height:40px;flex:none;color:var(--ink)}")
a = a.replace(".ftr .finjan{width:64px;height:56px;color:var(--crema);transform-origin:50% 90%}", ".ftr .finjan{width:clamp(84px,9vw,128px);height:auto;color:var(--ground);transform-origin:50% 78%}")
assert ".logo .lm" in a and "apple-touch-icon" in a and "og-kafei.png" in a, "a.html patch failed"
open("parts/a.html", "w").write(a)

# the finjan icon used by the pour meter and the footer is now the brand mark: qahwa level inside the tilted cup
v = open("parts/views.js").read()
new_fj = ('const FINJAN=(cls="")=>`<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="fj-${cls||"x"}"><path d="' + CUP + '"/></clipPath></defs>'
          '<g transform="' + ROT + '"><g clip-path="url(#fj-${cls||"x"})"><rect class="fj-level" x="0" y="${cls==="finjan"?40:76}" width="100" height="100" fill="#B9824B"/></g>'
          '<path d="' + CUP + '" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/></g><path d="' + PALM + '" fill="currentColor"/></svg>`;')
v = re.sub(r"const FINJAN=\(cls=\"\"\)=>`.*?</svg>`;", lambda m: new_fj, v, count=1, flags=re.S)
v = v.replace('if(level) level.setAttribute("y",String(56-46*((q+1)/n)));', 'if(level) level.setAttribute("y",String(76-50*((q+1)/n)));')
assert 'stroke-width="6"' in v and "76-50*" in v, "views.js patch failed"
open("parts/views.js", "w").write(v)
shutil.copy(f"{B}/png/apple-touch-icon-180.png", "img/apple-touch-icon-180.png")
print("brand applied")
