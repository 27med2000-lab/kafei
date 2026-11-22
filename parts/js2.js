/* ===== cart ===== */
const sub=()=>cart.reduce((s,l)=>s+byId[l.id].price*l.qty,0);
const count=()=>cart.reduce((s,l)=>s+l.qty,0);
const fee=s=>s===0||(CONFIG.freeOver&&s>=CONFIG.freeOver)?0:CONFIG.fee;
function saveCart(){ store.set("kafei-cart2",cart); updateCount(); }
function updateCount(){ $("#cartCount").textContent=count(); $("#cartSr").textContent=t("cart_n",count()); }
function addToCart(id,q=1,color=null){ const p=byId[id]; if(!p||p.price==null||p.out) return; let c=null;
  if(p.colors&&p.colors.length){ c=colorOf(p,color)||firstColor(p); if(!c||c.out) return; }
  const k=lineKey({id,color:c&&c.id}), l=cart.find(x=>lineKey(x)===k); if(l) l.qty=Math.min(99,l.qty+q); else cart.push(c?{id,qty:q,color:c.id}:{id,qty:q}); saveCart(); replay($("#cartCount"),"tick"); toast(t("added",cName(p,c))); }
/* restart a one-shot CSS animation (the stylesheet turns these off for reduced motion) */
function replay(el,cls){ if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); el.addEventListener("animationend",()=>el.classList.remove(cls),{once:true}); }
let toastT; function toast(m){ const e=$("#toast"); e.textContent=m; e.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>e.classList.remove("show"),3200); }

