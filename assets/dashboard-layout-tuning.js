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
    /* UI chrome should feel like an app, not selectable article text. */
    .stat-row .stat-card,
    .stat-row .stat-card *,
    .row-opps .panel-title,
    .row-opps .opps-toolbar,
    .row-opps .opps-toolbar *,
    button,.btn,[role="button"],nav,nav *,aside,aside *{
      -webkit-user-select:none!important;user-select:none!important;
    }
    /* Preserve copy/select behavior for useful job content and form fields. */
    .job-card .job-title,.job-card .job-description,.job-card .job-company,.job-card .job-meta,
    .job-card [data-job-title],.job-card [data-job-description],
    input,textarea,[contenteditable="true"]{
      -webkit-user-select:text!important;user-select:text!important;
    }

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
    .row-opps>section:first-child{width:100%!important;max-width:none!important;min-width:0!important;overflow:hidden!important}
    .row-opps>section[data-tc-removed-sector-panel='1'],.row-opps>section:nth-child(2){display:none!important}
    .row-opps .panel-head{padding:15px 18px 9px!important}
    .row-opps .panel-title{font-size:16px!important}

    /* Toolbar: tabs stay grouped left; Sort + Filters stay aligned right. */
    .row-opps .opps-toolbar{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) auto!important;
      align-items:center!important;
      width:100%!important;
      gap:10px 18px!important;
      padding:12px 14px 14px!important;
      margin:0!important;
      border-top:1px solid #eef1f4!important;
      border-bottom:1px solid #eef1f4!important;
      background:#fff!important;
      box-sizing:border-box!important;
      flex-wrap:unset!important;
    }
    .row-opps .tabs{
      grid-column:1!important;
      display:flex!important;align-items:center!important;
      gap:8px!important;min-width:0!important;flex-wrap:nowrap!important;
      overflow-x:auto!important;overflow-y:hidden!important;
      scrollbar-width:none!important;padding:1px 0 2px!important;
    }
    .row-opps .tabs::-webkit-scrollbar{display:none!important}
    .row-opps .opps-actions{
      grid-column:2!important;
      display:flex!important;align-items:center!important;justify-content:flex-end!important;
      gap:8px!important;margin:0!important;min-width:max-content!important;
    }
    .row-opps .tab,.row-opps .select-like,.row-opps .filter-btn{
      min-height:40px!important;height:40px!important;
      padding:0 14px!important;border-radius:11px!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      box-sizing:border-box!important;white-space:nowrap!important;
      font-size:11.5px!important;line-height:1!important;font-weight:750!important;
    }
    .row-opps .tab{flex:0 0 auto!important;min-width:112px!important}
    .row-opps .select-like{min-width:148px!important}
    .row-opps .filter-btn{min-width:86px!important}

    /* Keep any injected role-search strip visually aligned with the toolbar. */
    .row-opps .tc-role-search,
    .row-opps .job-role-search,
    .row-opps .opps-search,
    .row-opps .job-search-strip,
    .row-opps [data-tc-role-search]{
      width:calc(100% - 28px)!important;
      margin:0 14px 10px!important;
      box-sizing:border-box!important;
    }

    @media(max-width:1100px){
      .stat-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      .stat-row .stat-card{min-height:124px!important}
      .row-opps .opps-toolbar{grid-template-columns:1fr!important;gap:10px!important}
      .row-opps .opps-actions{grid-column:1!important;justify-content:flex-end!important;width:100%!important}
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
      .row-opps .panel-head{padding:13px 11px 8px!important}
      .row-opps .opps-toolbar{padding:10px 9px 12px!important;gap:9px!important}
      .row-opps .tabs{width:100%!important;padding-bottom:3px!important}
      .row-opps .opps-actions{width:100%!important;justify-content:stretch!important}
      .row-opps .select-like{flex:1 1 auto!important;min-width:0!important}
      .row-opps .filter-btn{flex:0 0 88px!important;min-width:88px!important}
      .row-opps .tab,.row-opps .select-like,.row-opps .filter-btn{font-size:10.8px!important;min-height:38px!important;height:38px!important;padding:0 11px!important}
      .row-opps .tab{min-width:104px!important}
      .row-opps .tc-role-search,
      .row-opps .job-role-search,
      .row-opps .opps-search,
      .row-opps .job-search-strip,
      .row-opps [data-tc-role-search]{width:calc(100% - 18px)!important;margin:0 9px 9px!important}
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
