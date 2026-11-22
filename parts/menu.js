/* ===== brands, slide-out menu and home carousels ===== */
Object.assign(T.en,{menu_h:"Menu",menu_close:"Close the menu",m_shop:"Shop",m_cats:"Categories",view_h:"Show products as",view_grid:"Grid",view_rows:"Rows",m_brands:"Brands",m_more:"More",m_wa:"Message us on WhatsApp",
  brands_h:"Shop by brand",brand_lead:n=>`Everything we stock from ${n}.`,soon_h2:"Coming soon",soon_ask_short:"Arriving soon. Ask us on WhatsApp",soon_ask:"Ask us what's arriving",rail_prev:"Previous",rail_next:"Next",soon_short:"Coming soon"});
Object.assign(T.ar,{menu_h:"القائمة",menu_close:"أغلق القائمة",m_shop:"المتجر",m_cats:"الأقسام",view_h:"طريقة العرض",view_grid:"شبكة",view_rows:"صفوف",m_brands:"الماركات",m_more:"المزيد",m_wa:"راسلنا على واتساب",
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
  <div class="wrap">${plist(b.items)}</div>`;
}

/* ---- carousels ---- */
function rail(id,title,cards,n){
  return `<section class="rail-sec" aria-labelledby="${id}H"><div class="wrap rail-head"><h2 id="${id}H" data-rise>${title}</h2>
    <div class="rail-btns"><button type="button" class="rail-btn" data-rail="${id}" data-dir="-1" aria-label="${t("rail_prev")}" aria-controls="${id}">${ARROW}</button><button type="button" class="rail-btn" data-rail="${id}" data-dir="1" aria-label="${t("rail_next")}" aria-controls="${id}">${ARROW}</button></div></div>
    <ul class="rail" id="${id}" tabindex="0" aria-label="${title}">${cards}</ul></section>`;
}
const ARROW=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
/* category icons: one geometric set drawn for Kafei on a 24-unit grid, round caps and joins,
   and clear space between parts. The line weight is set in CSS (finer on the cards, firmer in the menu). */
const CAT_ICON={"espresso-machines":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"5\" rx=\"2\"/><path d=\"M13 5.5h4\"/><path d=\"M5 8v13M19 8v13M3 21h18\"/><path d=\"M10 8v1.5h4V8\"/><path d=\"M9.5 14h5v1a2.5 2.5 0 0 1-5 0z\"/></g>"],"pourover-machines":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"3\" width=\"5\" height=\"18\" rx=\"1.5\"/><path d=\"M9 4h9a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H9\"/><path d=\"M15 9v1.5\"/><path d=\"M12 13h6v2.5a3 3 0 0 1-6 0z\"/><path d=\"M9 21h11\"/></g>"],"beans":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g transform=\"rotate(45 8 8)\"><ellipse cx=\"8\" cy=\"8\" rx=\"3.25\" ry=\"5\"/><path d=\"M8 4.5c-1.1 1.2 1.1 5.8 0 7\"/></g><g transform=\"rotate(45 16 16)\"><ellipse cx=\"16\" cy=\"16\" rx=\"3.25\" ry=\"5\"/><path d=\"M16 12.5c-1.1 1.2 1.1 5.8 0 7\"/></g></g>"],"pourover-accessories":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11.5 6.5V5\"/><path d=\"M10 9V7.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V9\"/><path d=\"M9 9h5l2 11H7z\"/><path d=\"M15.2 11.5h1.8a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2h-.6\"/><path d=\"M7.4 17.5C5.2 17.5 4.3 15.5 3.9 13L3 8.5\"/><path d=\"M5 22h14\"/></g>"],"espresso-accessories":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4.5a2.75 2.75 0 0 0-2.75 2.75c0 1.8 1.5 2.75 1.5 4.75h2.5c0-2 1.5-2.95 1.5-4.75A2.75 2.75 0 0 0 12 4.5z\"/><ellipse cx=\"12\" cy=\"14\" rx=\"7\" ry=\"2\"/><path d=\"M5 14v3c0 1.1 3.1 2 7 2s7-.9 7-2v-3\"/></g>"],"cups":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 2.5v2.5M13 2.5v2.5\"/><path d=\"M5 8h12v4a6 6 0 0 1-12 0z\"/><path d=\"M17 9.5h1a2.5 2.5 0 0 1 0 5h-1.4\"/><path d=\"M3 21h17\"/></g>"],"tumblers":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"8\" y=\"2\" width=\"8\" height=\"3\" rx=\"1\"/><rect x=\"7\" y=\"7\" width=\"10\" height=\"15\" rx=\"3\"/><path d=\"M7 12h10\"/></g>"],"grinders":["0 0 24 24","<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 9V5h6\"/><rect x=\"18\" y=\"2.5\" width=\"3\" height=\"5\" rx=\"1.5\"/><rect x=\"7\" y=\"9\" width=\"10\" height=\"13\" rx=\"2.5\"/><path d=\"M7 17h10\"/></g>"]};
const catIcon=c=>{ const i=CAT_ICON[c.id]; return i?`<svg class="cat-ico" viewBox="${i[0]}" aria-hidden="true">${i[1]}</svg>`:""; };
/* every category gets a card: its mark on its Sadu colour and its name once; the ones not in stock yet carry a small "coming soon" tag */
function catRail(){
  const order=[...CATS.filter(c=>inCat(c).length),...CATS.filter(c=>!inCat(c).length)];
  const cards=order.map(c=>{ const n=inCat(c).length, bd=BANDS[c.band]||BANDS.cream;
    // the light "cream" cards sit a step darker here, so the picture area stands apart from the name strip below it
    const tb=c.band==="cream"?"#CDBDA8":bd[0];
    return `<li class="tile cat"><a href="#shop-${c.id}" style="--tb:${tb};--tf:${bd[1]}">
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
  const catsOpen=curKey().startsWith("shop-");
  const bs=brands(), cur=curKey();
  const link=(h,label,extra="")=>`<li><a href="#${h}" ${cur===h?'aria-current="page"':""}>${label}${extra}</a></li>`;
  $("#menu").innerHTML=`<div class="drawer-head"><h2 id="menuTitle">${t("menu_h")}</h2><button class="x-btn" id="menuClose" type="button" aria-label="${t("menu_close")}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  <nav class="menu-body" aria-labelledby="menuTitle">
    <h3>${t("m_shop")}</h3><ul class="menu-list">${link("shop",t("all_products"))}
      <li class="menu-group${catsOpen?" open":""}"><button type="button" class="menu-drop" id="menuDrop" aria-expanded="${catsOpen}" aria-controls="menuCats">${t("m_cats")}<svg class="chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
        <div class="menu-sub" id="menuCats"><ul ${catsOpen?"":"inert"}>${CATS.map(c=>`<li><a href="#shop-${c.id}" ${cur.startsWith("shop-"+c.id)?'aria-current="page"':""}>${catIcon(c)}<span>${esc(L(c.name))}</span>${inCat(c).length?"":`<span class="n n-soon">${t("soon_short")}</span>`}</a></li>`).join("")}</ul></div></li></ul>
    ${bs.length?`<h3>${t("m_brands")}</h3><ul class="menu-list">${bs.map(b=>link("brand-"+b.id,`<bdi>${esc(b.name)}</bdi>`)).join("")}</ul>`:""}
    <h3>${t("m_more")}</h3><ul class="menu-list">${link("delivery",t("nav_delivery"))}${link("about",t("nav_about"))}${accountsOn()?link("account",sbUser?t("acct_mine"):t("acct_signin")):""}</ul>
    <ul class="menu-social">${socialLinks("soc")}</ul>
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
/* the categories fold open and shut inside the menu */
document.addEventListener("click",e=>{
  const d=e.target.closest("#menuDrop"); if(!d) return;
  const g=d.closest(".menu-group"), open=!g.classList.contains("open");
  g.classList.toggle("open",open); d.setAttribute("aria-expanded",String(open));
  const ul=g.querySelector(".menu-sub ul"); if(open) ul.removeAttribute("inert"); else ul.setAttribute("inert","");
});
document.addEventListener("keydown",e=>{
  const m=$("#menu"); if(!m||m.hidden) return;
  if(e.key==="Escape"){ closeMenu(); return; }
  if(e.key==="Tab"){ const f=$$("#menu a,#menu button").filter(x=>x.offsetParent); if(!f.length) return; const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); } }
});
