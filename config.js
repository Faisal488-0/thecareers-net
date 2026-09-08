// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj"
};

// Global Search Network layout safety layer.
// Keeps all six source cards inside the panel and outside the black-hole core.
(() => {
  const style = document.createElement('style');
  style.id = 'thecareers-network-layout-hotfix';
  style.textContent = `
    .net-body {
      min-height: 300px;
      overflow: hidden;
      isolation: isolate;
      position: relative;
    }

    .net-body .net-node {
      width: 132px !important;
      min-width: 132px !important;
      max-width: 132px !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      white-space: normal !important;
      overflow: hidden !important;
      text-overflow: ellipsis;
      z-index: 8 !important;
    }

    .net-body .net-node b,
    .net-body .net-node .live {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .net-body #netCanvas { z-index: 1 !important; }
    .net-body .net-center { z-index: 3 !important; }

    /* Explicit balanced placement. nth-of-type counts .net-center as the first div. */
    .net-body > .net-node:nth-of-type(2) {
      top: 12% !important;
      left: 8% !important;
      right: auto !important;
      bottom: auto !important;
      transform: none !important;
    }
    .net-body > .net-node:nth-of-type(3) {
      top: 12% !important;
      right: 8% !important;
      left: auto !important;
      bottom: auto !important;
      transform: none !important;
    }
    .net-body > .net-node:nth-of-type(4) {
      top: 50% !important;
      left: 5% !important;
      right: auto !important;
      bottom: auto !important;
      transform: translateY(-50%) !important;
    }
    .net-body > .net-node:nth-of-type(5) {
      top: 50% !important;
      right: 5% !important;
      left: auto !important;
      bottom: auto !important;
      transform: translateY(-50%) !important;
    }
    .net-body > .net-node:nth-of-type(6) {
      bottom: 8% !important;
      left: 8% !important;
      right: auto !important;
      top: auto !important;
      transform: none !important;
    }
    .net-body > .net-node:nth-of-type(7) {
      bottom: 8% !important;
      right: 8% !important;
      left: auto !important;
      top: auto !important;
      transform: none !important;
    }

    @media (max-width: 1180px) {
      .net-body { min-height: 320px; }
      .net-body .net-node {
        width: 118px !important;
        min-width: 118px !important;
        max-width: 118px !important;
        padding: 7px 9px !important;
      }
      .net-body > .net-node:nth-of-type(2),
      .net-body > .net-node:nth-of-type(6) { left: 6% !important; }
      .net-body > .net-node:nth-of-type(3),
      .net-body > .net-node:nth-of-type(7) { right: 6% !important; }
      .net-body > .net-node:nth-of-type(4) { left: 3% !important; }
      .net-body > .net-node:nth-of-type(5) { right: 3% !important; }
    }

    @media (max-width: 760px) {
      .net-body { min-height: 310px; }
      .net-body .net-node {
        width: 104px !important;
        min-width: 104px !important;
        max-width: 104px !important;
        font-size: 10px !important;
      }
      .net-body > .net-node:nth-of-type(2),
      .net-body > .net-node:nth-of-type(6) { left: 3% !important; }
      .net-body > .net-node:nth-of-type(3),
      .net-body > .net-node:nth-of-type(7) { right: 3% !important; }
      .net-body > .net-node:nth-of-type(4) { left: 1.5% !important; }
      .net-body > .net-node:nth-of-type(5) { right: 1.5% !important; }
    }

    @media (max-width: 520px) {
      .net-body .net-node { display: none !important; }
    }
  `;
  document.head.appendChild(style);
})();
