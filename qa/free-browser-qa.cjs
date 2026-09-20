const fs = require('fs');
const path = require('path');
const { chromium } = require('/tmp/free-browser-qa/node_modules/playwright');

const target = process.env.TARGET_URL;
if (!target || !/^https?:\/\//i.test(target)) throw new Error('TARGET_URL must be http(s)');
const outDir = path.resolve('qa/free-browser-output');
fs.mkdirSync(outDir, { recursive: true });

function assert(results, name, ok, details = '') { results.push({ name, ok:Boolean(ok), details:String(details || '') }); }
function clean(v=''){ return String(v || '').replace(/\s+/g,' ').trim(); }
async function text(locator){ if (!(await locator.count())) return ''; return clean(await locator.first().textContent().catch(()=>'')); }

async function inspectPage(browser, mode, viewport) {
  const context = await browser.newContext({ viewport, colorScheme:'light' });
  const page = await context.newPage();
  const failures=[], assertions=[]; const started=Date.now();
  page.on('pageerror',e=>failures.push({type:'pageerror',critical:true,message:String(e.message||e)}));
  page.on('console',m=>{ if(m.type()==='error') failures.push({type:'console',critical:true,message:m.text()}); });
  page.on('requestfailed',r=>{ const u=r.url(), message=r.failure()?.errorText||'failed'; const aborted=/ERR_ABORTED/i.test(message), telemetry=/\/rest\/v1\/site_events(?:\?|$)/i.test(u), firstParty=u.startsWith(new URL(target).origin)||/supabase\.co/i.test(u); failures.push({type:'requestfailed',critical:firstParty&&!aborted&&!telemetry,url:u,message}); });
  page.on('response',r=>{ if(r.status()>=400){ const u=r.url(), telemetry=/\/rest\/v1\/site_events(?:\?|$)/i.test(u), critical=!telemetry&&(u.startsWith(new URL(target).origin)||/supabase\.co/i.test(u)); if(!/favicon\.ico/i.test(u)) failures.push({type:'http',critical,status:r.status(),url:u}); }});

  const response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:60000}); await page.waitForTimeout(3500);
  const title=await page.title();
  assert(assertions,'HTTP page response',response&&response.status()<400,response?.status());
  assert(assertions,'HTTPS target',page.url().startsWith('https://'),page.url());
  assert(assertions,'Document title',/TheCareers/i.test(title),title);
  assert(assertions,'Top Opportunities panel',await page.locator('.row-opps').count()>0);
  assert(assertions,'Backend role search input',await page.locator('#tcJobTitleSearch').count()===1);
  assert(assertions,'Country filter',await page.locator('#tcCountryFilter').count()===1);
  assert(assertions,'Opportunity tabs',await page.locator('.row-opps .tab').count()>=4);
  assert(assertions,'Sort control',await page.locator('.row-opps .select-like').count()===1);
  assert(assertions,'Filter control',await page.locator('.row-opps .filter-btn').count()===1);

  await page.locator('.backend-job').first().waitFor({state:'attached',timeout:20000}).catch(()=>{});
  const cards=await page.locator('.backend-job').count(); assert(assertions,'Live job cards loaded',cards>0,`${cards} cards in DOM`);
  const visibleInitial=await page.locator('.backend-job:visible').count();
  assert(assertions,'Exactly 10 or fewer job cards visible per page',visibleInitial>0&&visibleInitial<=10,`${visibleInitial} visible cards`);
  if(cards>10) assert(assertions,'Normal job page is capped at 10 cards',visibleInitial===10,`${visibleInitial} visible of ${cards} DOM cards`);

  const tabs=page.locator('.row-opps .tab[data-tab]');
  assert(assertions,'Four opportunity tabs available',await tabs.count()===4,`${await tabs.count()} tabs`);
  const activeTabs=page.locator('.row-opps .tab.active[aria-pressed="true"]');
  assert(assertions,'Exactly one opportunity tab is selected',await activeTabs.count()===1,`${await activeTabs.count()} selected`);

  const filterPanel=page.locator('#tcNetJobFilters');
  assert(assertions,'Job filters panel exists',await filterPanel.count()===1);
  if(mode==='desktop'){
    assert(assertions,'Job filters are in left sidebar',await page.locator('.sidebar #tcNetJobFilters').count()===1);
    assert(assertions,'Live metric cards moved above filters',await page.locator('.sidebar .tc-sidebar-stats .stat-card').count()===4,`${await page.locator('.sidebar .tc-sidebar-stats .stat-card').count()} cards`);
    assert(assertions,'Sidebar has Dashboard and CV Centre only',await page.locator('.sidebar .nav-item').count()===2,await page.locator('.sidebar .nav-item').allTextContents().catch(()=>[]));
    assert(assertions,'Settings removed from sidebar',await page.locator('.sidebar .nav-item[data-page="settings"]').count()===0);
  }

  assert(assertions,'Top slogan removed',await page.locator('.topbar-left').count()===0);
  assert(assertions,'Sources Scanning panel removed',await page.locator('.sources-scan').count()===0);

  if(cards>0){
    const first=page.locator('.backend-job').first();
    const titleLoc=first.locator('.title,[data-job-title],h3,h4').first();
    const companyLoc=first.locator('.company,[data-company],.job-company').first();
    assert(assertions,'Job title visible',(await text(titleLoc)).length>=3,await text(titleLoc));
    assert(assertions,'Company visible',(await text(companyLoc)).length>=2,await text(companyLoc));
    for(const key of ['country','location','type','category','salary','date']){ const fact=first.locator(`.tc-meta-item[data-meta="${key}"] strong`); const value=await text(fact); assert(assertions,`Job fact: ${key}`,value.length>0,value||'missing'); }
    const view=first.locator('.tc-view-job').first(); const href=await view.getAttribute('href').catch(()=>null); assert(assertions,'View Job has safe URL',Boolean(href&&/^https?:\/\//i.test(href)),href||'missing');
    const save=first.locator('.tc-save-job').first(); if(await save.count()){ const before=await text(save); await save.click(); await page.waitForTimeout(200); const after=await text(save); assert(assertions,'Save button toggles',before!==after,`${before} -> ${after}`); await save.click().catch(()=>{}); }
  }

  if(mode==='desktop'){
    const allTab=page.locator('.tab[data-tab="all"]');
    const newTab=page.locator('.tab[data-tab="new"]');
    const savedTab=page.locator('.tab[data-tab="saved"]');
    const highTab=page.locator('.tab[data-tab="high"]');

    await allTab.click(); await page.waitForTimeout(350);
    assert(assertions,'All Jobs tab activates',await allTab.getAttribute('aria-pressed')==='true');
    let visible=await page.locator('.backend-job:visible').count();
    assert(assertions,'All Jobs keeps 10-card page cap',visible>0&&visible<=10,`${visible} visible`);

    await newTab.click(); await page.waitForTimeout(300);
    assert(assertions,'New Today tab activates',await newTab.getAttribute('aria-pressed')==='true');
    visible=await page.locator('.backend-job:visible').count();
    assert(assertions,'New Today keeps 10-card page cap',visible<=10,`${visible} visible`);

    await allTab.click(); await page.waitForTimeout(300);
    const saveFirst=page.locator('.backend-job:visible .tc-save-job').first();
    if(await saveFirst.count()){
      await saveFirst.click(); await page.waitForTimeout(250);
      await savedTab.click(); await page.waitForTimeout(350);
      assert(assertions,'Saved tab activates',await savedTab.getAttribute('aria-pressed')==='true');
      const savedVisible=await page.locator('.backend-job:visible').count();
      assert(assertions,'Saved tab shows saved result',savedVisible>=1&&savedVisible<=10,`${savedVisible} visible`);
      const undo=page.locator('.backend-job:visible .tc-save-job').first(); if(await undo.count()) await undo.click().catch(()=>{});
      await allTab.click(); await page.waitForTimeout(250);
    }

    await highTab.click(); await page.waitForTimeout(450);
    const highActive=await highTab.getAttribute('aria-pressed')==='true';
    const authSurface=await page.locator('.tc-modal-backdrop,#tcAuthForm,[role="dialog"]').count();
    assert(assertions,'High Match either activates personalized view or requests account/CV',highActive||authSurface>0,`active=${highActive} authSurface=${authSurface}`);
    if(authSurface>0){
      await page.waitForTimeout(250);
      assert(assertions,'Password recovery control available on sign-in',await page.locator('.tc-forgot-password').count()===1);
      await page.keyboard.press('Escape').catch(()=>{});
      await page.waitForTimeout(150);
    }

    const cvNav=page.locator('.nav-item[data-page="cv"]');
    if(await cvNav.count()){
      await cvNav.click(); await page.waitForTimeout(350);
      const cvSurface=await page.locator('.tc-modal-backdrop,[role="dialog"]').count();
      assert(assertions,'CV Centre opens account/CV surface',cvSurface>0,`surfaces=${cvSurface}`);
      await page.keyboard.press('Escape').catch(()=>{});
    }

    await page.waitForTimeout(500);
    const emailLinks=await page.locator('.tc-apply-method a[href^="mailto:"]').count();
    assert(assertions,'Direct-email apply opportunities are surfaced when present',emailLinks>0,`${emailLinks} email apply links`);

    const searchNow=page.locator('#searchNowBtn');
    assert(assertions,'Search Now is present and operable',await searchNow.count()===1&&!await searchNow.isDisabled().catch(()=>true));

    const search=page.locator('#tcJobTitleSearch'); await search.fill('hr'); await page.waitForFunction(()=>{const t=document.querySelector('#tcJobSearchMeta')?.textContent||'';return t&&!/SEARCHING BACKEND/i.test(t);},{timeout:10000}).catch(()=>{}); await page.waitForTimeout(500);
    const searchMeta=await text(page.locator('#tcJobSearchMeta')); assert(assertions,'Backend role search returns status',/RELATED ROLE|BACKEND READY/i.test(searchMeta),searchMeta);
    const visibleTitles=(await page.locator('.backend-job:visible .title,.backend-job:visible [data-job-title],.backend-job:visible h3,.backend-job:visible h4').allTextContents()).map(clean).filter(Boolean);
    const rolePattern=/(\bhr\b|human resources|recruit|talent|people partner|people operations|personnel|payroll|compensation|employee relations|workforce)/i, sample=visibleTitles.slice(0,8), relevantSample=sample.filter(t=>rolePattern.test(t));
    assert(assertions,'HR search returns actual HR-related roles',visibleTitles.length>0&&relevantSample.length>=Math.min(4,sample.length),sample.join(' | '));
    const knownBad=/(marketing manager\/in \(teilzeit.*jahre|master\/ lead nut roaster|e-commerce executive)/i; assert(assertions,'HR search avoids letter/category false-positives',!visibleTitles.some(t=>knownBad.test(t)),sample.join(' | '));
    await page.screenshot({path:path.join(outDir,'search-hr.png'),fullPage:true});
    await search.fill(''); await page.waitForTimeout(700);
    const kuwait=page.locator('.tc-country-btn[data-country="kuwait"]'); if(await kuwait.count()){ await kuwait.click(); await page.waitForTimeout(1200); const countries=(await page.locator('.backend-job:visible .tc-meta-item[data-meta="country"] strong').allTextContents()).map(clean).filter(Boolean); assert(assertions,'Kuwait country filter is backend-consistent',countries.length===0||countries.every(x=>x==='Kuwait'),countries.slice(0,10).join(', ')); await page.locator('.tc-country-btn[data-country="all"]').click().catch(()=>{}); }
    const filter=page.locator('.row-opps .filter-btn'); if(await filter.count()){ const before=await text(filter); await filter.click(); await page.waitForTimeout(700); const after=await text(filter); assert(assertions,'Filters control changes backend mode',before!==after,`${before} -> ${after}`); }
    const profile=page.locator('.profile'); if(await profile.count()){ await profile.click().catch(()=>{}); await page.waitForTimeout(350); const authSurface=await page.locator('.tc-modal-backdrop,#tcAuthForm,[role="dialog"]').count(); assert(assertions,'Profile/auth interaction opens a surface',authSurface>0,`surfaces=${authSurface}`); await page.keyboard.press('Escape').catch(()=>{}); }
  }

  if(mode==='mobile'){
    const menu=page.locator('#tc-mobile-menu-btn');
    assert(assertions,'Mobile navigation button exists',await menu.count()===1);
    if(await menu.count()){
      await menu.click(); await page.waitForTimeout(180);
      assert(assertions,'Mobile sidebar opens',await page.locator('body.tc-mobile-nav-open').count()===1);
      assert(assertions,'Mobile CV Centre is reachable',await page.locator('.sidebar .nav-item[data-page="cv"]').count()===1);
      const filterToggle=page.locator('.sidebar .tc-net-filter-toggle');
      if(await filterToggle.count()){
        const box=await filterToggle.boundingBox();
        assert(assertions,'Mobile filter control meets touch size',Boolean(box&&box.height>=44),box?`${Math.round(box.width)}x${Math.round(box.height)}`:'missing');
      }
      await page.locator('.tc-mobile-sidebar-close').click().catch(()=>{});
    }
    const mobileTabs=page.locator('.row-opps .tab[data-tab]');
    if(await mobileTabs.count()){
      const box=await mobileTabs.first().boundingBox();
      assert(assertions,'Mobile job tabs meet touch height',Boolean(box&&box.height>=44),box?`${Math.round(box.width)}x${Math.round(box.height)}`:'missing');
    }
    const mobileVisible=await page.locator('.backend-job:visible').count();
    assert(assertions,'Mobile job page capped at 10 cards',mobileVisible>0&&mobileVisible<=10,`${mobileVisible} visible`);

    const before=await page.evaluate(()=>scrollY); await page.evaluate(()=>scrollTo(0,Math.min(600,document.body.scrollHeight))); await page.waitForTimeout(250); const after=await page.evaluate(()=>scrollY); assert(assertions,'Mobile page scroll works',after>before,`${before} -> ${after}`);
    const globe=page.locator('#thecareers-globe-stage,#thecareers-ai-globe').first(); if(await globe.count()){ const pe=await globe.evaluate(el=>getComputedStyle(el).pointerEvents); assert(assertions,'Mobile globe does not trap page touch',pe==='none'||pe==='auto',`pointer-events=${pe}`); }
  }

  const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})); assert(assertions,`${mode} horizontal overflow`,overflow.scrollWidth<=overflow.clientWidth+4,JSON.stringify(overflow));
  const perf=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return n?{domContentLoaded:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd),transferSize:n.transferSize||null}:{}});
  await page.screenshot({path:path.join(outDir,`${mode}.png`),fullPage:true});
  const result={mode,target:page.url(),status:response?.status()||null,title,elapsedMs:Date.now()-started,perf,assertions,failures:failures.slice(0,100),criticalFailureCount:failures.filter(x=>x.critical).length,failedAssertionCount:assertions.filter(x=>!x.ok).length}; await context.close(); return result;
}

