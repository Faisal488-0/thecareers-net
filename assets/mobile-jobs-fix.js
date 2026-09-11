/* TheCareers mobile job-card hardening
   Keeps desktop untouched; makes job rows readable/tappable on narrow screens. */
(() => {
  if (document.getElementById('tc-mobile-jobs-fix')) return;
  const style = document.createElement('style');
  style.id = 'tc-mobile-jobs-fix';
  style.textContent = `
    @media (max-width: 760px) {
      html, body, .app, .main, .content, .panel, #jobList { max-width:100%; overflow-x:hidden!important; }
      .content { padding-left:10px!important; padding-right:10px!important; }
      #jobList { width:100%!important; }
      .job-row.backend-job {
        position:relative!important;
        display:grid!important;
        grid-template-columns:52px minmax(0,1fr) 54px!important;
        grid-template-rows:auto auto!important;
        column-gap:10px!important;
        row-gap:4px!important;
        width:100%!important;
        min-width:0!important;
        padding:14px 10px!important;
        align-items:start!important;
        overflow:hidden!important;
      }
      .job-row.backend-job .job-logo {
        grid-column:1!important; grid-row:1 / span 2!important;
        width:48px!important; height:48px!important; min-width:48px!important;
        border-radius:13px!important; font-size:15px!important;
      }
      .job-row.backend-job .job-main {
        grid-column:2!important; grid-row:1 / span 2!important;
        min-width:0!important; width:auto!important;
      }
      .job-row.backend-job .job-main .title {
        white-space:normal!important; overflow:visible!important; text-overflow:clip!important;
        overflow-wrap:anywhere!important; word-break:normal!important;
        font-size:15px!important; line-height:1.28!important; margin:0 0 4px!important;
      }
      .job-row.backend-job .company {
        white-space:normal!important; overflow-wrap:anywhere!important;
        font-size:11.5px!important; line-height:1.3!important;
      }
      .job-row.backend-job .job-meta {
        display:flex!important; flex-wrap:wrap!important; gap:5px 10px!important;
        margin-top:7px!important; font-size:10.5px!important; line-height:1.25!important;
      }
      .job-row.backend-job .job-meta span { white-space:normal!important; }
      .job-row.backend-job .job-score {
        grid-column:3!important; grid-row:1!important;
        width:54px!important; min-width:54px!important; text-align:center!important;
        align-self:start!important; justify-self:end!important;
      }
      .job-row.backend-job .job-score .pct { font-size:18px!important; line-height:1!important; }
      .job-row.backend-job .job-score .lbl { font-size:8.5px!important; margin-top:4px!important; }
      .job-row.backend-job > div:nth-of-type(4) { display:none!important; }
      .job-row.backend-job .job-actions {
        grid-column:3!important; grid-row:2!important;
        display:flex!important; flex-direction:row!important; gap:5px!important;
        justify-content:flex-end!important; align-self:end!important; position:static!important;
      }
      .job-row.backend-job .job-actions .icon-btn {
        width:24px!important; height:24px!important; min-width:24px!important;
        padding:0!important; font-size:11px!important; border-radius:7px!important;
      }
      .tc-job-note { margin-left:0!important; margin-right:0!important; }
    }
    @media (max-width: 420px) {
      .job-row.backend-job { grid-template-columns:46px minmax(0,1fr) 48px!important; padding:12px 8px!important; column-gap:8px!important; }
      .job-row.backend-job .job-logo { width:42px!important; height:42px!important; min-width:42px!important; }
      .job-row.backend-job .job-main .title { font-size:14px!important; }
      .job-row.backend-job .job-score { width:48px!important; min-width:48px!important; }
      .job-row.backend-job .job-score .pct { font-size:17px!important; }
    }
  `;
  document.head.appendChild(style);
})();
