/* TheCareers public UI copy cleanup
   Keeps infrastructure/vendor names out of customer-facing controls.
   Also loads the isolated mobile job-card fix and applies the approved
   wide AI Search Core layout without changing search/backend behavior. */
(() => {
  'use strict';
  if (window.__TC_UI_COPY_CLEANUP__) return;
  window.__TC_UI_COPY_CLEANUP__ = true;

  const apply = () => {
    document.querySelectorAll('.tc-modal .tc-setting span').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (/^Refresh\s+Supabase\s+data\s+now$/i.test(text)) el.textContent = 'Refresh live data now';
    });
  };

  // User-approved dashboard cleanup:
  // remove only the visible Live Search Activity card and let AI Search Core
  // use the freed horizontal space. Background activity/search logic remains intact.
  if (!document.getElementById('tc-wide-ai-core-layout')) {
    const style = document.createElement('style');
    style.id = 'tc-wide-ai-core-layout';
    style.textContent = `
      .row-core {
        grid-template-columns: minmax(0, 1fr) !important;
      }
      .row-core > section:nth-child(2) {
        display: none !important;
      }
      .row-core > section:first-child {
        width: 100% !important;
        max-width: none !important;
      }

      @media (min-width: 1000px) {
        .row-core .core-body {
          grid-template-columns: minmax(0, 1fr) 220px !important;
        }
        .row-core .core-visual.thecareers-globe-zone {
          grid-template-columns: minmax(180px, 1fr) minmax(460px, 38vw) minmax(180px, 1fr) !important;
          column-gap: 22px !important;
          min-height: 470px !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }
        .row-core .thecareers-globe-zone #thecareers-globe-stage {
          width: clamp(460px, 38vw, 720px) !important;
        }
        .row-core .source-chip {
          max-width: 205px !important;
        }
      }

      @media (min-width: 1500px) {
        .row-core .core-visual.thecareers-globe-zone {
          grid-template-columns: minmax(210px, 1fr) minmax(520px, 40vw) minmax(210px, 1fr) !important;
        }
        .row-core .thecareers-globe-zone #thecareers-globe-stage {
          width: clamp(520px, 40vw, 760px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (!document.querySelector('script[data-tc-mobile-jobs-fix]')) {
    const s = document.createElement('script');
    s.dataset.tcMobileJobsFix = '1';
    s.src = new URL('./mobile-jobs-fix.js?v=20260911b', document.currentScript?.src || location.href).href;
    s.defer = true;
    document.head.appendChild(s);
  }
})();
