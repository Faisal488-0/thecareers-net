(()=>{'use strict';
if(window.__THECAREERS_COMPLIANCE_NOTICE__)return;window.__THECAREERS_COMPLIANCE_NOTICE__=true;
const ready=()=>{
  const foot=document.querySelector('.sidebar-foot');
  if(foot&&!foot.querySelector('[data-tc-legal]')){
    const links=document.createElement('div');links.dataset.tcLegal='1';links.style.cssText='margin-top:7px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center';
    links.innerHTML='<a href="/privacy.html" style="color:inherit;text-decoration:underline;text-underline-offset:2px">Privacy</a><a href="/terms.html" style="color:inherit;text-decoration:underline;text-underline-offset:2px">Terms</a><a href="/disclaimer.html" style="color:inherit;text-decoration:underline;text-underline-offset:2px">Disclaimer</a>';
    foot.appendChild(links);
  }

  const replaceExact=(selector,from,to)=>document.querySelectorAll(selector).forEach(el=>{if((el.textContent||'').trim()===from)el.textContent=to});
  // Avoid presenting fixed demo labels as verified live facts while preserving the visual layout.
  replaceExact('.source-chip .lbl span','Scanning 892 sites','Company career sources');
  replaceExact('.live-pill','180+ PLATFORMS','MULTIPLE SOURCES');
  replaceExact('.net-node b','LinkedIn','Job Boards');

  // The sector chart was intentionally removed from TheCareers.net.
  const sectorPanel=[...document.querySelectorAll('.row-opps > .panel')].find(panel=>
    [...panel.querySelectorAll('.panel-title')].some(title=>(title.textContent||'').trim().toUpperCase()==='// JOBS BY SECTOR')
  );
  if(sectorPanel){
    const row=sectorPanel.parentElement;
    sectorPanel.remove();
    if(row?.classList.contains('row-opps')) row.style.gridTemplateColumns='minmax(0,1fr)';
  }

  // Remove the live activity card and let the AI core use the full row width.
  const activityPanel=[...document.querySelectorAll('.row-core > .panel')].find(panel=>
    [...panel.querySelectorAll('.panel-title')].some(title=>(title.textContent||'').trim().toUpperCase()==='// LIVE SEARCH ACTIVITY')
  );
  if(activityPanel){
    const row=activityPanel.parentElement;
    activityPanel.remove();
    if(row?.classList.contains('row-core')) row.style.gridTemplateColumns='minmax(0,1fr)';
  }

  // Remove the narrow Search Visualization / metrics sidebar from the AI core.
  const aiCorePanel=[...document.querySelectorAll('.row-core > .panel')].find(panel=>
    [...panel.querySelectorAll('.panel-title')].some(title=>(title.textContent||'').trim().toUpperCase().includes('AI SEARCH CORE'))
  );
  if(aiCorePanel){
    aiCorePanel.querySelector('.metrics-col')?.remove();
    const coreBody=aiCorePanel.querySelector('.core-body');
    if(coreBody) coreBody.style.gridTemplateColumns='minmax(0,1fr)';
    const visualizationHead=[...aiCorePanel.querySelectorAll('.panel-head > div')].find(el=>
      (el.textContent||'').toUpperCase().includes('SEARCH VISUALIZATION')
    );
    visualizationHead?.remove();
  }

  const key='thecareers_privacy_notice_v1';let seen=true;try{seen=localStorage.getItem(key)==='ack'}catch{}
  if(!seen&&!document.getElementById('tcPrivacyNotice')){
    const box=document.createElement('aside');box.id='tcPrivacyNotice';box.setAttribute('role','region');box.setAttribute('aria-label','Privacy and cookie notice');
    box.style.cssText='position:fixed;z-index:2147483000;left:12px;right:12px;bottom:12px;margin:auto;max-width:720px;background:#fff;color:#121417;border:1px solid #dfe3e8;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.16);padding:13px 14px;font:13px/1.55 Inter,Arial,sans-serif';
    box.innerHTML='<div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span style="flex:1 1 440px">TheCareers uses essential browser storage for security, sign-in, saved jobs and preferences. No third-party advertising cookies are enabled by this notice. <a href="/privacy.html#cookies" style="color:#1769e0;font-weight:700">Privacy details</a></span><button type="button" style="border:0;border-radius:9px;padding:8px 14px;background:#121417;color:#fff;font-weight:700;cursor:pointer">Got it</button></div>';
    box.querySelector('button')?.addEventListener('click',()=>{try{localStorage.setItem(key,'ack')}catch{}box.remove()});document.body.appendChild(box);
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();

(()=>{'use strict';
if(document.querySelector('script[data-tc-job-filters-net]'))return;
const s=document.createElement('script');
s.dataset.tcJobFiltersNet='1';
const base=document.currentScript?.src||location.href;
s.src=new URL('./job-filters-panel.js',base).href;
s.async=false;
s.addEventListener('error',()=>console.error('[TheCareers] Job filters failed to load'));
document.head.appendChild(s);
})();

(()=>{'use strict';
if(document.querySelector('script[data-tc-apply-methods]'))return;
const s=document.createElement('script');
s.dataset.tcApplyMethods='1';
const base=document.currentScript?.src||location.href;
s.src=new URL('./apply-method-overlay.js',base).href;
s.defer=true;
s.addEventListener('error',()=>console.error('[TheCareers] Apply method overlay failed to load'));
document.head.appendChild(s);
})();
