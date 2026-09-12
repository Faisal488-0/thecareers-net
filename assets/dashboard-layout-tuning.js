/* TheCareers dashboard layout tuning
   Scope: dashboard framing, stat cards and opportunity toolbar only.
   Job-card styling intentionally lives in jobs-pagination.js so the two modules
   do not fight each other and create overlapping actions.
*/
(() => {
  'use strict';
  if (window.__TC_DASHBOARD_LAYOUT_TUNING__) return;
  window.__TC_DASHBOARD_LAYOUT_TUNING__ = true;

  const removeSectorPanel = () => {
    document.querySelectorAll('.panel').forEach(panel => {
      const title = panel.querySelector('.panel-title');
      const text = (title?.textContent || '').replace(/\s+/g, ' ').trim();
      if (/JOBS BY SECTOR/i.test(text)) {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
        panel.dataset.tcRemovedSectorPanel = '1';
      }
    });
  };

  const style = document.createElement('style');
  style.id = 'tc-dashboard-layout-tuning-style';
  style.textContent = `
    /* Four summary cards: align to the full dashboard content width. */
    .stat-row{
      width:100%!important;max-width:none!important;margin:0!important;
      display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:14px!important;align-items:stretch!important;
    }
    .stat-row .stat-card{
      min-width:0!important;min-height:132px!important;padding:15px 17px 12px!important;
      border-radius:15px!important;border:1px solid #e6e9ed!important;background:#fff!important;
      box-shadow:0 2px 6px rgba(20,22,26,.035),0 14px 34px -26px rgba(20,22,26,.28)!important;
    }
    .stat-row .stat-top{display:flex!important;align-items:center!important;gap:9px!important;margin-bottom:12px!important}
    .stat-row .stat-ic{width:28px!important;height:28px!important;min-width:28px!important;border-radius:8px!important;display:grid!important;place-items:center!important}
    .stat-row .stat-ic svg{width:13px!important;height:13px!important}
    .stat-row .stat-title{font-size:11px!important;line-height:1.2!important;font-weight:700!important;color:#686f79!important}
    .stat-row .stat-num{font-size:27px!important;line-height:1.05!important;font-weight:800!important;letter-spacing:-.02em!important;margin-top:0!important}
    .stat-row .stat-num span[style]{font-size:11px!important}
    .stat-row .stat-sub{font-size:9.5px!important;line-height:1.25!important;margin-top:8px!important;font-weight:650!important}
    .stat-row .stat-spark{width:100%!important;height:24px!important;margin-top:9px!important;display:block!important}

    /* Top Opportunities uses the full available width. */
    .row-opps{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important;min-width:0!important}
    .row-opps>section:first-child{width:100%!important;max-width:none!important;min-width:0!important}
    .row-opps>section[data-tc-removed-sector-panel='1'],.row-opps>section:nth-child(2){display:none!important}
    .row-opps .panel-title{font-size:16px!important}
    .row-opps .opps-toolbar{
      display:flex!important;justify-content:space-between!important;align-items:center!important;
      width:100%!important;gap:14px!important;padding-left:18px!important;padding-right:18px!important;
      flex-wrap:wrap!important;
    }
    .row-opps .tabs{display:flex!important;gap:8px!important;min-width:0!important;flex-wrap:wrap!important}
    .row-opps .opps-actions{display:flex!important;gap:8px!important;margin-left:auto!important}
    .row-opps .tab,.row-opps .select-like,.row-opps .filter-btn{
      font-size:12px!important;min-height:38px!important;padding:8px 14px!important;border-radius:11px!important;
    }

    @media(max-width:1100px){
      .stat-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      .stat-row .stat-card{min-height:124px!important}
    }
    @media(max-width:760px){
      .stat-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      .stat-row .stat-card{min-height:112px!important;padding:12px 12px 10px!important;border-radius:13px!important}
      .stat-row .stat-top{gap:7px!important;margin-bottom:8px!important}
      .stat-row .stat-ic{width:24px!important;height:24px!important;min-width:24px!important;border-radius:7px!important}
      .stat-row .stat-title{font-size:9.8px!important}
      .stat-row .stat-num{font-size:22px!important}
      .stat-row .stat-sub{font-size:8.6px!important;margin-top:6px!important}
      .stat-row .stat-spark{height:20px!important;margin-top:7px!important}
      .row-opps .opps-toolbar{align-items:flex-start!important;padding-left:10px!important;padding-right:10px!important;gap:10px!important}
      .row-opps .tabs{width:100%!important;overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:2px!important}
      .row-opps .opps-actions{width:100%!important;margin-left:0!important;justify-content:flex-end!important}
      .row-opps .tab,.row-opps .select-like,.row-opps .filter-btn{font-size:11px!important;min-height:36px!important;padding:7px 11px!important}
    }
    @media(max-width:420px){
      .stat-row{grid-template-columns:1fr!important}
      .stat-row .stat-card{min-height:104px!important}
    }
  `;
  document.head.appendChild(style);

  removeSectorPanel();
  const observer = new MutationObserver(removeSectorPanel);
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
