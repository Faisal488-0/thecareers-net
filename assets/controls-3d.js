/* TheCareers — visual / accessibility enhancement layer only.
   Business logic belongs to backend-bridge.js. This file must never filter,
   hide, reorder, or replace live Supabase job rows. */
(() => {
  'use strict';

  const STYLE_ID = 'tc-3d-controls-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root{--tc3d-bg:#f7f9fc;--tc3d-hi:#fff;--tc3d-lo:#dfe5ec;--tc3d-ink:#16191e;--tc3d-green:#20bf74;--tc3d-blue:#2f6feb}
      #globeStage,#chartdiv,#netCanvas{isolation:auto}
      .profile{display:none!important}.topbar-right{gap:18px}
      .tc-3d{position:relative;border:1px solid rgba(214,221,230,.92)!important;background:linear-gradient(145deg,#fff 0%,#f4f7fb 100%)!important;color:var(--tc3d-ink)!important;box-shadow:7px 8px 16px rgba(108,122,140,.18),-6px -6px 14px rgba(255,255,255,.94),inset 0 1px 0 rgba(255,255,255,.98)!important;transform:translateY(0) scale(1);transition:transform .10s ease,box-shadow .10s ease,background .12s ease,border-color .12s ease;-webkit-tap-highlight-color:transparent;user-select:none}
      .tc-3d:hover{box-shadow:9px 10px 20px rgba(101,116,135,.21),-7px -7px 16px #fff,inset 0 1px 0 #fff!important;transform:translateY(-1px)}
      .tc-3d:active,.tc-3d.tc-pressing,.tc-3d[aria-pressed="true"],.tab.tc-3d.active{transform:translateY(2px) scale(.985)!important;box-shadow:inset 5px 6px 11px rgba(117,131,148,.20),inset -5px -5px 10px rgba(255,255,255,.96),0 2px 4px rgba(96,110,128,.10)!important;background:linear-gradient(145deg,#edf1f6,#fff)!important}
      .tc-3d:focus-visible{outline:3px solid rgba(47,111,235,.20)!important;outline-offset:3px!important}
      .nav{gap:8px!important}.nav-item.tc-3d{border-radius:13px!important;padding:10px 12px!important;min-height:42px}.nav-item.tc-3d.active{color:#fff!important;border-color:#171a1f!important;background:linear-gradient(145deg,#242830,#080a0d)!important;box-shadow:inset 4px 5px 10px rgba(0,0,0,.55),inset -2px -2px 5px rgba(255,255,255,.08),0 2px 5px rgba(0,0,0,.16)!important;transform:translateY(2px) scale(.988)!important}
      .search-now.tc-3d{min-height:44px;padding:10px 18px!important;border-radius:14px!important;font-weight:800!important}.search-now.tc-3d .ic{width:15px;height:15px;background:radial-gradient(circle at 35% 30%,#7fffc0 0%,#22c77a 34%,#099451 100%)!important;box-shadow:0 0 0 8px rgba(31,181,103,.10),0 3px 8px rgba(5,136,74,.32)!important}.search-now.tc-3d[data-busy="1"]{box-shadow:inset 5px 6px 11px rgba(117,131,148,.18),inset -5px -5px 10px rgba(255,255,255,.95)!important;transform:translateY(2px)!important}
      .source-chip.tc-3d,.net-node.tc-3d{border-radius:14px!important}.source-chip.tc-3d .ic{background:linear-gradient(145deg,#fff,#edf2f7)!important;box-shadow:3px 4px 8px rgba(110,124,142,.14),-3px -3px 7px #fff}.tabs{gap:8px!important}.tab.tc-3d{border-radius:11px!important;padding:8px 12px!important}.select-like.tc-3d,.filter-btn.tc-3d{border-radius:11px!important;padding:8px 11px!important}.filter-btn.tc-filter-active{color:#0a7843!important;border-color:#bfe7d2!important}.icon-btn.tc-3d{min-width:34px;min-height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px!important}.icon-btn.tc-saved{color:#0b7e48!important;box-shadow:inset 4px 5px 9px rgba(113,132,149,.18),inset -4px -4px 8px #fff!important;transform:translateY(1px)!important}.copilot-card.tc-3d{cursor:pointer}.net-node.tc-3d{cursor:pointer;min-width:118px}.wf-step.tc-3d{cursor:pointer;border-radius:999px!important;padding:7px 14px!important}.wf-step.tc-current-step{color:#0b7e48!important;border-color:#bfe7d2!important;box-shadow:inset 4px 5px 9px rgba(113,132,149,.18),inset -4px -4px 8px #fff!important}
      @media(max-width:760px){.tc-3d{box-shadow:4px 5px 10px rgba(108,122,140,.15),-4px -4px 9px rgba(255,255,255,.9),inset 0 1px 0 #fff!important}}
      @media(prefers-reduced-motion:reduce){.tc-3d{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  document.querySelector('.profile')?.remove();

  const selector = ['.search-now','.nav-item','.source-chip','.tab','.select-like','.filter-btn','.icon-btn','.net-node','.wf-step','.copilot-card'].join(',');
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
      el.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') el.classList.add('tc-pressing'); });
      el.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') el.classList.remove('tc-pressing'); });
    });
  }
  upgradeControls();

  const copilot = document.querySelector('.copilot-card');
  if (copilot && copilot.dataset.tcActionBound !== '1') {
    copilot.dataset.tcActionBound = '1';
    copilot.setAttribute('aria-label','Open AI Search Core');
    const run = () => { document.querySelector('.row-core')?.scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(()=>document.getElementById('searchNowBtn')?.focus(),350); };
    copilot.addEventListener('click', run);
    copilot.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); run(); } });
  }

  document.querySelectorAll('.wf-step').forEach(step => {
    if (step.dataset.tcActionBound === '1') return;
    step.dataset.tcActionBound = '1';
    step.setAttribute('aria-pressed','false');
    const run = () => {
      document.querySelectorAll('.wf-step').forEach(x=>{x.classList.remove('tc-current-step');x.setAttribute('aria-pressed','false');});
      step.classList.add('tc-current-step');
      step.setAttribute('aria-pressed','true');
      window.pushActivity?.(`Workflow stage selected: ${step.textContent.trim()}`);
    };
    step.addEventListener('click',run);
    step.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});
  });

  const observer = new MutationObserver(() => upgradeControls());
  observer.observe(document.body,{childList:true,subtree:true});

  setTimeout(() => {
    const checks = [
      ['Search Now', !!document.getElementById('searchNowBtn')],
      ['Sidebar navigation', document.querySelectorAll('.nav-item').length >= 6],
      ['Source buttons', document.querySelectorAll('.source-chip').length >= 6],
      ['Job tabs', document.querySelectorAll('.tab').length >= 4],
      ['Sort control', !!document.querySelector('.select-like')],
      ['Filter control', !!document.querySelector('.filter-btn')],
      ['Global network nodes', document.querySelectorAll('.net-node').length >= 6],
      ['Globe preserved', !!document.getElementById('globeStage') && !!document.getElementById('chartdiv')],
      ['Black-hole preserved', !!document.getElementById('netCanvas')]
    ];
    window.TheCareersUIAudit = {pass:checks.filter(x=>x[1]).length,total:checks.length,checks:checks.map(([name,ok])=>({name,ok})),timestamp:new Date().toISOString()};
    console.info('[TheCareers UI Audit]', window.TheCareersUIAudit);
  },1200);
})();
