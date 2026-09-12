/* TheCareers dashboard visual tuning
   - Remove redundant Jobs by Sector panel (sector categories are already represented near the globe)
   - Reduce the four dashboard metric cards (Jobs Found / High Match / Sources Online / Applications) by ~40%
   - Widen Top Opportunities to use the freed space
   - Make opportunity cards wider/shorter and increase card text ~15% for readability
   - Preserve globe/category layout and backend/search behavior
*/
(() => {
  'use strict';
  if (window.__TC_DASHBOARD_LAYOUT_TUNING__) return;
  window.__TC_DASHBOARD_LAYOUT_TUNING__ = true;

  const removeSectorPanel = () => {
    document.querySelectorAll('.panel').forEach(panel => {
      const title = panel.querySelector('.panel-title');
      const text = (title?.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^\/?\/?\s*JOBS BY SECTOR$/i.test(text) || /JOBS BY SECTOR/i.test(text)) {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
        panel.dataset.tcRemovedSectorPanel = '1';
      }
    });
  };

  const style = document.createElement('style');
  style.id = 'tc-dashboard-layout-tuning-style';
  style.textContent = `
    .stat-row { gap: 10px !important; align-items: stretch !important; }
    .stat-row .stat-card { min-height: 0 !important; padding: 10px 12px 9px !important; border-radius: 12px !important; box-shadow: 0 1px 2px rgba(20,22,26,.035), 0 6px 18px -14px rgba(20,22,26,.10) !important; }
    .stat-row .stat-top { gap: 7px !important; margin-bottom: 7px !important; }
    .stat-row .stat-ic { width: 22px !important; height: 22px !important; min-width: 22px !important; border-radius: 6px !important; }
    .stat-row .stat-ic svg { width: 11px !important; height: 11px !important; }
    .stat-row .stat-title { font-size: 9.5px !important; line-height: 1.1 !important; }
    .stat-row .stat-num { font-size: 20px !important; line-height: 1.08 !important; margin-top: 1px !important; }
    .stat-row .stat-num span[style] { font-size: 10px !important; }
    .stat-row .stat-sub { font-size: 8.5px !important; line-height: 1.15 !important; margin-top: 5px !important; }
    .stat-row .stat-spark { height: 18px !important; margin-top: 6px !important; }

    .row-opps { grid-template-columns: minmax(0, 1fr) !important; width: 100% !important; }
    .row-opps > section:first-child { width: 100% !important; max-width: none !important; }
    .row-opps > section[data-tc-removed-sector-panel='1'], .row-opps > section:nth-child(2) { display: none !important; }

    .row-opps .panel-title { font-size: 16px !important; }
    .row-opps .opps-toolbar { padding-left: 18px !important; padding-right: 18px !important; gap: 14px !important; }
    .row-opps .tabs { gap: 8px !important; }
    .row-opps .tab, .row-opps .select-like, .row-opps .filter-btn { font-size: 12px !important; min-height: 36px !important; padding: 8px 14px !important; border-radius: 11px !important; }

    /* Desktop opportunity cards: horizontal rectangles, not tall stacked cards. */
    .row-opps .job-row {
      min-height: 58px !important;
      padding: 7px 14px !important;
      display: grid !important;
      grid-template-columns: 42px minmax(0,1fr) 66px 104px 66px !important;
      column-gap: 12px !important;
      align-items: center !important;
      border-radius: 10px !important;
    }
    .row-opps .job-logo {
      width: 38px !important;
      height: 38px !important;
      min-width: 38px !important;
      border-radius: 9px !important;
      font-size: 12px !important;
    }
    .row-opps .job-main {
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: minmax(120px,auto) minmax(0,1fr) !important;
      grid-template-areas: 'title title' 'company meta' !important;
      column-gap: 14px !important;
      row-gap: 2px !important;
      align-items: center !important;
    }
    .row-opps .job-main .title {
      grid-area: title !important;
      font-size: 19.55px !important;
      line-height: 1.08 !important;
      font-weight: 800 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      margin: 0 !important;
    }
    .row-opps .job-main .company {
      grid-area: company !important;
      font-size: 14.6px !important;
      line-height: 1.1 !important;
      margin: 0 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .row-opps .job-meta {
      grid-area: meta !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      min-width: 0 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
    }
    .row-opps .job-meta, .row-opps .job-meta span { font-size: 12.65px !important; line-height: 1.08 !important; }
    .row-opps .job-score .pct, .row-opps .job-score .score, .row-opps .relevance { font-size: 12.65px !important; line-height: 1.05 !important; }
    .row-opps .job-score .lbl { font-size: 9.8px !important; }
    .row-opps .badge { font-size: 10.5px !important; line-height: 1 !important; padding-top: 5px !important; padding-bottom: 5px !important; }
    .row-opps .job-time { font-size: 9.8px !important; line-height: 1.05 !important; }
    .row-opps .job-actions { gap: 7px !important; }
    .row-opps .job-actions .icon-btn,
    .row-opps .job-actions button,
    .row-opps .job-action,
    .row-opps .save-btn,
    .row-opps .open-btn {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      font-size: 15px !important;
      transform: none !important;
    }

    @media (min-width: 1000px) {
      .stat-row { width: 72% !important; max-width: 980px !important; margin-left: auto !important; margin-right: auto !important; }
      .row-opps .opps-toolbar { display: flex !important; justify-content: space-between !important; align-items: center !important; width: 100% !important; }
      .row-opps .opps-actions { margin-left: auto !important; }
      .row-opps #jobList { display: grid !important; gap: 5px !important; }
    }

    @media (min-width: 1500px) {
      .stat-row { width: 68% !important; max-width: 1040px !important; }
      .row-opps .job-row { grid-template-columns: 44px minmax(0,1fr) 72px 112px 72px !important; }
    }

    @media (max-width: 999px) {
      .stat-row { gap: 8px !important; }
      .stat-row .stat-card { padding: 9px 10px 8px !important; }
      .row-opps .panel-title { font-size: 15px !important; }
      .row-opps .tab, .row-opps .select-like, .row-opps .filter-btn { font-size: 11px !important; min-height: 34px !important; padding: 7px 11px !important; }
      .row-opps .job-row { min-height: 64px !important; padding: 8px 10px !important; grid-template-columns: 40px minmax(0,1fr) 58px 62px !important; column-gap: 8px !important; }
      .row-opps .job-row > div:nth-child(4) { display: none !important; }
      .row-opps .job-main { display: block !important; }
      .row-opps .job-main .title { font-size: 17px !important; line-height: 1.12 !important; white-space: normal !important; display: -webkit-box !important; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      .row-opps .job-main .company { font-size: 13px !important; margin-top: 2px !important; }
      .row-opps .job-meta { margin-top: 3px !important; gap: 6px !important; overflow-x: hidden !important; }
      .row-opps .job-meta, .row-opps .job-meta span { font-size: 10.5px !important; }
    }
  `;
  document.head.appendChild(style);

  removeSectorPanel();
  const observer = new MutationObserver(removeSectorPanel);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (!document.querySelector('script[data-tc-country-filter]')) {
    const s = document.createElement('script');
    s.dataset.tcCountryFilter = '1';
    s.src = new URL('./country-filter.js?v=20260911a', document.currentScript?.src || location.href).href;
    s.defer = true;
    s.addEventListener('error', () => console.error('[TheCareers] country filter failed to load'));
    document.head.appendChild(s);
  }
})();
