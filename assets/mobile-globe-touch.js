/* TheCareers mobile globe touch hardening
   Mobile priority: native vertical page scrolling must always win.
   Desktop globe drag/zoom behavior is unchanged. */
(() => {
  'use strict';
  if (window.__TC_MOBILE_GLOBE_TOUCH__) return;
  window.__TC_MOBILE_GLOBE_TOUCH__ = true;

  const isTouchLayout = () =>
    window.innerWidth <= 760 ||
    window.matchMedia?.('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0;

  if (!isTouchLayout()) return;

  const ensureScrollStyle = () => {
    if (document.getElementById('tc-mobile-globe-scroll-fix')) return;
    const style = document.createElement('style');
    style.id = 'tc-mobile-globe-scroll-fix';
    style.textContent = `
      @media (max-width:760px), (pointer:coarse) {
        #thecareers-globe-stage,
        #thecareers-ai-globe,
        #thecareers-ai-globe canvas,
        #thecareers-ai-globe svg,
        .core-visual.thecareers-globe-zone {
          touch-action: pan-y !important;
          overscroll-behavior: auto !important;
        }

        /* amCharts' canvas can claim the pointer before the browser starts a
           native scroll in standalone/PWA mode.  On touch layouts the globe
           remains animated but its rendering surface does not own touch input. */
        #thecareers-ai-globe,
        #thecareers-ai-globe * {
          pointer-events: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const apply = () => {
    ensureScrollStyle();

    const stage = document.getElementById('thecareers-globe-stage');
    const globe = document.getElementById('thecareers-ai-globe');
    if (stage) stage.style.touchAction = 'pan-y';
    if (globe) globe.style.touchAction = 'pan-y';

    const chart = window.__theCareersGlobe?.chart;
    if (!chart) return false;

    try {
      chart.setAll({
        panX: 'none',
        panY: 'none',
        pinchZoom: false,
        wheelY: 'none',
        wheelX: 'none'
      });
    } catch (_) {}

    // No pointermove/preventDefault listeners on touch layouts.  This is
    // intentional: the page owns every vertical gesture, including gestures
    // that begin directly on the globe.
    return true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (apply() || tries >= 160) clearInterval(timer);
  }, 100);

  window.addEventListener('pageshow', apply);
  window.addEventListener('resize', apply, { passive: true });
})();
