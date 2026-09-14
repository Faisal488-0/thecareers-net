/* TheCareers — readability pass. Visual only; no data/state changes. */
(() => {
  'use strict';
  if (window.__TC_READABILITY_TUNING__) return;
  window.__TC_READABILITY_TUNING__ = true;

  const s = document.createElement('style');
  s.id = 'tc-readability-tuning';
  s.textContent = `
    /* Raise the smallest text across the dashboard without changing layout structure. */
    .brand-tag{font-size:10px!important}.sidebar-foot{font-size:11px!important;line-height:1.7!important}.sidebar-quote{font-size:12px!important}
    .topbar-left{font-size:11px!important}.status-chip .txt small{font-size:10px!important}.status-chip .txt b{font-size:12px!important}.profile-role{font-size:11px!important}.profile-name{font-size:13px!important}
    .panel-sub{font-size:12px!important;line-height:1.35!important}.live-pill{font-size:10.5px!important}.source-chip{font-size:11px!important}.source-chip .lbl b{font-size:11px!important}.source-chip .lbl span{font-size:10px!important;line-height:1.25!important}
    .scan-head{font-size:11px!important}.src-row{font-size:12px!important}.metric-big .lbl{font-size:10.5px!important}.ai-working{font-size:11px!important}.activity-row{font-size:12px!important}.agent-txt span{font-size:11.5px!important}
    .stat-title{font-size:12.5px!important}.stat-sub{font-size:11.5px!important}.leg-row{font-size:12px!important}.globe-hint{font-size:10px!important}.wf-step{font-size:11px!important}.sidebar .status-row{font-size:12px!important}

    /* Job card hierarchy and facts. */
    .row-opps .job-row.backend-job,.job-row.backend-job{min-height:132px!important;padding-top:16px!important;padding-bottom:16px!important}
    .row-opps .job-row.backend-job .job-main .title,.job-row.backend-job .job-main .title{font-size:17px!important;line-height:1.27!important;margin-bottom:5px!important}
    .row-opps .job-row.backend-job .job-main .company,.job-row.backend-job .job-main .company{font-size:13px!important;line-height:1.35!important;margin-bottom:10px!important;color:#4a525c!important}
    .row-opps .job-row.backend-job .job-main .job-meta.tc-job-facts,.job-row.backend-job .job-main .job-meta.tc-job-facts{
      display:grid!important;grid-template-columns:repeat(3,minmax(118px,1fr))!important;gap:10px 14px!important;
      margin:0!important;padding-top:10px!important;border-top:1px solid #edf0f3!important;color:#545c66!important;
    }
    .row-opps .job-row.backend-job .tc-meta-item,.job-row.backend-job .tc-meta-item{
      min-width:0!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:3px!important;
      padding-left:9px!important;border-left:2px solid #edf0f3!important;white-space:normal!important;
    }
    .row-opps .job-row.backend-job .tc-meta-item small,.job-row.backend-job .tc-meta-item small{
      color:#858d97!important;font:800 9.8px/1.15 'JetBrains Mono',monospace!important;letter-spacing:.035em!important;
    }
    .row-opps .job-row.backend-job .tc-meta-item strong,.job-row.backend-job .tc-meta-item strong{
      max-width:100%!important;color:#333941!important;font:700 11.8px/1.3 Inter,system-ui,sans-serif!important;overflow-wrap:anywhere!important;
    }
    .row-opps .job-row.backend-job .tc-meta-salary strong,.job-row.backend-job .tc-meta-salary strong{color:#14764a!important}
    .row-opps .job-row.backend-job .job-score .pct,.job-row.backend-job .job-score .pct{font-size:19px!important}.row-opps .job-row.backend-job .job-score .lbl,.job-row.backend-job .job-score .lbl{font-size:10px!important}
    .row-opps .job-row.backend-job .job-actions .tc-job-btn,.job-row.backend-job .job-actions .tc-job-btn{font-size:13px!important}
    .tc-page-summary{font-size:10.5px!important}.tc-country-empty,.tc-job-note{font-size:12px!important;line-height:1.5!important}

    @media(max-width:1100px){
      .row-opps .job-row.backend-job .job-main .job-meta.tc-job-facts,.job-row.backend-job .job-main .job-meta.tc-job-facts{grid-template-columns:repeat(2,minmax(118px,1fr))!important}
    }
    @media(max-width:760px){
      .panel-sub{font-size:11.5px!important}.activity-row{font-size:11.5px!important}
      .row-opps .job-row.backend-job,.job-row.backend-job{min-height:0!important}
      .row-opps .job-row.backend-job .job-main .title,.job-row.backend-job .job-main .title{font-size:15.5px!important}
      .row-opps .job-row.backend-job .job-main .company,.job-row.backend-job .job-main .company{font-size:12px!important}
      .row-opps .job-row.backend-job .job-main .job-meta.tc-job-facts,.job-row.backend-job .job-main .job-meta.tc-job-facts{grid-template-columns:1fr 1fr!important;gap:9px!important}
      .row-opps .job-row.backend-job .tc-meta-item strong,.job-row.backend-job .tc-meta-item strong{font-size:11.2px!important}
      .row-opps .job-row.backend-job .tc-meta-item small,.job-row.backend-job .tc-meta-item small{font-size:9.5px!important}
    }
    @media(max-width:430px){.row-opps .job-row.backend-job .job-main .job-meta.tc-job-facts,.job-row.backend-job .job-main .job-meta.tc-job-facts{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(s);
})();
