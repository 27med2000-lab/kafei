function field(id,label,o={}){ const req=o.req!==false;
  return `<div class="f ${o.full?"full":""}"><label for="${id}">${label}${req?' <span class="req" aria-hidden="true">*</span>':""}</label>${o.type==="textarea"?`<textarea id="${id}"></textarea>`:`<input id="${id}" type="text" ${req?'required aria-required="true"':""} ${o.auto?`autocomplete="${o.auto}"`:""} ${o.mode?`inputmode="${o.mode}"`:""}>`}<p class="err" id="${id}-err" hidden></p></div>`; }
/* ===== discount code (checked again by the server when paying) ===== */
let promo=null;
const disc=s=>!promo||!s?0:promo.kind==="percent"?Math.round(s*promo.value/100):Math.min(promo.value,s);
const promoLabel=p=>p.kind==="percent"?`${p.value}%`:money(p.value);
const coTotals=(s,f)=>`<dt>${t("subtotal")}</dt><dd class="num">${money(s)}</dd>${promo?`<dt>${esc(t("code_line",promo.code))}</dt><dd class="num">−${money(disc(s))}</dd>`:""}<dt>${t("delivery")}</dt><dd>${f?money(f):t("free")}</dd><dt class="grand">${t("total")}</dt><dd class="grand num">${money(s-disc(s)+f)}</dd>`;
function coRefresh(){ const s=sub(),f=fee(s),d=$("#coTotals"),p=$("#coPay"),i=$("#code"),b=$("#codeBtn");
  if(d) d.innerHTML=coTotals(s,f); if(p) p.textContent=money(s-disc(s)+f);
  if(i){ i.readOnly=!!promo; if(promo) i.value=promo.code; } if(b) b.textContent=promo?t("code_remove"):t("code_apply"); }
async function applyPromo(){
  const i=$("#code"), m=$("#code-msg"), b=$("#codeBtn");
  if(promo){ promo=null; m.textContent=""; coRefresh(); i.value=""; i.focus(); return; }
  const code=i.value.trim(); if(!code){ m.textContent=t("code_need"); i.focus(); return; }
  b.disabled=true;
  try{ const r=await fetch("/api/discount",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,phone:($("#phone")||{}).value||"",sub:sub()})});
    const d=await r.json().catch(()=>({}));
    if(r.ok&&d.code){ promo=d; m.textContent=t("code_on",d.code,promoLabel(d)); coRefresh(); }
    else m.textContent=d.message||t("code_fail");
  }catch(e){ m.textContent=t("code_fail"); }
  b.disabled=false;
}
document.addEventListener("click",e=>{ if(e.target.closest("#codeBtn")) applyPromo(); });
document.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.id==="code"){ e.preventDefault(); if(!promo) applyPromo(); } });
function viewCheckout(){
  if(!cart.length) return `<div class="wrap page-head"><h1 class="display">${t("co_h")}</h1><div class="empty"><p>${t("co_empty")}</p><a class="btn" href="#shop">${t("shop_all")}</a></div></div>`;
  const s=sub(), f=fee(s);
  return `<div class="wrap page-head"><ol class="crumbs"><li><a href="#home">${t("home")}</a></li><li aria-current="page">${t("co_h")}</li></ol><h1 class="display">${t("co_h")}</h1></div>
  <div class="wrap co"><form id="coForm" novalidate><div id="errSum"></div>
    <fieldset><legend>${t("co_contact")}</legend><div class="fgrid">${field("name",t("f_name"),{auto:"name",full:true})}
      <div class="f full"><label for="phone">${t("f_phone")} <span class="req" aria-hidden="true">*</span></label><div class="tel"><span>+965</span><input id="phone" type="tel" inputmode="tel" autocomplete="tel-national" required aria-required="true" aria-describedby="phone-help" maxlength="9"></div><p class="help" id="phone-help">${t("f_phone_help")}</p><p class="err" id="phone-err" hidden></p></div></div></fieldset>
    <fieldset><legend>${t("co_addr")}</legend><div class="fgrid">
      <div class="f"><label for="gov">${t("f_gov")} <span class="req" aria-hidden="true">*</span></label><select id="gov" required aria-required="true"><option value="">${t("f_choose")}</option>${GOVS.map(g=>`<option value="${g[0]}">${lang==="ar"?g[2]:g[1]}</option>`).join("")}</select><p class="err" id="gov-err" hidden></p></div>
      ${field("area",t("f_area"))}${field("block",t("f_block"),{mode:"numeric"})}${field("street",t("f_street"))}${field("avenue",t("f_avenue"),{req:false})}${field("house",t("f_house"))}${field("notes",t("f_notes"),{type:"textarea",req:false,full:true})}</div></fieldset>
    <fieldset><legend>${t("code_l")}</legend><div class="codebox"><input id="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" aria-describedby="code-msg" value="${promo?esc(promo.code):""}" ${promo?"readonly":""}><button class="btn ghost" type="button" id="codeBtn">${promo?t("code_remove"):t("code_apply")}</button></div><p class="help" id="code-msg" aria-live="polite">${promo?esc(t("code_on",promo.code,promoLabel(promo))):""}</p></fieldset>
    <fieldset><legend>${t("co_pay")}</legend><div class="radios">${["knet","card","apple"].map((m,i)=>`<label class="radio"><input type="radio" name="pay" value="${m}" ${i===0?"checked":""}><span>${t("pay_"+m)}</span></label>`).join("")}</div></fieldset>
    <button class="btn" type="submit" style="width:100%;min-height:58px">${t("place")}, <span class="num" id="coPay">${money(s-disc(s)+f)}</span></button><p class="demo">${t(CONFIG.payments?"demo_live":"demo")}</p><p class="demo">${lang==="ar"?`بالدفع فأنت توافق على <a href="/terms">شروط البيع</a> و<a href="/returns">سياسة الإرجاع</a>.`:`By paying you agree to our <a href="/terms">terms of sale</a> and <a href="/returns">returns policy</a>.`}</p>
  </form>
  <aside class="summary" aria-labelledby="sumH"><h2 id="sumH">${t("cart_h")}</h2>${cart.map(l=>`<p style="display:flex;justify-content:space-between;gap:12px;padding:6px 0"><span>${l.qty} × ${esc(cName(byId[l.id],colorOf(byId[l.id],l.color)))}</span><span class="num">${money(byId[l.id].price*l.qty)}</span></p>`).join("")}
    <dl class="totals" id="coTotals" style="margin-top:12px">${coTotals(s,f)}</dl></aside></div>`;
}
function viewOrder(){
  if(!lastOrder) return viewShop();
  return `<div class="wrap page-head"><h1 class="display">${t("ok_h",lastOrder.id)}</h1><p style="margin-top:18px;max-width:50ch">${t("ok_p")}</p><p style="display:flex;flex-wrap:wrap;gap:10px;margin-top:28px"><a class="btn" href="${lastOrder.wa}" target="_blank" rel="noopener">${ICON.wa}<span>${t("ok_send")}</span></a><a class="btn ghost" href="#shop">${t("ok_back")}</a></p></div>`;
}
