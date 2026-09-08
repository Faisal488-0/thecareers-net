/* TheCareers — 3D / neumorphic control layer + functional UI audit.
   Intentionally does NOT touch #globeStage/#chartdiv or the Three.js black-hole renderer. */
(() => {
  'use strict';

  const STYLE_ID = 'tc-3d-controls-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root{
        --tc3d-bg:#f7f9fc;
        --tc3d-hi:#ffffff;
        --tc3d-lo:#dfe5ec;
        --tc3d-ink:#16191e;
        --tc3d-green:#20bf74;
        --tc3d-blue:#2f6feb;
      }

      /* Keep both visualization engines completely untouched. */
      #globeStage,#chartdiv,#netCanvas{isolation:auto;}

      .profile{display:none!important;}
      .topbar-right{gap:18px;}

      .tc-3d{
        position:relative;
        border:1px solid rgba(214,221,230,.92)!important;
        background:linear-gradient(145deg,#ffffff 0%,#f4f7fb 100%)!important;
        color:var(--tc3d-ink)!important;
        box-shadow:
          7px 8px 16px rgba(108,122,140,.18),
          -6px -6px 14px rgba(255,255,255,.94),
          inset 0 1px 0 rgba(255,255,255,.98)!important;
        transform:translateY(0) scale(1);
        transition:transform .10s ease,box-shadow .10s ease,background .12s ease,border-color .12s ease;
        -webkit-tap-highlight-color:transparent;
        user-select:none;
      }
      .tc-3d:hover{
        box-shadow:
          9px 10px 20px rgba(101,116,135,.21),
          -7px -7px 16px rgba(255,255,255,1),
          inset 0 1px 0 #fff!important;
        transform:translateY(-1px);
      }
      .tc-3d:active,.tc-3d.tc-pressing,
      .tc-3d[aria-pressed="true"],
      .tab.tc-3d.active{
        transform:translateY(2px) scale(.985)!important;
        box-shadow:
          inset 5px 6px 11px rgba(117,131,148,.20),
          inset -5px -5px 10px rgba(255,255,255,.96),
          0 2px 4px rgba(96,110,128,.10)!important;
        background:linear-gradient(145deg,#edf1f6,#ffffff)!important;
      }
      .tc-3d:focus-visible{
        outline:3px solid rgba(47,111,235,.20)!important;
        outline-offset:3px!important;
      }

      .nav{gap:8px!important;}
      .nav-item.tc-3d{
        border-radius:13px!important;
        padding:10px 12px!important;
        min-height:42px;
      }
      .nav-item.tc-3d.active{
        color:#fff!important;
        border-color:#171a1f!important;
        background:linear-gradient(145deg,#242830,#080a0d)!important;
        box-shadow:
          inset 4px 5px 10px rgba(0,0,0,.55),
          inset -2px -2px 5px rgba(255,255,255,.08),
          0 2px 5px rgba(0,0,0,.16)!important;
        transform:translateY(2px) scale(.988)!important;
      }

      .search-now.tc-3d{
        min-height:44px;
        padding:10px 18px!important;
        border-radius:14px!important;
        font-weight:800!important;
      }
      .search-now.tc-3d .ic{
        width:15px;height:15px;
        background:radial-gradient(circle at 35% 30%,#7fffc0 0%,#22c77a 34%,#099451 100%)!important;
        box-shadow:0 0 0 8px rgba(31,181,103,.10),0 3px 8px rgba(5,136,74,.32)!important;
      }
      .search-now.tc-3d[data-busy="1"]{
        box-shadow:inset 5px 6px 11px rgba(117,131,148,.18),inset -5px -5px 10px rgba(255,255,255,.95)!important;
        transform:translateY(2px)!important;
      }

      .source-chip.tc-3d,.net-node.tc-3d{
        border-radius:14px!important;
      }
      .source-chip.tc-3d .ic{
        background:linear-gradient(145deg,#fff,#edf2f7)!important;
        box-shadow:3px 4px 8px rgba(110,124,142,.14),-3px -3px 7px #fff;
      }

      .tabs{gap:8px!important;}
      .tab.tc-3d{
        border-radius:11px!important;
        padding:8px 12px!important;
      }
      .select-like.tc-3d,.filter-btn.tc-3d{
        border-radius:11px!important;
        padding:8px 11px!important;
      }
      .filter-btn.tc-filter-active{
        color:#0a7843!important;
        border-color:#bfe7d2!important;
      }

      .icon-btn.tc-3d{
        min-width:34px;min-height:34px;
        display:inline-flex;align-items:center;justify-content:center;
        border-radius:10px!important;
      }
      .icon-btn.tc-saved{
        color:#0b7e48!important;
        box-shadow:inset 4px 5px 9px rgba(113,132,149,.18),inset -4px -4px 8px #fff!important;
        transform:translateY(1px)!important;
      }

      .copilot-card.tc-3d{cursor:pointer;}
      .net-node.tc-3d{cursor:pointer;min-width:118px;}
      .wf-step.tc-3d{cursor:pointer;border-radius:999px!important;padding:7px 14px!important;}
      .wf-step.tc-current-step{
        color:#0b7e48!important;
        border-color:#bfe7d2!important;
        box-shadow:inset 4px 5px 9px rgba(113,132,149,.18),inset -4px -4px 8px #fff!important;
      }

      @media(max-width:760px){
        .tc-3d{box-shadow:4px 5px 10px rgba(108,122,140,.15),-4px -4px 9px rgba(255,255,255,.9),inset 0 1px 0 #fff!important;}
      }
      @media(prefers-reduced-motion:reduce){.tc-3d{transition:none!important;}}
    `;
    document.head.appendChild(style);
  }

  document.querySelector('.profile')?.remove();

  const selector = [
    '.search-now','.nav-item','.source-chip','.tab','.select-like','.filter-btn',
    '.icon-btn','.net-node','.wf-step','.copilot-card'
  ].join(',');

  function upgradeControls(root = document) {
    root.querySelectorAll(selector).forEach(el => {
      el.classList.add('tc-3d');
      if (!/^(BUTTON|A)$/.test(el.tagName)) {
        if (!el.hasAttribute('role')) el.setAttribute('role','button');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
      }
      if (el.dataset.tcPressBound === '1') return;
      el.dataset.tcPressBound = '1';
      const down = () => el.classList.add('tc-pressing');
      const up = () => el.classList.remove('tc-pressing');
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') el.classList.add('tc-pressing');
      });
      el.addEventListener('keyup', e => {
        if (e.key === ' ' || e.key === 'Enter') el.classList.remove('tc-pressing');
      });
    });
  }
  upgradeControls();

  const jobList = document.getElementById('jobList');
  const savedKey = 'thecareers_saved_job_ids_v1';
  const getSaved = () => {
    try { return new Set(JSON.parse(localStorage.getItem(savedKey) || '[]')); }
    catch { return new Set(); }
  };
  const putSaved = set => localStorage.setItem(savedKey, JSON.stringify([...set]));

  let backendTabMode = 'high';
  let backendFilterMode = 'all';
  let backendSortMode = 'relevance';
  let originalOrder = [];

  function scoreOf(row){ return Number((row.querySelector('.pct')?.textContent || '0').replace(/[^0-9.]/g,'')) || 0; }
  function companyOf(row){ return (row.querySelector('.company')?.textContent || '').trim(); }
  function isKuwait(row){ return /kuwait/i.test(row.textContent || ''); }
  function isVerified(row){ return !!row.querySelector('.badge.verified,.badge.high'); }
  function isNew(row){ return !!row.querySelector('.badge.new'); }

  function decorateBackendRows() {
    if (!jobList) return;
    const saved = getSaved();
    const rows = [...jobList.querySelectorAll('.backend-job')];
    if (rows.length && (!originalOrder.length || originalOrder.some(x => !x.isConnected))) originalOrder = rows.slice();

    rows.forEach(row => {
      row.dataset.tcDecorated = '1';
      const id = row.dataset.jobId || row.dataset.jobUrl || row.querySelector('.title')?.textContent || '';
      row.dataset.tcSaved = saved.has(id) ? '1' : '0';
      const actions = row.querySelector('.job-actions');
      if (actions && !actions.querySelector('.tc-save-backend')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-btn tc-save-backend';
        btn.title = 'Save job';
        btn.setAttribute('aria-label','Save job');
        btn.textContent = saved.has(id) ? '✓' : '🔖';
        if (saved.has(id)) btn.classList.add('tc-saved');
        btn.addEventListener('click', e => {
          e.preventDefault(); e.stopPropagation();
          const now = getSaved();
          if (now.has(id)) { now.delete(id); btn.textContent='🔖'; btn.classList.remove('tc-saved'); row.dataset.tcSaved='0'; }
          else { now.add(id); btn.textContent='✓'; btn.classList.add('tc-saved'); row.dataset.tcSaved='1'; }
          putSaved(now);
          upgradeControls(actions);
          if (backendTabMode === 'saved') applyBackendView();
          window.pushActivity?.(`Saved jobs updated — ${now.size} saved`);
        });
        actions.prepend(btn);
      }
    });
    upgradeControls(jobList);
    applyBackendView();
  }

  function applyBackendView(){
    if (!jobList) return;
    const rows = [...jobList.querySelectorAll('.backend-job')];
    if (!rows.length) return;

    rows.forEach(row => {
      let tabOk = true;
      if (backendTabMode === 'high') tabOk = scoreOf(row) >= 85;
      else if (backendTabMode === 'new') tabOk = isNew(row);
      else if (backendTabMode === 'saved') tabOk = row.dataset.tcSaved === '1';

      let filterOk = true;
      if (backendFilterMode === 'kuwait') filterOk = isKuwait(row);
      else if (backendFilterMode === 'verified') filterOk = isVerified(row);
      else if (backendFilterMode === 'high') filterOk = scoreOf(row) >= 85;
      row.style.display = tabOk && filterOk ? '' : 'none';
    });

    const sorted = rows.slice();
    if (backendSortMode === 'relevance') sorted.sort((a,b)=>scoreOf(b)-scoreOf(a));
    else if (backendSortMode === 'company') sorted.sort((a,b)=>companyOf(a).localeCompare(companyOf(b)));
    else if (backendSortMode === 'original' && originalOrder.length) {
      const rank = new Map(originalOrder.map((r,i)=>[r,i]));
      sorted.sort((a,b)=>(rank.get(a)??999)-(rank.get(b)??999));
    }
    const current = [...jobList.querySelectorAll('.backend-job')];
    const needsReorder = sorted.some((row,i)=>current[i] !== row);
    if (needsReorder) sorted.forEach(row => jobList.appendChild(row));
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', e => {
      if (!jobList?.querySelector('.backend-job')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      document.querySelectorAll('.tab').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed','false'); });
      tab.classList.add('active'); tab.setAttribute('aria-pressed','true');
      backendTabMode = tab.dataset.tab || 'all';
      applyBackendView();
      window.pushActivity?.(`Job view: ${backendTabMode}`);
    }, true);
  });

  const sortCtl = document.querySelector('.select-like');
  if (sortCtl) {
    const modes = [['relevance','Relevance'],['company','Company'],['original','Newest']];
    let idx = 0;
    sortCtl.addEventListener('click', e => {
      if (!jobList?.querySelector('.backend-job')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      idx = (idx + 1) % modes.length;
      backendSortMode = modes[idx][0];
      sortCtl.textContent = `Sort by: ${modes[idx][1]}`;
      applyBackendView();
    }, true);
  }

  const filterCtl = document.querySelector('.filter-btn');
  if (filterCtl) {
    const modes = [['all','Filters'],['kuwait','Filters: Kuwait'],['verified','Filters: Verified'],['high','Filters: High Match']];
    let idx = 0;
    filterCtl.addEventListener('click', e => {
      if (!jobList?.querySelector('.backend-job')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      idx = (idx + 1) % modes.length;
      backendFilterMode = modes[idx][0];
      filterCtl.textContent = modes[idx][1];
      filterCtl.classList.toggle('tc-filter-active', backendFilterMode !== 'all');
      filterCtl.setAttribute('aria-pressed', backendFilterMode !== 'all' ? 'true' : 'false');
      applyBackendView();
      window.pushActivity?.(`Filter: ${modes[idx][1].replace('Filters: ','')}`);
    }, true);
  }

  const copilot = document.querySelector('.copilot-card');
  if (copilot) {
    copilot.setAttribute('aria-label','Open AI Search Core');
    const run = () => {
      document.querySelector('.row-core')?.scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>document.getElementById('searchNowBtn')?.focus(),350);
    };
    copilot.addEventListener('click',run);
    copilot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});
  }

  document.querySelectorAll('.wf-step').forEach(step => {
    step.setAttribute('aria-pressed','false');
    const run = () => {
      document.querySelectorAll('.wf-step').forEach(x=>{x.classList.remove('tc-current-step');x.setAttribute('aria-pressed','false');});
      step.classList.add('tc-current-step'); step.setAttribute('aria-pressed','true');
      window.pushActivity?.(`Workflow stage selected: ${step.textContent.trim()}`);
    };
    step.addEventListener('click',run);
    step.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});
  });

  const observer = new MutationObserver(mutations => {
    let needsDecorate = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('.backend-job:not([data-tc-decorated="1"])') || node.querySelector?.('.backend-job:not([data-tc-decorated="1"])')) {
          needsDecorate = true;
          break;
        }
      }
      if (needsDecorate) break;
    }
    upgradeControls();
    if (needsDecorate) decorateBackendRows();
  });
  if (jobList) observer.observe(jobList,{childList:true,subtree:true});
  decorateBackendRows();

  function runAudit(){
    const checks = [
      ['Search Now', !!document.getElementById('searchNowBtn')],
      ['Sidebar navigation', document.querySelectorAll('.nav-item').length >= 6],
      ['Source category buttons', document.querySelectorAll('.source-chip').length >= 6],
      ['Job tabs', document.querySelectorAll('.tab').length >= 4],
      ['Sort control', !!sortCtl],
      ['Filter control', !!filterCtl],
      ['Global network nodes', document.querySelectorAll('.net-node').length >= 6],
      ['Workflow controls', document.querySelectorAll('.wf-step').length >= 5],
      ['Globe preserved', !!document.getElementById('globeStage') && !!document.getElementById('chartdiv')],
      ['Black-hole canvas preserved', !!document.getElementById('netCanvas')],
      ['Placeholder profile removed', !document.querySelector('.profile')]
    ];
    const pass = checks.filter(x=>x[1]).length;
    const result = {pass,total:checks.length,checks:checks.map(([name,ok])=>({name,ok})),timestamp:new Date().toISOString()};
    window.TheCareersUIAudit = result;
    console.info('[TheCareers UI Audit]', result);
    return result;
  }
  setTimeout(runAudit,1200);
})();
