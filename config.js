// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj"
};

// Global Search Network layout safety layer + realistic black-hole visual.
// Only the black-hole artwork is changed; the original workflow/buttons,
// panel spacing, top bar and responsive layout remain untouched.
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
    .net-body .tc-black-hole {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%,-50%) !important;
      width: clamp(360px, 48vw, 650px) !important;
      max-width: 68% !important;
      height: auto !important;
      object-fit: contain !important;
      z-index: 1 !important;
      pointer-events: none !important;
      user-select: none !important;
      filter: saturate(1.03) contrast(1.025) drop-shadow(0 16px 28px rgba(14,37,70,.11));
    }
    .net-body #netCanvas {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2 !important;
      opacity: .46;
    }
    .net-body .net-center {
      display: none !important;
    }
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
    @media (max-width: 760px) {
      .net-body .tc-black-hole {
        width: min(86vw, 500px) !important;
        max-width: 86% !important;
      }
    }
    @media (max-width: 520px) {
      .net-body .net-node { display: none !important; }
      .net-body .tc-black-hole {
        width: min(96vw, 460px) !important;
        max-width: 96% !important;
      }
    }
  `;
  document.head.appendChild(style);

  function installBlackHole() {
    const body = document.querySelector('.net-body');
    if (!body) return;
    let img = body.querySelector('.tc-black-hole');
    if (!img) {
      img = document.createElement('img');
      img.className = 'tc-black-hole';
      img.src = './assets/global-search-blackhole.webp';
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'eager';
      img.setAttribute('aria-hidden', 'true');
      body.insertBefore(img, body.firstChild);
    }
  }

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

  const run = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    installBlackHole();
    layoutNetworkNodes();
  }));
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

// Pre-launch identity and legal navigation.
// Do not present a fictional user or a registered-company identity before Auth
// and the final legal operator details are configured.
(() => {
  const apply = () => {
    const profileName = document.querySelector('.profile-name');
    const profileRole = document.querySelector('.profile-role');
    const avatar = document.querySelector('.profile .avatar');
    if (profileName) profileName.textContent = 'Guest';
    if (profileRole) profileRole.textContent = 'Pre-launch access';
    if (avatar) avatar.textContent = 'TC';

    const foot = document.querySelector('.sidebar-foot');
    if (foot) {
      foot.innerHTML = `
        TheCareers v2.1.0<br>
        © 2026 TheCareers<br>
        <span style="display:inline-block;margin-top:6px">
          <a href="./privacy.html">Privacy</a> ·
          <a href="./terms.html">Terms</a> ·
          <a href="./disclaimer.html">Disclaimer</a>
        </span><br>
        <a href="mailto:support@thecareers.net">support@thecareers.net</a>
      `;
      foot.querySelectorAll('a').forEach(a => {
        a.style.color = 'inherit';
        a.style.textDecoration = 'underline';
        a.style.textUnderlineOffset = '2px';
      });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
