/* ===== brands, slide-out menu and home carousels ===== */
Object.assign(T.en,{menu_h:"Menu",menu_close:"Close the menu",m_shop:"Shop",m_brands:"Brands",m_more:"More",m_wa:"Message us on WhatsApp",
  brands_h:"Shop by brand",brand_lead:n=>`Everything we stock from ${n}.`,soon_h2:"Coming soon",soon_ask_short:"Arriving soon. Ask us on WhatsApp",soon_ask:"Ask us what's arriving",rail_prev:"Previous",rail_next:"Next",soon_short:"Coming soon"});
Object.assign(T.ar,{menu_h:"القائمة",menu_close:"أغلق القائمة",m_shop:"المتجر",m_brands:"الماركات",m_more:"المزيد",m_wa:"راسلنا على واتساب",
  brands_h:"تسوّق حسب الماركة",brand_lead:n=>`كل ما نوفّره من ${n}.`,soon_h2:"قريبًا",soon_ask_short:"يصل قريبًا. اسألنا على واتساب",soon_ask:"اسألنا عمّا سيصل",rail_prev:"السابق",rail_next:"التالي",soon_short:"قريبًا"});

const brandSlug=b=>String(b||"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
/* brands come from the products themselves (the "Brand" box in the dashboard), most products first */
function brands(){
  const m=new Map();
  for(const p of P){ const b=(p.brand||"").trim(), s=brandSlug(b); if(!s) continue; if(!m.has(s)) m.set(s,{id:s,name:b,items:[]}); m.get(s).items.push(p); }
  return [...m.values()].sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name));
}
const brandById=id=>brands().find(b=>b.id===id)||null;

function viewBrand(b){
  return `<div class="wrap page-head">${crumbs([["home",t("home")],["shop",t("shop_h")],["",b.name]])}<h1 data-rise>${esc(b.name)}</h1><p class="lead">${esc(t("brand_lead",b.name))}</p></div>
  <div class="wrap"><ul class="plist">${b.items.map(prow).join("")}</ul></div>`;
}

/* ---- carousels ---- */
function rail(id,title,cards,n){
  return `<section class="rail-sec" aria-labelledby="${id}H"><div class="wrap rail-head"><h2 id="${id}H" data-rise>${title}</h2>
    <div class="rail-btns"><button type="button" class="rail-btn" data-rail="${id}" data-dir="-1" aria-label="${t("rail_prev")}" aria-controls="${id}">${ARROW}</button><button type="button" class="rail-btn" data-rail="${id}" data-dir="1" aria-label="${t("rail_next")}" aria-controls="${id}">${ARROW}</button></div></div>
    <ul class="rail" id="${id}" tabindex="0" aria-label="${title}">${cards}</ul></section>`;
}
const ARROW=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
/* one flat drawing per category, of the gear itself: lit and shaded faces in the palette's own colours,
   drawn for the colour of its card (BANDS in js1.js) */
