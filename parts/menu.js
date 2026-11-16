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
/* category icons from two open-source sets with the same 1.5 line weight (both MIT, via Iconify):
   IconOven for espresso machine, coffee maker, beans, cup and thermos; UIX Icons for tamper and grinder;
   the pour-over kettle is Material Design Icons' (Apache-2.0) redrawn as an outline to match.
   Each viewBox is fitted to the icon's own shape so all eight look the same size; the line weight is set in CSS. */
const CAT_ICON={"espresso-machines":["-0.81 -0.81 25.62 25.62","<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"17.5\" height=\"6.5\" x=\"3.25\" y=\"2.75\" rx=\"2\"/><path d=\"M7 6h.01\"/><path d=\"M12.5 6h4.25m-8.5 3.25v2.5h7.5v-2.5m-11.5 0v12m15.5-12v12m-17 0h18.5M9 15h6v4.25a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z\"/></g>"],"pourover-machines":["-0.81 -0.81 25.62 25.62","<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.75 2.75h14.5a2 2 0 0 1 2 2v3.5h-12v10.5h12v2.5H4.75a2 2 0 0 1-2-2V4.75a2 2 0 0 1 2-2\"/><path d=\"M12.75 11h4.75q1 0 .86.99l-.47 3.27q-.14.99-1.14.99H13.5q-1 0-1.14-.99l-.47-3.27q-.14-.99.86-.99\"/></g>"],"beans":["3.08 2.96 17.83 17.83","<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.65 11.97a5 3.25-48 1 1 6.7-7.44a5 3.25-48 1 1-6.7 7.44m8 7.25a5 3.25-48 1 1 6.7-7.44a5 3.25-48 1 1-6.7 7.44\"/><path d=\"M5.83 10.67Q7.6 10.04 8 8.25t2.17-2.42m3.66 12.09q1.77-.63 2.17-2.42t2.17-2.42\"/></g>"],"pourover-accessories":["1.02 1.80 21.40 21.40","<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.75 6.5v-.75a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v.75\"/><path d=\"M8.6 6.5h5.8l1.95 10.1a1 1 0 0 1-.98 1.2H7.6a1 1 0 0 1-.98-1.2Z\"/><path d=\"M14.9 9.25h1.8l3.55 5.35\"/><path d=\"M15.55 12.5h2.15\"/><path d=\"M7 15.75c-1.6 0-2.45-.95-2.7-2.6L3.2 7.1\"/><path d=\"M5 20.25h13.5\"/></g>"],"espresso-accessories":["0.51 0.26 22.97 22.97","<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 13.25C9.5 11 8 9 8 6.5a4 4 0 0 1 8 0c0 2.5-1.5 4.5-1.5 6.75\"/><path d=\"M4 15.5a8 2.5 0 1 0 16 0a8 2.5 0 1 0-16 0\"/><path d=\"M4 15.5v3a8 2.5 0 0 0 16 0v-3\"/></g>"],"cups":["0.48 1.60 23.05 23.05","<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.25 5h11.5v4.75a5.75 5.75 0 0 1-11.5 0Z\"/><path d=\"M15.75 6.75h1.75a2.5 2.5 0 0 1 0 5h-2.25M2.75 18.5h18.5c-.75 1.75-2.25 2.75-4 2.75H6.75c-1.75 0-3.25-1-4-2.75\"/></g>"],"tumblers":["2.15 1.53 20.94 20.94","<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8.75 2.75h4.5q.75 0 .87.74l.26 1.52q.12.74-.63.74h-5.5q-.75 0-.63-.74l.26-1.52q.12-.74.87-.74\"/><rect width=\"8\" height=\"12.5\" x=\"7\" y=\"8.75\" rx=\"2.5\"/><path d=\"M15 11h1.75a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H15\"/></g>"],"grinders":["0.60 0.60 22.81 22.81","<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M5.5 5.5h13l-3 5.5h-7ZM7.625 11h8.75A2.625 2.625 0 0 1 19 13.625v5.25a2.625 2.625 0 0 1-2.625 2.625h-8.75A2.625 2.625 0 0 1 5 18.875v-5.25A2.625 2.625 0 0 1 7.625 11M12 5.5v-3h5M9.5 16.25h5\"/>"]};
const catIcon=c=>{ const i=CAT_ICON[c.id]; return i?`<svg class="cat-ico" viewBox="${i[0]}" aria-hidden="true">${i[1]}</svg>`:""; };
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
