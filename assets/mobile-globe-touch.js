/* TheCareers mobile globe gesture controller
   Horizontal one-finger drag rotates the globe.
   Vertical drag remains native page scroll.
   Desktop behaviour is unchanged. */
(() => {
  'use strict';
  if (window.__TC_MOBILE_GLOBE_TOUCH__) return;
  window.__TC_MOBILE_GLOBE_TOUCH__ = true;

  const isTouchLayout = () => window.innerWidth <= 760 || navigator.maxTouchPoints > 0;

  const attach = () => {
    if (!isTouchLayout()) return false;
    const stage = document.getElementById('thecareers-globe-stage');
    const globe = document.getElementById('thecareers-ai-globe');
    const api = window.__theCareersGlobe;
    const chart = api?.chart;
    if (!stage || !globe || !chart || stage.dataset.tcTouchBound === '1') return false;

    stage.dataset.tcTouchBound = '1';
    stage.style.touchAction = 'pan-y';
    globe.style.touchAction = 'pan-y';

    // amCharts' default rotateY touch handling competes with browser vertical
    // scrolling. On touch layouts we let this small controller arbitrate the
    // gesture instead: horizontal = globe, vertical = page.
    try {
      chart.setAll({ panX: 'none', panY: 'none', pinchZoom: false, wheelY: 'none' });
    } catch (_) {}

    let gesture = null;

    const resume = () => {
      if (!gesture) return;
      if (gesture.mode === 'rotate') {
        try { api.startSpin?.(); } catch (_) {}
      }
      gesture = null;
    };

    stage.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        rotationX: Number(chart.get('rotationX') || -48),
        mode: 'pending'
      };
    }, { passive: true });

    stage.addEventListener('pointermove', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (gesture.mode === 'pending' && Math.max(ax, ay) >= 7) {
        if (ax > ay * 1.15) {
          gesture.mode = 'rotate';
          try { stage.setPointerCapture(event.pointerId); } catch (_) {}
          try { api.stopSpin?.(); } catch (_) {}
        } else if (ay > ax * 1.05) {
          gesture.mode = 'scroll';
        }
      }

      if (gesture.mode === 'rotate') {
        event.preventDefault();
        try { chart.set('rotationX', gesture.rotationX + dx * 0.34); } catch (_) {}
      }
      // For vertical gestures we intentionally do nothing: the browser owns
      // them and scrolls the page normally.
    }, { passive: false });

    stage.addEventListener('pointerup', resume, { passive: true });
    stage.addEventListener('pointercancel', resume, { passive: true });

    // Keep tap/double-tap semantics available without stealing vertical scroll.
    let lastTap = 0;
    stage.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'touch') return;
      const now = Date.now();
      if (now - lastTap < 320) {
        try { api.reset?.(); } catch (_) {}
        lastTap = 0;
      } else {
        lastTap = now;
      }
    }, { passive: true });

    return true;
  };

  if (attach()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (attach() || tries >= 120) clearInterval(timer);
  }, 100);
})();
