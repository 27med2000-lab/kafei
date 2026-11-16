/* ===== events ===== */
document.addEventListener("click",e=>{
  const w=e.target.closest("[data-weft]"); if(w){ openWeft(w.dataset.weft); return; }
  const a=e.target.closest("[data-add]"); if(a){ addToCart(a.dataset.add); return; }
  if(e.target.closest("#pdpAdd")){ const ch=$("input[name=pcolor]:checked"); addToCart(e.target.closest("#pdpAdd").dataset.pid,+$("#pq").textContent,ch?ch.value:null); return; }
  const pq=e.target.closest("[data-pq]"); if(pq){ const o=$("#pq"); o.textContent=Math.max(1,Math.min(99,+o.textContent+ +pq.dataset.pq)); return; }
  const q=e.target.closest("[data-q]"); if(q){ const l=cart.find(x=>lineKey(x)===q.dataset.q); if(l) setQty(q.dataset.q,l.qty+ +q.dataset.d); return; }
  const rm=e.target.closest("[data-rm]"); if(rm){ setQty(rm.dataset.rm,0); return; }
  if(e.target.closest("#cartBtn")){ openDrawer(); return; }
  if(e.target.closest("#drawerClose")||e.target.id==="scrim"||e.target.closest("[data-close]")){ closeDrawer(); return; }
  if(e.target.closest("#langBtn")){ lang=lang==="ar"?"en":"ar"; store.set("kafei-lang",lang); applyLang(); pendingFocus=false; render(); replay($("#main"),"lang-in"); return; }
  if(e.target.closest("#copyPhone")){ try{ navigator.clipboard.writeText(CONFIG.phoneDisplay).then(()=>toast(t("copied")),selectPhone); }catch(err){ selectPhone(); } return; }
  const fl=e.target.closest("[data-focus]"); if(fl){ e.preventDefault(); const el=document.getElementById(fl.dataset.focus); el&&el.focus(); }
});
function selectPhone(){ const r=document.createRange(); r.selectNodeContents($("#phoneNum")); const s=getSelection(); s.removeAllRanges(); s.addRange(r); toast(t("copy_fail")); }
document.addEventListener("keydown",e=>{
  const w=e.target.closest&&e.target.closest("[data-weft]");
  if(w&&["ArrowDown","ArrowUp","Home","End"].includes(e.key)){ const ids=P.map(p=>p.id), i=ids.indexOf(w.dataset.weft); const j=e.key==="Home"?0:e.key==="End"?ids.length-1:(i+(e.key==="ArrowDown"?1:-1)+ids.length)%ids.length; e.preventDefault(); $(`[data-weft="${ids[j]}"]`).focus(); return; }
  const d=$("#drawer"); if(d.hidden) return;
  if(e.key==="Escape"){ closeDrawer(); return; }
  if(e.key==="Tab"){ const f=$$("a[href],button:not([disabled]),input,select,textarea",d).filter(x=>x.offsetParent!==null); if(!f.length) return; const first=f[0],last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();} }
});
/* colour swatches: swap the photo, the colour name and the WhatsApp question */
document.addEventListener("change",e=>{
  if(e.target.name!=="pcolor") return; const id=(curKey().match(/^p-(.+)$/)||[])[1], p=byId[id], c=colorOf(p,e.target.value); if(!c) return;
  const img=$(".pdp .vessel img"); if(img){ img.src=c.img||p.img; img.alt=cName(p,c); }
  $$(".pdp [data-detail]").forEach(d=>{ const i=+d.dataset.detail; if(c.details&&c.details[i]){ d.src=c.details[i]; d.alt=`${cName(p,c)}, ${t(i?"d_side":"d_close")}`; } });
  $("#swName").textContent=L(c.name); const a=$("#pdpAsk"); if(a) a.href=wa(t("wa_item",cName(p,c)));
});
document.addEventListener("focusout",e=>{ const id=e.target.id; if(RULES[id]&&e.target.closest("#coForm")&&(e.target.value||e.target.getAttribute("aria-invalid")==="true")) validate(id); });
document.addEventListener("submit",e=>{ if(e.target.id==="coForm") submitCheckout(e); });
applyLang();
/* products from the owner's dashboard: replace the built-in list once they arrive; keep it if they don't.
   The first draw waits for them (up to 1.5 s) so the page, and the hero intro, are drawn once with the right products.
   If they come later, the page is redrawn in place without replaying anything. */
/* (a host without the /api functions answers 404: then checkout sends every order on WhatsApp instead of showing a payment error) */
let booted=false; const boot=()=>{ if(booted) return; booted=true; render(); };
/* a link straight to an inner page draws at once (the pre-built home was cleared for it), unless it names a product only the server knows */
const deepNow=()=>{ if(!document.documentElement.classList.contains("deep")) return false; const h=curKey(); return !(h.startsWith("p-")&&!byId[h.slice(2)])&&!h.startsWith("brand-"); };
if(CONFIG.payments&&CONFIG.payments.products){ setTimeout(boot,1500); if(deepNow()) boot();
  fetch(CONFIG.payments.products).then(r=>{
  if(r.status===404||r.status===405){ CONFIG.payments=null; if(booted&&curKey()==="checkout") refreshInPlace(); return null; }
  return r.status===200?r.json():null; }).then(list=>{
  if(!Array.isArray(list)||!list.length||JSON.stringify(list)===JSON.stringify(P)) return boot();
  P.length=0; list.forEach(x=>P.push(x)); for(const k of Object.keys(byId)) delete byId[k]; P.forEach(x=>byId[x.id]=x);
  const have=new Set(cart.map(lineKey)); cart=cart.filter(okLine);
  for(const l of cartSaved) if(!have.has(lineKey(l))&&okLine(l)) cart.push(l);
  updateCount(); if(booted) refreshInPlace(); else boot();
}).catch(boot); } else boot();
})();
</script>
