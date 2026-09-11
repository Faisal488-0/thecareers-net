/* Desktop-only source cards + data attraction for Global Search Network.
   Scope is intentionally limited to .net-body. It does not alter the black-hole artwork,
   its animation, page layout, job list, filters, or any other dashboard component. */
(() => {
  'use strict';

  const DESKTOP_MIN = 900;
  const mq = window.matchMedia(`(min-width:${DESKTOP_MIN}px)`);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const sources = [
    { name: 'LinkedIn', sub: 'Global professional jobs', mark: 'in', tone: 'blue' },
    { name: 'Indeed', sub: 'Worldwide job listings', mark: 'i', tone: 'indigo' },
    { name: 'Bayt', sub: 'Middle East careers', mark: 'B', tone: 'sky' },
    { name: 'Glassdoor', sub: 'Jobs · Companies · Reviews', mark: 'G', tone: 'green' },
    { name: 'Naukrigulf', sub: 'GCC opportunities', mark: 'N', tone: 'violet' },
    { name: 'Direct Careers', sub: 'Official company portals', mark: '◎', tone: 'slate' }
  ];

  function ensureStyle() {
    if (document.getElementById('tc-network-desktop-flow-style')) return;
    const style = document.createElement('style');
    style.id = 'tc-network-desktop-flow-style';
    style.textContent = `
      @media (min-width:${DESKTOP_MIN}px) {
        .net-body { position:relative!important; overflow:hidden!important; }
        .tc-desktop-source-layer { position:absolute; inset:0; z-index:8; pointer-events:none; }
        .tc-desktop-source-card {
          position:absolute; width:154px; min-height:56px; box-sizing:border-box;
          display:flex; align-items:center; gap:9px; padding:8px 10px;
          border:1px solid rgba(212,221,232,.92); border-radius:12px;
          background:rgba(255,255,255,.93); backdrop-filter:blur(8px);
          box-shadow:0 10px 28px -18px rgba(29,62,102,.38), inset 0 1px 0 rgba(255,255,255,.85);
          pointer-events:auto; transform:translateZ(0);
          transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease;
        }
        .tc-desktop-source-card:hover {
          transform:translateY(-2px) scale(1.02);
          border-color:rgba(164,198,232,.95);
          box-shadow:0 14px 34px -18px rgba(37,93,153,.48), inset 0 1px 0 rgba(255,255,255,.9);
        }
        .tc-desktop-source-icon {
          width:32px; height:32px; flex:0 0 32px; border-radius:9px;
          display:grid; place-items:center; font:800 16px/1 Inter,Arial,sans-serif;
          color:#254764; background:#f4f8fc; border:1px solid #e9eef4;
        }
        .tc-desktop-source-icon[data-tone="blue"]{background:#0a66c2;color:#fff;border-color:#0a66c2}
        .tc-desktop-source-icon[data-tone="indigo"]{color:#2557b7;background:#f1f5ff}
        .tc-desktop-source-icon[data-tone="sky"]{color:#1677b8;background:#eef8ff}
        .tc-desktop-source-icon[data-tone="green"]{color:#11895d;background:#eefaf5}
        .tc-desktop-source-icon[data-tone="violet"]{color:#6f55bf;background:#f5f1ff}
        .tc-desktop-source-icon[data-tone="slate"]{color:#46576a;background:#f3f6f8}
        .tc-desktop-source-copy { min-width:0; }
        .tc-desktop-source-name { display:block; color:#121820; font-size:11.5px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tc-desktop-source-sub { display:block; margin-top:2px; color:#78879a; font-size:8.3px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tc-desktop-source-live { display:flex; align-items:center; gap:5px; margin-top:4px; color:#118557; font-size:8px; font-weight:800; letter-spacing:.04em; }
        .tc-desktop-source-live::before { content:''; width:5px; height:5px; border-radius:50%; background:#18b56b; box-shadow:0 0 0 3px rgba(24,181,107,.08); }
        .tc-desktop-flow-canvas { position:absolute; inset:0; width:100%; height:100%; z-index:7; pointer-events:none; }
      }
      @media (max-width:${DESKTOP_MIN - 1}px) {
        .tc-desktop-source-layer,.tc-desktop-flow-canvas { display:none!important; }
      }
    `;
    document.head.appendChild(style);
  }

  function getBody() { return document.querySelector('.net-body'); }

  function ensureCards(body) {
    let layer = body.querySelector(':scope > .tc-desktop-source-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'tc-desktop-source-layer';
      layer.setAttribute('aria-label', 'Global job data sources');
      body.appendChild(layer);
    }
    if (!layer.children.length) {
      sources.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'tc-desktop-source-card';
        card.dataset.sourceIndex = String(i);
        card.innerHTML = `<span class="tc-desktop-source-icon" data-tone="${s.tone}">${s.mark}</span><span class="tc-desktop-source-copy"><span class="tc-desktop-source-name">${s.name}</span><span class="tc-desktop-source-sub">${s.sub}</span><span class="tc-desktop-source-live">LIVE DATA</span></span>`;
        layer.appendChild(card);
      });
    }
    return Array.from(layer.children);
  }

  function layout(body, cards) {
    if (!mq.matches) return;
    const w = body.clientWidth, h = body.clientHeight;
    if (!w || !h) return;
    const cardW = Math.max(142, Math.min(170, Math.round(w * .145)));
    const margin = Math.max(18, Math.min(42, Math.round(w * .03)));
    const cardH = 56;
    const yTop = Math.max(18, Math.round(h * .08));
    const yMid = Math.max(yTop + 74, Math.round((h - cardH) / 2));
    const yBottom = Math.min(h - cardH - 18, Math.max(yMid + 74, h - yTop - cardH));
    const ys = [yTop, yMid, yBottom];
    cards.forEach((card, i) => {
      const right = i % 2 === 1;
      const row = Math.floor(i / 2);
      card.style.width = `${cardW}px`;
      card.style.left = right ? `${w - margin - cardW}px` : `${margin}px`;
      card.style.top = `${ys[row]}px`;
    });
  }

  function ensureCanvas(body) {
    let canvas = body.querySelector(':scope > .tc-desktop-flow-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'tc-desktop-flow-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      body.appendChild(canvas);
    }
    return canvas;
  }

  function startFlow(body, cards, canvas) {
    if (canvas.dataset.running === '1') return;
    canvas.dataset.running = '1';
    const ctx = canvas.getContext('2d');
    let phase = 0, last = performance.now();

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = body.clientWidth, h = body.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function bezier(t, p0, p1, p2) {
      const q = 1 - t;
      return { x:q*q*p0.x + 2*q*t*p1.x + t*t*p2.x, y:q*q*p0.y + 2*q*t*p1.y + t*t*p2.y };
    }

    function frame(now) {
      const dt = Math.min(40, now - last); last = now;
      if (!reduceMotion) phase = (phase + dt * .00019) % 1;
      const w = body.clientWidth, h = body.clientHeight;
      ctx.clearRect(0, 0, w, h);
      if (!mq.matches) { requestAnimationFrame(frame); return; }

      const br = body.getBoundingClientRect();
      const cx = w / 2, cy = h / 2;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const isRight = i % 2 === 1;
        const row = Math.floor(i / 2);
        const p0 = { x:(isRight ? r.left : r.right) - br.left, y:r.top - br.top + r.height/2 };
        const p2 = { x:cx + (isRight ? 38 : -38), y:cy + (row - 1) * 25 };
        const p1 = { x:isRight ? cx + 135 : cx - 135, y:cy + (row - 1) * 46 };
        const rgb = isRight ? '235,164,72' : '66,156,232';

        ctx.save();
        const grad = ctx.createLinearGradient(p0.x,p0.y,p2.x,p2.y);
        grad.addColorStop(0, `rgba(${rgb},.12)`);
        grad.addColorStop(.55, `rgba(${rgb},.45)`);
        grad.addColorStop(1, `rgba(${rgb},.16)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.15;
        ctx.setLineDash([2,5]);
        ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.quadraticCurveTo(p1.x,p1.y,p2.x,p2.y); ctx.stroke();
        ctx.restore();

        for (let k=0;k<4;k++) {
          const t = reduceMotion ? .6 : ((phase * (1.05 + i*.025) + k*.245 + i*.067) % 1);
          const p = bezier(t,p0,p1,p2);
          const size = k===0 ? 3.1 : 2.1;
          const alpha = .45 + .52 * t;
          ctx.save();
          ctx.fillStyle = `rgba(${rgb},${alpha})`;
          ctx.shadowColor = `rgb(${rgb})`;
          ctx.shadowBlur = 5 + 10*t;
          ctx.beginPath(); ctx.arc(p.x,p.y,size,0,Math.PI*2); ctx.fill();
          ctx.restore();
        }
      });

      // Subtle attraction pulse around the core; does not modify the black-hole element.
      if (!reduceMotion) {
        const pulse = (Math.sin(now * .0022) + 1) / 2;
        ctx.save();
        ctx.strokeStyle = `rgba(104,168,229,${.04 + pulse*.05})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx,cy,42 + pulse*7,0,Math.PI*2); ctx.stroke();
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize, {passive:true});
    requestAnimationFrame(frame);
  }

  function init() {
    if (!mq.matches) return;
    const body = getBody();
    if (!body) return;
    ensureStyle();
    const cards = ensureCards(body);
    const canvas = ensureCanvas(body);
    const relayout = () => layout(body, cards);
    relayout();
    startFlow(body, cards, canvas);
    window.addEventListener('resize', relayout, {passive:true});
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(body);
  }

  function boot() {
    init();
    mq.addEventListener?.('change', e => { if (e.matches) init(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
