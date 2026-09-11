/* TheCareers dashboard visual tuning
   - Remove redundant Jobs by Sector panel (sector categories are already represented near the globe)
   - Reduce the four dashboard metric cards (Jobs Found / High Match / Sources Online / Applications) by ~40%
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

    @media (min-width: 1000px) {
      .stat-row {
        width: 72% !important;
        max-width: 980px !important;
        margin-left: auto !important;
        margin-right: auto !important;
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
    }
  `;
  document.head.appendChild(style);

  removeSectorPanel();
  const observer = new MutationObserver(removeSectorPanel);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
