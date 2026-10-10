'use strict';
// Public production smoke check: real Chromium, no sign-in, no private data, no external APIs.
const fs = require('node:fs');
const { chromium } = require('/tmp/mascot-live/node_modules/playwright');
const sites = [
  {name:'NOOO', url:'https://nooo.si/', face:'.nooo-friend-face', pupil:'.nooo-friend-eyes b',
   panel:'.nooo-friend-panel', prop:'--look-x', nav:'.nooo-friend-actions button'},
  {name:'TheCareers.net', url:'https://thecareers.net/', face:'.fh-trigger',
   pupil:'.fh-eyes b', panel:'.fh-panel', prop:'--eye-x', nav:'.fh-actions button'},
  {name:'TheCareers.org', url:'https://www.thecareers.org/', face:'.fh-trigger',
   pupil:'.fh-eyes b', panel:'.fh-panel', prop:'--eye-x', nav:'.fh-actions button'},
];
const status = [];
const sleep = ms => new Promise(r => setTimeout(r,ms));
async function verify(browser, site) {
  const context = await browser.newContext({viewport:{width:1365,height:900},isMobile:false,hasTouch:false,reducedMotion:'no-preference'});
  const page = await context.newPage();
  try {
    page.setDefaultTimeout(12000);
    const response=await page.goto(site.url,{waitUntil:'domcontentloaded',timeout:20000});
    if (!response || response.status()>=400) throw Error('Homepage HTTP '+(response?.status()||'unavailable'));
    await page.locator(site.face).waitFor({state:'visible',timeout:12000});
    if(await page.locator(site.pupil).count()!==2) throw Error('Missing two pupils');
    const face = page.locator(site.face);
    const box=await face.boundingBox();
    if(!box)throw Error('No mascot bounding box');
    const gaze=async(x,y)=>{
      await page.mouse.move(x,y);
      await page.waitForTimeout(180);
      return await face.evaluate((element,prop)=>element.style.getPropertyValue(prop),site.prop);
    };
    const left=await gaze(Math.max(3,box.x-160),box.y+box.height/2);
    const right=await gaze(Math.min(1360,box.x+box.width*0.75),box.y+box.height/2);
    if(!left||!right)throw Error('Pupil CSS coordinates are not updated by mouse movement');
    const a=Number.parseFloat(left),b=Number.parseFloat(right);
    if(!(Number.isFinite(a)&&Number.isFinite(b)&&a<0&&b>0&&Math.abs(a)<=3.01&&Math.abs(b)<=3.01))
      throw Error('Incorrect pupil direction or bounds: '+JSON.stringify({left,right,box}));
    await face.click();
    if(!await page.locator(site.panel).isVisible()) throw Error('Mascot menu did not open');
    if(await page.locator(site.nav).count()<4)throw Error('Not enough working guide shortcuts');
    return {name:site.name,passed:true,http:response.status(),gaze:{left:a,right:b},actions:await page.locator(site.nav).count()};
  }catch(error){
    fs.mkdirSync('qa/live-mascot-output',{recursive:true});
    try{await page.screenshot({path:'qa/live-mascot-output/'+site.name.replaceAll('.','-')+'.png',fullPage:false,timeout:4000})}catch{}
    return {name:site.name,passed:false,error:String(error).slice(0,900)};
  }finally{await context.close().catch(()=>{})}
}
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    for(const site of sites){const result=await verify(browser,site);status.push(result);console.log(JSON.stringify(result))}
  }finally{await browser.close()}
  fs.mkdirSync('qa/live-mascot-output',{recursive:true});
  fs.writeFileSync('qa/live-mascot-output/report.json',JSON.stringify({generatedAt:new Date().toISOString(),results:status},null,2));
  if(status.length!==3||status.some(s=>!s.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
