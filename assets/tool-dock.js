/* TheCareers visible in-page tool dock */
(() => {
  'use strict';
  if (window.__THECAREERS_TOOL_DOCK__) return;
  window.__THECAREERS_TOOL_DOCK__ = true;

  const style = document.createElement('style');
  style.textContent = `
    .tc-tool-dock{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 14px;padding:10px;border:1px solid #dfe5ec;border-radius:14px;background:linear-gradient(145deg,#ffffff,#f6f8fb);box-shadow:0 8px 24px rgba(20,28,38,.06)}
    .tc-tool-title{font:700 10px/1.1 'JetBrains Mono',monospace;letter-spacing:.08em;color:#6b7280;margin-right:4px}
    .tc-tool-btn{appearance:none;border:1px solid #d9e0e8;background:#fff;color:#111827;border-radius:10px;padding:9px 11px;font:700 11px/1 Inter,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:.16s ease;box-shadow:0 1px 2px rgba(0,0,0,.03)}
    .tc-tool-btn:hover{transform:translateY(-1px);border-color:#b8c4d3;box-shadow:0 5px 14px rgba(20,28,38,.08)}
    .tc-tool-btn.primary{background:#101318;color:#fff;border-color:#101318}
    .tc-tool-btn.green{background:#1fb567;color:#fff;border-color:#1fb567}
    .tc-tool-btn small{font-size:9px;font-weight:600;opacity:.68}
    @media(max-width:760px){.tc-tool-dock{margin:8px 0 12px;padding:8px}.tc-tool-title{width:100%;margin-bottom:2px}.tc-tool-btn{flex:1 1 calc(50% - 8px);justify-content:center;padding:10px 8px}}
  `;
  document.head.appendChild(style);

  function clickNav(page){
    const el=document.querySelector(`.nav-item[data-page="${page}"]`);
    if(el){ el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); return true; }
    return false;
  }
  function scrollToJobs(){ document.querySelector('.row-opps')?.scrollIntoView({behavior:'smooth',block:'start'}); }
  function scrollToSources(){
    const el=document.querySelector('.stat-card:nth-child(3)') || document.querySelector('.net-body');
    el?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function doSearch(){ document.getElementById('searchNowBtn')?.click(); }
  function openCv(){ if(window.TheCareersAuth?.cv) window.TheCareersAuth.cv(); else clickNav('cv'); }
  function openAccount(){ if(window.TheCareersAuth?.account) window.TheCareersAuth.account(); else document.querySelector('.profile')?.click(); }

  function mount(){
    if(document.querySelector('.tc-tool-dock')) return;
    const content=document.querySelector('.content');
    if(!content) return;
    const dock=document.createElement('div');
    dock.className='tc-tool-dock';
    dock.setAttribute('aria-label','TheCareers tools');
    dock.innerHTML=`
      <span class="tc-tool-title">TOOLS</span>
      <button class="tc-tool-btn primary" data-tool="search">🔎 بحث ذكي <small>AI Search</small></button>
      <button class="tc-tool-btn green" data-tool="cv">📄 رفع وتحليل CV <small>CV Center</small></button>
      <button class="tc-tool-btn" data-tool="jobs">💼 أحدث الوظائف <small>Live Jobs</small></button>
      <button class="tc-tool-btn" data-tool="sources">🌐 المصادر <small>Verified Sources</small></button>
      <button class="tc-tool-btn" data-tool="account">👤 حسابي <small>Account</small></button>
    `;
    dock.addEventListener('click',e=>{
      const btn=e.target.closest('[data-tool]'); if(!btn)return;
      const tool=btn.dataset.tool;
      if(tool==='search')doSearch();
      else if(tool==='cv')openCv();
      else if(tool==='jobs')scrollToJobs();
      else if(tool==='sources')scrollToSources();
      else if(tool==='account')openAccount();
    });
    content.prepend(dock);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
