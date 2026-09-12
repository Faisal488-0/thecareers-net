/* TheCareers — personalized CV High Match controller
   Makes High Match account-specific instead of using the generic backend relevance score.
   Requires an analyzed CV and applies a 70% threshold plus the selected/home country.
*/
(() => {
  'use strict';
  if (window.__TC_CV_HIGH_MATCH__) return;
  window.__TC_CV_HIGH_MATCH__ = true;

  const THRESHOLD = 70;
  const PAGE_SIZE = 10;
  let highMode = false;
  let highPage = 1;
  let bypassTab = false;
  let scheduled = 0;
  let listObserver = null;

  const style = document.createElement('style');
  style.id = 'tc-cv-high-match-style';
  style.textContent = `
    .tab[data-tab="high"].tc-personalized-high::after{content:"CV";display:inline-grid;place-items:center;margin-left:6px;min-width:18px;height:16px;padding:0 4px;border-radius:999px;background:#eef8f3;color:#15784b;font:800 8px 'JetBrains Mono',monospace;vertical-align:1px}
    .tab[data-tab="high"].active.tc-personalized-high::after{background:rgba(31,181,103,.16);color:#15965a}
    .tc-high-empty{margin:10px 14px 14px;padding:18px 16px;border:1px dashed #d9e1ea;border-radius:13px;background:#fbfcfe;color:#5c6674;font-size:11px;line-height:1.6;text-align:center}
    .tc-high-empty b{display:block;color:#15191f;font-size:12px;margin-bottom:4px}
  `;
  document.head.appendChild(style);

  const clean = (v='') => String(v || '').toLowerCase().replace(/[^a-z0-9+#.\u0600-\u06ff ]/g,' ').replace(/\s+/g,' ').trim();
  const words = v => new Set(clean(v).split(/\s+/).filter(Boolean));
  const account = () => window.TheCareersAccount || {};
  const analysis = () => account().analysis || null;

  const roleStop = new Set(['specialist','officer','manager','coordinator','assistant','senior','junior','lead','head','director','administrator','executive','professional','consultant','associate','supervisor']);
  const conceptDefs = [
    ['hr', /\bhr\b|human resources|recruit|talent|employee relations|payroll|onboarding/i],
    ['admin', /admin|administration|administrator|office|clerical|secretar/i],
    ['operations', /operation|operations|logistic|supply chain|procurement|warehouse|fleet/i],
    ['education', /teach|teacher|teaching|education|educator|academic|school|university|curriculum|mathematics|math\b/i],
    ['finance', /finance|financial|account|accounting|audit|budget|treasury/i],
    ['it', /information technology|\bit\b|software|developer|data|network|cyber|systems?/i],
    ['engineering', /engineer|engineering|civil|mechanical|electrical|maintenance/i],
    ['sales', /sales|business development|commercial|account executive|customer success/i],
    ['oilgas', /oil|gas|petroleum|drilling|pipeline|refiner|hse/i]
  ];

  function concepts(text){
    const out=new Set();
    for(const [name,re] of conceptDefs) if(re.test(text)) out.add(name);
    return out;
  }
  function overlap(a,b){let n=0;for(const x of a)if(b.has(x))n++;return n;}

  function rowLocation(row){
    const first=row.querySelector('.job-meta span:first-child')?.textContent||'';
    return first.replace(/^[\s📍]+/u,'').trim();
  }
  function countryKeyFromText(value){
    const text=String(value||'').toLowerCase();
    if(/kuwait|الكويت/.test(text))return 'kuwait';
    if(/united arab emirates|\buae\b|dubai|abu dhabi|sharjah|الإمارات/.test(text))return 'uae';
    if(/saudi|riyadh|jeddah|dammam|khobar|السعودية/.test(text))return 'saudi';
    if(/qatar|doha|قطر/.test(text))return 'qatar';
    if(/oman|muscat|duqm|salalah|عمان/.test(text))return 'oman';
    if(/bahrain|manama|البحرين/.test(text))return 'bahrain';
    if(/\bgcc\b|gulf|الخليج/.test(text))return 'gcc';
    return 'other';
  }
  function timezoneCountry(){
    let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch{}
    const map={
      'Asia/Kuwait':'kuwait','Asia/Riyadh':'saudi','Asia/Dubai':'uae',
      'Asia/Qatar':'qatar','Asia/Muscat':'oman','Asia/Bahrain':'bahrain'
    };
    return map[tz]||'';
  }
  function namedCountry(value){
    const text=String(value||'').toLowerCase();
    if(/kuwait/.test(text))return 'kuwait';
    if(/united arab emirates|uae|emirates/.test(text))return 'uae';
    if(/saudi/.test(text))return 'saudi';
    if(/qatar/.test(text))return 'qatar';
    if(/oman/.test(text))return 'oman';
    if(/bahrain/.test(text))return 'bahrain';
    return '';
  }
  function homeCountry(){
    const profile=account().profile||{};
    const direct=namedCountry(profile.country||profile.location||profile.current_country||'');
    if(direct)return direct;
    const tz=timezoneCountry();if(tz)return tz;
    const prefs=account().preferences||{};
    const countries=Array.isArray(prefs.countries)?prefs.countries:[];
    if(countries.length===1)return namedCountry(countries[0]);
    return '';
  }
  function selectedCountry(){
    const selected=document.documentElement.dataset.tcCountryFilter||'all';
    if(selected!=='all'&&selected!=='gcc')return selected;
    return homeCountry()||selected;
  }

  function sectorConcepts(text){return concepts(clean(text));}
  function cvScore(row){
    const a=analysis();if(!a)return 0;
    const title=row.querySelector('.title')?.textContent||'';
    const company=row.querySelector('.company')?.textContent||'';
    const meta=row.querySelector('.job-meta')?.textContent||'';
    const titleText=clean(title), allText=clean(`${title} ${company} ${meta}`);
    const titleWords=words(titleText), allWords=words(allText), jobConcepts=concepts(allText);

    let roleScore=0;
    for(const targetRaw of (a.inferred_titles||[])){
      const target=clean(targetRaw);if(!target)continue;
      if(titleText.includes(target)){roleScore=Math.max(roleScore,60);continue;}
      const targetConcepts=concepts(target);
      if(targetConcepts.size&&overlap(targetConcepts,jobConcepts)>0){roleScore=Math.max(roleScore,55);continue;}
      const domain=new Set([...words(target)].filter(w=>!roleStop.has(w)&&w.length>2));
      if(domain.size){
        const hits=overlap(domain,titleWords);
        if(hits===domain.size)roleScore=Math.max(roleScore,52);
        else if(hits>0)roleScore=Math.max(roleScore,Math.min(45,30+hits*8));
      }
    }

    let sectorScore=0;
    const cvSectors=new Set();
    for(const s of (a.industries||[]))for(const c of sectorConcepts(s))cvSectors.add(c);
    if(cvSectors.size&&overlap(cvSectors,jobConcepts)>0)sectorScore=20;

    let skillHits=0;
    for(const skillRaw of (a.skills||[]).slice(0,30)){
      const skill=clean(skillRaw);if(!skill)continue;
      const skillConcept=concepts(skill);
      if(skillConcept.size&&overlap(skillConcept,jobConcepts)>0){skillHits++;continue;}
      const sw=[...words(skill)].filter(w=>w.length>2);
      if(sw.length&&sw.every(w=>allWords.has(w)))skillHits++;
    }
    const skillScore=Math.min(20,skillHits*4);
    return Math.max(0,Math.min(99,roleScore+sectorScore+skillScore));
  }

  function allRows(){return Array.from(document.querySelectorAll('#jobList > .backend-job'));}
  function matchingRows(){
    const country=selectedCountry();
    return allRows().map(row=>({row,score:cvScore(row),country:countryKeyFromText(rowLocation(row))}))
      .filter(x=>x.score>=THRESHOLD&&(country==='all'||country==='gcc'?true:x.country===country))
      .sort((a,b)=>b.score-a.score);
  }
  function decorateRow(row,score){
    row.dataset.tcCvMatch=String(score);
    const pct=row.querySelector('.job-score .pct');if(pct)pct.textContent=`${score}%`;
    const lbl=row.querySelector('.job-score .lbl');if(lbl)lbl.textContent='CV Match';
    const badge=row.querySelector('.badge');if(badge){badge.textContent=score>=THRESHOLD?'CV High Match':'CV Match';badge.classList.toggle('high',score>=THRESHOLD);}
  }
  function updateTabVisual(count){
    const high=document.querySelector('.tab[data-tab="high"]');
    if(high){high.textContent=`High Match (${count.toLocaleString()})`;high.classList.add('tc-personalized-high');}
    document.querySelectorAll('.tab').forEach(t=>{const on=highMode&&t.dataset.tab==='high';if(highMode)t.classList.toggle('active',on);if(highMode)t.setAttribute('aria-pressed',on?'true':'false');});
    const stat=document.getElementById('statHigh');if(stat&&highMode)stat.textContent=count.toLocaleString();
  }
  function renderPager(total){
    const list=document.getElementById('jobList');if(!list)return;
    let pager=document.getElementById('tcJobsPagination');
    if(!pager){pager=document.createElement('nav');pager.id='tcJobsPagination';pager.className='tc-jobs-pagination';list.insertAdjacentElement('afterend',pager);}
    if(total===0){
      const c=selectedCountry();const label={kuwait:'Kuwait',uae:'UAE',saudi:'Saudi Arabia',qatar:'Qatar',oman:'Oman',bahrain:'Bahrain',all:'selected countries',gcc:'GCC'}[c]||'your country';
      pager.hidden=false;pager.innerHTML=`<div class="tc-country-empty"><b>No ${THRESHOLD}%+ CV matches in ${label} right now.</b><br>All Jobs still contains the full live feed; High Match only shows roles that strongly fit your CV.</div>`;return;
    }
    const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));highPage=Math.min(Math.max(1,highPage),pages);
    if(pages<=1){pager.hidden=true;pager.innerHTML='';return;}
    const tokens=[];if(pages<=7){for(let i=1;i<=pages;i++)tokens.push(i)}else{tokens.push(1);const s=Math.max(2,highPage-1),e=Math.min(pages-1,highPage+1);if(s>2)tokens.push('…');for(let i=s;i<=e;i++)tokens.push(i);if(e<pages-1)tokens.push('…');tokens.push(pages)}
    const btns=tokens.map(t=>t==='…'?'<span class="tc-page-ellipsis">…</span>':`<button class="tc-page-btn${t===highPage?' active':''}" type="button" data-cv-high-page="${t}">${String(t).padStart(2,'0')}</button>`).join('');
    const start=(highPage-1)*PAGE_SIZE+1,end=Math.min(total,highPage*PAGE_SIZE);
    pager.hidden=false;pager.innerHTML=`<button class="tc-page-btn tc-page-nav" type="button" data-cv-high-step="prev" ${highPage===1?'disabled':''}>Previous</button>${btns}<button class="tc-page-btn tc-page-nav" type="button" data-cv-high-step="next" ${highPage===pages?'disabled':''}>Next</button><div class="tc-page-summary">Showing ${start}–${end} of ${total.toLocaleString()} CV high matches · ${THRESHOLD}%+ threshold</div>`;
  }

  function applyHigh(){
    scheduled=0;if(!highMode)return;
    const a=analysis();if(!a)return;
    const matches=matchingRows();
    const start=(highPage-1)*PAGE_SIZE,end=start+PAGE_SIZE;
    const visible=new Set(matches.slice(start,end).map(x=>x.row));
    const scoreMap=new Map(matches.map(x=>[x.row,x.score]));
    for(const row of allRows()){
      const score=scoreMap.get(row)??cvScore(row);decorateRow(row,score);
      const show=visible.has(row);row.style.setProperty('display',show?'grid':'none','important');row.setAttribute('aria-hidden',show?'false':'true');
    }
    updateTabVisual(matches.length);renderPager(matches.length);
  }
  function scheduleApply(delay=0){
    if(!highMode)return;clearTimeout(scheduled);scheduled=setTimeout(()=>requestAnimationFrame(applyHigh),delay);
  }

  function syncCountryForHigh(){
    const selected=document.documentElement.dataset.tcCountryFilter||'all';
    if(selected!=='all'&&selected!=='gcc')return;
    const home=homeCountry();if(!home)return;
    const btn=document.querySelector(`.tc-country-btn[data-country="${home}"]`);
    if(btn&&!btn.classList.contains('active'))btn.click();
    else document.documentElement.dataset.tcCountryFilter=home;
  }

  function activateHigh(){
    if(!analysis()){
      window.TheCareersAuth?.cv?.();
      return;
    }
    highMode=true;highPage=1;syncCountryForHigh();
    const all=document.querySelector('.tab[data-tab="all"]');
    if(all){bypassTab=true;all.click();bypassTab=false;}
    scheduleApply(30);scheduleApply(140);
  }
  function leaveHigh(){highMode=false;highPage=1;}

  document.addEventListener('click',e=>{
    const tab=e.target.closest('.tab[data-tab]');
    if(tab&&!bypassTab){
      if(tab.dataset.tab==='high'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();activateHigh();return;
      }
      leaveHigh();return;
    }
    if(!highMode)return;
    const p=e.target.closest('#tcJobsPagination [data-cv-high-page]');
    const step=e.target.closest('#tcJobsPagination [data-cv-high-step]');
    if(p||step){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const total=matchingRows().length,pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
      if(p)highPage=Number(p.dataset.cvHighPage)||1;
      else if(step.dataset.cvHighStep==='prev')highPage=Math.max(1,highPage-1);
      else highPage=Math.min(pages,highPage+1);
      applyHigh();document.getElementById('jobList')?.scrollIntoView({behavior:'smooth',block:'start'});return;
    }
  },true);

  document.addEventListener('tc:country-filter-change',()=>{if(highMode){highPage=1;scheduleApply(20);scheduleApply(120)}});
  window.addEventListener('thecareers:cv-profile-updated',()=>{if(highMode){highPage=1;scheduleApply(30)}});

  function watchList(){
    const list=document.getElementById('jobList');if(!list)return setTimeout(watchList,120);
    listObserver?.disconnect();listObserver=new MutationObserver(()=>{if(highMode){scheduleApply(20);scheduleApply(120)}});listObserver.observe(list,{childList:true});
  }
  function refreshWhenAccountReady(){
    let tries=0;const timer=setInterval(()=>{
      tries++;
      const high=document.querySelector('.tab[data-tab="high"]');if(high)high.classList.toggle('tc-personalized-high',!!analysis());
      if(highMode&&analysis())scheduleApply(0);
      if(tries>80)clearInterval(timer);
    },250);
  }
  function boot(){watchList();refreshWhenAccountReady();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.TheCareersCVHighMatch={
    threshold:THRESHOLD,
    activate:activateHigh,
    refresh:()=>scheduleApply(0),
    scoreRow:cvScore,
    getState:()=>({active:highMode,page:highPage,country:selectedCountry(),threshold:THRESHOLD,matches:highMode?matchingRows().length:null})
  };
})();
