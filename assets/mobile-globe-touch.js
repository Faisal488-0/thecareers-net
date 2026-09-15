/* TheCareers mobile globe gesture controller
   Goal on touch devices:
   - Tap/click on the globe remains interactive.
   - A horizontal/mostly-horizontal drag rotates the globe naturally.
   - A vertical drag is always owned by the page so normal scrolling works.
   - Controls below the globe are never intercepted.
   Desktop behaviour is unchanged. */
(() => {
  'use strict';
  if (window.__TC_MOBILE_GLOBE_TOUCH__) return;
  window.__TC_MOBILE_GLOBE_TOUCH__ = true;

  const isTouchLayout = () =>
    window.innerWidth <= 760 ||
    window.matchMedia?.('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0;

  if (!isTouchLayout()) return;

  const ensureTouchStyle = () => {
    let style = document.getElementById('tc-mobile-globe-scroll-fix');
    if (!style) {
      style = document.createElement('style');
      style.id = 'tc-mobile-globe-scroll-fix';
      document.head.appendChild(style);
    }
    style.textContent = `
      @media (max-width:760px), (pointer:coarse) {
        #thecareers-globe-stage,
        #thecareers-ai-globe,
        #thecareers-ai-globe canvas,
        #thecareers-ai-globe svg {
          pointer-events:auto !important;
          touch-action:pan-y !important;
          overscroll-behavior:auto !important;
          -webkit-user-select:none !important;
          user-select:none !important;
          -webkit-tap-highlight-color:transparent;
        }
        .core-visual.thecareers-globe-zone {
          touch-action:pan-y !important;
          overscroll-behavior:auto !important;
        }
      }

      /* Audit polish for narrow phones: keep the header inside the card and
         give all six source controls enough width to remain readable/tappable. */
      @media (max-width:420px) {
        .row-core > section:first-child .panel-head > :last-child {
          min-width:0 !important;
          width:100px !important;
          max-width:32% !important;
          flex:0 1 100px !important;
        }
        .row-core > section:first-child .panel-head > :last-child .panel-sub {
          overflow-wrap:break-word !important;
          word-break:normal !important;
        }
        .row-core .core-visual.thecareers-globe-zone {
          grid-template-columns:repeat(2,minmax(0,1fr)) !important;
          grid-template-rows:auto auto auto auto !important;
          gap:7px !important;
        }
        .row-core .thecareers-globe-zone #thecareers-globe-stage {
          grid-column:1 / 3 !important;
          grid-row:1 !important;
        }
        .row-core .source-chip {
          min-height:48px !important;
          padding:7px 8px !important;
        }
        .row-core .source-chip .lbl b {
          font-size:9px !important;
          line-height:1.15 !important;
        }
        .row-core .sc-companies{grid-column:1!important;grid-row:2!important}
        .row-core .sc-schools{grid-column:2!important;grid-row:2!important}
        .row-core .sc-international{grid-column:1!important;grid-row:3!important}
        .row-core .sc-oilgas{grid-column:2!important;grid-row:3!important}
        .row-core .sc-government{grid-column:1!important;grid-row:4!important}
        .row-core .sc-talent{grid-column:2!important;grid-row:4!important}
      }
    `;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const attach = () => {
    ensureTouchStyle();

    const stage = document.getElementById('thecareers-globe-stage');
    const globe = document.getElementById('thecareers-ai-globe');
    const api = window.__theCareersGlobe;
    const chart = api?.chart;
    if (!stage || !globe || !chart) return false;

    stage.style.touchAction = 'pan-y';
    globe.style.touchAction = 'pan-y';

    // Disable amCharts' built-in touch panning only on touch layouts. We handle
    // rotation below so vertical gestures can stay native browser scrolling.
    try {
      chart.setAll({
        panX: 'none',
        panY: 'none',
        pinchZoom: false,
        wheelY: 'none',
        wheelX: 'none'
      });
    } catch (_) {}

    if (stage.dataset.tcTouchBound === '1') return true;
    stage.dataset.tcTouchBound = '1';

    let gesture = null;
    let lastTapAt = 0;

    const finish = (event) => {
      if (!gesture) return;
      const wasRotate = gesture.mode === 'rotate';
      const wasTap = gesture.mode === 'pending' &&
        Math.abs((event?.clientX ?? gesture.x) - gesture.x) < 7 &&
        Math.abs((event?.clientY ?? gesture.y) - gesture.y) < 7;

      if (wasRotate) {
        try { api.startSpin?.(); } catch (_) {}
      }

      if (wasTap && event?.pointerType === 'touch') {
        const now = Date.now();
        if (now - lastTapAt < 320) {
          try { api.reset?.(); } catch (_) {}
          lastTapAt = 0;
        } else {
          lastTapAt = now;
        }
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
        rotationY: Number(chart.get('rotationY') || -18),
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
        // Vertical-first gesture = native page scroll. Horizontal/diagonal-first
        // gesture = globe rotation. This keeps scrolling natural even when a
        // swipe starts directly on top of the globe.
        if (ay > ax * 1.08) {
          gesture.mode = 'scroll';
          return;
        }
        if (ax >= ay * 0.92) {
          gesture.mode = 'rotate';
          try { stage.setPointerCapture(event.pointerId); } catch (_) {}
          try { api.stopSpin?.(); } catch (_) {}
        }
      }

      if (gesture.mode === 'rotate') {
        event.preventDefault();
        try {
          chart.set('rotationX', gesture.rotationX + dx * 0.34);
          chart.set('rotationY', clamp(gesture.rotationY - dy * 0.22, -78, 78));
        } catch (_) {}
      }
      // gesture.mode === 'scroll': intentionally do nothing. The browser owns it.
    }, { passive: false });

    stage.addEventListener('pointerup', finish, { passive: true });
    stage.addEventListener('pointercancel', finish, { passive: true });

    return true;
  };

  if (attach()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (attach() || tries >= 160) clearInterval(timer);
  }, 100);

  window.addEventListener('pageshow', attach);
  window.addEventListener('resize', attach, { passive: true });
})();