(async()=>{ const browser=await chromium.launch({headless:true}); const desktop=await inspectPage(browser,'desktop',{width:1440,height:1000}); const mobile=await inspectPage(browser,'mobile',{width:390,height:844}); await browser.close(); const report={target,generatedAt:new Date().toISOString(),engine:'local Chromium + Playwright (no cloud API key)',summary:{failedAssertions:desktop.failedAssertionCount+mobile.failedAssertionCount,criticalBrowserFailures:desktop.criticalFailureCount+mobile.criticalFailureCount},desktop,mobile}; fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2)); const md=['# TheCareers Browser QA','',`Target: ${target}`,`Generated: ${report.generatedAt}`,`Failed assertions: ${report.summary.failedAssertions}`,`Critical browser/network failures: ${report.summary.criticalBrowserFailures}`,'',...[desktop,mobile].flatMap(r=>[`## ${r.mode}`,...r.assertions.map(a=>`- ${a.ok?'✅':'❌'} ${a.name}${a.details?` — ${a.details}`:''}`),...(r.failures.length?['','Browser/network findings:',...r.failures.map(f=>`- ${f.critical?'❌':'⚠️'} ${f.type}: ${f.status||''} ${f.url||''} ${f.message||''}`)]:[]),''])].join('\n'); fs.writeFileSync(path.join(outDir,'report.md'),md); if(report.summary.failedAssertions>0||report.summary.criticalBrowserFailures>0) process.exitCode=2; })();
