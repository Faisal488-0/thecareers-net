// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj"
};

// Global Search Network layout safety layer.
// Runtime pixel positioning is intentional here: it overrides the original
// inline left/right styles and keeps all six cards inside the panel at every
// desktop width without entering the black-hole center.
(() => {
  const style = document.createElement('style');
  style.id = 'thecareers-network-layout-hotfix';
  style.textContent = `
    .net-body {
      min-height: 300px !important;
      overflow: hidden !important;
      isolation: isolate;
      position: relative !important;
    }
    .net-body #netCanvas {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 1 !important;
    }
    .net-body .net-center { z-index: 3 !important; }
    .net-body .net-node {
      position: absolute !important;
      min-width: 0 !important;
      display: block;
      visibility: visible;
      opacity: 1;
      white-space: normal !important;
      overflow: hidden !important;
      text-overflow: ellipsis;
      z-index: 8 !important;
      box-sizing: border-box !important;
      transition: left .18s ease, top .18s ease, width .18s ease;
    }
    .net-body .net-node b,
    .net-body .net-node .live {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @media (max-width: 520px) {
      .net-body .net-node { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  function layoutNetworkNodes() {
    const body = document.querySelector('.net-body');
    if (!body) return;
    const nodes = Array.from(body.querySelectorAll(':scope > .net-node'));
    if (nodes.length !== 6) return;

    const w = body.clientWidth;
    const h = body.clientHeight;
    if (!w || !h) return;

    if (w <= 520) {
      nodes.forEach(n => n.style.setProperty('display', 'none', 'important'));
      return;
    }

    const cardW = w < 760 ? 104 : (w < 1180 ? 118 : 132);
    const side = w < 760 ? 14 : Math.max(22, Math.min(74, Math.round(w * 0.065)));
    const topGap = 20;
    const bottomGap = 22;

    nodes.forEach(n => {
      n.style.setProperty('display', 'block', 'important');
      n.style.setProperty('width', `${cardW}px`, 'important');
      n.style.setProperty('max-width', `${cardW}px`, 'important');
      n.style.setProperty('min-width', `${cardW}px`, 'important');
      n.style.setProperty('right', 'auto', 'important');
      n.style.setProperty('bottom', 'auto', 'important');
      n.style.setProperty('transform', 'none', 'important');
    });

    const leftX = side;
    const rightX = Math.max(side, w - side - cardW);

    const topY = topGap;
    const midYLeft = Math.max(topGap + 56, Math.round((h - nodes[2].offsetHeight) / 2));
    const midYRight = Math.max(topGap + 56, Math.round((h - nodes[3].offsetHeight) / 2));
    const bottomYLeft = Math.max(midYLeft + 58, h - bottomGap - nodes[4].offsetHeight);
    const bottomYRight = Math.max(midYRight + 58, h - bottomGap - nodes[5].offsetHeight);

    const positions = [
      [leftX, topY],
      [rightX, topY],
      [leftX, midYLeft],
      [rightX, midYRight],
      [leftX, bottomYLeft],
      [rightX, bottomYRight]
    ];

    nodes.forEach((n, i) => {
      n.style.setProperty('left', `${positions[i][0]}px`, 'important');
      n.style.setProperty('top', `${positions[i][1]}px`, 'important');
    });
  }

  const run = () => requestAnimationFrame(() => requestAnimationFrame(layoutNetworkNodes));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  window.addEventListener('load', run, { once: true });
  window.addEventListener('resize', run, { passive: true });

  const attachObserver = () => {
    const body = document.querySelector('.net-body');
    if (!body || !('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(run);
    ro.observe(body);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
  } else {
    attachObserver();
  }
})();

// Job title is the primary decision field in Top Opportunities.
// Make it visually dominant while keeping company/meta information secondary.
(() => {
  const style = document.createElement('style');
  style.id = 'thecareers-job-title-priority';
  style.textContent = `
    .job-main .title {
      font-size: 15.5px !important;
      line-height: 1.28 !important;
      font-weight: 800 !important;
      letter-spacing: -0.01em !important;
      color: #0b0c0e !important;
      margin-bottom: 3px !important;
    }
    .job-main .company {
      font-size: 11.5px !important;
      color: #5b6068 !important;
    }
    .job-row {
      min-height: 64px;
    }
    @media (max-width: 760px) {
      .job-main .title { font-size: 14.5px !important; }
    }
  `;
  document.head.appendChild(style);
})();

// Load the utility panels without changing the original document structure.
// CV Center and Settings are real controls, not placeholder scroll targets.
(() => {
  if (document.querySelector('script[data-tc-utility-panels]')) return;
  const s = document.createElement('script');
  s.dataset.tcUtilityPanels = '1';
  s.src = new URL('./assets/utility-panels.js', document.currentScript?.src || location.href).href;
  s.defer = true;
  s.addEventListener('error', () => console.error('[TheCareers] utility panels failed to load'));
  document.head.appendChild(s);
})();
