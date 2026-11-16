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
/* every category gets a card: stocked ones show their first product, the rest show their name in big type on their Sadu colour, marked coming soon */
function catRail(){
  const order=[...CATS.filter(c=>inCat(c).length),...CATS.filter(c=>!inCat(c).length)];
  const cards=order.map(c=>{ const list=inCat(c), n=list.length, p=list[0], bd=BANDS[c.band]||BANDS.cream;
    return `<li class="tile${n?"":" is-soon"}"><a href="#shop-${c.id}" style="--tb:${bd[0]};--tf:${bd[1]}">
      <span class="tile-img" aria-hidden="true">${p?`<img src="${p.img}" alt="" ${p.fit==="contain"?'class="contain"':""} loading="lazy" decoding="async" width="400" height="400">`:`<span class="tile-word">${esc(L(c.name))}</span><span class="tile-flag">${t("soon_short")}</span>`}</span>
      <span class="tile-txt"><b>${esc(L(c.name))}</b><span>${n?t("n_products",n):t("soon_ask_short")}</span></span></a></li>`; }).join("");
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
    <h3>${t("m_shop")}</h3><ul class="menu-list">${link("shop",t("all_products"),` <span class="n num">${P.length}</span>`)}${CATS.map(c=>{const n=inCat(c).length;return link("shop-"+c.id,esc(L(c.name)),n?` <span class="n num">${n}</span>`:` <span class="n soon">${t("soon_short")}</span>`);}).join("")}</ul>
    ${bs.length?`<h3>${t("m_brands")}</h3><ul class="menu-list">${bs.map(b=>link("brand-"+b.id,`<bdi>${esc(b.name)}</bdi>`,` <span class="n num">${b.items.length}</span>`)).join("")}</ul>`:""}
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