const CAT_ART={
 "espresso-machines":"<ellipse cx=\"100\" cy=\"181\" rx=\"80\" ry=\"6\" fill=\"#9C6A39\"/><rect x=\"40\" y=\"30\" width=\"100\" height=\"4\" rx=\"2\" fill=\"#F1E7D9\"/><rect x=\"46\" y=\"30\" width=\"4\" height=\"12\" fill=\"#F1E7D9\"/><rect x=\"130\" y=\"30\" width=\"4\" height=\"12\" fill=\"#F1E7D9\"/><rect x=\"52\" y=\"38\" width=\"26\" height=\"6\" rx=\"1\" fill=\"#F1E7D9\"/><rect x=\"56\" y=\"34\" width=\"18\" height=\"4\" rx=\"1\" fill=\"#D3C6B5\"/><path d=\"M34 46h112l14-8H48z\" fill=\"#3D2C1F\"/><path d=\"M146 46l14-8v128l-14 8z\" fill=\"#1D1209\"/><rect x=\"34\" y=\"46\" width=\"112\" height=\"128\" fill=\"#2E2016\"/><rect x=\"34\" y=\"46\" width=\"112\" height=\"30\" fill=\"#1D1209\"/><circle cx=\"56\" cy=\"61\" r=\"10\" fill=\"#F1E7D9\"/><circle cx=\"56\" cy=\"61\" r=\"7.5\" fill=\"#E4DACD\"/><path d=\"M56 61l6-6 1.2 1.2-6 6z\" fill=\"#9C6A39\"/><circle cx=\"56\" cy=\"61\" r=\"1.8\" fill=\"#1D1209\"/><circle cx=\"110\" cy=\"61\" r=\"3.6\" fill=\"#D3C6B5\"/><circle cx=\"122\" cy=\"61\" r=\"3.6\" fill=\"#D3C6B5\"/><circle cx=\"134\" cy=\"61\" r=\"3.6\" fill=\"#B9824B\"/><rect x=\"82\" y=\"76\" width=\"36\" height=\"9\" fill=\"#3D2C1F\"/><rect x=\"80\" y=\"85\" width=\"40\" height=\"10\" rx=\"4\" fill=\"#D3C6B5\"/><rect x=\"80\" y=\"85\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#F1E7D9\"/><path d=\"M118 87l34 6-1.4 7-33-4z\" fill=\"#B9824B\"/><circle cx=\"151\" cy=\"96\" r=\"4\" fill=\"#9C6A39\"/><rect x=\"92\" y=\"95\" width=\"3\" height=\"5\" fill=\"#D3C6B5\"/><rect x=\"105\" y=\"95\" width=\"3\" height=\"5\" fill=\"#D3C6B5\"/><rect x=\"93\" y=\"101\" width=\"1.4\" height=\"9\" fill=\"#B9824B\"/><rect x=\"106\" y=\"101\" width=\"1.4\" height=\"9\" fill=\"#B9824B\"/><rect x=\"86\" y=\"112\" width=\"28\" height=\"4\" rx=\"1\" fill=\"#F1E7D9\"/><path d=\"M88 116h24v10a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8z\" fill=\"#F1E7D9\"/><path d=\"M100 116h12v10a8 8 0 0 1-8 8h-4z\" fill=\"#D3C6B5\"/><path d=\"M112 119h3a5 5 0 0 1 0 10h-4v-3h4a2 2 0 0 0 0-4h-3z\" fill=\"#D3C6B5\"/><rect x=\"42\" y=\"76\" width=\"3.5\" height=\"46\" fill=\"#D3C6B5\"/><rect x=\"40\" y=\"120\" width=\"8\" height=\"5\" rx=\"1\" fill=\"#D3C6B5\"/><rect x=\"40\" y=\"138\" width=\"104\" height=\"14\" fill=\"#1D1209\"/><rect x=\"46\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"58\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"70\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"82\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"94\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"106\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"118\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"130\" y=\"143\" width=\"8\" height=\"3\" rx=\"1\" fill=\"#3D2C1F\"/><rect x=\"92\" y=\"160\" width=\"16\" height=\"4\" rx=\"1\" fill=\"#B9824B\"/><rect x=\"40\" y=\"174\" width=\"16\" height=\"6\" rx=\"1\" fill=\"#1D1209\"/><rect x=\"124\" y=\"174\" width=\"16\" height=\"6\" rx=\"1\" fill=\"#1D1209\"/>",
 "pourover-machines":"<ellipse cx=\"100\" cy=\"182\" rx=\"78\" ry=\"6\" fill=\"#120B05\"/><rect x=\"36\" y=\"172\" width=\"128\" height=\"8\" rx=\"3\" fill=\"#D3C6B5\"/><rect x=\"48\" y=\"14\" width=\"36\" height=\"8\" rx=\"3\" fill=\"#2E2016\"/><rect x=\"48\" y=\"22\" width=\"36\" height=\"30\" rx=\"2\" fill=\"#4E3825\"/><ellipse cx=\"56\" cy=\"44\" rx=\"3.2\" ry=\"2.2\" fill=\"#B9824B\"/><ellipse cx=\"65\" cy=\"39\" rx=\"3.2\" ry=\"2.2\" fill=\"#B9824B\"/><ellipse cx=\"74\" cy=\"44\" rx=\"3.2\" ry=\"2.2\" fill=\"#B9824B\"/><ellipse cx=\"83\" cy=\"39\" rx=\"3.2\" ry=\"2.2\" fill=\"#B9824B\"/><ellipse cx=\"60\" cy=\"36\" rx=\"3\" ry=\"2\" fill=\"#9C6A39\"/><ellipse cx=\"69\" cy=\"40\" rx=\"3\" ry=\"2\" fill=\"#9C6A39\"/><ellipse cx=\"78\" cy=\"36\" rx=\"3\" ry=\"2\" fill=\"#9C6A39\"/><path d=\"M88 52l10-6v122l-10 6z\" fill=\"#D3C6B5\"/><rect x=\"40\" y=\"52\" width=\"48\" height=\"122\" rx=\"4\" fill=\"#F1E7D9\"/><rect x=\"40\" y=\"52\" width=\"48\" height=\"6\" rx=\"2\" fill=\"#FBF6EE\"/><rect x=\"50\" y=\"68\" width=\"28\" height=\"15\" rx=\"2\" fill=\"#1D1209\"/><rect x=\"54\" y=\"73\" width=\"4\" height=\"5\" fill=\"#B9824B\"/><rect x=\"60\" y=\"73\" width=\"4\" height=\"5\" fill=\"#B9824B\"/><rect x=\"68\" y=\"73\" width=\"6\" height=\"5\" fill=\"#9C6A39\"/><circle cx=\"64\" cy=\"104\" r=\"8\" fill=\"#1D1209\"/><circle cx=\"64\" cy=\"104\" r=\"4.5\" fill=\"#B9824B\"/><rect x=\"56\" y=\"150\" width=\"16\" height=\"3\" rx=\"1\" fill=\"#B9824B\"/><rect x=\"88\" y=\"38\" width=\"66\" height=\"16\" rx=\"5\" fill=\"#F1E7D9\"/><rect x=\"88\" y=\"50\" width=\"66\" height=\"4\" fill=\"#D3C6B5\"/><rect x=\"124\" y=\"54\" width=\"18\" height=\"4\" fill=\"#1D1209\"/><rect x=\"132.4\" y=\"58\" width=\"1.6\" height=\"8\" fill=\"#D3C6B5\"/><rect x=\"108\" y=\"66\" width=\"52\" height=\"5\" rx=\"2\" fill=\"#1D1209\"/><path d=\"M112 71h44l-12 26h-20z\" fill=\"#F1E7D9\"/><path d=\"M134 71h22l-12 26h-10z\" fill=\"#D3C6B5\"/><path d=\"M124 75l5 16h-2l-5-16zM140 75l-5 16h2l5-16z\" fill=\"#D3C6B5\"/><rect x=\"133\" y=\"97\" width=\"2\" height=\"8\" fill=\"#B9824B\"/><rect x=\"118\" y=\"104\" width=\"32\" height=\"5\" rx=\"2\" fill=\"#1D1209\"/><path d=\"M118 109h32l3 6v42a10 10 0 0 1-10 10h-18a10 10 0 0 1-10-10v-42z\" fill=\"#4E3825\"/><path d=\"M115.5 134h37v23a10 10 0 0 1-10 10h-17a10 10 0 0 1-10-10z\" fill=\"#8A5A2E\"/><rect x=\"119\" y=\"114\" width=\"3\" height=\"40\" rx=\"1\" fill=\"#644A31\"/><path d=\"M153 118h5a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-5v-5h4a2 2 0 0 0 2-2v-16a2 2 0 0 0-2-2h-4z\" fill=\"#2E2016\"/>",
 "beans":"<ellipse cx=\"98\" cy=\"176\" rx=\"60\" ry=\"6\" fill=\"#D3C6B5\"/><ellipse cx=\"150\" cy=\"178\" rx=\"16\" ry=\"3\" fill=\"#D3C6B5\"/><g transform=\"translate(72 108) rotate(-28) scale(1.12)\"><ellipse cx=\"0\" cy=\"0\" rx=\"30\" ry=\"42\" fill=\"#644A31\"/><path d=\"M0-42a30 42 0 0 1 0 84c10-22-10-62 0-84z\" fill=\"#4E3825\"/><path d=\"M0-40c11 20-11 60 0 80c-7-20 13-60 0-80z\" fill=\"#1D1209\"/></g><g transform=\"translate(128 124) rotate(22) scale(0.98)\"><ellipse cx=\"0\" cy=\"0\" rx=\"30\" ry=\"42\" fill=\"#B9824B\"/><path d=\"M0-42a30 42 0 0 1 0 84c10-22-10-62 0-84z\" fill=\"#9C6A39\"/><path d=\"M0-40c11 20-11 60 0 80c-7-20 13-60 0-80z\" fill=\"#4E3825\"/></g><g transform=\"translate(150 170) rotate(70) scale(0.3)\"><ellipse cx=\"0\" cy=\"0\" rx=\"30\" ry=\"42\" fill=\"#644A31\"/><path d=\"M0-42a30 42 0 0 1 0 84c10-22-10-62 0-84z\" fill=\"#4E3825\"/><path d=\"M0-40c11 20-11 60 0 80c-7-20 13-60 0-80z\" fill=\"#1D1209\"/></g><g transform=\"translate(48 172) rotate(-60) scale(0.26)\"><ellipse cx=\"0\" cy=\"0\" rx=\"30\" ry=\"42\" fill=\"#B9824B\"/><path d=\"M0-42a30 42 0 0 1 0 84c10-22-10-62 0-84z\" fill=\"#9C6A39\"/><path d=\"M0-40c11 20-11 60 0 80c-7-20 13-60 0-80z\" fill=\"#4E3825\"/></g>",
 "pourover-accessories":"<ellipse cx=\"100\" cy=\"182\" rx=\"82\" ry=\"6\" fill=\"#4E3825\"/><rect x=\"26\" y=\"98\" width=\"48\" height=\"5\" rx=\"2\" fill=\"#F1E7D9\"/><path d=\"M28 103h44l-14 30H42z\" fill=\"#F1E7D9\"/><path d=\"M50 103h22l-14 30h-8z\" fill=\"#D3C6B5\"/><path d=\"M38 107l7 20h-2.4l-7-20zM62 107l-7 20h2.4l7-20z\" fill=\"#D3C6B5\"/><path d=\"M72 104h4a6 6 0 0 1 0 12h-6l2-4h4a2 2 0 0 0 0-4h-4z\" fill=\"#D3C6B5\"/><rect x=\"40\" y=\"133\" width=\"20\" height=\"4\" rx=\"1\" fill=\"#D3C6B5\"/><path d=\"M32 140h36l3 7v22a10 10 0 0 1-10 10H39a10 10 0 0 1-10-10v-22z\" fill=\"#4E3825\"/><path d=\"M29.5 158h41v11a10 10 0 0 1-10 10H39a10 10 0 0 1-10-10z\" fill=\"#1D1209\"/><rect x=\"34\" y=\"146\" width=\"3\" height=\"26\" rx=\"1\" fill=\"#644A31\"/><rect x=\"30\" y=\"138\" width=\"40\" height=\"4\" rx=\"1\" fill=\"#D3C6B5\"/><path d=\"M120 92h38l8 74a10 10 0 0 1-10 11h-44a10 10 0 0 1-10-11z\" fill=\"#2E2016\"/><path d=\"M142 92h16l8 74a10 10 0 0 1-10 11h-12z\" fill=\"#1D1209\"/><path d=\"M122 92c0-10 8-16 17-16s17 6 17 16z\" fill=\"#1D1209\"/><rect x=\"135\" y=\"66\" width=\"8\" height=\"10\" rx=\"3\" fill=\"#B9824B\"/><path d=\"M164 102c14 2 16 46 2 50l-2-7c8-3 7-33-1-36z\" fill=\"#1D1209\"/><path d=\"M114 158c-14-2-20-28-28-48l-6-6 3-3 7 5c9 20 14 42 25 45z\" fill=\"#2E2016\"/><rect x=\"79.4\" y=\"104\" width=\"1.6\" height=\"24\" fill=\"#8C7A68\"/><rect x=\"126\" y=\"140\" width=\"22\" height=\"3\" rx=\"1\" fill=\"#B9824B\"/>",
 "espresso-accessories":"<ellipse cx=\"100\" cy=\"181\" rx=\"84\" ry=\"5\" fill=\"#9C6A39\"/><rect x=\"18\" y=\"164\" width=\"164\" height=\"14\" rx=\"4\" fill=\"#1D1209\"/><rect x=\"18\" y=\"164\" width=\"164\" height=\"4\" rx=\"2\" fill=\"#2E2016\"/><g transform=\"translate(0 27)\"><path d=\"M40 70a14 14 0 0 1 28 0v6c0 12-4 20-4 34H44c0-14-4-22-4-34z\" fill=\"#644A31\"/><path d=\"M54 56a14 14 0 0 1 14 14v6c0 12-4 20-4 34h-10z\" fill=\"#4E3825\"/><rect x=\"42\" y=\"110\" width=\"24\" height=\"9\" fill=\"#D3C6B5\"/><rect x=\"42\" y=\"110\" width=\"12\" height=\"9\" fill=\"#F1E7D9\"/><rect x=\"30\" y=\"119\" width=\"48\" height=\"18\" rx=\"3\" fill=\"#F1E7D9\"/><rect x=\"54\" y=\"119\" width=\"24\" height=\"18\" rx=\"3\" fill=\"#D3C6B5\"/><rect x=\"30\" y=\"134\" width=\"48\" height=\"3\" fill=\"#D3C6B5\"/></g><g transform=\"translate(0 13)\"><rect x=\"96\" y=\"112\" width=\"64\" height=\"7\" rx=\"3\" fill=\"#F1E7D9\"/><path d=\"M100 119h56v12a14 14 0 0 1-14 14h-28a14 14 0 0 1-14-14z\" fill=\"#F1E7D9\"/><path d=\"M128 119h28v12a14 14 0 0 1-14 14h-14z\" fill=\"#D3C6B5\"/><rect x=\"100\" y=\"112\" width=\"56\" height=\"4\" rx=\"2\" fill=\"#4E3825\"/><rect x=\"121\" y=\"145\" width=\"4\" height=\"6\" fill=\"#D3C6B5\"/><rect x=\"131\" y=\"145\" width=\"4\" height=\"6\" fill=\"#D3C6B5\"/><rect x=\"92\" y=\"114\" width=\"6\" height=\"3\" rx=\"1\" fill=\"#D3C6B5\"/><rect x=\"158\" y=\"114\" width=\"6\" height=\"3\" rx=\"1\" fill=\"#D3C6B5\"/></g><path d=\"M150 142l30 18a5 5 0 0 1-4 8l-32-18z\" fill=\"#2E2016\"/><path d=\"M150 142l6 4-8 9-4-2z\" fill=\"#1D1209\"/>",
 "cups":"<ellipse cx=\"100\" cy=\"182\" rx=\"74\" ry=\"5\" fill=\"#120B05\"/><path d=\"M74 34c-8 10 8 14 0 26M98 28c-8 10 8 14 0 26M122 34c-8 10 8 14 0 26\" fill=\"none\"/><path d=\"M70 32c-6 8 6 12 0 22l3 1c6-10-6-14 0-22zM96 24c-6 8 6 12 0 22l3 1c6-10-6-14 0-22zM122 32c-6 8 6 12 0 22l3 1c6-10-6-14 0-22z\" fill=\"#644A31\"/><path d=\"M24 160h152c-6 12-24 18-52 18H76c-28 0-46-6-52-18z\" fill=\"#D3C6B5\"/><path d=\"M24 160h152l-2 4H26z\" fill=\"#F1E7D9\"/><ellipse cx=\"100\" cy=\"162\" rx=\"40\" ry=\"4\" fill=\"#D3C6B5\"/><path d=\"M52 82h96v28a48 48 0 0 1-96 0z\" fill=\"#F1E7D9\"/><path d=\"M100 82h48v28a48 48 0 0 1-48 48z\" fill=\"#D3C6B5\"/><ellipse cx=\"100\" cy=\"82\" rx=\"48\" ry=\"8\" fill=\"#FBF6EE\"/><ellipse cx=\"100\" cy=\"83\" rx=\"43\" ry=\"6\" fill=\"#644A31\"/><ellipse cx=\"100\" cy=\"83\" rx=\"30\" ry=\"4\" fill=\"#B9824B\"/><ellipse cx=\"96\" cy=\"82\" rx=\"10\" ry=\"1.6\" fill=\"#D9A66E\"/><path d=\"M148 92h10a16 16 0 0 1 0 32h-14l3-8h11a8 8 0 0 0 0-16h-10z\" fill=\"#D3C6B5\"/><path d=\"M150 150l30-26 3 3-30 27z\" fill=\"#B9824B\"/>",
 "tumblers":"<ellipse cx=\"100\" cy=\"182\" rx=\"40\" ry=\"5\" fill=\"#4E3825\"/><rect x=\"62\" y=\"22\" width=\"76\" height=\"12\" rx=\"5\" fill=\"#2E2016\"/><rect x=\"64\" y=\"18\" width=\"72\" height=\"8\" rx=\"4\" fill=\"#1D1209\"/><rect x=\"86\" y=\"21\" width=\"28\" height=\"3\" rx=\"1.5\" fill=\"#D3C6B5\"/><path d=\"M64 34h72l-8 138a8 8 0 0 1-8 8H80a8 8 0 0 1-8-8z\" fill=\"#B9824B\"/><path d=\"M100 34h36l-8 138a8 8 0 0 1-8 8h-20z\" fill=\"#9C6A39\"/><path d=\"M66.6 76h66.8l-1.7 30H68.3z\" fill=\"#F1E7D9\"/><path d=\"M100 76h33.4l-1.7 30H100z\" fill=\"#D3C6B5\"/><rect x=\"92\" y=\"86\" width=\"16\" height=\"10\" rx=\"2\" fill=\"#B9824B\"/><rect x=\"96\" y=\"89\" width=\"8\" height=\"4\" rx=\"1\" fill=\"#644A31\"/><rect x=\"72\" y=\"40\" width=\"4\" height=\"120\" rx=\"2\" fill=\"#CD9A63\"/>",
 "grinders":"<ellipse cx=\"100\" cy=\"182\" rx=\"46\" ry=\"5\" fill=\"#D3C6B5\"/><rect x=\"96\" y=\"10\" width=\"8\" height=\"14\" fill=\"#1D1209\"/><path d=\"M100 14h52v8h-52z\" fill=\"#1D1209\"/><circle cx=\"100\" cy=\"18\" r=\"5\" fill=\"#2E2016\"/><rect x=\"146\" y=\"4\" width=\"12\" height=\"24\" rx=\"6\" fill=\"#B9824B\"/><rect x=\"146\" y=\"4\" width=\"6\" height=\"24\" rx=\"3\" fill=\"#CD9A63\"/><rect x=\"70\" y=\"24\" width=\"60\" height=\"14\" rx=\"4\" fill=\"#2E2016\"/><rect x=\"70\" y=\"24\" width=\"30\" height=\"14\" rx=\"4\" fill=\"#3D2C1F\"/><rect x=\"70\" y=\"34\" width=\"60\" height=\"4\" fill=\"#1D1209\"/><rect x=\"70\" y=\"38\" width=\"60\" height=\"66\" fill=\"#2E2016\"/><rect x=\"100\" y=\"38\" width=\"30\" height=\"66\" fill=\"#1D1209\"/><rect x=\"70\" y=\"52\" width=\"60\" height=\"36\" fill=\"#644A31\"/><rect x=\"100\" y=\"52\" width=\"30\" height=\"36\" fill=\"#4E3825\"/><rect x=\"76\" y=\"56\" width=\"3\" height=\"28\" rx=\"1.5\" fill=\"#4E3825\"/><rect x=\"84\" y=\"56\" width=\"3\" height=\"28\" rx=\"1.5\" fill=\"#4E3825\"/><rect x=\"92\" y=\"56\" width=\"3\" height=\"28\" rx=\"1.5\" fill=\"#4E3825\"/><rect x=\"100\" y=\"56\" width=\"3\" height=\"28\" rx=\"1.5\" fill=\"#3D2C1F\"/><rect x=\"108\" y=\"56\" width=\"3\" height=\"28\" rx=\"1.5\" fill=\"#3D2C1F\"/><rect x=\"116\" y=\"56\" width=\"3\" height=\"28\" rx=\"1.5\" fill=\"#3D2C1F\"/><rect x=\"124\" y=\"56\" width=\"3\" height=\"28\" rx=\"1.5\" fill=\"#3D2C1F\"/><rect x=\"70\" y=\"104\" width=\"60\" height=\"6\" fill=\"#3D2C1F\"/><path d=\"M72 110h56v52a10 10 0 0 1-10 10H82a10 10 0 0 1-10-10z\" fill=\"#644A31\"/><path d=\"M100 110h28v52a10 10 0 0 1-10 10h-18z\" fill=\"#4E3825\"/><rect x=\"72\" y=\"124\" width=\"56\" height=\"3\" fill=\"#2E2016\"/><rect x=\"94\" y=\"146\" width=\"12\" height=\"3\" rx=\"1\" fill=\"#B9824B\"/>"
};
const catIcon=c=>`<svg class="cat-ico" viewBox="0 0 200 200" aria-hidden="true">${CAT_ART[c.id]||""}</svg>`;
/* every category gets a card: its mark on its Sadu colour and its name once; the ones not in stock yet carry a small "coming soon" tag */
function catRail(){
  const order=[...CATS.filter(c=>inCat(c).length),...CATS.filter(c=>!inCat(c).length)];
  const cards=order.map(c=>{ const n=inCat(c).length, bd=BANDS[c.band]||BANDS.cream;
    return `<li class="tile cat"><a href="#shop-${c.id}" style="--tb:${bd[0]};--tf:${bd[1]}">
      <span class="tile-img">${catIcon(c)}${n?"":`<span class="tile-flag">${t("soon_short")}</span>`}</span>
      <span class="tile-txt"><b>${esc(L(c.short||c.name))}</b></span></a></li>`; }).join("");
  return rail("catRail",t("cats_h"),cards);
}
function brandRail(){
  const bs=brands(); if(!bs.length) return "";
  const cards=bs.map(b=>{ const p=b.items[0];
    return `<li class="tile brand"><a href="#brand-${b.id}">
      <span class="tile-img" aria-hidden="true">${p?`<img src="${p.img}" alt="" ${p.fit==="contain"?'class="contain"':""} loading="lazy" decoding="async" width="400" height="400">`:""}</span>
      <span class="tile-txt"><b dir="auto">${esc(b.name)}</b><span>${t("n_products",b.items.length)}</span></span></a></li>`; }).join("");
  return rail("brandRail",t("brands_h"),cards);
}
function railState(){
  $$(".rail").forEach(r=>{ const max=r.scrollWidth-r.clientWidth, x=Math.abs(r.scrollLeft);
    $$(`[data-rail="${r.id}"]`).forEach(b=>{ b.disabled=b.dataset.dir==="-1"?x<4:x>max-4; });
    r.closest(".rail-sec").classList.toggle("fits",max<4); });
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-rail]"); if(!b) return;
  const r=document.getElementById(b.dataset.rail); if(!r) return;
  const step=Math.max(240,r.clientWidth*.8)*(+b.dataset.dir)*(document.documentElement.dir==="rtl"?-1:1);
  r.scrollBy({left:step,behavior:reduce.matches?"auto":"smooth"});
});
document.addEventListener("scroll",e=>{ if(e.target.classList&&e.target.classList.contains("rail")) railState(); },true);
addEventListener("resize",railState);

