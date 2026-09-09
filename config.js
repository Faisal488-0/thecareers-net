// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj"
};

// Global Search Network — realistic black-hole visual + responsive safety layer.
// The black hole stays locked to the exact center of the existing network panel.
(() => {
  const style = document.createElement('style');
  style.id = 'thecareers-network-blackhole-v2';
  style.textContent = `
    .net-body {
      position: relative !important;
      height: clamp(330px, 31vw, 470px) !important;
      min-height: 330px !important;
      overflow: hidden !important;
      isolation: isolate;
      background:
        radial-gradient(circle at 50% 48%, rgba(47,111,235,.045), transparent 38%),
        linear-gradient(180deg,#fff 0%,#fbfdff 100%);
    }
    .net-body .tc-black-hole {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%,-50%) !important;
      width: clamp(430px, 56vw, 760px) !important;
      max-width: 72% !important;
      height: auto !important;
      aspect-ratio: 600 / 429;
      object-fit: contain !important;
      z-index: 1 !important;
      pointer-events: none !important;
      user-select: none !important;
      filter: saturate(1.03) contrast(1.025) drop-shadow(0 18px 32px rgba(14,37,70,.12));
      transform-origin: 50% 50%;
    }
    .net-body::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: min(49vw,650px);
      aspect-ratio: 1.42 / 1;
      transform: translate(-50%,-50%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      box-shadow: 0 0 50px rgba(64,151,255,.08), 0 0 76px rgba(255,160,53,.05);
    }
    .net-body #netCanvas {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2 !important;
      opacity: .46;
      pointer-events: none;
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
      background: rgba(255,255,255,.96) !important;
      backdrop-filter: blur(8px);
      border-color: rgba(218,226,238,.94) !important;
      box-shadow: 0 10px 26px -16px rgba(24,45,78,.28) !important;
      transition: left .18s ease, top .18s ease, width .18s ease;
    }
    .net-body .net-node b,
    .net-body .net-node .live {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .workflow {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 9px !important;
      padding: 4px 18px 20px !important;
      flex-wrap: wrap !important;
      overflow: visible !important;
    }
    .workflow .wf-step {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      flex: 0 0 auto;
      visibility: visible !important;
      opacity: 1 !important;
      white-space: nowrap;
      border-color: #dce5f2 !important;
      background: #fbfdff !important;
      box-shadow: 0 5px 14px -12px rgba(30,70,130,.24);
    }
    @media (max-width: 980px) {
      .net-body {
        height: clamp(320px, 45vw, 410px) !important;
      }
      .net-body .tc-black-hole {
        width: clamp(390px, 68vw, 620px) !important;
        max-width: 68% !important;
      }
    }
    @media (max-width: 760px) {
      .content { padding-left: 12px !important; padding-right: 12px !important; }
      .topbar { padding: 10px 12px !important; overflow: visible !important; }
      .topbar-right { width: 100%; gap: 8px !important; justify-content: flex-end; min-width: 0; }
      .topbar-right .status-chip { display: none !important; }
      .topbar-right .profile { padding-left: 8px !important; min-width: 0; }
      .topbar-right .profile-name { max-width: 84px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .search-now { display: inline-flex !important; visibility: visible !important; opacity: 1 !important; flex: 0 0 auto; padding: 9px 12px !important; }
      .panel-head { gap: 10px; }
      .panel-head .live-pill { flex: 0 0 auto; }
      .net-body {
        height: min(78vw, 330px) !important;
        min-height: 250px !important;
      }
      .net-body .tc-black-hole {
        width: min(94vw, 520px) !important;
        max-width: 94% !important;
      }
      .net-body #netCanvas { opacity: .28; }
      .workflow {
        justify-content: stretch !important;
        gap: 8px !important;
        padding: 10px 12px 16px !important;
      }
      .workflow .wf-step {
        flex: 1 1 calc(50% - 8px) !important;
        min-width: 0 !important;
        width: auto !important;
        padding: 9px 8px !important;
        font-size: 10px !important;
      }
      .workflow .wf-arrow { display: none !important; }
    }
    @media (max-width: 560px) {
      .net-body {
        height: min(82vw, 310px) !important;
        min-height: 235px !important;
      }
      .net-body .tc-black-hole {
        width: min(112vw, 480px) !important;
        max-width: 112% !important;
      }
      .net-body .net-node { display: none !important; }
      .workflow .wf-step {
        flex-basis: calc(50% - 6px) !important;
        min-height: 38px !important;
      }
      .workflow .wf-step:last-of-type { flex-basis: 100% !important; }
    }
    @media (max-width: 380px) {
      .workflow .wf-step { flex-basis: 100% !important; }
      .search-now { font-size: 12px !important; padding: 8px 10px !important; }
      .profile-role { display: none !important; }
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

    if (w <= 560) {
      nodes.forEach(n => n.style.setProperty('display', 'none', 'important'));
      return;
    }

    const cardW = w < 760 ? 104 : (w < 1180 ? 120 : 138);
    const side = w < 760 ? 10 : Math.max(20, Math.min(68, Math.round(w * .055)));
    const topGap = Math.max(18, Math.round(h * .08));
    const bottomGap = topGap;

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
    const middleY = Math.max(topGap + 62, Math.round((h - 48) / 2));
    const bottomY = Math.max(middleY + 58, h - bottomGap - 48);
    const positions = [
      [leftX, topY], [rightX, topY],
      [leftX, middleY], [rightX, middleY],
      [leftX, bottomY], [rightX, bottomY]
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('load', run, { once: true });
  window.addEventListener('resize', run, { passive: true });

  const attachObserver = () => {
    const body = document.querySelector('.net-body');
    if (!body || !('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(run);
    ro.observe(body);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
  else attachObserver();
})();

// Job title is the primary decision field in Top Opportunities.
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
    .job-main .company { font-size: 11.5px !important; color: #5b6068 !important; }
    .job-row { min-height: 64px; }
    @media (max-width: 760px) { .job-main .title { font-size: 14.5px !important; } }
  `;
  document.head.appendChild(style);
})();

// Load the utility panels without changing the original document structure.
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
