/* ===== drawer ===== */
let lastFocus=null;
function renderDrawer(){
  const d=$("#drawer"), s=sub(), f=fee(s);
  d.innerHTML=`<div class="drawer-head"><h2 id="drawerTitle">${t("cart_h")}</h2><button class="x-btn" type="button" id="drawerClose" aria-label="${t("close")}">${ICON.close}</button></div>
  <div class="drawer-body">${cart.length?cart.map(l=>{const p=byId[l.id],k=esc(lineKey(l));return `<div class="line"><img src="${lineImg(l)}" alt="" loading="lazy"><div><h3>${esc(cName(p,colorOf(p,l.color)))}</h3><div class="ctl"><div class="stepper" role="group" aria-label="${t("qty")}"><button type="button" data-q="${k}" data-d="-1" aria-label="${t("dec")}">−</button><output>${l.qty}</output><button type="button" data-q="${k}" data-d="1" aria-label="${t("inc")}">+</button></div><button class="linkbtn" type="button" data-rm="${k}">${t("remove")}</button></div></div><span class="num">${money(p.price*l.qty)}</span></div>`}).join(""):`<div class="empty"><p>${t("empty")}</p><a class="btn" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t("wa_hello"))}" target="_blank" rel="noopener">${ICON.wa}<span>${t("ask_price")}</span></a><a class="btn ghost" href="#shop" data-close>${t("shop_all")}</a></div>`}</div>
  ${cart.length?`<div class="drawer-foot"><dl class="totals"><dt>${t("subtotal")}</dt><dd class="num">${money(s)}</dd><dt>${t("delivery")}</dt><dd>${f?money(f):t("free")}</dd><dt class="grand">${t("total")}</dt><dd class="grand num">${money(s+f)}</dd></dl><a class="btn" href="#checkout" data-close>${t("checkout")}</a></div>`:""}`;
}
function openDrawer(){ lastFocus=document.activeElement; renderDrawer(); const d=$("#drawer"),s=$("#scrim"); d.hidden=false; s.hidden=false; requestAnimationFrame(()=>{d.classList.add("open");s.classList.add("show");$("#drawerClose").focus();}); document.documentElement.style.overflow="hidden"; }
function closeDrawer(){ const d=$("#drawer"),s=$("#scrim"); if(d.hidden) return; d.classList.remove("open"); s.classList.remove("show"); document.documentElement.style.overflow=""; setTimeout(()=>{ if(!d.classList.contains("open")){d.hidden=true;s.hidden=true;} },reduce.matches?0:460); if(lastFocus&&lastFocus.isConnected) lastFocus.focus(); }
function setQty(key,q){ const l=cart.find(x=>lineKey(x)===key); if(!l) return; if(q<=0) cart=cart.filter(x=>x!==l); else l.qty=Math.min(99,q); saveCart(); renderDrawer(); }

/* ===== checkout ===== */
const RULES={name:v=>v.trim().length>=2,phone:v=>/^[4569]\d{7}$/.test(v.replace(/\D/g,"")),gov:v=>!!v,area:v=>v.trim().length>=2,block:v=>v.trim().length>=1,street:v=>v.trim().length>=1,house:v=>v.trim().length>=1};
function validate(id){ const el=document.getElementById(id); if(!el) return true; const ok=RULES[id](el.value), er=document.getElementById(id+"-err"); el.setAttribute("aria-invalid",ok?"false":"true"); const desc=[id==="phone"?"phone-help":"",ok?"":id+"-err"].filter(Boolean).join(" "); if(desc) el.setAttribute("aria-describedby",desc); else el.removeAttribute("aria-describedby"); if(er){er.hidden=ok;er.textContent=ok?"":t("e_"+id);} return ok; }
function submitCheckout(e){
  e.preventDefault(); const bad=Object.keys(RULES).filter(id=>!validate(id)); const box=$("#errSum");
  if(bad.length){ box.innerHTML=`<div class="err-summary" role="alert" tabindex="-1" id="errBox"><h2>${t("e_sum",bad.length)}</h2><ul>${bad.map(id=>`<li><a href="#${id}" data-focus="${id}">${t("e_"+id)}</a></li>`).join("")}</ul></div>`; $("#errBox").focus(); return; }
  const v=id=>document.getElementById(id).value.trim(), g=GOVS.find(x=>x[0]===v("gov")), s=sub(), f=fee(s);
  const lines=[t("wa_order"),...cart.map(l=>`• ${l.qty} × ${cName(byId[l.id],colorOf(byId[l.id],l.color))}: ${money(byId[l.id].price*l.qty)}`),`${t("delivery")}: ${f?money(f):t("free")}`,`${t("total")}: ${money(s+f)}`,`${t("f_name")}: ${v("name")}`,`${t("f_phone")}: +965 ${v("phone")}`,`${t("co_addr")}: ${lang==="ar"?g[2]:g[1]}, ${v("area")}, ${t("f_block")} ${v("block")}, ${t("f_street")} ${v("street")}${v("avenue")?", "+v("avenue"):""}, ${v("house")}`,`${t("co_pay")}: ${t("pay_"+$("input[name=pay]:checked").value)}`];
  if(sbUser&&$("#saveAddr")&&$("#saveAddr").checked) saveProfile({name:v("name"),phone:v("phone").replace(/\D/g,""),gov:v("gov"),area:v("area"),block:v("block"),street:v("street"),avenue:v("avenue"),house:v("house"),notes:v("notes")},true);
  const method=$("input[name=pay]:checked").value;
  if(method!=="cod"&&CONFIG.payments){ startPayment(method,v,g,lines); return; }
  if(CONFIG.payments){ placeCod(v,g,lines,s,f); return; }
  lastOrder={id:"KF-"+(20000+Math.floor(Math.random()*79999)),wa:wa(lines.join("\n"))};
  demoRecordOrder({id:lastOrder.id,status:"sent",method:"cod",total_fils:s+f,items:cart.map(l=>({id:l.id,color:l.color,name:cName(byId[l.id],colorOf(byId[l.id],l.color)),qty:l.qty}))});
  cart=[]; saveCart(); location.hash="order";
}
async function placeCod(v,g,lines,s,f){
  const btn=$("#coForm button[type=submit]"); btn.disabled=true;
  let id=null;
  try{ const tok=await sbToken(), hd={"Content-Type":"application/json"}; if(tok) hd.Authorization="Bearer "+tok;
    const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),6000);
    const r=await fetch(CONFIG.payments.cod,{method:"POST",headers:hd,signal:ctl.signal,body:JSON.stringify({items:cart.map(l=>({id:l.id,qty:l.qty,color:l.color})),lang,customer:{name:v("name"),phone:v("phone")},address:{gov:g[0],area:v("area"),block:v("block"),street:v("street"),avenue:v("avenue"),house:v("house"),notes:v("notes")}})});
    clearTimeout(timer); const d=await r.json().catch(()=>({})); if(r.ok&&d.orderId) id=d.orderId;
  }catch(e){}
  // the order still goes to WhatsApp if the server could not record it
  id=id||"KF-"+(20000+Math.floor(Math.random()*79999));
  lastOrder={id,wa:wa([lines[0]+" ("+id+")",...lines.slice(1)].join("\n"))};
  demoRecordOrder({id,status:"sent",method:"cod",total_fils:s+f,items:cart.map(l=>({id:l.id,color:l.color,name:cName(byId[l.id],colorOf(byId[l.id],l.color)),qty:l.qty}))});
  cart=[]; saveCart(); location.hash="order";
}
async function startPayment(method,v,g,lines){
  const btn=$("#coForm button[type=submit]"), box=$("#errSum"), label=btn.innerHTML;
  btn.disabled=true; btn.innerHTML=`<span>${t("paying")}</span>`;
  const body={items:cart.map(l=>({id:l.id,qty:l.qty,color:l.color})),method,lang,customer:{name:v("name"),phone:v("phone")},
    address:{gov:g[1],area:v("area"),block:v("block"),street:v("street"),avenue:v("avenue"),house:v("house"),notes:v("notes")}};
  try{
    const tok=await sbToken(), hd={"Content-Type":"application/json"}; if(tok) hd.Authorization="Bearer "+tok;
    const r=await fetch(CONFIG.payments.checkout,{method:"POST",headers:hd,body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.link) throw new Error(d.message||t("pay_fail"));
    store.set("kafei-pending",{id:d.orderId,total:d.total,method,wa:lines.join("\n")});
    location.href=d.link;
  }catch(err){
    btn.disabled=false; btn.innerHTML=label;
    box.innerHTML=`<div class="err-summary" role="alert" tabindex="-1" id="errBox"><h2>${esc(err.message||t("pay_fail"))}</h2><ul><li><a href="#" data-focus="pay-cod">${t("cod_instead")}</a></li></ul></div>`;
    const c=$('input[name=pay][value=cod]'); if(c) c.id="pay-cod"; $("#errBox").focus();
  }
}

/* ===== the loom: one band open at a time ===== */
function openWeft(id,focus){
  openId=id;
  $$(".weft").forEach(w=>{ const on=w.querySelector("[data-weft]").dataset.weft===id; w.dataset.open=String(on); w.querySelector(".weft-head").setAttribute("aria-expanded",String(on)); const b=w.querySelector(".weft-body"); if(on) b.removeAttribute("inert"); else b.setAttribute("inert",""); });
  if(focus) $(`[data-weft="${id}"]`).focus();
}

