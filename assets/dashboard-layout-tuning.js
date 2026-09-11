/* TheCareers dashboard visual tuning
   - Remove redundant Jobs by Sector panel (sector categories are already represented near the globe)
   - Reduce globe source/category cards by ~40% while preserving readability and responsive behavior
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
    /* Category/source cards around/below the globe: ~40% smaller footprint. */
    @media (min-width: 1000px) {
      .row-core .source-chip {
        max-width: 108px !important;
        min-height: 34px !important;
        padding: 5px 6px !important;
        gap: 5px !important;
        border-radius: 8px !important;
        box-shadow: 0 1px 2px rgba(20,22,26,.04), 0 5px 14px -10px rgba(20,22,26,.16) !important;
      }
      .row-core .source-chip .ic {
        width: 14px !important;
        height: 14px !important;
        min-width: 14px !important;
        border-radius: 5px !important;
      }
      .row-core .source-chip .ic svg {
        width: 8px !important;
        height: 8px !important;
      }
      .row-core .source-chip .lbl b {
        font-size: 7.8px !important;
        line-height: 1.1 !important;
        letter-spacing: .02em !important;
      }
      .row-core .source-chip .lbl span {
        font-size: 6.8px !important;
        line-height: 1.15 !important;
        margin-top: 1px !important;
      }

      /* Keep the reduced cards clear of the globe and the right analytics rail. */
      .row-core .core-visual.thecareers-globe-zone {
        grid-template-columns: minmax(110px,130px) minmax(420px,31vw) minmax(110px,130px) !important;
        column-gap: 14px !important;
      }
      .row-core .sc-companies,.row-core .sc-schools,.row-core .sc-international { justify-self:start !important; }
      .row-core .sc-oilgas,.row-core .sc-government,.row-core .sc-talent { justify-self:end !important; }
    }

    @media (min-width: 1500px) {
      .row-core .source-chip { max-width: 118px !important; }
      .row-core .core-visual.thecareers-globe-zone {
        grid-template-columns: minmax(120px,140px) minmax(470px,33vw) minmax(120px,140px) !important;
      }
    }

    /* On tablets/phones, preserve tap/readability rather than forcing desktop scaling. */
    @media (max-width: 999px) {
      .row-core .source-chip {
        max-width: 150px !important;
      }
    }
  `;
  document.head.appendChild(style);

  removeSectorPanel();
  const observer = new MutationObserver(removeSectorPanel);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
