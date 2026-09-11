/* TheCareers public UI copy cleanup
   Keeps infrastructure/vendor names out of customer-facing controls.
   Scope: Settings modal copy only. */
(() => {
  'use strict';
  if (window.__TC_UI_COPY_CLEANUP__) return;
  window.__TC_UI_COPY_CLEANUP__ = true;

  const apply = () => {
    document.querySelectorAll('.tc-modal .tc-setting span').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (/^Refresh\s+Supabase\s+data\s+now$/i.test(text)) {
        el.textContent = 'Refresh live data now';
      }
    });
  };

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
