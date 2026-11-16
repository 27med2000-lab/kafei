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
/* one fine-line drawing per category, of the gear itself */
const CAT_ICON={
 "espresso-machines":"<rect x=\"14\" y=\"14\" width=\"68\" height=\"18\" rx=\"3\"/><circle cx=\"27\" cy=\"23\" r=\"4.5\"/><path d=\"M27 23l2.6-2.2\"/><circle cx=\"62\" cy=\"23\" r=\"1.6\"/><circle cx=\"70\" cy=\"23\" r=\"1.6\"/><path d=\"M18 32v44M78 32v44\"/><path d=\"M40 32v5h16v-5\"/><path d=\"M37 37h22v3a6 6 0 0 1-6 6H43a6 6 0 0 1-6-6z\"/><path d=\"M59 40l17 3\"/><path d=\"M45 46v3M51 46v3\"/><path d=\"M48 52v4\" stroke-dasharray=\"1.2 2.4\"/><path d=\"M41 59h14v8a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z\"/><path d=\"M55 61h1.5a3 3 0 0 1 0 6H55\"/><path d=\"M24 32v20a4 4 0 0 0 4 4\"/><rect x=\"14\" y=\"76\" width=\"68\" height=\"6\" rx=\"2\"/>",
 "pourover-machines":"<rect x=\"18\" y=\"12\" width=\"26\" height=\"70\" rx=\"4\"/><path d=\"M22 20h18\"/><rect x=\"24\" y=\"44\" width=\"14\" height=\"8\" rx=\"1.5\"/><path d=\"M44 16h28a4 4 0 0 1 4 4v5a3 3 0 0 1-3 3H44\"/><path d=\"M63 28v3\"/><path d=\"M51 34h24\"/><path d=\"M53 34h20l-6 12h-8z\"/><path d=\"M63 49v3\" stroke-dasharray=\"1.2 2.4\"/><path d=\"M55 55h16l2 4v13a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6V59z\"/><path d=\"M73 61h2a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-2\"/><path d=\"M53.5 67h19\"/><path d=\"M12 84h72\"/>",
 "beans":"<g transform=\"translate(36 44) rotate(-28)\"><ellipse rx=\"14\" ry=\"20\"/><path d=\"M0-19c7 9-7 20 0 38\"/></g><g transform=\"translate(63 56) rotate(24)\"><ellipse rx=\"12\" ry=\"17\"/><path d=\"M0-16c6 8-6 17 0 32\"/></g>",
 "pourover-accessories":"<path d=\"M10 30h36\"/><path d=\"M12 30h32l-11 18H23z\"/><path d=\"M22 34l4 9M34 34l-4 9\"/><path d=\"M44 33h2.5a3 3 0 0 1 0 6H42\"/><path d=\"M18 52h20l1 4v18a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5V56z\"/><path d=\"M17 66h22\"/><path d=\"M56 46h22l4 30a4 4 0 0 1-4 4H56a4 4 0 0 1-4-4z\"/><path d=\"M58 46c0-5 4-8 9-8s9 3 9 8\"/><path d=\"M67 38v-3\"/><path d=\"M80 52c7 1 8 20 1 22\"/><path d=\"M53 70c-8-2-8-24-17-30l-3-1\"/>",
 "espresso-accessories":"<path d=\"M26 46a7 7 0 0 1 14 0v3c0 7-2 11-2 17H28c0-6-2-10-2-17z\"/><path d=\"M25 66h16v6H25z\"/><rect x=\"20\" y=\"72\" width=\"26\" height=\"10\" rx=\"2\"/><path d=\"M49 38h36\"/><path d=\"M52 38h30v7a9 9 0 0 1-9 9H61a9 9 0 0 1-9-9z\"/><path d=\"M64 54v4M70 54v4\"/><path d=\"M77 51l8 25a3 3 0 0 1-5 2.4L72 54\"/><path d=\"M12 84h72\"/>",
 "cups":"<path d=\"M38 36c-3-4 3-6 0-12M48 34c-3-4 3-6 0-12M58 36c-3-4 3-6 0-12\"/><path d=\"M26 44h40v10a20 20 0 0 1-40 0z\"/><path d=\"M66 48h4a7 7 0 0 1 0 14h-6\"/><path d=\"M14 76h68\"/><path d=\"M20 76c2 4 6 6 12 6h32c6 0 10-2 12-6\"/>",
 "tumblers":"<rect x=\"28\" y=\"10\" width=\"40\" height=\"10\" rx=\"3\"/><path d=\"M42 15h12\"/><path d=\"M30 20l4 60a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4l4-60\"/><path d=\"M31.4 40h33.2M32.5 58h31\"/>",
 "grinders":"<path d=\"M48 22V12h22\"/><circle cx=\"48\" cy=\"12\" r=\"2.5\"/><rect x=\"68\" y=\"4\" width=\"7\" height=\"14\" rx=\"3.5\"/><rect x=\"34\" y=\"22\" width=\"28\" height=\"8\" rx=\"2\"/><rect x=\"34\" y=\"30\" width=\"28\" height=\"34\" rx=\"2\"/><path d=\"M42 36v22M48 36v22M54 36v22\"/><path d=\"M35 64h26v14a4 4 0 0 1-4 4H39a4 4 0 0 1-4-4z\"/><path d=\"M35 70h26\"/>"
};
const catIcon=c=>`<svg class="cat-ico" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CAT_ICON[c.id]||""}</svg>`;
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
