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
/* category icons from established open-source sets: Google Material Symbols (rounded, weight 400, Apache-2.0)
   and Phosphor (bold, MIT) for the coffee bean, which Material lacks. One weight, coloured by the card. */
const CAT_ICON={"espresso-machines":["0 -960 960 960","<path d=\"M220-80q-23 0-41.5-18T160-140v-680q0-23 18.5-41.5T220-880h550q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5h-77v60q0 14-12.5 27T654-720H368q-14 0-26.5-13T329-760v-60H220v680h188q-38-26-58.5-63T329-293v-133q0-24.75 17.63-42.38Q364.25-486 389-486h244q24.75 0 42.38 17.62Q693-450.75 693-426v133q0 53-21 90t-59 63h157q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32Q782.75-80 770-80H220Zm290.5-86q51.5 0 87-37.04T633-293v-133H389v133q0 52.92 35 89.96Q459-166 510.5-166ZM538-571q11-11 11-28t-11-28q-11-11-28-11t-28 11q-11 11-11 28t11 28q11 11 28 11t28-11Zm-27 145Z\"/>"],"pourover-machines":["0 -960 960 960","<path d=\"M440-160q-17 0-28.5-11.5T400-200v-240L161-745q-14-17-4-36t31-19h584q21 0 31 19t-4 36L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-276 240-304H240l240 304Zm0 0Z\"/>"],"beans":["0 0 256 256","<path d=\"M214.58,41.42C196.86,23.71,171,16.63,141.81,21.5c-27.74,4.62-55.46,19.62-78.08,42.23S26.12,114.07,21.5,141.81c-4.87,29.21,2.21,55.05,19.92,72.77C55.48,228.64,74.67,236,96.6,236a107.43,107.43,0,0,0,17.59-1.5c27.74-4.62,55.46-19.62,78.08-42.23s37.61-50.34,42.23-78.08C239.37,85,232.29,59.14,214.58,41.42ZM45.17,145.75c3.8-22.84,16.42-45.94,35.53-65S122.91,49,145.75,45.17A82,82,0,0,1,159.27,44a62.77,62.77,0,0,1,18.24,2.57A110.12,110.12,0,0,0,154.62,60.4c-20,15.77-32.88,37.72-38.38,65.25-8.95,44.73-40.3,61.1-62.07,67.09C45.25,180.83,42.06,164.41,45.17,145.75Zm165.66-35.5c-3.8,22.84-16.42,45.94-35.53,65.05S133.09,207,110.25,210.83c-11.65,1.94-22.4,1.41-31.75-1.42a109.42,109.42,0,0,0,22.87-13.81c20-15.77,32.89-37.72,38.39-65.25,9-44.73,40.3-61.1,62.07-67.09C210.75,75.17,213.94,91.59,210.83,110.25Z\"/>"],"pourover-accessories":["0 -960 960 960","<path d=\"M250-260v-473l-74-99q-11-15-2.81-31.5T200-880h453q27.85 0 47.43 19.57Q720-840.85 720-813v63h100q24.75 0 42.38 17.62Q880-714.75 880-690v220q0 24.75-17.62 42.37Q844.75-410 820-410H720v150q0 24.75-17.62 42.37Q684.75-200 660-200H310q-24.75 0-42.37-17.63Q250-235.25 250-260Zm60 0h350v-560H260l50 65v495Zm410-210h100v-220H720v220ZM514.5-745.42Q500-730.83 500-710v340q0 20.83 14.62 35.42Q529.24-320 550.12-320q20.88 0 35.38-14.58Q600-349.17 600-370v-340q0-20.83-14.62-35.42Q570.76-760 549.88-760q-20.88 0-35.38 14.58ZM150-80q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h660q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32Q822.75-80 810-80H150Zm310-460Z\"/>"],"espresso-accessories":["0 -960 960 960","<path d=\"M290-80H112q-13 0-22-9.5T82-112q10-150 90.5-263T410-511v-139q-42-5-93-18t-97.5-36.5Q173-728 137.5-762T90-843q-4-14 5-25.5t24-11.5h722q15 0 24 11.5t5 25.5q-12 47-47.5 81t-82 57.5Q694-681 643-668t-93 18v139q157 23 237.5 136T878-112q1 13-8 22.5T848-80H670q-13 0-21.5-8.5T640-110q0-13 8.5-21.5T670-140h147q-18-152-111-234.5T480-457q-133 0-226 82.5T143-140h147q13 0 21.5 8.5T320-110q0 13-8.5 21.5T290-80Zm386-661.5Q766-778 795-820H165q29 42 119 78.5T480-705q106 0 196-36.5ZM480-80q-33 0-56.5-23.5T400-160q0-17 6.5-31t17.5-25q12-12 33-24.5t50-25.5l100-41q9-4 16 3.5t3 16.5l-41 100q-13 29-25 50t-24 33q-11 11-25 17.5T480-80Zm0-625Z\"/>"],"cups":["0 -960 960 960","<path d=\"M442-242q-116 0-199-80.04-83-80.05-83-194.96v-263q0-24.75 17.63-42.38Q195.25-840 220-840h529q54.27 0 92.64 37Q880-766 880-712q0 60-37 106t-94 46h-25v43q0 114.91-83 194.96Q558-242 442-242ZM220-620h444v-160H220v160Zm222 318q91 0 156.5-62T664-517v-43H220v43q0 91 65.5 153T442-302Zm282-318h25q33 0 52-28.5t19-63.5q0-29-21-48.5T749-780h-25v160ZM190-120q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h580q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H190Zm252-440Z\"/>"],"tumblers":["0 -960 960 960","<path d=\"M623-530H377q-5 14-13.46 25.5T343-485l32 345h250l32-345q-12-8-20.5-19.5T623-530ZM366-700l-17 69q9 8 16 18.5t11 22.5h248.58q4.64-11.43 11.03-21.71Q642-622 651-630l-17-70H366Zm9 620q-23.35 0-40.68-16Q317-112 315-135l-33-365q-1-8.89 3.5-16.44Q290-524 298-529l1-1q8-5 14-12t6-17q0-9-4-17t-12-12l-2-1q-9-5-13-14.5t-2-19.5l28-114q2-10 10.25-16.5T343-760h127v-60h-30q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h120q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5h-30v60h127q10.8 0 18.9 6.5Q684-747 686-737l27 112q2 10-2 19.5T698-591l-2 1q-8 4-12 12t-4 16.74q0 10.69 5.5 17.97 5.5 7.29 14.18 11.92t13.5 12.5Q718-511 717-501l-32 366q-2.25 23.36-19.5 39.18T625-80H375Zm125-450Zm0-60Z\"/>"],"grinders":["0 -960 960 960","<path d=\"M300-80q-24 0-42-18t-18-42v-56q0-45 22.5-82t65.5-65l-33-190H180q-24 0-42-18t-18-42v-187q0-25 17.5-42.5T180-840h212v-10q0-13 8.5-21.5T422-880h106q13 0 21.5 8.5T558-850v10h125q14 0 23 10.5t7 24.5l-81 462q43 28 65.5 65t22.5 82v56q0 24-18 42t-42 18H300Zm-16-513-32-187h-72v187h104Zm224.5 381.5Q520-223 520-240t-11.5-28.5Q497-280 480-280t-28.5 11.5Q440-257 440-240t11.5 28.5Q463-200 480-200t28.5-11.5ZM382-380h196l70-400H312l70 400Zm-82 240h360v-56q0-54-40-89t-99-35h-82q-59 0-99 35t-40 89v56Zm180-90Z\"/>"]};
const catIcon=c=>{ const i=CAT_ICON[c.id]; return i?`<svg class="cat-ico" viewBox="${i[0]}" fill="currentColor" aria-hidden="true">${i[1]}</svg>`:""; };
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
