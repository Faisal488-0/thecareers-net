// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj"
};

// Live jobs freshness guard. The dashboard controller still performs all
// rendering/scoring locally, but its Supabase jobs request is rewritten to load
// the freshest active records first instead of an old score-heavy snapshot.
// This runs synchronously before backend-bridge.js is parsed.
(() => {
  if (window.__THECAREERS_FRESH_JOBS_FETCH__) return;
  window.__THECAREERS_FRESH_JOBS_FETCH__ = true;
  const nativeFetch = window.fetch.bind(window);
  const supabaseHost = (() => {
    try { return new URL(window.THECAREERS_CONFIG.SUPABASE_URL).host; }
    catch { return ''; }
  })();

  window.fetch = function(input, init) {
    try {
      if (typeof input === 'string') {
        const u = new URL(input, location.href);
        if (u.host === supabaseHost && u.pathname === '/rest/v1/jobs' && u.searchParams.get('status') === 'eq.active') {
          u.searchParams.set('order', 'found_at.desc.nullslast,published_at.desc.nullslast,score.desc.nullslast');
          const currentLimit = Number(u.searchParams.get('limit') || 0);
          if (!currentLimit || currentLimit < 1200) u.searchParams.set('limit', '1200');
          input = u.href;
        }
      }
    } catch (_) {}
    return nativeFetch(input, init);
  };
})();

// Keep the existing filters and controls unchanged, but always open the live
// opportunity list on All Jobs + Newest. This prevents the High Match tab from
// hiding fresh low-score jobs and making the site look stale.
(() => {
  const applyFreshestDefault = () => {
    const allTab = document.querySelector('.tab[data-tab="all"]');
    const sortCtl = document.querySelector('.select-like');
    if (allTab && !allTab.classList.contains('active')) allTab.click();
    if (sortCtl && !/Sort by:\s*Newest/i.test(sortCtl.textContent || '')) {
      for (let i = 0; i < 3 && !/Sort by:\s*Newest/i.test(sortCtl.textContent || ''); i++) sortCtl.click();
    }
  };
  const boot = () => {
    let tries = 0;
    const timer = setInterval(() => {
      applyFreshestDefault();
      tries += 1;
      const allActive = document.querySelector('.tab[data-tab="all"]')?.classList.contains('active');
      const newest = /Sort by:\s*Newest/i.test(document.querySelector('.select-like')?.textContent || '');
      if ((allActive && newest) || tries >= 20) clearInterval(timer);
    }, 150);
  };
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot, { once: true });
})();

// Global Search Network enhancement is isolated in its own file so the rest of
// the dashboard layout stays unchanged.
(() => {
  if (document.querySelector('script[data-tc-network-enhancement]')) return;
  const s = document.createElement('script');
  s.dataset.tcNetworkEnhancement = '1';
  s.src = new URL('./assets/network-enhancement.js?v=20260909c', document.currentScript?.src || location.href).href;
  s.async = false;
  s.addEventListener('error', () => console.error('[TheCareers] network enhancement failed to load'));
  document.head.appendChild(s);
})();

// Desktop-only source cards and attraction-flow layer. This deliberately targets
// only the existing Global Search Network (.net-body) and does not alter any other UI.
(() => {
  if (document.querySelector('script[data-tc-network-desktop-flow]')) return;
  const s = document.createElement('script');
  s.dataset.tcNetworkDesktopFlow = '1';
  s.src = new URL('./assets/network-desktop-flow.js?v=20260911a', document.currentScript?.src || location.href).href;
  s.defer = true;
  s.addEventListener('error', () => console.error('[TheCareers] desktop network flow failed to load'));
  document.head.appendChild(s);
})();

// Mobile navigation drawer. The original stylesheet hides .sidebar below 760px;
// this isolated enhancement restores it as an accessible off-canvas menu.
(() => {
  if (document.querySelector('script[data-tc-mobile-nav]')) return;
  const s = document.createElement('script');
  s.dataset.tcMobileNav = '1';
  s.src = new URL('./assets/mobile-nav.js?v=20260910a', document.currentScript?.src || location.href).href;
  s.defer = true;
  s.addEventListener('error', () => console.error('[TheCareers] mobile navigation failed to load'));
  document.head.appendChild(s);
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
    .job-main .company {
      font-size: 11.5px !important;
      color: #5b6068 !important;
    }
    .job-row { min-height: 64px; }
    @media (max-width: 760px) {
      .job-main .title { font-size: 14.5px !important; }
    }
  `;
  document.head.appendChild(style);
})();

// Load the account / CV / settings panels without changing the original page structure.
(() => {
  if (document.querySelector('script[data-tc-utility-panels]')) return;
  const s = document.createElement('script');
  s.dataset.tcUtilityPanels = '1';
  s.src = new URL('./assets/utility-panels.js', document.currentScript?.src || location.href).href;
  s.defer = true;
  s.addEventListener('error', () => console.error('[TheCareers] utility panels failed to load'));
  document.head.appendChild(s);
})();

// Privacy-minimized product analytics. Events are stored in the backend and
// Telegram delivery is handled server-side, never from browser secrets.
(() => {
  if (document.querySelector('script[data-tc-site-telemetry]')) return;
  const s = document.createElement('script');
  s.dataset.tcSiteTelemetry = '1';
  s.src = new URL('./assets/site-telemetry.js?v=20260911c', document.currentScript?.src || location.href).href;
  s.defer = true;
  s.addEventListener('error', () => console.error('[TheCareers] telemetry failed to load'));
  document.head.appendChild(s);
})();

// Customer-facing settings must not expose backend/vendor implementation names.
(() => {
  if (document.querySelector('script[data-tc-ui-copy-cleanup]')) return;
  const s = document.createElement('script');
  s.dataset.tcUiCopyCleanup = '1';
  s.src = new URL('./assets/ui-copy-cleanup.js?v=20260911a', document.currentScript?.src || location.href).href;
  s.defer = true;
  document.head.appendChild(s);
})();

// Pre-launch fallback identity and legal navigation. Auth can replace this after load.
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
