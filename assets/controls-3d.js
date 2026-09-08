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
      :root{
        --tc3d-ink:#171a1f;
        --tc3d-muted:#707780;
        --tc3d-pearl-1:#fffefa;
        --tc3d-pearl-2:#f7f5ef;
        --tc3d-pearl-3:#ece9e1;
        --tc3d-edge:rgba(206,202,191,.74);
        --tc3d-shadow:rgba(102,96,82,.18);
        --tc3d-shadow-soft:rgba(112,105,92,.10);
        --tc3d-green:#20bf74;
        --tc3d-blue:#2f6feb;
      }

      #globeStage,#chartdiv,#netCanvas{isolation:auto}
      .profile{display:none!important}.topbar-right{gap:18px}

      .tc-3d{
        position:relative;
        overflow:hidden;
        isolation:isolate;
        border:1px solid var(--tc3d-edge)!important;
        background:
          linear-gradient(145deg,var(--tc3d-pearl-1) 0%,#fbfaf6 44%,var(--tc3d-pearl-2) 72%,var(--tc3d-pearl-3) 100%)!important;
        color:var(--tc3d-ink)!important;
        box-shadow:
          0 12px 24px var(--tc3d-shadow-soft),
          8px 10px 18px rgba(117,110,94,.16),
          -7px -7px 16px rgba(255,255,255,.96),
          inset 0 1px 0 rgba(255,255,255,.98),
          inset 0 -1px 0 rgba(173,166,151,.12)!important;
        transform:translateY(0) scale(1);
        transition:transform .11s ease,box-shadow .13s ease,background .15s ease,border-color .15s ease,filter .15s ease;
        -webkit-tap-highlight-color:transparent;
        user-select:none;
        backdrop-filter:saturate(1.03);
      }

      .tc-3d::before{
        content:"";
        position:absolute;
        inset:1px 2px auto 2px;
        height:46%;
        border-radius:inherit;
        background:linear-gradient(180deg,rgba(255,255,255,.62),rgba(255,255,255,0));
        pointer-events:none;
        z-index:-1;
      }

      .tc-3d:hover{
        transform:translateY(-2px) scale(1.008);
        border-color:rgba(193,187,173,.84)!important;
        box-shadow:
          0 16px 30px rgba(105,99,86,.13),
          10px 12px 22px rgba(112,105,91,.19),
          -8px -8px 18px rgba(255,255,255,.98),
          inset 0 1px 0 #fff!important;
        filter:saturate(1.02) brightness(1.008);
      }

      .tc-3d:active,.tc-3d.tc-pressing,.tc-3d[aria-pressed="true"],.tab.tc-3d.active{
        transform:translateY(2px) scale(.986)!important;
        background:linear-gradient(145deg,#eeebe3 0%,#faf8f2 46%,#fffefa 100%)!important;
        box-shadow:
          inset 6px 7px 13px rgba(121,113,97,.20),
          inset -5px -5px 11px rgba(255,255,255,.95),
          0 2px 4px rgba(93,87,75,.10)!important;
      }

      .tc-3d:focus-visible{
        outline:3px solid rgba(47,111,235,.18)!important;
        outline-offset:3px!important;
      }

      .nav{gap:9px!important}
      .nav-item.tc-3d{
        border-radius:17px!important;
        padding:11px 13px!important;
        min-height:44px;
      }
      .nav-item.tc-3d.active{
        color:#fff!important;
        border-color:#20242a!important;
        background:linear-gradient(145deg,#2d3139 0%,#171a1f 52%,#080a0d 100%)!important;
        box-shadow:
          inset 5px 6px 11px rgba(0,0,0,.58),
          inset -2px -2px 5px rgba(255,255,255,.08),
          0 6px 14px rgba(0,0,0,.16)!important;
        transform:translateY(2px) scale(.988)!important;
      }

      .search-now.tc-3d{
        min-height:46px;
        padding:11px 19px!important;
        border-radius:18px!important;
        font-weight:800!important;
        letter-spacing:.01em;
      }
      .search-now.tc-3d .ic{
        width:15px;height:15px;
        background:radial-gradient(circle at 35% 30%,#9effcd 0%,#22c77a 35%,#0b8e51 100%)!important;
        box-shadow:0 0 0 8px rgba(31,181,103,.10),0 3px 8px rgba(5,136,74,.30)!important;
      }
      .search-now.tc-3d[data-busy="1"]{
        box-shadow:inset 6px 7px 13px rgba(121,113,97,.18),inset -5px -5px 11px rgba(255,255,255,.95)!important;
        transform:translateY(2px)!important;
      }

      .source-chip.tc-3d,.net-node.tc-3d{
        border-radius:18px!important;
      }
      .source-chip.tc-3d{
        padding-top:9px!important;
        padding-bottom:9px!important;
      }
      .source-chip.tc-3d .ic{
        background:linear-gradient(145deg,#fffefa,#eeeae1)!important;
        box-shadow:4px 5px 9px rgba(112,105,91,.15),-3px -3px 8px rgba(255,255,255,.98),inset 0 1px 0 #fff;
      }

      .tabs{gap:9px!important}
      .tab.tc-3d{
        border-radius:15px!important;
        padding:9px 13px!important;
        min-height:38px;
      }
      .select-like.tc-3d,.filter-btn.tc-3d{
        border-radius:15px!important;
        padding:9px 12px!important;
      }
      .filter-btn.tc-filter-active{
        color:#087242!important;
        border-color:#b8ddc9!important;
        background:linear-gradient(145deg,#f5fff9,#edf8f2)!important;
      }

      .icon-btn.tc-3d{
        min-width:36px;
        min-height:36px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius:14px!important;
      }
      .icon-btn.tc-saved{
        color:#0b7e48!important;
        box-shadow:inset 5px 6px 10px rgba(113,132,149,.16),inset -4px -4px 9px rgba(255,255,255,.96)!important;
        transform:translateY(1px)!important;
      }

      .copilot-card.tc-3d{
        cursor:pointer;
        border-radius:22px!important;
      }
      .net-node.tc-3d{
        cursor:pointer;
        min-width:118px;
        padding:10px 14px!important;
      }
      .wf-step.tc-3d{
        cursor:pointer;
        border-radius:999px!important;
        padding:8px 15px!important;
      }
      .wf-step.tc-current-step{
        color:#0b7e48!important;
        border-color:#b9dfca!important;
        background:linear-gradient(145deg,#f7fff9,#edf8f2)!important;
        box-shadow:inset 5px 6px 10px rgba(113,132,149,.15),inset -4px -4px 9px rgba(255,255,255,.96)!important;
      }

      @media(max-width:760px){
        .tc-3d{
          box-shadow:0 9px 18px rgba(108,101,87,.10),5px 6px 11px rgba(108,101,87,.14),-4px -4px 10px rgba(255,255,255,.92),inset 0 1px 0 #fff!important;
        }
        .nav-item.tc-3d{border-radius:15px!important}
        .search-now.tc-3d{border-radius:16px!important}
      }

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
