// Public frontend configuration. The publishable key is safe to expose in browser code.
window.THECAREERS_CONFIG = {
  SUPABASE_URL: "https://cqqozlmsvysmxdkkxjbj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_lJPgMCG-HAEnfRNEVJtSdg_pFaxAAuj",
  AUTH_REDIRECT_URL: "https://thecareers.net/"
};

(() => {
  'use strict';
  const here = document.currentScript?.src || location.href;
  const asset = p => new URL(p, here).href;

  function css(path, attr) {
    if (document.querySelector(`link[data-${attr}]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.dataset[attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())] = '1';
    l.href = asset(path); document.head.appendChild(l);
  }
  css('./assets/ui-ux-pro-max.css?v=20260912a', 'tc-uiux-pro-max');
  css('./assets/mobile-responsive-fix.css?v=20260912c', 'tc-mobile-responsive-fix');

  if (!window.__TC_JOBLIST_MUTATION_STABILITY__) {
    window.__TC_JOBLIST_MUTATION_STABILITY__ = true;
    const NativeMutationObserver = window.MutationObserver;
    if (NativeMutationObserver) {
      window.MutationObserver = class TheCareersStableMutationObserver extends NativeMutationObserver {
        observe(target, options = {}) {
          if (target?.id === 'jobList' && options?.childList && options?.subtree) {
            return super.observe(target, { ...options, subtree: false, characterData: false });
          }
          return super.observe(target, options);
        }
      };
    }
  }

  if (!window.__THECAREERS_FRESH_JOBS_FETCH__) {
    window.__THECAREERS_FRESH_JOBS_FETCH__ = true;
    const nativeFetch = window.fetch.bind(window);
    const host = (()=>{try{return new URL(window.THECAREERS_CONFIG.SUPABASE_URL).host}catch{return ''}})();
    window.fetch = function(input, init) {
      try {
        if (typeof input === 'string') {
          const u = new URL(input, location.href);
          if (u.host === host && u.pathname === '/rest/v1/jobs' && u.searchParams.get('status') === 'eq.active') {
            u.searchParams.set('order','found_at.desc.nullslast,published_at.desc.nullslast,score.desc.nullslast');
            const lim=Number(u.searchParams.get('limit')||0); if(!lim||lim<500)u.searchParams.set('limit','500');
            input=u.href;
          }
        }
      } catch (_) {}
      return nativeFetch(input, init);
    };
  }

  const applyFreshestDefault = () => {
    const all=document.querySelector('.tab[data-tab="all"]'), sort=document.querySelector('.select-like');
    if(all&&!all.classList.contains('active'))all.click();
    if(sort&&!/Sort by:\s*Newest/i.test(sort.textContent||'')){for(let i=0;i<3&&!/Sort by:\s*Newest/i.test(sort.textContent||'');i++)sort.click();}
    if(sort&&/Sort by:\s*Newest/i.test(sort.textContent||''))sort.textContent='Sort by: Newest First';
  };
  const bootFresh=()=>{let n=0;const t=setInterval(()=>{applyFreshestDefault();n++;if(n>=8||(document.querySelector('.tab[data-tab="all"]')?.classList.contains('active')&&/Sort by:\s*Newest/i.test(document.querySelector('.select-like')?.textContent||'')))clearInterval(t);},250);};
  if(document.readyState==='complete')bootFresh();else window.addEventListener('load',bootFresh,{once:true});

  if(!document.getElementById('thecareers-job-title-priority')){
    const s=document.createElement('style');s.id='thecareers-job-title-priority';s.textContent=`
      .job-main .title{font-size:15.5px!important;line-height:1.28!important;font-weight:800!important;letter-spacing:-.01em!important;color:#0b0c0e!important;margin-bottom:3px!important}
      .job-main .company{font-size:11.5px!important;color:#5b6068!important}.job-row{min-height:64px}
      @media(max-width:760px){.job-main .title{font-size:14.5px!important}}
    `;document.head.appendChild(s);
  }

  const scripts=[
    ['./assets/network-enhancement.js?v=20260909c','tc-network-enhancement'],
    ['./assets/network-desktop-flow.js?v=20260911a','tc-network-desktop-flow'],
    ['./assets/mobile-nav.js?v=20260912c','tc-mobile-nav'],
    ['./assets/auth-redirect-fix.js?v=20260912a','tc-auth-redirect-fix'],
    ['./assets/utility-panels.js?v=20260912a','tc-utility-panels'],
    ['./assets/cv-upload-fast.js?v=20260912a','tc-cv-upload-fast'],
    ['./assets/cv-profile-manager.js?v=20260912c','tc-cv-profile-manager'],
    ['./assets/cv-modal-retire.js?v=20260912a','tc-cv-modal-retire'],
    ['./assets/site-telemetry.js?v=20260911c','tc-site-telemetry'],
    ['./assets/ui-copy-cleanup.js?v=20260911d','tc-ui-copy-cleanup'],
    ['./assets/dashboard-layout-tuning.js?v=20260912e','tc-dashboard-layout-tuning'],
    ['./assets/topbar-visibility-cleanup.js?v=20260912b','tc-topbar-visibility-cleanup'],
    ['./assets/country-filter.js?v=20260912e','tc-country-filter'],
    ['./assets/jobs-pagination.js?v=20260912e','tc-jobs-pagination'],
    ['./assets/job-card-desktop-layout.js?v=20260912a','tc-job-card-desktop-layout'],
    ['./assets/cv-high-match.js?v=20260912a','tc-cv-high-match']
  ];
  scripts.forEach(([src,key])=>{
    if(document.querySelector(`script[data-${key}]`))return;
    const s=document.createElement('script');s.setAttribute(`data-${key}`,'1');s.src=asset(src);s.async=false;
    s.addEventListener('error',()=>console.error(`[TheCareers] failed to load ${src}`));document.head.appendChild(s);
  });

  const applyGuest=()=>{
    const name=document.querySelector('.profile-name'),role=document.querySelector('.profile-role'),avatar=document.querySelector('.profile .avatar');
    if(name)name.textContent='Guest';if(role)role.textContent='Pre-launch access';if(avatar)avatar.textContent='TC';
    const foot=document.querySelector('.sidebar-foot');if(foot){foot.innerHTML=`TheCareers v2.1.0<br>© 2026 TheCareers<br><span style="display:inline-block;margin-top:6px"><a href="./privacy.html">Privacy</a> · <a href="./terms.html">Terms</a> · <a href="./disclaimer.html">Disclaimer</a></span><br><a href="mailto:support@thecareers.net">support@thecareers.net</a>`;foot.querySelectorAll('a').forEach(a=>{a.style.color='inherit';a.style.textDecoration='underline';a.style.textUnderlineOffset='2px';});}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyGuest,{once:true});else applyGuest();
})();
