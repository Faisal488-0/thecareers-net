/* Visual cleanup for TheCareers.
   - Hides the descriptive topbar banner and system/search status chips.
   - Removes redundant sidebar entries: Jobs, Search Engine, Companies.
   Dashboard, CV Center, Settings, Search Now, profile controls and backend behavior remain unchanged. */
(() => {
  'use strict';
  if (window.__TC_TOPBAR_VISIBILITY_CLEANUP__) return;
  window.__TC_TOPBAR_VISIBILITY_CLEANUP__ = true;

  const style = document.createElement('style');
  style.id = 'tc-topbar-visibility-cleanup';
  style.textContent = `
    .topbar-left,
    .topbar-right > .status-chip {
      display: none !important;
    }

    .topbar {
      justify-content: flex-end !important;
    }

    .topbar-right {
      margin-left: auto !important;
    }
  `;
  document.head.appendChild(style);

  const removeRedundantNav = () => {
    document.querySelectorAll('.nav-item[data-page="jobs"], .nav-item[data-page="search"], .nav-item[data-page="companies"]').forEach(el => el.remove());
  };

  removeRedundantNav();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeRedundantNav, { once: true });
  }

  const nav = document.querySelector('.nav');
  if (nav) {
    new MutationObserver(removeRedundantNav).observe(nav, { childList: true, subtree: true });
  }
})();
