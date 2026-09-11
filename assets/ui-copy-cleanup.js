/* TheCareers public UI copy cleanup
   Keeps infrastructure/vendor names out of customer-facing controls.
   Also loads the isolated mobile job-card fix and applies the approved
   wide AI Search Core layout without changing search/backend behavior. */
(() => {
  'use strict';
  if (window.__TC_UI_COPY_CLEANUP__) return;
  window.__TC_UI_COPY_CLEANUP__ = true;

  const sourceIcons = [
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M8 7V5h8v2M9 12h6"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4M8 11h6M11 8v6"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18M5 10v9M9 10v9M15 10v9M19 10v9M3 19h18M12 3l9 5H3z"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-3.4 2.8-6 6-6s6 2.6 6 6M14 15c2.8.2 5 2.2 5 5"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 8 9-5 9 5-9 5zM7 11v5c3 2 7 2 10 0v-5M21 9v6"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 8h14M7 5l-2 3 2 3M17 5l2 3-2 3M7 13l-2 3 2 3M17 13l2 3-2 3"/></svg>'
  ];

  const apply = () => {
    document.querySelectorAll('.tc-modal .tc-setting span').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (/^Refresh\s+Supabase\s+data\s+now$/i.test(text)) el.textContent = 'Refresh live data now';
    });

    const coreBody = document.querySelector('.row-core .core-body');
    const metrics = coreBody?.querySelector('.metrics-col');
    const scan = coreBody?.querySelector('.sources-scan');
    if (metrics && scan && scan.parentElement !== metrics) {
      metrics.prepend(scan);
      scan.classList.add('tc-scan-rail');
    }

    document.querySelectorAll('.tc-scan-rail .src-row').forEach((row, i) => {
      const name = row.querySelector('.name');
      if (!name || name.querySelector('.tc-src-icon')) return;
      const oldDot = name.querySelector('.d');
      if (oldDot) oldDot.remove();
      const icon = document.createElement('span');
      icon.className = `tc-src-icon tc-src-icon-${(i % sourceIcons.length) + 1}`;
      icon.innerHTML = sourceIcons[i % sourceIcons.length];
      name.prepend(icon);
    });
  };

  if (!document.getElementById('tc-wide-ai-core-layout')) {
    const style = document.createElement('style');
    style.id = 'tc-wide-ai-core-layout';
    style.textContent = `
      .row-core { grid-template-columns:minmax(0,1fr)!important; }
      .row-core > section:nth-child(2){display:none!important;}
      .row-core > section:first-child{width:100%!important;max-width:none!important;overflow:hidden!important;}

      /* Keep the top live status visually inside the right-side rail. */
      .row-core > section:first-child .panel-head{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 300px!important;
        gap:24px!important;
        align-items:start!important;
      }
      .row-core > section:first-child .panel-head > :last-child{
        width:100%!important;
        min-width:0!important;
        text-align:left!important;
      }
      .row-core > section:first-child .panel-head > :last-child .panel-sub{
        text-align:left!important;
        white-space:normal!important;
      }
      .row-core > section:first-child .live-pill{
        width:100%!important;
        max-width:160px!important;
        min-width:0!important;
        height:26px!important;
        padding:0 12px!important;
        justify-content:flex-start!important;
        border-radius:999px!important;
      }

      .row-core .metrics-col{min-width:0!important;overflow:visible!important;}
      .row-core .tc-scan-rail{
        padding:0 0 16px!important;
        margin:0 0 2px!important;
        border-bottom:1px dashed var(--line-strong);
      }
      .row-core .tc-scan-rail .scan-head{font-size:9.5px;letter-spacing:.11em;margin-bottom:3px;}
      .row-core .tc-scan-rail .scan-count{font-size:25px;margin-top:1px;line-height:1.08;}
      .row-core .tc-scan-rail .scan-count span{font-size:11px;}
      .row-core .tc-scan-rail .bar-track{display:none!important;}
      .row-core .tc-scan-rail .src-list{margin-top:12px;gap:8px;}
      .row-core .tc-scan-rail .src-row{min-height:22px;gap:8px;font-size:10.5px;}
      .row-core .tc-scan-rail .src-row .name{gap:8px;min-width:0;}
      .row-core .tc-scan-rail .src-row .val{font-size:10px;flex:0 0 auto;}
      .tc-src-icon{width:20px;height:20px;border-radius:6px;display:inline-grid;place-items:center;flex:0 0 20px;background:#f3f6f8;border:1px solid #dfe5ea;color:#34506d;box-shadow:0 1px 2px rgba(20,22,26,.03);}
      .tc-src-icon svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
      .tc-src-icon-2,.tc-src-icon-6{color:#2f6feb;background:#f1f5ff;border-color:#dce6ff;}
      .tc-src-icon-3,.tc-src-icon-7{color:#59636f;background:#f7f8f9;}
      .tc-src-icon-4{color:#48576a;background:#f4f6f8;}
      .tc-src-icon-5{color:#23885b;background:#f0faf5;border-color:#d8efe3;}
      .tc-src-icon-8{color:#7a5a2b;background:#fbf7ef;border-color:#eee2ce;}

      @media (min-width:1000px){
        .row-core .core-body{
          grid-template-columns:minmax(0,1fr) 300px!important;
          gap:28px!important;
          align-items:start!important;
        }
        .row-core .core-visual.thecareers-globe-zone{
          grid-template-columns:minmax(145px,170px) minmax(420px,31vw) minmax(145px,170px)!important;
          column-gap:18px!important;
          row-gap:18px!important;
          min-height:455px!important;
          padding:10px 6px 6px!important;
          overflow:visible!important;
        }
        .row-core .thecareers-globe-zone #thecareers-globe-stage{
          width:clamp(420px,31vw,610px)!important;
          max-width:100%!important;
        }
        .row-core .source-chip{
          width:100%!important;
          max-width:170px!important;
          min-width:0!important;
          padding:8px 10px!important;
          transform:none!important;
        }
        .row-core .sc-companies,.row-core .sc-schools,.row-core .sc-international{justify-self:start!important;}
        .row-core .sc-oilgas,.row-core .sc-government,.row-core .sc-talent{justify-self:end!important;}
        .row-core .metrics-col{
          padding-left:20px!important;
          border-left:1px solid var(--line)!important;
          gap:16px!important;
          width:300px!important;
        }
      }

      @media (min-width:1500px){
        .row-core > section:first-child .panel-head{grid-template-columns:minmax(0,1fr) 320px!important;}
        .row-core .core-body{grid-template-columns:minmax(0,1fr) 320px!important;gap:34px!important;}
        .row-core .core-visual.thecareers-globe-zone{
          grid-template-columns:minmax(160px,190px) minmax(470px,33vw) minmax(160px,190px)!important;
          column-gap:22px!important;
        }
        .row-core .thecareers-globe-zone #thecareers-globe-stage{width:clamp(470px,33vw,660px)!important;}
        .row-core .source-chip{max-width:185px!important;}
        .row-core .metrics-col{width:320px!important;}
      }

      @media (max-width:999px){
        .row-core > section:first-child .panel-head{display:flex!important;grid-template-columns:none!important;gap:12px!important;}
        .row-core > section:first-child .panel-head > :last-child{width:auto!important;text-align:right!important;}
        .row-core > section:first-child .panel-head > :last-child .panel-sub{text-align:right!important;}
        .row-core > section:first-child .live-pill{width:auto!important;max-width:none!important;height:auto!important;padding:4px 9px!important;}
        .row-core .metrics-col{min-width:0!important;width:auto!important;}
        .row-core .tc-scan-rail{padding-top:8px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});

  if (!document.querySelector('script[data-tc-mobile-jobs-fix]')) {
    const s=document.createElement('script');
    s.dataset.tcMobileJobsFix='1';
    s.src=new URL('./mobile-jobs-fix.js?v=20260911b',document.currentScript?.src||location.href).href;
    s.defer=true;
    document.head.appendChild(s);
  }
})();
