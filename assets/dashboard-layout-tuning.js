/* TheCareers dashboard visual tuning
   - Remove redundant Jobs by Sector panel (sector categories are already represented near the globe)
   - Reduce the four dashboard metric cards (Jobs Found / High Match / Sources Online / Applications) by ~40%
   - Widen Top Opportunities to use the freed space and scale its controls/text by ~10%
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
    /* The four KPI cards under the globe are intentionally much more compact. */
    .stat-row {
      gap: 10px !important;
      align-items: stretch !important;
    }
    .stat-row .stat-card {
      min-height: 0 !important;
      padding: 10px 12px 9px !important;
      border-radius: 12px !important;
      box-shadow: 0 1px 2px rgba(20,22,26,.035), 0 6px 18px -14px rgba(20,22,26,.10) !important;
    }
    .stat-row .stat-top {
      gap: 7px !important;
      margin-bottom: 7px !important;
    }
    .stat-row .stat-ic {
      width: 22px !important;
      height: 22px !important;
      min-width: 22px !important;
      border-radius: 6px !important;
    }
    .stat-row .stat-ic svg {
      width: 11px !important;
      height: 11px !important;
    }
    .stat-row .stat-title {
      font-size: 9.5px !important;
      line-height: 1.1 !important;
    }
    .stat-row .stat-num {
      font-size: 20px !important;
      line-height: 1.08 !important;
      margin-top: 1px !important;
    }
    .stat-row .stat-num span[style] {
      font-size: 10px !important;
    }
    .stat-row .stat-sub {
      font-size: 8.5px !important;
      line-height: 1.15 !important;
      margin-top: 5px !important;
    }
    .stat-row .stat-spark {
      height: 18px !important;
      margin-top: 6px !important;
    }

    /* Top Opportunities should occupy the full horizontal area now that the
       Jobs by Sector panel is hidden. This removes the empty right-hand column. */
    .row-opps {
      grid-template-columns: minmax(0, 1fr) !important;
      width: 100% !important;
    }
    .row-opps > section:first-child {
      width: 100% !important;
      max-width: none !important;
    }
    .row-opps > section[data-tc-removed-sector-panel='1'],
    .row-opps > section:nth-child(2) {
      display: none !important;
    }

    /* ~10% larger toolbar buttons and labels. */
    .row-opps .panel-title {
      font-size: 16px !important;
    }
    .row-opps .opps-toolbar {
      padding-left: 18px !important;
      padding-right: 18px !important;
      gap: 14px !important;
    }
    .row-opps .tabs {
      gap: 8px !important;
    }
    .row-opps .tab,
    .row-opps .select-like,
    .row-opps .filter-btn {
      font-size: 12px !important;
      min-height: 36px !important;
      padding: 8px 14px !important;
      border-radius: 11px !important;
    }

    /* ~10% larger readable job content while preserving the existing layout. */
    .row-opps .job-main .title {
      font-size: 17px !important;
      line-height: 1.28 !important;
    }
    .row-opps .job-main .company {
      font-size: 12.7px !important;
    }
    .row-opps .job-meta,
    .row-opps .job-meta span {
      font-size: 11px !important;
    }
    .row-opps .job-row {
      min-height: 72px !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    .row-opps .job-score .pct,
    .row-opps .job-score .score,
    .row-opps .relevance {
      font-size: 11px !important;
    }
    .row-opps .job-actions button,
    .row-opps .job-action,
    .row-opps .save-btn,
    .row-opps .open-btn {
      transform: scale(1.1);
      transform-origin: center;
    }

    @media (min-width: 1000px) {
      .stat-row {
        width: 72% !important;
        max-width: 980px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .row-opps .opps-toolbar {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
      }
      .row-opps .opps-actions {
        margin-left: auto !important;
      }
    }

    @media (min-width: 1500px) {
      .stat-row {
        width: 68% !important;
        max-width: 1040px !important;
      }
    }

    @media (max-width: 999px) {
      .stat-row {
        gap: 8px !important;
      }
      .stat-row .stat-card {
        padding: 9px 10px 8px !important;
      }
      .row-opps .panel-title {
        font-size: 15px !important;
      }
      .row-opps .tab,
      .row-opps .select-like,
      .row-opps .filter-btn {
        font-size: 11px !important;
        min-height: 34px !important;
        padding: 7px 11px !important;
      }
      .row-opps .job-main .title {
        font-size: 15.5px !important;
      }
    }
  `;
  document.head.appendChild(style);

  removeSectorPanel();
  const observer = new MutationObserver(removeSectorPanel);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
