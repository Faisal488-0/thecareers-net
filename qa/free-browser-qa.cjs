const fs = require('fs');
const path = require('path');
const { chromium } = require('/tmp/free-browser-qa/node_modules/playwright');

const target = process.env.TARGET_URL;
if (!target || !/^https?:\/\//i.test(target)) throw new Error('TARGET_URL must be http(s)');
const outDir = path.resolve('qa/free-browser-output');
fs.mkdirSync(outDir, { recursive: true });

function assert(results, name, ok, details = '') {
  results.push({ name, ok: Boolean(ok), details: String(details || '') });
}
function clean(v=''){ return String(v || '').replace(/\s+/g,' ').trim(); }

async function inspectPage(browser, mode, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: 'light' });
  const page = await context.newPage();
  const failures = [];
  const assertions = [];
  const started = Date.now();

  page.on('pageerror', e => failures.push({ type:'pageerror', critical:true, message:String(e.message || e) }));
  page.on('console', m => {
    if (m.type() === 'error') failures.push({ type:'console', critical:true, message:m.text() });
  });
  page.on('requestfailed', r => {
    const u = r.url();
    const message = r.failure()?.errorText || 'failed';
    /* Chromium reports superseded fetches and context-closing telemetry as
       ERR_ABORTED. Those are lifecycle noise, not production outages. */
    const aborted = /ERR_ABORTED/i.test(message);
    const telemetry = /\/rest\/v1\/site_events(?:\?|$)/i.test(u);
    const firstParty = u.startsWith(new URL(target).origin) || /supabase\.co/i.test(u);
    const critical = firstParty && !aborted && !telemetry;
    failures.push({ type:'requestfailed', critical, url:u, message });
  });
  page.on('response', r => {
    if (r.status() >= 400) {
      const u = r.url();
      const telemetry = /\/rest\/v1\/site_events(?:\?|$)/i.test(u);
      const critical = !telemetry && (u.startsWith(new URL(target).origin) || /supabase\.co/i.test(u));
      if (!/favicon\.ico/i.test(u)) failures.push({ type:'http', critical, status:r.status(), url:u });
    }
  });

  const response = await page.goto(target, { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForTimeout(3500);
  const title = await page.title();
  assert(assertions, 'HTTP page response', response && response.status() < 400, response?.status());
  assert(assertions, 'HTTPS target', page.url().startsWith('https://'), page.url());
  assert(assertions, 'Document title', /TheCareers/i.test(title), title);
  assert(assertions, 'Top Opportunities panel', await page.locator('.row-opps').count() > 0);
  assert(assertions, 'Backend role search input', await page.locator('#tcJobTitleSearch').count() === 1);
  assert(assertions, 'Country filter', await page.locator('#tcCountryFilter').count() === 1);
  assert(assertions, 'Opportunity tabs', await page.locator('.row-opps .tab').count() >= 4);
  assert(assertions, 'Sort control', await page.locator('.row-opps .select-like').count() === 1);
  assert(assertions, 'Filter control', await page.locator('.row-opps .filter-btn').count() === 1);

  await page.locator('.backend-job').first().waitFor({ state:'attached', timeout:20000 }).catch(()=>{});
  let cards = await page.locator('.backend-job').count();
  assert(assertions, 'Live job cards loaded', cards > 0, `${cards} cards in DOM`);
  if (cards > 0) {
    const first = page.locator('.backend-job').first();
    assert(assertions, 'Job title visible', clean(await first.locator('.title').textContent()).length >= 3);
    assert(assertions, 'Company visible', clean(await first.locator('.company').textContent()).length >= 2);
    const requiredFacts = ['country','location','type','category','salary','date'];
    for (const key of requiredFacts) {
      const fact = first.locator(`.tc-meta-item[data-meta="${key}"] strong`);
      assert(assertions, `Job fact: ${key}`, await fact.count() === 1 && clean(await fact.textContent()).length > 0, await fact.count() ? clean(await fact.textContent()) : 'missing');
    }
    const view = first.locator('.tc-view-job');
    const href = await view.getAttribute('href').catch(()=>null);
    assert(assertions, 'View Job has safe URL', Boolean(href && /^https?:\/\//i.test(href)), href || 'missing');
    const save = first.locator('.tc-save-job');
    if (await save.count()) {
      const before = clean(await save.textContent());
      await save.click(); await page.waitForTimeout(200);
      const after = clean(await save.textContent());
      assert(assertions, 'Save button toggles', before !== after, `${before} -> ${after}`);
      await save.click().catch(()=>{});
    }
  }

  if (mode === 'desktop') {
    const search = page.locator('#tcJobTitleSearch');
    await search.fill('hr');
    await page.waitForFunction(() => {
      const t = document.querySelector('#tcJobSearchMeta')?.textContent || '';
      return t && !/SEARCHING BACKEND/i.test(t);
    }, { timeout:10000 }).catch(()=>{});
    await page.waitForTimeout(500);
    const searchMeta = clean(await page.locator('#tcJobSearchMeta').textContent().catch(()=>''));
    assert(assertions, 'Backend role search returns status', /RELATED ROLE|BACKEND READY/i.test(searchMeta), searchMeta);
    const visibleTitles = (await page.locator('.backend-job:visible .title').allTextContents()).map(clean).filter(Boolean);
    const rolePattern = /(\bhr\b|human resources|recruit|talent|people partner|people operations|personnel|payroll|compensation|employee relations|workforce)/i;
    const sample = visibleTitles.slice(0,8);
    const relevantSample = sample.filter(t => rolePattern.test(t));
    assert(assertions, 'HR search returns actual HR-related roles', visibleTitles.length > 0 && relevantSample.length >= Math.min(4, sample.length), sample.join(' | '));
    const knownBad = /(marketing manager\/in \(teilzeit.*jahre|master\/ lead nut roaster|e-commerce executive)/i;
    assert(assertions, 'HR search avoids letter/category false-positives', !visibleTitles.some(t => knownBad.test(t)), sample.join(' | '));
    await page.screenshot({ path:path.join(outDir,'search-hr.png'), fullPage:true });

    await search.fill('');
    await page.waitForFunction(() => {
      const t = document.querySelector('#tcJobSearchMeta')?.textContent || '';
      return !/SEARCHING BACKEND/i.test(t);
    }, { timeout:10000 }).catch(()=>{});
    await page.waitForTimeout(500);
    const kuwait = page.locator('.tc-country-btn[data-country="kuwait"]');
    if (await kuwait.count()) {
      await kuwait.click();
      await page.waitForTimeout(1200);
      const countries = (await page.locator('.backend-job:visible .tc-meta-item[data-meta="country"] strong').allTextContents()).map(clean).filter(Boolean);
      assert(assertions, 'Kuwait country filter is backend-consistent', countries.length === 0 || countries.every(x => x === 'Kuwait'), countries.slice(0,10).join(', '));
      await page.locator('.tc-country-btn[data-country="all"]').click(); await page.waitForTimeout(700);
    }

    const filter = page.locator('.row-opps .filter-btn');
    if (await filter.count()) {
      const before = clean(await filter.textContent());
      await filter.click(); await page.waitForTimeout(700);
      const after = clean(await filter.textContent());
      assert(assertions, 'Filters control changes backend mode', before !== after, `${before} -> ${after}`);
    }

    const profile = page.locator('.profile');
    if (await profile.count()) {
      await profile.click().catch(()=>{}); await page.waitForTimeout(350);
      const authSurface = await page.locator('.tc-modal-backdrop,#tcAuthForm,[role="dialog"]').count();
      assert(assertions, 'Profile/auth interaction opens a surface', authSurface > 0, `surfaces=${authSurface}`);
      await page.keyboard.press('Escape').catch(()=>{});
    }
  }

  const overflow = await page.evaluate(() => ({ scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth }));
  assert(assertions, `${mode} horizontal overflow`, overflow.scrollWidth <= overflow.clientWidth + 4, JSON.stringify(overflow));

  const keyFontSizes = await page.evaluate(() => {
    const sels = ['.panel-sub','.stat-sub','.source-chip .lbl span','.job-main .company','.tc-meta-item strong','.tc-meta-item small'];
    return sels.map(sel => { const el=document.querySelector(sel); return {sel,size:el?parseFloat(getComputedStyle(el).fontSize):null}; });
  });
  keyFontSizes.forEach(x => {
    if (x.size != null) assert(assertions, `Readable font ${x.sel}`, x.size >= 9.5, `${x.size}px`);
  });

  const perf = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    return n ? { domContentLoaded:Math.round(n.domContentLoadedEventEnd), load:Math.round(n.loadEventEnd), transferSize:n.transferSize || null } : {};
  });
  await page.screenshot({ path:path.join(outDir,`${mode}.png`), fullPage:true });
  const criticalFailures = failures.filter(x => x.critical);
  const failedAssertions = assertions.filter(x => !x.ok);
  const result = { mode, target:page.url(), status:response?.status() || null, title, elapsedMs:Date.now()-started, perf, assertions, failures:failures.slice(0,100), criticalFailureCount:criticalFailures.length, failedAssertionCount:failedAssertions.length };
  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless:true });
  const desktop = await inspectPage(browser,'desktop',{width:1440,height:1000});
  const mobile = await inspectPage(browser,'mobile',{width:390,height:844});
  await browser.close();

  const report = {
    target,
    generatedAt:new Date().toISOString(),
    engine:'local Chromium + Playwright (no cloud API key)',
    summary:{
      failedAssertions:desktop.failedAssertionCount + mobile.failedAssertionCount,
      criticalBrowserFailures:desktop.criticalFailureCount + mobile.criticalFailureCount
    },
    desktop,
    mobile
  };
  fs.writeFileSync(path.join(outDir,'report.json'), JSON.stringify(report,null,2));
  const md = [
    '# TheCareers Browser QA',
    '',
    `Target: ${target}`,
    `Generated: ${report.generatedAt}`,
    `Failed assertions: ${report.summary.failedAssertions}`,
    `Critical browser/network failures: ${report.summary.criticalBrowserFailures}`,
    '',
    ...[desktop,mobile].flatMap(r => [
      `## ${r.mode}`,
      ...r.assertions.map(a => `- ${a.ok ? '✅' : '❌'} ${a.name}${a.details ? ` — ${a.details}` : ''}`),
      ...(r.failures.length ? ['', 'Browser/network findings:', ...r.failures.map(f => `- ${f.critical ? '❌' : '⚠️'} ${f.type}: ${f.status || ''} ${f.url || ''} ${f.message || ''}`)] : []),
      ''
    ])
  ].join('\n');
  fs.writeFileSync(path.join(outDir,'report.md'), md);
  if (report.summary.failedAssertions > 0 || report.summary.criticalBrowserFailures > 0) process.exitCode = 2;
})();
