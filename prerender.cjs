// Snapshot the English home page (static, reduced-motion state) into parts/prerender.html,
// so the HTML a visitor or crawler receives already holds the real content.
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch();
  const c=await b.newContext({locale:'en-US',reducedMotion:'reduce'});
  const p=await c.newPage();
  fs.writeFileSync('/home/user/kafei/v3/parts/prerender.html','');
  await p.goto('http://127.0.0.1:4400/site.html#home');
  await p.waitForTimeout(800);
  const out=await p.evaluate(()=>document.querySelector('#main').innerHTML+'<!--FOOTER-->'+document.querySelector('#footer').innerHTML);
  fs.writeFileSync('/home/user/kafei/v3/parts/prerender.html',out);
  console.log('prerendered',out.length,'chars');
  await b.close();
})();
