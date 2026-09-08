// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj"
};

// UI safety hotfix: keep Global Search Network source cards compact and
// permanently outside the interactive black-hole center across desktop widths.
(() => {
  const style = document.createElement('style');
  style.id = 'thecareers-network-layout-hotfix';
  style.textContent = `
    .net-body {
      min-height: 290px;
      overflow: hidden;
      isolation: isolate;
    }
    .net-body .net-node {
      width: 132px !important;
      min-width: 0 !important;
      max-width: 132px !important;
      display: block !important;
      white-space: normal !important;
      overflow: hidden !important;
      text-overflow: ellipsis;
      z-index: 6;
    }
    .net-body .net-node b,
    .net-body .net-node .live {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .net-body .net-center,
    .net-body #netCanvas {
      z-index: 2;
    }
    @media (max-width: 1180px) {
      .net-body { min-height: 320px; }
      .net-body .net-node {
        width: 118px !important;
        max-width: 118px !important;
        padding: 7px 9px !important;
      }
    }
    @media (max-width: 760px) {
      .net-body { min-height: 300px; }
      .net-body .net-node {
        width: 100px !important;
        max-width: 100px !important;
        font-size: 10px !important;
      }
    }
    @media (max-width: 520px) {
      .net-body .net-node { display: none !important; }
    }
  `;
  document.head.appendChild(style);
})();