/* ---- slide-out menu ---- */
let menuFocus=null;
function renderMenu(){
  const bs=brands(), cur=curKey();
  const link=(h,label,extra="")=>`<li><a href="#${h}" ${cur===h?'aria-current="page"':""}>${label}${extra}</a></li>`;
  $("#menu").innerHTML=`<div class="drawer-head"><h2 id="menuTitle">${t("menu_h")}</h2><button class="x-btn" id="menuClose" type="button" aria-label="${t("menu_close")}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  <nav class="menu-body" aria-labelledby="menuTitle">
    <h3>${t("m_shop")}</h3><ul class="menu-list">${link("shop",t("all_products"))}${CATS.map(c=>link("shop-"+c.id,esc(L(c.name)),inCat(c).length?"":` <span class="n soon">${t("soon_short")}</span>`)).join("")}</ul>
    ${bs.length?`<h3>${t("m_brands")}</h3><ul class="menu-list">${bs.map(b=>link("brand-"+b.id,`<bdi>${esc(b.name)}</bdi>`)).join("")}</ul>`:""}
    <h3>${t("m_more")}</h3><ul class="menu-list">${link("delivery",t("nav_delivery"))}${link("about",t("nav_about"))}${accountsOn()?link("account",sbUser?t("acct_mine"):t("acct_signin")):""}</ul>
  </nav>
  <div class="drawer-foot menu-foot"><a class="btn" href="${wa(t("wa_hello"))}" target="_blank" rel="noopener">${ICON.wa}<span>${t("m_wa")}</span></a><button class="btn ghost" type="button" id="menuLang">${t("lang")}</button></div>`;
}
function openMenu(){
  closeDrawer(); menuFocus=document.activeElement; renderMenu();
  const m=$("#menu"),s=$("#scrim"); m.hidden=false; s.hidden=false;
  requestAnimationFrame(()=>{ m.classList.add("open"); s.classList.add("show"); $("#menuClose").focus(); });
  document.documentElement.style.overflow="hidden"; $("#menuBtn").setAttribute("aria-expanded","true");
}
function closeMenu(back=true){
  const m=$("#menu"),s=$("#scrim"); if(!m||m.hidden) return;
  m.classList.remove("open"); s.classList.remove("show"); document.documentElement.style.overflow=""; $("#menuBtn").setAttribute("aria-expanded","false");
  setTimeout(()=>{ if(!m.classList.contains("open")){ m.hidden=true; if($("#drawer").hidden) s.hidden=true; } },reduce.matches?0:460);
  if(back&&menuFocus&&menuFocus.focus) menuFocus.focus();
}
document.addEventListener("click",e=>{
  if(e.target.closest("#menuBtn")){ e.stopImmediatePropagation(); $("#menu").hidden?openMenu():closeMenu(); return; }
  if(e.target.closest("#menuClose")||(e.target.id==="scrim"&&!$("#menu").hidden)){ closeMenu(); return; }
  if(e.target.closest("#menuLang")){ closeMenu(false); $("#langBtn").click(); return; }
  if(e.target.closest("#menu a")) closeMenu(false);
},true);
document.addEventListener("keydown",e=>{
  const m=$("#menu"); if(!m||m.hidden) return;
  if(e.key==="Escape"){ closeMenu(); return; }
  if(e.key==="Tab"){ const f=$$("#menu a,#menu button").filter(x=>x.offsetParent); if(!f.length) return; const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); } }
});
