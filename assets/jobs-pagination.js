/* TheCareers job-list quality + pagination
   - exactly 10 jobs per page
   - clear title/company/location hierarchy
   - explicit View Job + Save actions with no overlap
   - client-side legacy quality gate + dedupe
   - Jobs Found remains the total active-job count
*/
(() => {
  'use strict';
  if (window.__TC_JOBS_PAGINATION__) return;
  window.__TC_JOBS_PAGINATION__ = true;

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let lastSignature = '';
  let applying = false;
  let enhancing = false;
  let activeJobsTotal = null;

  const style = document.createElement('style');
  style.id = 'tc-jobs-pagination-style';
  style.textContent = `
    /* One source of truth for opportunity-card layout. */
    #jobList.job-list,#jobList{
      width:100%!important;max-width:100%!important;min-width:0!important;
      display:grid!important;grid-template-columns:1fr!important;gap:10px!important;
      padding:10px 14px 16px!important;overflow:visible!important;
    }

    .row-opps .job-row.backend-job,
    .job-row.backend-job{
      position:relative!important;float:none!important;inset:auto!important;transform:none!important;
      width:100%!important;max-width:100%!important;min-width:0!important;min-height:94px!important;
      box-sizing:border-box!important;margin:0!important;padding:14px 16px!important;
      display:grid!important;
      grid-template-columns:54px minmax(0,1fr) 112px 228px!important;
      grid-template-areas:"logo main score actions"!important;
      align-items:center!important;column-gap:15px!important;row-gap:8px!important;
      overflow:hidden!important;background:#fff!important;
      border:1px solid #e7eaee!important;border-radius:16px!important;
      box-shadow:0 2px 5px rgba(20,22,26,.025),0 12px 28px -25px rgba(20,22,26,.36)!important;
      cursor:default!important;transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease!important;
    }
    .row-opps .job-row.backend-job:hover,.job-row.backend-job:hover{
      background:#fff!important;border-color:#d8dde4!important;
      box-shadow:0 3px 8px rgba(20,22,26,.04),0 18px 38px -28px rgba(20,22,26,.44)!important;
      transform:translateY(-1px)!important;
    }

    .row-opps .job-row.backend-job .job-logo,.job-row.backend-job .job-logo{
      grid-area:logo!important;width:48px!important;height:48px!important;min-width:48px!important;
      margin:0!important;border-radius:13px!important;display:grid!important;place-items:center!important;
      color:#fff!important;font-size:12px!important;font-weight:800!important;letter-spacing:.02em!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)!important;
    }
    .row-opps .job-row.backend-job .job-main,.job-row.backend-job .job-main{
      grid-area:main!important;display:block!important;min-width:0!important;width:100%!important;overflow:visible!important;
    }
    .row-opps .job-row.backend-job .job-main .title,.job-row.backend-job .job-main .title{
      display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;
      white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important;overflow-wrap:anywhere!important;
      margin:0 0 4px!important;color:#0b0c0e!important;font-size:17px!important;line-height:1.24!important;
      font-weight:800!important;letter-spacing:-.012em!important;
    }
    .row-opps .job-row.backend-job .job-main .company,.job-row.backend-job .job-main .company{
      display:block!important;min-width:0!important;margin:0 0 7px!important;
      color:#4c535d!important;font-size:12.4px!important;line-height:1.3!important;font-weight:700!important;
      white-space:normal!important;overflow-wrap:anywhere!important;
    }
    .row-opps .job-row.backend-job .job-meta,.job-row.backend-job .job-meta{
      display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px 12px!important;
      min-width:0!important;margin:0!important;color:#737a84!important;font-size:10.8px!important;line-height:1.35!important;
      white-space:normal!important;overflow:visible!important;
    }
    .row-opps .job-row.backend-job .job-meta span,.job-row.backend-job .job-meta span{
      min-width:0!important;max-width:100%!important;white-space:normal!important;
    }
    .row-opps .job-row.backend-job .tc-job-date,.job-row.backend-job .tc-job-date{
      display:block!important;margin-top:7px!important;color:#9298a1!important;font-size:10px!important;line-height:1.25!important;font-weight:550!important;
      text-align:left!important;white-space:normal!important;
    }

    .row-opps .job-row.backend-job .job-score,.job-row.backend-job .job-score{
      grid-area:score!important;position:static!important;float:none!important;min-width:0!important;width:auto!important;
      padding:0!important;margin:0!important;text-align:center!important;align-self:center!important;
    }
    .row-opps .job-row.backend-job .job-score .pct,.job-row.backend-job .job-score .pct{
      color:#111318!important;font-size:18px!important;line-height:1.05!important;font-weight:800!important;
    }
    .row-opps .job-row.backend-job .job-score .lbl,.job-row.backend-job .job-score .lbl{
      margin-top:4px!important;color:#8b919a!important;font-size:9px!important;line-height:1.1!important;font-weight:650!important;text-transform:none!important;
    }
    .row-opps .job-row.backend-job .tc-job-status,.job-row.backend-job .tc-job-status{display:none!important}

    .row-opps .job-row.backend-job .job-actions,.job-row.backend-job .job-actions{
      grid-area:actions!important;position:static!important;inset:auto!important;float:none!important;transform:none!important;
      width:100%!important;min-width:0!important;height:auto!important;margin:0!important;padding:0!important;
      display:grid!important;grid-template-columns:minmax(112px,1.2fr) minmax(88px,.8fr)!important;
      align-items:center!important;justify-content:stretch!important;gap:8px!important;overflow:visible!important;
    }
    .row-opps .job-row.backend-job .job-actions .tc-job-btn,.job-row.backend-job .job-actions .tc-job-btn{
      position:static!important;float:none!important;inset:auto!important;transform:none!important;
      width:100%!important;max-width:none!important;min-width:0!important;height:42px!important;min-height:42px!important;
      margin:0!important;padding:0 13px!important;box-sizing:border-box!important;border-radius:11px!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;
      font-family:Inter,system-ui,sans-serif!important;font-size:12.5px!important;line-height:1!important;font-weight:800!important;
      white-space:nowrap!important;text-decoration:none!important;cursor:pointer!important;z-index:2!important;
      transition:background .15s ease,border-color .15s ease,box-shadow .15s ease!important;
    }
    .row-opps .job-row.backend-job .job-actions .tc-view-job,.job-row.backend-job .job-actions .tc-view-job{
      background:#111318!important;color:#fff!important;border:1px solid #111318!important;
      box-shadow:0 6px 16px -12px rgba(0,0,0,.7)!important;
    }
    .row-opps .job-row.backend-job .job-actions .tc-view-job:hover,.job-row.backend-job .job-actions .tc-view-job:hover{
      background:#000!important;border-color:#000!important;
    }
    .row-opps .job-row.backend-job .job-actions .tc-save-job,.job-row.backend-job .job-actions .tc-save-job{
      background:#fff!important;color:#30353c!important;border:1px solid #dce1e7!important;
    }
    .row-opps .job-row.backend-job .job-actions .tc-save-job:hover,.job-row.backend-job .job-actions .tc-save-job:hover{
      background:#f7f8fa!important;border-color:#c9d0d8!important;
    }
    .row-opps .job-row.backend-job .job-actions .tc-save-job.tc-saved,.job-row.backend-job .job-actions .tc-save-job.tc-saved{
      background:#eef8f3!important;color:#14764a!important;border-color:#cce8da!important;
    }

    .tc-jobs-pagination{
      display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;
      width:100%;padding:18px 10px 20px;border-top:1px solid #eef0f2;
    }
    .tc-page-btn{
      min-width:40px;height:40px;padding:0 11px;border:1px solid #e0e4e9;border-radius:10px;
      background:#fff;color:#555c66;font:750 11px 'JetBrains Mono',monospace;
      display:inline-grid;place-items:center;cursor:pointer;transition:all .15s ease;
    }
    .tc-page-btn.tc-page-nav{min-width:84px;font-family:Inter,sans-serif;font-size:11px}
    .tc-page-btn:hover{border-color:#b9c3cf;background:#f7f9fb;color:#111318}
    .tc-page-btn.active{background:#111318;color:#fff;border-color:#111318;box-shadow:0 7px 17px -12px rgba(0,0,0,.65)}
    .tc-page-btn:disabled{opacity:.34;cursor:default}
    .tc-page-ellipsis{min-width:22px;text-align:center;color:#8b919a;font:700 11px 'JetBrains Mono',monospace}
    .tc-page-summary{width:100%;margin-top:3px;text-align:center;color:#8b919a;font-size:10px}
    .tc-country-empty{width:100%;margin:0;padding:16px;border:1px dashed #dcdfe3;border-radius:12px;background:#fbfbfc;color:#5b6068;font-size:11px;text-align:center}

    @media(max-width:1180px){
      .row-opps .job-row.backend-job,.job-row.backend-job{
        grid-template-columns:50px minmax(0,1fr) 96px 206px!important;column-gap:12px!important;padding:13px 14px!important;
      }
      .row-opps .job-row.backend-job .job-main .title,.job-row.backend-job .job-main .title{font-size:16px!important}
      .row-opps .job-row.backend-job .job-actions,.job-row.backend-job .job-actions{grid-template-columns:minmax(104px,1.15fr) minmax(82px,.85fr)!important}
    }

    @media(max-width:900px){
      #jobList.job-list,#jobList{padding-left:10px!important;padding-right:10px!important}
      .row-opps .job-row.backend-job,.job-row.backend-job{
        grid-template-columns:48px minmax(0,1fr) 92px!important;
        grid-template-areas:"logo main score" "logo actions actions"!important;
        align-items:start!important;row-gap:10px!important;padding:13px!important;
      }
      .row-opps .job-row.backend-job .job-actions,.job-row.backend-job .job-actions{max-width:300px!important;justify-self:end!important}
    }

    @media(max-width:760px){
      #jobList.job-list,#jobList{width:100%!important;max-width:100%!important;padding:8px 8px 14px!important;gap:9px!important;overflow-x:hidden!important}
      .row-opps .job-row.backend-job,.job-row.backend-job{
        grid-template-columns:44px minmax(0,1fr)!important;
        grid-template-areas:"logo main" "score score" "actions actions"!important;
        width:100%!important;max-width:100%!important;min-height:0!important;
        padding:13px 11px!important;column-gap:10px!important;row-gap:10px!important;border-radius:14px!important;
      }
      .row-opps .job-row.backend-job .job-logo,.job-row.backend-job .job-logo{width:42px!important;height:42px!important;min-width:42px!important;border-radius:11px!important;font-size:11px!important}
      .row-opps .job-row.backend-job .job-main .title,.job-row.backend-job .job-main .title{font-size:15px!important;line-height:1.28!important;margin-bottom:4px!important}
      .row-opps .job-row.backend-job .job-main .company,.job-row.backend-job .job-main .company{font-size:11.5px!important;margin-bottom:6px!important}
      .row-opps .job-row.backend-job .job-meta,.job-row.backend-job .job-meta{gap:5px 8px!important;font-size:10px!important}
      .row-opps .job-row.backend-job .job-score,.job-row.backend-job .job-score{
        display:flex!important;align-items:baseline!important;justify-content:flex-start!important;gap:7px!important;
        width:100%!important;text-align:left!important;padding-left:52px!important;
      }
      .row-opps .job-row.backend-job .job-score .pct,.job-row.backend-job .job-score .pct{font-size:16px!important}
      .row-opps .job-row.backend-job .job-score .lbl,.job-row.backend-job .job-score .lbl{margin:0!important}
      .row-opps .job-row.backend-job .job-actions,.job-row.backend-job .job-actions{
        width:100%!important;max-width:none!important;justify-self:stretch!important;
        grid-template-columns:1.15fr .85fr!important;gap:8px!important;
      }
      .row-opps .job-row.backend-job .job-actions .tc-job-btn,.job-row.backend-job .job-actions .tc-job-btn{
        width:100%!important;height:44px!important;min-height:44px!important;padding:0 9px!important;font-size:12.5px!important;border-radius:10px!important;
      }
      .tc-jobs-pagination{gap:5px;padding:14px 4px 18px}
      .tc-page-btn{min-width:40px;height:44px;padding:0 8px;font-size:10px}
      .tc-page-btn.tc-page-nav{min-width:76px;font-size:10.5px}
      .tc-page-summary{font-size:9.5px}
      .tc-job-note{margin-left:0!important;margin-right:0!important}
    }

    @media(max-width:390px){
      .row-opps .job-row.backend-job,.job-row.backend-job{grid-template-columns:40px minmax(0,1fr)!important;padding:12px 9px!important;column-gap:8px!important}
      .row-opps .job-row.backend-job .job-logo,.job-row.backend-job .job-logo{width:38px!important;height:38px!important;min-width:38px!important}
      .row-opps .job-row.backend-job .job-score,.job-row.backend-job .job-score{padding-left:46px!important}
      .row-opps .job-row.backend-job .job-actions,.job-row.backend-job .job-actions{grid-template-columns:1fr 1fr!important}
      .tc-page-btn.tc-page-nav{min-width:70px;padding:0 6px}
    }
  `;
  document.head.appendChild(style);

  function clean(v=''){return String(v||'').replace(/\s+/g,' ').trim();}
  function simpleKey(v=''){return clean(v).toLowerCase().replace(/&amp;/g,'&').replace(/[^a-z0-9\u0600-\u06ff]+/g,' ').trim();}
  function decodeEntities(v=''){
    const el=document.createElement('textarea');
    el.innerHTML=String(v||'');
    return el.value;
  }

  const exactBadTitles=new Set([
    'privacy','privacy policy','terms','terms of use','legal','newsletter','language','login','register','welcome',
    'careers','career','jobs','job','our schools','view details','view detail','view role','book a service',
    'saved jobs','my saved jobs','jobs near you','skip to main content','skip to content','home','menu','sitemap',
    'products','product','categories','category','services','about us','contact us','quick links','read more','learn more'
  ]);

  function collapseRepeatedTitle(value){
    let t=clean(value);
    const parts=t.split(/\s*(?:\||•|—|–)\s*/).filter(Boolean);
    if(parts.length===2&&simpleKey(parts[0])&&simpleKey(parts[0])===simpleKey(parts[1]))t=parts[0];
    const words=t.split(/\s+/);
    if(words.length>=4&&words.length%2===0){
      const half=words.length/2;
      if(simpleKey(words.slice(0,half).join(' '))===simpleKey(words.slice(half).join(' ')))t=words.slice(0,half).join(' ');
    }
    return clean(t);
  }

  function sanitizeTitle(value){
    let t=decodeEntities(clean(value)).replace(/<[^>]*>/g,' ');
    t=clean(t).replace(/[↗→]+$/g,'').trim();
    t=t.replace(/\b(?:view\s+details?|view\s+role|apply\s+now)\b/gi,' ');
    t=t.replace(/(?:\s*[|•–—-]\s*)?(?:closing\s*date|job\s*id|requisition\s*(?:id|number|no\.?)?|reference\s*(?:id|number|no\.?)?)\s*[:#-]?\s*[^|•]*$/gi,' ');
    t=t.replace(/\b\d{7,}\b/g,' ');
    t=collapseRepeatedTitle(clean(t).replace(/\s*([|•–—-])\s*$/g,''));
    if(!t||t.length<3||t.length>180)return '';
    const key=simpleKey(t);
    if(exactBadTitles.has(key))return '';
    if(/^(?:apply|search|browse|find|view)\s+(?:for\s+)?(?:jobs?|careers?|vacancies|roles?)(?:\b.*)?$/i.test(t))return '';
    if(/\b(?:privacy|cookie\s+policy|copyright|trademark|terms\s+of\s+use|legal\s+(?:notice|disclosure)|newsletter|site\s+map|navigation)\b/i.test(t))return '';
    if(/^(?:all\s+)?(?:products?|categories?|departments?|industries|sectors|locations?|languages?)$/i.test(t))return '';
    return t;
  }

  function safeJobUrl(value){
    try{
      const raw=clean(value);
      if(!raw||/(?:^|\/)null(?:$|[/?#])/i.test(raw)||/(?:^|\/)undefined(?:$|[/?#])/i.test(raw))return '';
      const u=new URL(raw,location.href);
      if(!['https:','http:'].includes(u.protocol))return '';
      if(/\/(?:privacy|terms|legal|login|register|newsletter)(?:\/|$)/i.test(u.pathname))return '';
      if((u.pathname==='/'||!u.pathname)&&!u.search)return '';
      return u.href;
    }catch(_){return '';}
  }

  function canonicalUrl(value){
    const href=safeJobUrl(value);
    if(!href)return '';
    try{
      const u=new URL(href);
      u.hash='';
      [...u.searchParams.keys()].forEach(k=>{if(/^(?:utm_|fbclid$|gclid$|trk$|tracking$|ref$|source$|src$)/i.test(k))u.searchParams.delete(k);});
      u.pathname=u.pathname.replace(/\/$/,'')||'/';
      return u.href.toLowerCase();
    }catch(_){return href.toLowerCase();}
  }

  function getList(){return document.getElementById('jobList');}
  function allRows(){return Array.from(getList()?.querySelectorAll(':scope > .backend-job')||[]);}
  function rowLocation(row){
    const first=row.querySelector('.job-meta span:first-child')?.textContent||'';
    return clean(first.replace(/^[\s📍]+/u,''));
  }

  function enhanceRows(){
    if(enhancing)return;
    const list=getList();
    if(!list)return;
    enhancing=true;
    try{
      const seenUrls=new Set();
      const seenIdentity=new Set();
      for(const row of Array.from(list.querySelectorAll(':scope > .backend-job'))){
        const main=row.querySelector('.job-main');
        const titleEl=main?.querySelector('.title');
        const companyEl=main?.querySelector('.company');
        const title=sanitizeTitle(titleEl?.textContent||'');
        const company=clean(companyEl?.textContent||'');
        const locationText=rowLocation(row);
        const url=safeJobUrl(row.dataset.jobUrl||row.querySelector('.tc-open-job')?.getAttribute('href')||'');
        const companyKey=simpleKey(company);
        const locationKey=simpleKey(locationText);
        const badCompany=!company||company.length<2||/^(?:unknown(?:\s+company)?|n\/?a|null|undefined|company|hr|jobs?|careers?|candidate\s+experience\s+site)$/i.test(company);
        const badLocation=!locationText||/^(?:unknown|n\/?a|null|undefined|location)$/i.test(locationText);
        if(!title||badCompany||badLocation||!url){row.remove();continue;}

        const urlKey=canonicalUrl(url);
        const identityKey=`${companyKey}|${simpleKey(title)}|${locationKey}`;
        if((urlKey&&seenUrls.has(urlKey))||(identityKey&&seenIdentity.has(identityKey))){row.remove();continue;}
        if(urlKey)seenUrls.add(urlKey);
        if(identityKey)seenIdentity.add(identityKey);

        titleEl.textContent=title;
        row.dataset.jobUrl=url;
        row.dataset.tcEnhanced='1';
        row.removeAttribute('tabindex');
        row.setAttribute('role','article');
        row.setAttribute('aria-label',`${title} at ${company}`);

        const scoreLabel=row.querySelector('.job-score .lbl');
        if(scoreLabel)scoreLabel.textContent='Match Score';

        const badge=row.querySelector('.badge');
        const status=badge?.parentElement;
        if(status)status.classList.add('tc-job-status');
        const time=status?.querySelector('.job-time');
        if(time&&main&&time.parentElement!==main){
          time.classList.add('tc-job-date');
          time.textContent=`Date Posted · ${clean(time.textContent)||'Recently'}`;
          main.appendChild(time);
        }

        const actions=row.querySelector('.job-actions');
        const save=actions?.querySelector('.tc-save-job');
        const open=actions?.querySelector('.tc-open-job');
        if(open){
          open.classList.remove('icon-btn');
          open.classList.add('tc-job-btn','tc-view-job');
          open.textContent='View Job';
          open.href=url;
          open.target='_blank';
          open.rel='noopener noreferrer';
          open.title='View Job';
          open.setAttribute('aria-label',`View ${title} at ${company}`);
        }
        if(save){
          save.classList.remove('icon-btn');
          save.classList.add('tc-job-btn');
          const saved=save.classList.contains('tc-saved');
          save.textContent=saved?'Saved':'Save';
          save.title=saved?'Saved job':'Save job';
          save.setAttribute('aria-label',saved?`Saved ${title}`:`Save ${title}`);
        }
        if(actions&&open&&save&&actions.firstElementChild!==open)actions.insertBefore(open,save);

        /* Keep navigation explicit: only View Job opens the external vacancy.
           This prevents the row-level legacy click handler from competing with
           the visible action buttons. */
        if(!row.dataset.tcActionGuard){
          row.dataset.tcActionGuard='1';
          row.addEventListener('click',e=>{
            if(!e.target.closest('a,button'))e.stopImmediatePropagation();
          },true);
          row.addEventListener('keydown',e=>{
            if(e.target.closest('a,button'))e.stopPropagation();
          },true);
        }
      }
    }finally{enhancing=false;}
  }

  function countryKey(row){
    const text=rowLocation(row).toLowerCase();
    if(/kuwait|الكويت/.test(text))return 'kuwait';
    if(/united arab emirates|\buae\b|dubai|abu dhabi|sharjah|الإمارات/.test(text))return 'uae';
    if(/saudi|riyadh|jeddah|dammam|khobar|السعودية/.test(text))return 'saudi';
    if(/qatar|doha|قطر/.test(text))return 'qatar';
    if(/oman|muscat|duqm|salalah|عمان/.test(text))return 'oman';
    if(/bahrain|manama|البحرين/.test(text))return 'bahrain';
    if(/\bgcc\b|gulf|الخليج/.test(text))return 'gcc';
    return 'other';
  }

  function matchedRows(){
    enhanceRows();
    const selected=document.documentElement.dataset.tcCountryFilter||'all';
    const items=allRows();
    if(selected==='all')return items;
    if(selected==='gcc')return items.filter(r=>['kuwait','uae','saudi','qatar','oman','bahrain','gcc'].includes(countryKey(r)));
    return items.filter(r=>countryKey(r)===selected);
  }

  function signature(items){
    const selected=document.documentElement.dataset.tcCountryFilter||'all';
    return selected+'::'+items.map(r=>`${r.dataset.jobId||''}|${canonicalUrl(r.dataset.jobUrl||'')}`).join('~');
  }

  function ensurePager(list){
    let pager=document.getElementById('tcJobsPagination');
    if(!pager){
      pager=document.createElement('nav');
      pager.id='tcJobsPagination';
      pager.className='tc-jobs-pagination';
      pager.setAttribute('aria-label','Job result pages');
      list.insertAdjacentElement('afterend',pager);
    }
    return pager;
  }

  function pageTokens(page,total){
    if(total<=7)return Array.from({length:total},(_,i)=>i+1);
    const out=[1];
    const start=Math.max(2,page-1),end=Math.min(total-1,page+1);
    if(start>2)out.push('…');
    for(let p=start;p<=end;p++)out.push(p);
    if(end<total-1)out.push('…');
    out.push(total);
    return out;
  }

  function renderPager(pager,totalItems,totalPages){
    if(totalItems===0){
      pager.hidden=false;
      pager.innerHTML='<div class="tc-country-empty">No verified jobs are currently available for this view.</div>';
      return;
    }
    if(totalPages<=1){pager.hidden=true;pager.innerHTML='';return;}
    pager.hidden=false;
    const tokenHtml=pageTokens(currentPage,totalPages).map(token=>{
      if(token==='…')return '<span class="tc-page-ellipsis" aria-hidden="true">…</span>';
      const label=String(token).padStart(2,'0');
      return `<button class="tc-page-btn${token===currentPage?' active':''}" type="button" data-page="${token}" aria-label="Page ${token}" ${token===currentPage?'aria-current="page"':''}>${label}</button>`;
    }).join('');
    const start=(currentPage-1)*PAGE_SIZE+1;
    const end=Math.min(totalItems,currentPage*PAGE_SIZE);
    pager.innerHTML=`<button class="tc-page-btn tc-page-nav" type="button" data-step="prev" aria-label="Previous page" ${currentPage===1?'disabled':''}>Previous</button>${tokenHtml}<button class="tc-page-btn tc-page-nav" type="button" data-step="next" aria-label="Next page" ${currentPage===totalPages?'disabled':''}>Next</button><div class="tc-page-summary">Showing ${start}–${end} of ${totalItems.toLocaleString()} verified jobs</div>`;
  }

  function apply({resetIfChanged=true,scroll=false}={}){
    if(applying)return;
    const list=getList();
    if(!list)return;
    applying=true;
    try{
      enhanceRows();
      const matched=matchedRows();
      const visibleSet=new Set(matched);
      const sig=signature(matched);
      if(resetIfChanged&&sig!==lastSignature)currentPage=1;
      lastSignature=sig;

      const totalPages=Math.max(1,Math.ceil(matched.length/PAGE_SIZE));
      currentPage=Math.min(Math.max(1,currentPage),totalPages);
      const from=(currentPage-1)*PAGE_SIZE,to=from+PAGE_SIZE;

      allRows().forEach(row=>{
        const idx=matched.indexOf(row);
        const show=visibleSet.has(row)&&idx>=from&&idx<to;
        row.style.setProperty('display',show?'grid':'none','important');
        row.setAttribute('aria-hidden',show?'false':'true');
      });

      const pager=ensurePager(list);
      renderPager(pager,matched.length,totalPages);
      if(scroll)list.scrollIntoView({behavior:'smooth',block:'start'});
    }finally{applying=false;}
  }

  function syncJobsFoundTotal(){
    if(!Number.isFinite(activeJobsTotal))return;
    const value=Number(activeJobsTotal).toLocaleString();
    const stat=document.getElementById('statJobs');
    if(stat&&stat.textContent!==value)stat.textContent=value;
    const donutNum=document.querySelector('.donut-center .num');
    if(donutNum&&donutNum.textContent!==value)donutNum.textContent=value;
  }

  async function refreshActiveJobsTotal(){
    const cfg=window.THECAREERS_CONFIG||{};
    if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY)return;
    try{
      const base=cfg.SUPABASE_URL.replace(/\/$/,'');
      const res=await fetch(`${base}/rest/v1/jobs?select=id&status=eq.active`,{
        method:'HEAD',
        headers:{apikey:cfg.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,Prefer:'count=exact',Range:'0-0'}
      });
      const range=res.headers.get('content-range')||'';
      const m=range.match(/\/(\d+)$/);
      if(res.ok&&m){activeJobsTotal=Number(m[1]);syncJobsFoundTotal();}
    }catch(err){console.warn('[TheCareers] Jobs Found count refresh failed',err);}
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('#tcJobsPagination .tc-page-btn');
    if(!btn||btn.disabled)return;
    const total=Math.max(1,Math.ceil(matchedRows().length/PAGE_SIZE));
    if(btn.dataset.page)currentPage=Number(btn.dataset.page);
    else if(btn.dataset.step==='prev')currentPage=Math.max(1,currentPage-1);
    else if(btn.dataset.step==='next')currentPage=Math.min(total,currentPage+1);
    apply({resetIfChanged:false,scroll:true});
  });

  document.addEventListener('click',e=>{
    if(e.target.closest('.tab,.filter-btn,.select-like,.source-chip,.leg-row[data-sector],.net-node')){
      currentPage=1;
      setTimeout(()=>apply({resetIfChanged:false}),80);
    }
  },true);

  document.addEventListener('tc:country-filter-change',()=>{
    currentPage=1;
    apply({resetIfChanged:false,scroll:false});
  });

  function boot(){
    const list=getList();
    if(!list)return setTimeout(boot,120);
    enhanceRows();
    const observer=new MutationObserver(()=>{
      if(applying||enhancing)return;
      requestAnimationFrame(()=>{
        enhanceRows();
        apply({resetIfChanged:true});
        syncJobsFoundTotal();
      });
    });
    observer.observe(list,{childList:true});

    const stat=document.getElementById('statJobs');
    if(stat)new MutationObserver(syncJobsFoundTotal).observe(stat,{childList:true,characterData:true,subtree:true});

    apply({resetIfChanged:true});
    refreshActiveJobsTotal();
    setInterval(refreshActiveJobsTotal,60000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
