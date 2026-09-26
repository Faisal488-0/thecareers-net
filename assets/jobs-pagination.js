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
    .tc-jobs-pagination {
      display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;
      width:100%;padding:18px 10px 20px;border-top:1px solid #eef0f2;
    }
    .tc-page-btn {
      min-width:40px;height:40px;padding:0 11px;border:1px solid #e0e4e9;border-radius:10px;
      background:#fff;color:#555c66;font:750 11px 'JetBrains Mono',monospace;
      display:inline-grid;place-items:center;cursor:pointer;
    }
    .tc-page-btn.tc-page-nav{min-width:84px;font-family:Inter,sans-serif;font-size:11px}
    .tc-page-btn:hover{border-color:#b9c3cf;background:#f7f9fb;color:#111318}
    .tc-page-btn.active{background:#111318;color:#fff;border-color:#111318}
    .tc-page-btn:disabled{opacity:.34;cursor:default}
    .tc-page-ellipsis{min-width:22px;text-align:center;color:#8b919a;font-size:12px}
    .tc-page-summary{width:100%;margin-top:3px;text-align:center;color:#8b919a;font-size:11px}
    .tc-country-empty{width:100%;margin:0;padding:16px;border:1px dashed #dcdfe3;border-radius:12px;background:#fbfbfc;color:#5b6068;font-size:11px;text-align:center}
    .tc-page-btn:focus-visible{outline:3px solid #7baafe;outline-offset:3px}
    @media(max-width:760px){
      .tc-jobs-pagination{gap:5px;padding:14px 4px 18px}
      .tc-page-btn{min-width:40px;height:44px;padding:0 8px}
      .tc-page-btn.tc-page-nav{min-width:76px}
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
    // Level-6 compact cards keep location outside the fact rows.
    const compact=row.querySelector('.tc-card-location')?.textContent;
    if(compact) return clean(compact);
    const dedicated=row.querySelector('.tc-meta-item[data-meta="location"] strong')?.textContent;
    if(dedicated) return clean(dedicated);
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
        const companyEl=main?.querySelector('.company') || row.querySelector('.tc-card-employer b');
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

        // Compact cards have accessible native links and a dedicated CTA order.
        // The legacy row enhancer would rename and reposition their actions.
        if(row.classList.contains('tc-job-compact')) continue;

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
      pager.hidden=true;
      pager.innerHTML='';
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
        row.style.setProperty('display',show?'flex':'none','important');
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
      const res=await fetch(`${base}/rest/v1/jobs?select=id&status=eq.active&verified=eq.true&quality_status=eq.approved`,{
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
