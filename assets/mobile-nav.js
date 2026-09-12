/* TheCareers mobile navigation drawer hotfix.
   Keeps the desktop sidebar unchanged and restores navigation on <= 760px screens. */
(() => {
  const init = () => {
    // Critical: the dedicated mobile responsive stylesheet existed in the repo
    // but was not wired into the live page. Load it here because mobile-nav.js
    // is already part of the production boot path.
    if (!document.querySelector('link[data-tc-mobile-responsive-fix]')) {
      const responsive = document.createElement('link');
      responsive.rel = 'stylesheet';
      responsive.dataset.tcMobileResponsiveFix = '1';
      responsive.href = new URL('./mobile-responsive-fix.css?v=20260912c', document.currentScript?.src || location.href).href;
      document.head.appendChild(responsive);
    }

    // Emergency scroll ownership rule for touch devices. amCharts deliberately
    // captures drag gestures for globe rotation on desktop; on phones we give
    // those gestures back to the browser so a finger drag always scrolls page.
    if (!document.getElementById('tc-mobile-scroll-ownership')) {
      const scrollStyle = document.createElement('style');
      scrollStyle.id = 'tc-mobile-scroll-ownership';
      scrollStyle.textContent = `
        @media (max-width:760px), (pointer:coarse) {
          html, body {
            overflow-x:hidden !important;
            overflow-y:auto !important;
            height:auto !important;
            min-height:100% !important;
            touch-action:pan-y !important;
            overscroll-behavior-y:auto !important;
            -webkit-overflow-scrolling:touch !important;
          }
          body:not(.tc-mobile-nav-open),
          body:not(.tc-mobile-nav-open) .app,
          body:not(.tc-mobile-nav-open) .main,
          body:not(.tc-mobile-nav-open) .content {
            overflow-y:visible !important;
            height:auto !important;
            position:static !important;
            touch-action:pan-y !important;
          }
          #thecareers-globe-stage,
          .core-visual.thecareers-globe-zone {
            touch-action:pan-y !important;
          }
          /* Disable only touch interaction with the amCharts rendering layer.
             Animation remains visible; desktop mouse rotate/zoom is unaffected. */
          #thecareers-ai-globe,
          #thecareers-ai-globe * {
            pointer-events:none !important;
            touch-action:pan-y !important;
          }
        }
      `;
      document.head.appendChild(scrollStyle);
    }

    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    if (!sidebar || !topbar || document.getElementById('tc-mobile-menu-btn')) return;

    const style = document.createElement('style');
    style.id = 'tc-mobile-nav-style';
    style.textContent = `
      .tc-mobile-menu-btn,
      .tc-mobile-sidebar-overlay,
      .tc-mobile-sidebar-close { display: none; }

      @media (max-width: 760px) {
        body.tc-mobile-nav-open { overflow: hidden !important; }

        .tc-mobile-menu-btn {
          display: inline-flex;
          position: fixed;
          top: max(10px, env(safe-area-inset-top));
          left: 10px;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--line, #e7e9ec);
          border-radius: 11px;
          background: rgba(255,255,255,.96);
          color: var(--ink, #14161a);
          box-shadow: 0 8px 24px rgba(20,22,26,.12);
          z-index: 1402;
          font-size: 22px;
          line-height: 1;
          -webkit-tap-highlight-color: transparent;
        }

        .tc-mobile-menu-btn:active { transform: scale(.97); }

        .sidebar {
          display: flex !important;
          position: fixed !important;
          top: 0;
          left: 0;
          width: min(84vw, 320px);
          max-width: 320px;
          height: 100dvh !important;
          min-height: 100vh;
          overflow-y: auto;
          overscroll-behavior: contain;
          transform: translateX(-104%);
          transition: transform .24s ease;
          z-index: 1401;
          box-shadow: 18px 0 48px rgba(20,22,26,.18);
          padding-top: max(22px, calc(env(safe-area-inset-top) + 14px));
        }

        body.tc-mobile-nav-open .sidebar { transform: translateX(0); }

        .tc-mobile-sidebar-overlay {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(11,12,14,.34);
          backdrop-filter: blur(2px);
          opacity: 0;
          pointer-events: none;
          transition: opacity .2s ease;
          z-index: 1400;
        }

        body.tc-mobile-nav-open .tc-mobile-sidebar-overlay {
          opacity: 1;
          pointer-events: auto;
        }

        .tc-mobile-sidebar-close {
          display: inline-flex;
          position: absolute;
          top: max(12px, env(safe-area-inset-top));
          right: 12px;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--line, #e7e9ec);
          border-radius: 9px;
          background: #fff;
          color: var(--ink, #14161a);
          font-size: 22px;
          line-height: 1;
          z-index: 2;
        }

        .topbar {
          min-height: 62px;
          padding-left: 62px !important;
          padding-right: 12px !important;
        }

        .topbar-right {
          width: 100%;
          justify-content: flex-end;
          gap: 8px !important;
          min-width: 0;
        }

        .topbar-right .status-chip { display: none; }
        .topbar-right .profile { padding-left: 8px; }
        .profile-name, .profile-role { display: none; }
        .content { padding-left: 12px !important; padding-right: 12px !important; }
      }

      @media (min-width: 761px) {
        .sidebar { transform: none !important; }
      }
    `;
    document.head.appendChild(style);

    const menuBtn = document.createElement('button');
    menuBtn.id = 'tc-mobile-menu-btn';
    menuBtn.className = 'tc-mobile-menu-btn';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'Open navigation menu');
    menuBtn.setAttribute('aria-controls', 'tc-main-sidebar');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '<span aria-hidden="true">☰</span>';
    topbar.prepend(menuBtn);

    sidebar.id = sidebar.id || 'tc-main-sidebar';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tc-mobile-sidebar-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close navigation menu');
    closeBtn.innerHTML = '<span aria-hidden="true">×</span>';
    sidebar.prepend(closeBtn);

    const overlay = document.createElement('div');
    overlay.className = 'tc-mobile-sidebar-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    const setOpen = (open) => {
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const next = Boolean(open && mobile);
      document.body.classList.toggle('tc-mobile-nav-open', next);
      menuBtn.setAttribute('aria-expanded', String(next));
      menuBtn.setAttribute('aria-label', next ? 'Close navigation menu' : 'Open navigation menu');
      overlay.setAttribute('aria-hidden', String(!next));
      if (next) setTimeout(() => closeBtn.focus({ preventScroll: true }), 0);
    };

    // Never keep a stale scroll-lock after reload/navigation.
    document.body.classList.remove('tc-mobile-nav-open');

    menuBtn.addEventListener('click', () => setOpen(!document.body.classList.contains('tc-mobile-nav-open')));
    closeBtn.addEventListener('click', () => setOpen(false));
    overlay.addEventListener('click', () => setOpen(false));

    sidebar.addEventListener('click', (event) => {
      if (event.target.closest('.nav-item')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) setOpen(false);
    });
    window.addEventListener('pageshow', () => setOpen(false));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
