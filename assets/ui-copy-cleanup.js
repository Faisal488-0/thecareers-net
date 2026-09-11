/* TheCareers public UI copy cleanup
   Keeps infrastructure/vendor names out of customer-facing controls.
   Also loads the isolated mobile job-card fix without touching desktop UI. */
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
