/* Visual-only topbar cleanup for TheCareers.
   Hides the descriptive left banner and system/search status chips.
   Search Now, profile controls and all backend behavior remain unchanged. */
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
})();
