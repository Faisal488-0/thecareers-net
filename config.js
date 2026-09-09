// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj"
};

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
